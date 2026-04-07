from dataclasses import dataclass
from typing import Any

from app.models.data_source import DataSource, DataSourceType
from app.schemas.competitor_schema_catalog import SchemaColumnRead, SchemaTableRead
from app.services.data_source_query import (
    execute_sql_on_config,
    execute_sql_on_data_source,
)


@dataclass
class SchemaIntrospectionResult:
    success: bool
    message: str
    database_type: DataSourceType | None = None
    tables: list[SchemaTableRead] | None = None
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False


def _quoted(value: str) -> str:
    return value.replace("'", "''")


def _schema_sql_for_type(
    source_type: DataSourceType, connection_config: dict[str, Any] | None = None
) -> str:
    config = connection_config or {}
    schema_name = config.get("schema_name")

    if source_type == DataSourceType.POSTGRESQL:
        if schema_name:
            return (
                "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
                "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
                "FROM information_schema.columns "
                f"WHERE table_schema = '{_quoted(str(schema_name))}' "
                "ORDER BY table_schema, table_name, ordinal_position"
            )
        return (
            "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
            "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
            "FROM information_schema.columns "
            "WHERE table_schema NOT IN ('pg_catalog', 'information_schema') "
            "ORDER BY table_schema, table_name, ordinal_position"
        )

    if source_type == DataSourceType.MYSQL:
        return (
            "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
            "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
            "FROM information_schema.columns "
            "WHERE table_schema = DATABASE() "
            "ORDER BY table_schema, table_name, ordinal_position"
        )

    if source_type == DataSourceType.SQLSERVER:
        if schema_name:
            return (
                "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
                "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
                "FROM information_schema.columns "
                f"WHERE table_schema = '{_quoted(str(schema_name))}' "
                "ORDER BY table_schema, table_name, ordinal_position"
            )
        return (
            "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
            "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
            "FROM information_schema.columns "
            "ORDER BY table_schema, table_name, ordinal_position"
        )

    if source_type == DataSourceType.ORACLE:
        if schema_name:
            return (
                "SELECT owner AS schema_name, table_name, column_name, data_type, "
                "CASE WHEN nullable = 'Y' THEN 1 ELSE 0 END AS is_nullable, column_id AS ordinal_position "
                "FROM all_tab_columns "
                f"WHERE owner = UPPER('{_quoted(str(schema_name))}') "
                "ORDER BY owner, table_name, column_id"
            )
        return (
            "SELECT owner AS schema_name, table_name, column_name, data_type, "
            "CASE WHEN nullable = 'Y' THEN 1 ELSE 0 END AS is_nullable, column_id AS ordinal_position "
            "FROM all_tab_columns "
            "WHERE owner NOT IN ('SYS', 'SYSTEM') "
            "ORDER BY owner, table_name, column_id"
        )

    if source_type == DataSourceType.FIREBIRD:
        return (
            "SELECT "
            "NULL AS schema_name, "
            "TRIM(rf.RDB$RELATION_NAME) AS table_name, "
            "TRIM(rf.RDB$FIELD_NAME) AS column_name, "
            "CASE f.RDB$FIELD_TYPE "
            "WHEN 7 THEN CASE f.RDB$FIELD_SUB_TYPE WHEN 1 THEN 'NUMERIC' WHEN 2 THEN 'DECIMAL' ELSE 'SMALLINT' END "
            "WHEN 8 THEN CASE f.RDB$FIELD_SUB_TYPE WHEN 1 THEN 'NUMERIC' WHEN 2 THEN 'DECIMAL' ELSE 'INTEGER' END "
            "WHEN 10 THEN 'FLOAT' "
            "WHEN 12 THEN 'DATE' "
            "WHEN 13 THEN 'TIME' "
            "WHEN 14 THEN 'CHAR' "
            "WHEN 16 THEN CASE f.RDB$FIELD_SUB_TYPE WHEN 1 THEN 'NUMERIC' WHEN 2 THEN 'DECIMAL' ELSE 'BIGINT' END "
            "WHEN 23 THEN 'BOOLEAN' "
            "WHEN 24 THEN 'DECFLOAT' "
            "WHEN 25 THEN 'DECFLOAT' "
            "WHEN 26 THEN 'INT128' "
            "WHEN 27 THEN 'DOUBLE PRECISION' "
            "WHEN 28 THEN 'TIME WITH TIME ZONE' "
            "WHEN 29 THEN 'TIMESTAMP WITH TIME ZONE' "
            "WHEN 35 THEN 'TIMESTAMP' "
            "WHEN 37 THEN 'VARCHAR' "
            "WHEN 40 THEN 'CSTRING' "
            "WHEN 261 THEN 'BLOB' "
            "ELSE 'UNKNOWN' END AS data_type, "
            "CASE WHEN rf.RDB$NULL_FLAG = 1 THEN 0 ELSE 1 END AS is_nullable, "
            "rf.RDB$FIELD_POSITION + 1 AS ordinal_position "
            "FROM RDB$RELATION_FIELDS rf "
            "JOIN RDB$FIELDS f ON rf.RDB$FIELD_SOURCE = f.RDB$FIELD_NAME "
            "JOIN RDB$RELATIONS r ON rf.RDB$RELATION_NAME = r.RDB$RELATION_NAME "
            "WHERE COALESCE(r.RDB$SYSTEM_FLAG, 0) = 0 "
            "ORDER BY table_name, ordinal_position"
        )

    if source_type == DataSourceType.SQLITE:
        return (
            "SELECT "
            "NULL AS schema_name, "
            "m.name AS table_name, "
            "p.name AS column_name, "
            "COALESCE(NULLIF(p.type, ''), 'TEXT') AS data_type, "
            "CASE WHEN p.\"notnull\" = 1 THEN 0 ELSE 1 END AS is_nullable, "
            "p.cid + 1 AS ordinal_position "
            "FROM sqlite_master m "
            "JOIN pragma_table_info(m.name) p "
            "WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%' "
            "ORDER BY m.name, p.cid"
        )

    if source_type == DataSourceType.SNOWFLAKE:
        if schema_name:
            return (
                "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
                "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
                "FROM information_schema.columns "
                f"WHERE table_schema = UPPER('{_quoted(str(schema_name))}') "
                "ORDER BY table_schema, table_name, ordinal_position"
            )
        return (
            "SELECT table_schema AS schema_name, table_name, column_name, data_type, "
            "CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END AS is_nullable, ordinal_position "
            "FROM information_schema.columns "
            "ORDER BY table_schema, table_name, ordinal_position"
        )

    raise ValueError("Unsupported data source type for schema introspection.")


