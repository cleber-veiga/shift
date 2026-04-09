import hashlib
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

try:
    from pwdlib import PasswordHash
    from pwdlib.hashers.bcrypt import BcryptHasher
except ImportError:  # pragma: no cover - compatibility path for local envs
    PasswordHash = None
    BcryptHasher = None

if PasswordHash is not None and BcryptHasher is not None:
    password_hash = PasswordHash((BcryptHasher(),))
    _passlib_context: CryptContext | None = None
else:
    password_hash = None
    _passlib_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenDecodeError(Exception):
    pass


def utcnow() -> datetime:
    return datetime.now(UTC)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    # Bcrypt has a 72-byte limit. We truncate to ensure it doesn't crash.
    normalized_password = password[:72]
    if password_hash is not None:
        return password_hash.hash(normalized_password)
    assert _passlib_context is not None
    return _passlib_context.hash(normalized_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    normalized_password = plain_password[:72]
    if password_hash is not None:
        return password_hash.verify(normalized_password, hashed_password)
    assert _passlib_context is not None
    return _passlib_context.verify(normalized_password, hashed_password)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(subject: str) -> tuple[str, datetime]:
    expires_at = utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "iss": settings.JWT_ISSUER,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": int(utcnow().timestamp()),
        "nbf": int(utcnow().timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at


def create_refresh_token(subject: str) -> tuple[str, str, datetime]:
    jti = str(uuid.uuid4())
    expires_at = utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "iss": settings.JWT_ISSUER,
        "type": "refresh",
        "jti": jti,
        "iat": int(utcnow().timestamp()),
        "nbf": int(utcnow().timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expires_at


def decode_token(token: str, expected_type: str) -> dict[str, object]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
        )
    except JWTError as exc:
        raise TokenDecodeError("Invalid token.") from exc

    token_type = payload.get("type")
    subject = payload.get("sub")
    jti = payload.get("jti")

    if token_type != expected_type:
        raise TokenDecodeError("Invalid token type.")
    if not subject:
        raise TokenDecodeError("Token subject not found.")
    if expected_type == "refresh" and not jti:
        raise TokenDecodeError("Token identifier not found.")

    return payload
