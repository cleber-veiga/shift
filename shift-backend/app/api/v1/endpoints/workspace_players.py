from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.organization_member import OrganizationMember
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.workspace_player import WorkspacePlayer
from app.schemas.workspace_player import WorkspacePlayerCreate, WorkspacePlayerRead, WorkspacePlayerUpdate

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


def can_read_workspace_players(
    workspace_membership: WorkspaceMember | None,
    org_membership: OrganizationMember | None,
) -> bool:
    return workspace_membership is not None or org_membership is not None


def can_manage_workspace_players(
    workspace_membership: WorkspaceMember | None,
    org_membership: OrganizationMember | None,
) -> bool:
    return (
        workspace_membership is not None and workspace_membership.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_membership is not None
        and org_membership.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )


async def get_workspace_with_access(
    db: AsyncSession,
    workspace_id: UUID,
    user_id: UUID,
    require_manage_permission: bool = False,
) -> Workspace:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_membership = await get_workspace_member(db, workspace.id, user_id)
    org_membership = await get_org_member(db, workspace.organization_id, user_id)

    if require_manage_permission:
        if not can_manage_workspace_players(workspace_membership, org_membership):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")
    elif not can_read_workspace_players(workspace_membership, org_membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    return workspace


@router.post("/{workspace_id}/players", response_model=WorkspacePlayerRead, status_code=status.HTTP_201_CREATED)
async def create_workspace_player(
    workspace_id: UUID,
    payload: WorkspacePlayerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspacePlayer:
    workspace = await get_workspace_with_access(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        require_manage_permission=True,
    )

    existing = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.workspace_id == workspace.id,
            WorkspacePlayer.name == payload.name.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player already exists in this workspace.")

    player = WorkspacePlayer(
        workspace_id=workspace.id,
        name=payload.name.strip(),
        database_type=payload.database_type,
    )
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return player


@router.get("/{workspace_id}/players", response_model=list[WorkspacePlayerRead])
async def list_workspace_players(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WorkspacePlayer]:
    workspace = await get_workspace_with_access(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
    )

    players = await db.scalars(
        select(WorkspacePlayer)
        .where(WorkspacePlayer.workspace_id == workspace.id)
        .order_by(WorkspacePlayer.name.asc())
    )
    return list(players)


@router.get("/{workspace_id}/players/{player_id}", response_model=WorkspacePlayerRead)
async def get_workspace_player(
    workspace_id: UUID,
    player_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspacePlayer:
    workspace = await get_workspace_with_access(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
    )
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == player_id,
            WorkspacePlayer.workspace_id == workspace.id,
        )
    )
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found.")
    return player


@router.put("/{workspace_id}/players/{player_id}", response_model=WorkspacePlayerRead)
async def update_workspace_player(
    workspace_id: UUID,
    player_id: UUID,
    payload: WorkspacePlayerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspacePlayer:
    workspace = await get_workspace_with_access(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        require_manage_permission=True,
    )
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == player_id,
            WorkspacePlayer.workspace_id == workspace.id,
        )
    )
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found.")

    if payload.name is not None:
        normalized_name = payload.name.strip()
        existing = await db.scalar(
            select(WorkspacePlayer).where(
                WorkspacePlayer.workspace_id == workspace.id,
                WorkspacePlayer.name == normalized_name,
                WorkspacePlayer.id != player.id,
            )
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Player already exists in this workspace.")
        player.name = normalized_name

    if payload.database_type is not None:
        player.database_type = payload.database_type

    await db.commit()
    await db.refresh(player)
    return player


@router.delete("/{workspace_id}/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_player(
    workspace_id: UUID,
    player_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    workspace = await get_workspace_with_access(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        require_manage_permission=True,
    )
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == player_id,
            WorkspacePlayer.workspace_id == workspace.id,
        )
    )
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found.")

    await db.delete(player)
    await db.commit()
