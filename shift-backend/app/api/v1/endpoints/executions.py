from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.models.workflow_execution import ExecutionStatusEnum, WorkflowExecution
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.workflow_api import (
    ExecutionRead,
    ExecutionStatistics,
    ExecutionTrigger,
    PaginatedExecutions,
)
from app.services.workflow import WorkflowExecutionService

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


async def _get_execution_or_404(
    db: AsyncSession,
    *,
    service: WorkflowExecutionService,
    workspace_id: UUID,
    execution_id: UUID,
) -> WorkflowExecution:
    execution = await service.get_execution(execution_id)
    if not execution or execution.workflow is None or execution.workflow.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execucao nao encontrada.")
    return execution


@router.post(
    "/workspaces/{workspace_id}/workflows/{workflow_id}/execute",
    response_model=ExecutionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Disparar execucao manual de um workflow",
)
async def trigger_execution(
    workspace_id: UUID,
    workflow_id: UUID,
    payload: ExecutionTrigger,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutionRead:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)

    service = WorkflowExecutionService(db=db)
    try:
        execution = await service.run(
            workflow_id=workflow_id,
            triggered_by="manual",
            input_data=payload.input_data,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Falha na execucao do workflow: {exc}",
        ) from exc

    full_execution = await service.get_execution(execution.id)
    if full_execution is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Execucao criada mas nao encontrada para leitura.",
        )
    return ExecutionRead.model_validate(full_execution)


@router.get(
    "/workspaces/{workspace_id}/workflows/{workflow_id}/executions",
    response_model=PaginatedExecutions,
    summary="Listar execucoes de um workflow",
)
async def list_executions(
    workspace_id: UUID,
    workflow_id: UUID,
    status_filter: ExecutionStatusEnum | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedExecutions:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)

    service = WorkflowExecutionService(db=db)
    items, total = await service.list_executions(
        workflow_id=workflow_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    return PaginatedExecutions(items=items, total=total, limit=limit, offset=offset)


@router.get(
    "/workspaces/{workspace_id}/executions/{execution_id}",
    response_model=ExecutionRead,
    summary="Buscar detalhes de uma execucao",
)
async def get_execution(
    workspace_id: UUID,
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutionRead:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)

    service = WorkflowExecutionService(db=db)
    execution = await _get_execution_or_404(
        db,
        service=service,
        workspace_id=workspace_id,
        execution_id=execution_id,
    )
    return ExecutionRead.model_validate(execution)


@router.post(
    "/workspaces/{workspace_id}/executions/{execution_id}/cancel",
    response_model=ExecutionRead,
    summary="Cancelar uma execucao em andamento",
)
async def cancel_execution(
    workspace_id: UUID,
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutionRead:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)

    service = WorkflowExecutionService(db=db)
    await _get_execution_or_404(
        db,
        service=service,
        workspace_id=workspace_id,
        execution_id=execution_id,
    )

    try:
        execution = await service.cancel_execution(execution_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    refreshed_execution = await service.get_execution(execution.id)
    if refreshed_execution is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Execucao cancelada mas nao encontrada para leitura.",
        )
    return ExecutionRead.model_validate(refreshed_execution)


@router.get(
    "/workspaces/{workspace_id}/workflows/{workflow_id}/statistics",
    response_model=ExecutionStatistics,
    summary="Estatisticas de execucao de um workflow",
)
async def get_statistics(
    workspace_id: UUID,
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutionStatistics:
    await _get_workspace_or_404(db, workspace_id)
    await _require_workspace_member(db, workspace_id=workspace_id, user_id=current_user.id)
    await _get_workflow_or_404(db, workspace_id=workspace_id, workflow_id=workflow_id)

    service = WorkflowExecutionService(db=db)
    stats = await service.get_statistics(workflow_id)
    return ExecutionStatistics(**stats)
