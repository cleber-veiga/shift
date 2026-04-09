from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.workspace_player import WorkspacePlayer
from app.schemas.workflow_api import WorkflowCreate, WorkflowListItem, WorkflowRead, WorkflowUpdate

router = APIRouter()


async def _get_workspace_or_404(db: AsyncSession, workspace_id: UUID) -> Workspace:
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace nao encontrado.")
    return workspace


async def _require_workspace_member(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    user_id: UUID,
) -> WorkspaceMember:
    member = await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado ao workspace.")
    return member


async def _get_workflow_or_404(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    workflow_id: UUID,
) -> Workflow:
    workflow = await db.scalar(
        select(Workflow).where(
            Workflow.id == workflow_id,
            Workflow.workspace_id == workspace_id,
        )
    )
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow nao encontrado.")
    return workflow


async def _validate_player_belongs_to_workspace(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    player_id: UUID | None,
) -> None:
    if player_id is None:
        return
    player = await db.scalar(
        select(WorkspacePlayer).where(
            WorkspacePlayer.id == player_id,
            WorkspacePlayer.workspace_id == workspace_id,
        )
    )
    if not player:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Player informado nao pertence a este workspace.",
        )


async def _ensure_unique_workflow_name(
    db: AsyncSession,
    *,
    workspace_id: UUID,
    name: str,
    current_workflow_id: UUID | None = None,
) -> None:
    query = select(Workflow).where(
        Workflow.workspace_id == workspace_id,
        Workflow.name == name,
    )
    if current_workflow_id is not None:
        query = query.where(Workflow.id != current_workflow_id)
    existing = await db.scalar(query)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe um workflow com este nome no workspace.",
        )


def _normalize_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nome do workflow nao pode ser vazio.",
        )
    return normalized


@router.get("/workspaces/{workspace_id}/workflows", response_model=list[WorkflowListItem])
async def list_workflows(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Workflow]:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)

    result = await db.scalars(
        select(Workflow)
        .where(Workflow.workspace_id == workspace_id)
        .order_by(Workflow.created_at.desc())
    )
    return list(result.all())


@router.post(
    "/workspaces/{workspace_id}/workflows",
    response_model=WorkflowRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_workflow(
    workspace_id: UUID,
    payload: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workflow:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)

    normalized_name = _normalize_name(payload.name)
    await _ensure_unique_workflow_name(db, workspace_id=workspace_id, name=normalized_name)
    await _validate_player_belongs_to_workspace(
        db,
        workspace_id=workspace_id,
        player_id=payload.player_id,
    )

    workflow = Workflow(
        workspace_id=workspace_id,
        name=normalized_name,
        description=payload.description,
        definition=payload.definition.model_dump(mode="json"),
        player_id=payload.player_id,
        type=payload.type,
        active=payload.active,
        public=payload.public,
    )
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.get("/workspaces/{workspace_id}/workflows/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(
    workspace_id: UUID,
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workflow:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    return await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)


@router.patch("/workspaces/{workspace_id}/workflows/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workspace_id: UUID,
    workflow_id: UUID,
    payload: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workflow:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    workflow = await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = _normalize_name(update_data["name"])
        await _ensure_unique_workflow_name(
            db,
            workspace_id=workspace_id,
            name=update_data["name"],
            current_workflow_id=workflow_id,
        )

    if "player_id" in update_data:
        await _validate_player_belongs_to_workspace(
            db,
            workspace_id=workspace_id,
            player_id=update_data["player_id"],
        )

    if "definition" in update_data and payload.definition is not None:
        update_data["definition"] = payload.definition.model_dump(mode="json")

    for field, value in update_data.items():
        setattr(workflow, field, value)

    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/workspaces/{workspace_id}/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workspace_id: UUID,
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    workflow = await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)
    await db.delete(workflow)
    await db.commit()
