from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.conglomerate import Conglomerate
from app.models.competitor import Competitor
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter()


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


@router.post("/workspaces/{workspace_id}/projects", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    workspace_id: UUID,
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace_id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    can_write = (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )
    if not can_write:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == payload.conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")
    if conglomerate.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conglomerate must belong to the same organization as the workspace.",
        )
    competitor = await db.scalar(select(Competitor).where(Competitor.id == payload.competitor_id))
    if not competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found.")
    if competitor.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Competitor must belong to the same organization as the workspace.",
        )

    existing = await db.scalar(
        select(Project).where(
            Project.workspace_id == workspace_id,
            Project.name == payload.name.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project already exists in this workspace.")

    project = Project(
        workspace_id=workspace_id,
        conglomerate_id=payload.conglomerate_id,
        competitor_id=payload.competitor_id,
        created_by_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/workspaces/{workspace_id}/projects", response_model=list[ProjectRead])
async def list_workspace_projects(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Project]:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace_id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    projects = await db.scalars(
        select(Project)
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.desc())
    )
    return list(projects)
