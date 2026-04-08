from app.models.data_source import DataSourceType


def _strip_trailing_semicolon(sql: str) -> str:
    statement = sql.strip()
    while statement.endswith(";"):
        statement = statement[:-1].strip()
    if not statement:
        raise ValueError("user_sql cannot be empty.")
    return statement


def build_paginated_custom_sql(
    source_type: DataSourceType,
    user_sql: str,
    batch_size: int,
    offset: int,
) -> str:
    statement = _strip_trailing_semicolon(user_sql)

    if source_type in {DataSourceType.POSTGRESQL, DataSourceType.MYSQL, DataSourceType.SQLITE}:
        return f"SELECT * FROM ({statement}) AS user_query LIMIT {batch_size} OFFSET {offset}"

    if source_type == DataSourceType.SQLSERVER:
        return (
            f"SELECT * FROM ({statement}) AS user_query "
            f"ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {batch_size} ROWS ONLY"
        )

    if source_type == DataSourceType.ORACLE:
        return (
            f"SELECT * FROM ({statement}) user_query "
            f"OFFSET {offset} ROWS FETCH NEXT {batch_size} ROWS ONLY"
        )

    raise ValueError(f"Unsupported data source type for paginated SQL: {source_type}")