def _read_value(row: dict[str, Any], name: str) -> Any:
    normalized = name.lower()
    for key, value in row.items():
        if str(key).lower() == normalized:
            return value
    return None


def _as_nullable(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if value is None:
        return True
    text = str(value).strip().lower()
    return text in {"1", "true", "t", "yes", "y"}


def _as_int(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value
    return int(str(value))


def _rows_to_tables(rows: list[dict[str, Any]]) -> list[SchemaTableRead]:
    grouped: dict[tuple[str | None, str], list[tuple[int, SchemaColumnRead]]] = {}

    for row in rows:
        table_name = str(_read_value(row, "table_name") or "").strip()
        if not table_name:
            continue
        schema_name_raw = _read_value(row, "schema_name")
        schema_name = (
            str(schema_name_raw).strip() if schema_name_raw is not None else None
        )
        if schema_name == "":
            schema_name = None

        column_name = str(_read_value(row, "column_name") or "").strip()
        if not column_name:
            continue

        data_type = str(_read_value(row, "data_type") or "UNKNOWN").strip()
        is_nullable = _as_nullable(_read_value(row, "is_nullable"))
        ordinal_position = _as_int(_read_value(row, "ordinal_position"))

        key = (schema_name, table_name)
        grouped.setdefault(key, []).append(
            (
                ordinal_position,
                SchemaColumnRead(
                    column_name=column_name,
                    data_type=data_type,
                    is_nullable=is_nullable,
                ),
            )
        )

    tables: list[SchemaTableRead] = []
    for (schema_name, table_name), columns in sorted(
        grouped.items(), key=lambda item: (item[0][0] or "", item[0][1])
    ):
        sorted_columns = [
            column for _, column in sorted(columns, key=lambda item: item[0])
        ]
        tables.append(
            SchemaTableRead(
                table_name=table_name,
                schema_name=schema_name,
                columns=sorted_columns,
            )
        )

    return tables


async def introspect_schema_from_data_source(
    data_source: DataSource,
    max_rows: int = 20000,
) -> SchemaIntrospectionResult:
    if data_source.source_type in {DataSourceType.CSV, DataSourceType.XLSX}:
        return SchemaIntrospectionResult(
            success=False,
            message="Schema introspection is not supported for file sources (CSV/XLSX).",
        )

    try:
        sql = _schema_sql_for_type(data_source.source_type, data_source.connection_config)
    except ValueError as exc:
        return SchemaIntrospectionResult(
            success=False,
            message=str(exc),
            database_type=data_source.source_type,
        )

    query_result = await execute_sql_on_data_source(
        data_source=data_source,
        sql=sql,
        max_rows=max_rows,
    )
    if not query_result.success:
        return SchemaIntrospectionResult(
            success=False,
            message=query_result.message,
            database_type=data_source.source_type,
            rowcount=query_result.rowcount,
            latency_ms=query_result.latency_ms,
            truncated=query_result.truncated,
        )

    rows = query_result.rows or []
    tables = _rows_to_tables(rows)
    return SchemaIntrospectionResult(
        success=True,
        message="Schema introspected successfully.",
        database_type=data_source.source_type,
        tables=tables,
        rowcount=query_result.rowcount,
        latency_ms=query_result.latency_ms,
        truncated=query_result.truncated,
    )


async def introspect_schema_from_config(
    source_type: DataSourceType,
    connection_config: dict[str, Any],
    secret_config: dict[str, Any] | None = None,
    max_rows: int = 20000,
) -> SchemaIntrospectionResult:
    if source_type in {DataSourceType.CSV, DataSourceType.XLSX}:
        return SchemaIntrospectionResult(
            success=False,
            message="Schema introspection is not supported for file sources (CSV/XLSX).",
        )

    try:
        sql = _schema_sql_for_type(source_type, connection_config)
    except ValueError as exc:
        return SchemaIntrospectionResult(
            success=False,
            message=str(exc),
            database_type=source_type,
        )

    query_result = await execute_sql_on_config(
        source_type=source_type,
        connection_config=connection_config,
        secret_config=secret_config,
        sql=sql,
        max_rows=max_rows,
    )
    if not query_result.success:
        return SchemaIntrospectionResult(
            success=False,
            message=query_result.message,
            database_type=source_type,
            rowcount=query_result.rowcount,
            latency_ms=query_result.latency_ms,
            truncated=query_result.truncated,
        )

    rows = query_result.rows or []
    tables = _rows_to_tables(rows)
    return SchemaIntrospectionResult(
        success=True,
        message="Schema introspected successfully.",
        database_type=source_type,
        tables=tables,
        rowcount=query_result.rowcount,
        latency_ms=query_result.latency_ms,
        truncated=query_result.truncated,
    )
