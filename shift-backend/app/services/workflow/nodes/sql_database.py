from typing import Any

from app.models.data_source import DataSource
from app.schemas.workflow.action_config import SqlDatabaseConfig
from app.services.data_source_query import execute_sql_on_config, execute_sql_on_data_source

from .base import DEFAULT_ROUTE_HANDLE, BaseNodeProcessor, NodeProcessingError
from .factory import register_processor


@register_processor("sql_database")
class SqlDatabaseProcessor(BaseNodeProcessor):
    async def process(self, context: dict[str, Any]):
        config = SqlDatabaseConfig.model_validate(self.config)
        query = self.resolve_template(config.query or "", context)

        if config.data_source_id is not None:
            if self.db is None:
                raise NodeProcessingError(
                    node_id=self.node_id,
                    node_type=self.node_type,
                    message="Database session is required to load data_source_id.",
                )
            data_source = await self.db.get(DataSource, config.data_source_id)
            if data_source is None:
                raise NodeProcessingError(
                    node_id=self.node_id,
                    node_type=self.node_type,
                    message=f"Data source '{config.data_source_id}' not found.",
                )
            if not data_source.is_active:
                raise NodeProcessingError(
                    node_id=self.node_id,
                    node_type=self.node_type,
                    message=f"Data source '{config.data_source_id}' is inactive.",
                )

            result = await execute_sql_on_data_source(
                data_source=data_source,
                sql=query,
                max_rows=config.max_rows,
            )
        else:
            assert config.source_type is not None
            assert config.database is not None
            database_config = self.resolve_data(
                config.database.model_dump(mode="json", exclude_none=True),
                context,
            )
            secret_config = None
            if database_config.get("password"):
                secret_config = {"password": database_config.pop("password")}

            result = await execute_sql_on_config(
                source_type=config.source_type,
                connection_config=database_config,
                secret_config=secret_config,
                sql=query,
                max_rows=config.max_rows,
            )

        payload = self._build_payload(
            result,
            query=query,
            output_field=config.output_field,
            include_metadata=config.include_metadata,
        )
        if result.success:
            return self.build_result(
                payload,
                emitted_handles={DEFAULT_ROUTE_HANDLE, "success"},
            )

        if config.fail_on_error:
            raise NodeProcessingError(
                node_id=self.node_id,
                node_type=self.node_type,
                message=result.message,
            )

        return self.build_result(
            payload,
            emitted_handles={DEFAULT_ROUTE_HANDLE, "error"},
        )

    def _build_payload(
        self,
        result: Any,
        *,
        query: str,
        output_field: str,
        include_metadata: bool,
    ) -> dict[str, Any]:
        if not include_metadata:
            return {
                output_field: result.rows if result.rows is not None else []
            }
        return {
            output_field: {
                "success": result.success,
                "message": result.message,
                "query": query,
                "columns": result.columns,
                "rows": result.rows,
                "rowcount": result.rowcount,
                "latency_ms": result.latency_ms,
                "truncated": result.truncated,
            }
        }
