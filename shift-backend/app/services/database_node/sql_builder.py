from __future__ import annotations

from app.schemas.database_node import DatabaseManualSelectDefinition


def quote_identifier(value: str) -> str:
    safe = value.replace('"', '""')
    return f'"{safe}"'


def qualify_table(schema_name: str | None, table_name: str) -> str:
    if schema_name:
        return f"{quote_identifier(schema_name)}.{quote_identifier(table_name)}"
    return quote_identifier(table_name)


def build_select_sql(definition: DatabaseManualSelectDefinition) -> str:
    base_table = qualify_table(definition.base_schema_name, definition.base_table_name)
    base_alias = definition.base_alias or definition.base_table_name

    columns_sql: list[str] = []
    for column in definition.columns:
        prefix = quote_identifier(column.table_name)
        reference = f"{prefix}.{quote_identifier(column.column_name)}"
        if column.alias:
            reference += f" AS {quote_identifier(column.alias)}"
        columns_sql.append(reference)

    if not columns_sql:
        columns_sql = [f'{quote_identifier(base_alias)}.*']

    sql_parts = ["SELECT"]
    if definition.distinct:
        sql_parts.append("DISTINCT")
    sql_parts.append(", ".join(columns_sql))
    sql_parts.append(f"FROM {base_table} AS {quote_identifier(base_alias)}")

    for join in definition.joins:
        join_table = qualify_table(join.schema_name, join.table_name)
        alias = join.alias or join.table_name
        sql_parts.append(f"{join.join_type.upper()} JOIN {join_table} AS {quote_identifier(alias)} ON {join.on_sql}")

    if definition.filters:
        filter_parts: list[str] = []
        for index, item in enumerate(definition.filters):
            prefix = item.combinator.upper() if index > 0 else ""
            value = _sql_literal(item.value)
            chunk = f"{quote_identifier(item.column)} {item.operator} {value}".strip()
            if prefix:
                chunk = f"{prefix} {chunk}"
            filter_parts.append(chunk)
        sql_parts.append("WHERE " + " ".join(filter_parts))

    if definition.sorts:
        sql_parts.append(
            "ORDER BY "
            + ", ".join(f"{quote_identifier(item.column)} {item.direction.upper()}" for item in definition.sorts)
        )

    if definition.limit is not None:
        sql_parts.append(f"LIMIT {definition.limit}")
    if definition.offset is not None:
        sql_parts.append(f"OFFSET {definition.offset}")

    return " ".join(sql_parts)


def _sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"
