"""
Workflow execution service.
"""

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workflow import Workflow
from app.models.workflow_execution import ExecutionStatusEnum, NodeExecution, WorkflowExecution
from app.schemas.workflow.base import WorkflowDefinition

from .engine import WorkflowEngine

logger = logging.getLogger(__name__)


class WorkflowExecutionService:
    """Database-facing orchestration for workflow executions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def run(
        self,
        workflow_id: UUID,
        triggered_by: str = "manual",
        input_data: dict[str, Any] | None = None,
    ) -> WorkflowExecution:
        workflow = await self.db.get(Workflow, workflow_id)
        if not workflow:
            raise ValueError(f"Workflow '{workflow_id}' nao encontrado.")
        if not workflow.active:
            raise ValueError(f"Workflow '{workflow_id}' esta inativo.")

        definition = WorkflowDefinition.model_validate(workflow.definition)

        execution = WorkflowExecution(
            workflow_id=workflow_id,
            status=ExecutionStatusEnum.PENDING,
            triggered_by=triggered_by,
            input_data=input_data or {},
        )
        self.db.add(execution)
        await self.db.flush()

        workflow.last_run_at = datetime.now(timezone.utc)
        await self.db.flush()

        engine = WorkflowEngine(db=self.db)
        try:
            await engine.execute(execution=execution, definition=definition)
            workflow.last_run_status = execution.status.value
        except Exception:
            workflow.last_run_status = "failed"
            raise
        finally:
            await self.db.commit()

        return execution

    async def get_execution(self, execution_id: UUID) -> WorkflowExecution | None:
        return await self.db.scalar(
            select(WorkflowExecution)
            .where(WorkflowExecution.id == execution_id)
            .options(
                selectinload(WorkflowExecution.nodes),
                selectinload(WorkflowExecution.workflow),
            )
        )

    async def list_executions(
        self,
        workflow_id: UUID,
        status: ExecutionStatusEnum | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[WorkflowExecution], int]:
        query = select(WorkflowExecution).where(WorkflowExecution.workflow_id == workflow_id)
        if status:
            query = query.where(WorkflowExecution.status == status)

        total = await self.db.scalar(select(func.count()).select_from(query.subquery()))
        executions = (
            await self.db.scalars(
                query.order_by(WorkflowExecution.started_at.desc()).limit(limit).offset(offset)
            )
        ).all()
        return list(executions), total or 0

    async def get_node_executions(self, execution_id: UUID) -> list[NodeExecution]:
        result = await self.db.scalars(
            select(NodeExecution)
            .where(NodeExecution.execution_id == execution_id)
            .order_by(NodeExecution.started_at.asc())
        )
        return list(result.all())

    async def get_statistics(self, workflow_id: UUID) -> dict[str, Any]:
        rows = (
            await self.db.execute(
                select(WorkflowExecution.status, func.count().label("count"))
                .where(WorkflowExecution.workflow_id == workflow_id)
                .group_by(WorkflowExecution.status)
            )
        ).all()

        stats: dict[ExecutionStatusEnum, int] = {row.status: row.count for row in rows}
        total = sum(stats.values())
        success = stats.get(ExecutionStatusEnum.SUCCESS, 0)

        return {
            "total": total,
            "success": success,
            "failed": stats.get(ExecutionStatusEnum.FAILED, 0),
            "running": stats.get(ExecutionStatusEnum.RUNNING, 0),
            "cancelled": stats.get(ExecutionStatusEnum.CANCELLED, 0),
            "success_rate": round((success / total * 100), 2) if total > 0 else 0.0,
        }

    async def cancel_execution(self, execution_id: UUID) -> WorkflowExecution:
        execution = await self.db.get(WorkflowExecution, execution_id)
        if not execution:
            raise ValueError(f"Execucao '{execution_id}' nao encontrada.")
        if execution.status not in (ExecutionStatusEnum.PENDING, ExecutionStatusEnum.RUNNING):
            raise ValueError(
                f"Execucao '{execution_id}' nao pode ser cancelada (status: {execution.status})."
            )

        execution.status = ExecutionStatusEnum.CANCELLED
        execution.ended_at = datetime.now(timezone.utc)
        await self.db.commit()
        return execution
