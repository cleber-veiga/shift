import re
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.roles import OrganizationMemberRole
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationMemberCreate,
    OrganizationMemberRead,
    OrganizationRead,
)

router = APIRouter()
slug_pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def normalize_slug(slug: str) -> str:
    return slug.strip().lower()


async def get_org_member(
    db: AsyncSession,
    organization_id: UUID,
    user_id: UUID,
) -> OrganizationMember | None:
    return await db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    slug = normalize_slug(payload.slug)
    if not slug_pattern.match(slug):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Slug must use lowercase letters, numbers, and hyphens.",
        )

    existing = await db.scalar(select(Organization).where(Organization.slug == slug))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization slug already exists.")

    organization = Organization(name=payload.name.strip(), slug=slug)
    db.add(organization)
    await db.flush()

    db.add(
        OrganizationMember(
            organization_id=organization.id,
            user_id=current_user.id,
            role=OrganizationMemberRole.OWNER,
        )
    )
    await db.commit()
    await db.refresh(organization)
    return organization


@router.get("", response_model=list[OrganizationRead])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Organization]:
    organizations = await db.scalars(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == current_user.id)
        .order_by(Organization.created_at.desc())
    )
    return list(organizations)


@router.post("/{organization_id}/members", response_model=OrganizationMemberRead)
async def add_organization_member(
    organization_id: UUID,
    payload: OrganizationMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationMember:
    organization = await db.scalar(select(Organization).where(Organization.id == organization_id))
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    actor_membership = await get_org_member(db, organization_id, current_user.id)
    if not actor_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if actor_membership.role not in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    target_user = await db.scalar(select(User).where(User.id == payload.user_id))
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    membership = await get_org_member(db, organization_id, payload.user_id)
    if membership:
        membership.role = payload.role
    else:
        membership = OrganizationMember(
            organization_id=organization_id,
            user_id=payload.user_id,
            role=payload.role,
        )
        db.add(membership)

    await db.commit()
    await db.refresh(membership)
    return membership


@router.get("/{organization_id}/members", response_model=list[OrganizationMemberRead])
async def list_organization_members(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrganizationMember]:
    actor_membership = await get_org_member(db, organization_id, current_user.id)
    if not actor_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    members = await db.scalars(
        select(OrganizationMember)
        .where(OrganizationMember.organization_id == organization_id)
        .order_by(OrganizationMember.created_at.desc())
    )
    return list(members)
