from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database_node import DatabaseConnection
from app.models.data_source import DataSource
from app.schemas.database_node import (
    DatabaseAssistantRequest,
    DatabaseAssistantResponse,
    DatabaseBindingReference,
    DatabaseConnectionPolicy,
    DatabasePreviewRequest,
    DatabasePreviewResponse,
    DatabaseQueryMode,
    QueryRiskLevel,
)
from app.services.data_source_query import QueryExecutionResult, execute_sql_on_config, execute_sql_on_data_source
from app.services.database_node.assistant import generate_database_assistant_response
from app.services.database_node.query_guard import QueryGuard, QueryGuardViolation
from app.services.database_node.sql_builder import build_select_sql


class DatabaseNodeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def resolve_binding(self, binding: DatabaseBindingReference) -> tuple[Any, DatabaseConnectionPolicy, str]:
        if binding.connection_id:
            connection = await self.db.get(DatabaseConnection, binding.connection_id)
            if not connection or not connection.is_active:
                raise HTTPException(status_code=404, detail="Conexão do nó de banco não encontrada ou inativa.")
            policy = DatabaseConnectionPolicy(**(connection.policy or {}))
            return connection, policy, connection.source_type.value

        if binding.source_type and binding.database:
            data_source = DataSource(
                name="workflow_database_binding",
                project_id=None,
                created_by_id=None,
                source_type=binding.source_type,
                connection_config=binding.database.model_dump(mode="json", exclude={"password"}, exclude_none=True),
                secret_config={"password": binding.database.password} if binding.database.password else {},
                file_config=None,
                is_active=True,
            )
            return data_source, DatabaseConnectionPolicy(), binding.source_type.value

        raise HTTPException(status_code=400, detail="Binding de conexão inválido para o nó de banco.")

    async def preview(self, payload: DatabasePreviewRequest) -> DatabasePreviewResponse:
        sql = payload.sql or ""
        if payload.mode in {DatabaseQueryMode.MANUAL_SELECT, DatabaseQueryMode.VISUAL_BUILDER}:
            if not payload.manual_select:
                raise HTTPException(status_code=400, detail="Definição manual obrigatória para preview visual.")
            sql = build_select_sql(payload.manual_select)

        target, policy, _dialect = await self.resolve_binding(payload.binding)
        guard = QueryGuard(policy)
        try:
            analysis = guard.validate(sql)
        except QueryGuardViolation as exc:
            return DatabasePreviewResponse(success=False, message=str(exc), generated_sql=sql, risk_level=QueryRiskLevel.BLOCKED)

        result = await self._execute(target=target, sql=sql, max_rows=min(payload.max_rows, policy.max_rows_read))
        return DatabasePreviewResponse(
            success=result.success,
            message=result.message,
            columns=result.columns,
            rows=result.rows,
            rowcount=result.rowcount,
            latency_ms=result.latency_ms,
            truncated=result.truncated,
            generated_sql=analysis.normalized_sql,
            risk_level=analysis.risk_level,
            warnings=analysis.warnings,
        )

    async def _execute(self, *, target: Any, sql: str, max_rows: int) -> QueryExecutionResult:
        if isinstance(target, DatabaseConnection):
            return await execute_sql_on_config(
                target.source_type,
                target.connection_config or {},
                target.secret_config or {},
                sql,
                max_rows=max_rows,
            )
        return await execute_sql_on_data_source(target, sql, max_rows=max_rows)

    async def mock_assistant(self, payload: DatabaseAssistantRequest) -> DatabaseAssistantResponse:
        target, policy, dialect = await self.resolve_binding(payload.binding)
        return await generate_database_assistant_response(
            payload=payload,
            target=target,
            dialect=dialect,
            policy=policy,
        )
