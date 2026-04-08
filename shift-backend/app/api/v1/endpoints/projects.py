from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.conglomerate import Conglomerate
from app.models.competitor import Competitor
from app.models.data_source import DataSource
from app.models.extraction_template import ExtractionTemplate
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.project_extraction import ProjectExtraction
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.workspace_player import WorkspacePlayer
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.extraction_template import ExtractionTemplateRead
from app.schemas.project_extraction import ProjectExtractionCreate, ProjectExtractionRead

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


def can_manage_project(
    workspace_member: WorkspaceMember | None,
    org_member: OrganizationMember | None,
) -> bool:
    return (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
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
    if not can_manage_project(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == payload.conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")
    if conglomerate.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conglomerate must belong to the same organization as the workspace.",
        )
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == payload.player_id,
            WorkspacePlayer.workspace_id == workspace.id,
        )
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found in this workspace.",
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
        player_id=payload.player_id,
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


@router.post(
    "/projects/{project_id}/extractions",
    response_model=ProjectExtractionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_project_extraction(
    project_id: UUID,
    payload: ProjectExtractionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectExtraction:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_project(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    data_source = await db.scalar(select(DataSource).where(DataSource.id == payload.data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")
    if data_source.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source must belong to this project.",
        )

    template = await db.scalar(select(ExtractionTemplate).where(ExtractionTemplate.id == payload.template_id))
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction template not found.")
    if project.player_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project does not have a player linked.",
        )
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == project.player_id,
            WorkspacePlayer.workspace_id == project.workspace_id,
        )
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project player is invalid for this workspace.",
        )
    template_competitor = await db.scalar(select(Competitor).where(Competitor.id == template.competitor_id))
    if not template_competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template competitor not found.")
    if template_competitor.organization_id != workspace.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extraction template must belong to the same organization as the project workspace.",
        )
    if template_competitor.name.strip().casefold() != player.name.strip().casefold():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extraction template competitor must match the project's player name.",
        )

    existing = await db.scalar(
        select(ProjectExtraction).where(
            ProjectExtraction.project_id == project.id,
            ProjectExtraction.name == payload.name.strip(),
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project extraction already exists for this project.",
        )

    extraction = ProjectExtraction(
        project_id=project.id,
        data_source_id=payload.data_source_id,
        template_id=payload.template_id,
        name=payload.name.strip(),
        batch_size=payload.batch_size if payload.batch_size is not None else template.default_batch_size,
        created_by_id=current_user.id,
        is_active=True,
    )
    db.add(extraction)
    await db.commit()
    await db.refresh(extraction)
    return extraction


@router.get("/projects/{project_id}/extractions", response_model=list[ProjectExtractionRead])
async def list_project_extractions(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectExtraction]:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    extractions = await db.scalars(
        select(ProjectExtraction)
        .where(ProjectExtraction.project_id == project_id)
        .order_by(ProjectExtraction.created_at.desc())
    )
    return list(extractions)


@router.get("/projects/{project_id}/extraction-templates", response_model=list[ExtractionTemplateRead])
async def list_project_extraction_templates(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExtractionTemplate]:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    if project.player_id is None:
        return []

    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == project.player_id,
            WorkspacePlayer.workspace_id == project.workspace_id,
        )
    )
    if not player:
        return []

    templates = await db.scalars(
        select(ExtractionTemplate)
        .join(Competitor, Competitor.id == ExtractionTemplate.competitor_id)
        .where(
            Competitor.organization_id == workspace.organization_id,
            func.lower(Competitor.name) == player.name.strip().lower(),
        )
        .order_by(ExtractionTemplate.updated_at.desc())
    )
    return list(templates)
