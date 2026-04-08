from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.session import AsyncSessionLocal
from app.models.extraction_job import ExtractionJob, ExtractionJobStatus
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.project_extraction import ProjectExtraction
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.extraction_job import ExtractionJobStartRequest, ExtractionJobStartResponse
from app.services.extraction_runner import run_extraction_job

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


def can_manage_extractions(
    workspace_member: WorkspaceMember | None,
    org_member: OrganizationMember | None,
) -> bool:
    return (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )


async def _run_extraction_job_background(job_id: UUID) -> None:
    async with AsyncSessionLocal() as db:
        await run_extraction_job(job_id=job_id, db=db)


@router.post(
    "/project-extractions/{extraction_id}/start",
    response_model=ExtractionJobStartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_project_extraction(
    extraction_id: UUID,
    background_tasks: BackgroundTasks,
    payload: ExtractionJobStartRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExtractionJobStartResponse:
    extraction = await db.scalar(select(ProjectExtraction).where(ProjectExtraction.id == extraction_id))
    if extraction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project extraction not found.")

    project = await db.scalar(select(Project).where(Project.id == extraction.project_id))
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if workspace is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_extractions(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    job = ExtractionJob(
        project_extraction_id=extraction.id,
        status=ExtractionJobStatus.PENDING,
        total_rows_extracted=0,
        last_cursor_value=payload.cursor_override if payload else None,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    background_tasks.add_task(_run_extraction_job_background, job.id)
    return ExtractionJobStartResponse(job_id=job.id)
