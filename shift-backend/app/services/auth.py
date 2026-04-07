import asyncio
from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException, status
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token
import requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    TokenDecodeError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    normalize_email,
    utcnow,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginRequest, RefreshRequest, RegisterRequest


@dataclass
class SessionTokens:
    access_token: str
    refresh_token: str
    access_expires_at: int
    refresh_expires_at: int


def _build_google_request() -> GoogleRequest:
    session = requests.Session()
    base_request = session.request

    def request_with_timeout(method: str, url: str, **kwargs: object) -> requests.Response:
        kwargs.setdefault("timeout", settings.GOOGLE_REQUESTS_TIMEOUT_SECONDS)
        return base_request(method, url, **kwargs)

    session.request = request_with_timeout  # type: ignore[assignment]
    return GoogleRequest(session=session)


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    email = normalize_email(payload.email)
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    user = User(
        email=email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        auth_provider="local",
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> User:
    email = normalize_email(payload.email)
    user = await db.scalar(select(User).where(User.email == email))
    if not user or user.auth_provider != "local" or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user.",
        )
    return user


async def issue_session_tokens(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
) -> SessionTokens:
    access_token, access_expires_at = create_access_token(str(user.id))
    refresh_token, refresh_jti, refresh_expires_at = create_refresh_token(str(user.id))

    db.add(
        RefreshToken(
            user_id=user.id,
            jti=UUID(refresh_jti),
            token_hash=hash_token(refresh_token),
            user_agent=user_agent,
            expires_at=refresh_expires_at,
        )
    )
    user.last_login_at = utcnow()
    await db.commit()
    await db.refresh(user)

    return SessionTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        access_expires_at=int(access_expires_at.timestamp()),
        refresh_expires_at=int(refresh_expires_at.timestamp()),
    )


async def rotate_refresh_token(
    db: AsyncSession,
    payload: RefreshRequest,
    user_agent: str | None = None,
) -> tuple[User, SessionTokens]:
    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
        user_id = UUID(token_payload["sub"])
        jti = UUID(token_payload["jti"])
    except (TokenDecodeError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    db_token = await db.scalar(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.jti == jti)
    )
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found.",
        )

    now = utcnow()
    if db_token.revoked_at is not None or db_token.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked.",
        )
    if db_token.token_hash != hash_token(payload.refresh_token):
        db_token.revoked_at = now
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    user = await db.scalar(select(User).where(User.id == db_token.user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or missing user.",
        )

    db_token.revoked_at = now

    access_token, access_expires_at = create_access_token(str(user.id))
    refresh_token, refresh_jti, refresh_expires_at = create_refresh_token(str(user.id))
    db.add(
        RefreshToken(
            user_id=user.id,
            jti=UUID(refresh_jti),
            token_hash=hash_token(refresh_token),
            user_agent=user_agent,
            expires_at=refresh_expires_at,
        )
    )
    user.last_login_at = now
    await db.commit()
    await db.refresh(user)

    return user, SessionTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        access_expires_at=int(access_expires_at.timestamp()),
        refresh_expires_at=int(refresh_expires_at.timestamp()),
    )


async def revoke_refresh_token(db: AsyncSession, payload: RefreshRequest) -> None:
    try:
        token_payload = decode_token(payload.refresh_token, expected_type="refresh")
        user_id = UUID(token_payload["sub"])
        jti = UUID(token_payload["jti"])
    except (TokenDecodeError, KeyError, ValueError):
        return

    db_token = await db.scalar(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.jti == jti)
    )
    if db_token and db_token.revoked_at is None:
        db_token.revoked_at = utcnow()
        await db.commit()


async def authenticate_google_user(db: AsyncSession, payload: GoogleLoginRequest) -> User:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured.",
        )

    try:
        token_info = await asyncio.to_thread(
            google_id_token.verify_oauth2_token,
            payload.id_token,
            _build_google_request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token.",
        ) from exc

    if token_info.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google issuer.",
        )
    if not token_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email is not verified.",
        )

    email = token_info.get("email")
    provider_subject = token_info.get("sub")
    full_name = token_info.get("name")
    if not email or not provider_subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token missing required claims.",
        )

    normalized_email = normalize_email(email)
    user = await db.scalar(select(User).where(User.email == normalized_email))

    if not user:
        user = User(
            email=normalized_email,
            full_name=full_name,
            auth_provider="google",
            provider_subject=provider_subject,
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    if user.auth_provider != "google":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered with local credentials.",
        )

    if user.provider_subject and user.provider_subject != provider_subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google subject does not match this account.",
        )

    user.provider_subject = provider_subject
    if full_name and not user.full_name:
        user.full_name = full_name
    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    return user
