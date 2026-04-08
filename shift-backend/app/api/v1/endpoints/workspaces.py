from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.organization_member import OrganizationMember
from app.models.erp import ERP
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceMemberCreate,
    WorkspaceMemberRead,
    WorkspaceRead,
    WorkspaceUpdate,
)

router = APIRouter()


async def get_workspace_member(
    db: AsyncSession,
    workspace_id: UUID,
    user_id: UUID,
) -> WorkspaceMember | None:
    return await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )


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


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    actor_org_membership = await get_org_member(db, payload.organization_id, current_user.id)
    if not actor_org_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if actor_org_membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot create workspaces.")

    existing_workspace = await db.scalar(
        select(Workspace).where(
            Workspace.organization_id == payload.organization_id,
            Workspace.name == payload.name.strip(),
        )
    )
    if existing_workspace:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workspace already exists.")

    if payload.erp_id is not None:
        erp = await db.scalar(select(ERP).where(ERP.id == payload.erp_id))
        if not erp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ERP not found.")

    workspace = Workspace(
        name=payload.name.strip(),
        organization_id=payload.organization_id,
        erp_id=payload.erp_id,
        created_by_id=current_user.id,
    )
    db.add(workspace)
    await db.flush()

    db.add(
        WorkspaceMember(
            workspace_id=workspace.id,
            user_id=current_user.id,
            role=WorkspaceMemberRole.MANAGER,
        )
    )
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.get("/organization/{organization_id}", response_model=list[WorkspaceRead])
async def list_organization_workspaces(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Workspace]:
    actor_org_membership = await get_org_member(db, organization_id, current_user.id)
    if not actor_org_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    workspaces = await db.scalars(
        select(Workspace)
        .where(Workspace.organization_id == organization_id)
        .order_by(Workspace.created_at.desc())
    )
    return list(workspaces)


@router.put("/{workspace_id}", response_model=WorkspaceRead)
async def update_workspace(
    workspace_id: UUID,
    payload: WorkspaceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    actor_workspace_membership = await get_workspace_member(db, workspace_id, current_user.id)
    actor_org_membership = await get_org_member(db, workspace.organization_id, current_user.id)

    is_allowed = (
        actor_workspace_membership is not None and actor_workspace_membership.role == WorkspaceMemberRole.MANAGER
    ) or (
        actor_org_membership is not None
        and actor_org_membership.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )
    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    normalized_name = payload.name.strip()
    existing_workspace = await db.scalar(
        select(Workspace).where(
            Workspace.organization_id == workspace.organization_id,
            Workspace.name == normalized_name,
            Workspace.id != workspace.id,
        )
    )
    if existing_workspace:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Workspace already exists.")

    workspace.name = normalized_name

    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberRead)
async def add_workspace_member(
    workspace_id: UUID,
    payload: WorkspaceMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspaceMember:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    actor_workspace_membership = await get_workspace_member(db, workspace_id, current_user.id)
    actor_org_membership = await get_org_member(db, workspace.organization_id, current_user.id)

    is_allowed = (
        actor_workspace_membership is not None and actor_workspace_membership.role == WorkspaceMemberRole.MANAGER
    ) or (
        actor_org_membership is not None
        and actor_org_membership.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )
    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    target_user = await db.scalar(select(User).where(User.id == payload.user_id))
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    target_org_membership = await get_org_member(db, workspace.organization_id, payload.user_id)
    if not target_org_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be a member of the organization first.",
        )

    workspace_member = await get_workspace_member(db, workspace_id, payload.user_id)
    if workspace_member:
        workspace_member.role = payload.role
        workspace_member.permission_overrides = payload.permission_overrides
    else:
        workspace_member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=payload.user_id,
            role=payload.role,
            permission_overrides=payload.permission_overrides,
        )
        db.add(workspace_member)

    await db.commit()
    await db.refresh(workspace_member)
    return workspace_member


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberRead])
async def list_workspace_members(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WorkspaceMember]:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    actor_workspace_membership = await get_workspace_member(db, workspace_id, current_user.id)
    actor_org_membership = await get_org_member(db, workspace.organization_id, current_user.id)
    if not actor_workspace_membership and not actor_org_membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    members = await db.scalars(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.created_at.desc())
    )
    return list(members)
