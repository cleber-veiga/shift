import asyncio
import sqlite3
import time
from dataclasses import dataclass
from datetime import date, datetime, time as dt_time
from decimal import Decimal
from typing import Any
from uuid import UUID

from app.models.data_source import DataSource, DataSourceType
from app.services.firebird_client import connect_firebird


@dataclass
class QueryExecutionResult:
    success: bool
    message: str
    columns: list[str] | None = None
    rows: list[dict[str, Any]] | None = None
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False


def _serialize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (datetime, date, dt_time, Decimal, UUID)):
        return str(value)
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value).hex()
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    if isinstance(value, tuple):
        return [_serialize_value(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _serialize_value(v) for k, v in value.items()}
    return str(value)


def _ensure_single_statement(sql: str) -> str:
    statement = sql.strip()
    if not statement:
        raise ValueError("SQL cannot be empty.")
    if statement.endswith(";"):
        statement = statement[:-1].strip()
    if ";" in statement:
        raise ValueError("Only one SQL statement per request is allowed.")
    return statement


def _extract_result(cursor: Any, max_rows: int) -> tuple[list[str] | None, list[dict[str, Any]] | None, int | None, bool]:
    if cursor.description is None:
        return None, None, cursor.rowcount, False

    columns = [str(col[0]) for col in cursor.description]
    raw_rows = cursor.fetchmany(max_rows + 1)
    truncated = len(raw_rows) > max_rows
    rows = raw_rows[:max_rows]
    data = [dict(zip(columns, [_serialize_value(v) for v in row])) for row in rows]
    return columns, data, cursor.rowcount, truncated


def _postgresql_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    import psycopg

    conn_url = config.get("connection_url")
    if conn_url:
        return psycopg.connect(conn_url, connect_timeout=15)
    return psycopg.connect(
        host=config.get("host"),
        port=config.get("port") or 5432,
        dbname=config.get("database"),
        user=config.get("username"),
        password=(secret or {}).get("password"),
        sslmode=config.get("ssl_mode") or "prefer",
        connect_timeout=15,
    )


def _mysql_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    import pymysql

    return pymysql.connect(
        host=config.get("host"),
        port=config.get("port") or 3306,
        user=config.get("username"),
        password=(secret or {}).get("password"),
        database=config.get("database"),
        connect_timeout=15,
        charset="utf8mb4",
    )


def _sqlserver_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    import pyodbc

    host = config.get("host")
    port = config.get("port") or 1433
    db_name = config.get("database")
    user = config.get("username")
    password = (secret or {}).get("password")
    driver = config.get("odbc_driver") or "ODBC Driver 18 for SQL Server"
    encrypt = "yes" if (config.get("ssl_mode") or "require") in {"require", "verify-full", "verify-ca"} else "no"

    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER={host},{port};"
        f"DATABASE={db_name};"
        f"UID={user};"
        f"PWD={password};"
        f"Encrypt={encrypt};"
        "TrustServerCertificate=no;"
        "Connection Timeout=15;"
    )
    return pyodbc.connect(conn_str)


def _oracle_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    import oracledb

    user = config.get("username")
    password = (secret or {}).get("password")
    dsn = config.get("dsn")
    if not dsn:
        host = config.get("host")
        port = config.get("port") or 1521
        service_name = config.get("service_name")
        sid = config.get("sid")
        if service_name:
            dsn = oracledb.makedsn(host, int(port), service_name=service_name)
        elif sid:
            dsn = oracledb.makedsn(host, int(port), sid=sid)
        else:
            dsn = f"{host}:{port}/{config.get('database')}"
    return oracledb.connect(user=user, password=password, dsn=dsn)


def _firebird_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    return connect_firebird(config=config, secret=secret)


def _sqlite_conn(config: dict[str, Any]):
    sqlite_path = config.get("sqlite_path")
    if not sqlite_path:
        raise ValueError("sqlite_path is required for SQLITE.")
    return sqlite3.connect(sqlite_path, timeout=15)


def _snowflake_conn(config: dict[str, Any], secret: dict[str, Any] | None):
    import snowflake.connector

    account = config.get("account") or config.get("host")
    if not account:
        raise ValueError("account (or host) is required for SNOWFLAKE.")

    return snowflake.connector.connect(
        account=account,
        user=config.get("username"),
        password=(secret or {}).get("password"),
        warehouse=config.get("warehouse"),
        database=config.get("database"),
        schema=config.get("schema_name"),
        role=config.get("role"),
        login_timeout=15,
    )


def _execute_with_connection(connection: Any, sql: str, max_rows: int) -> QueryExecutionResult:
    cur = connection.cursor()
    try:
        cur.execute(sql)
        columns, rows, rowcount, truncated = _extract_result(cur, max_rows=max_rows)
        if columns is None:
            try:
                connection.commit()
            except Exception:
                pass
            return QueryExecutionResult(
                success=True,
                message="Statement executed successfully.",
                rowcount=rowcount,
                truncated=truncated,
            )
        return QueryExecutionResult(
            success=True,
            message="Query executed successfully.",
            columns=columns,
            rows=rows,
            rowcount=rowcount,
            truncated=truncated,
        )
    finally:
        try:
            cur.close()
        except Exception:
            pass
        try:
            connection.close()
        except Exception:
            pass


def _run_query_sync(data_source: DataSource, sql: str, max_rows: int) -> QueryExecutionResult:
    started_at = time.perf_counter()
    try:
        statement = _ensure_single_statement(sql)
        if max_rows < 1:
            raise ValueError("max_rows must be greater than 0.")
        if max_rows > 50000:
            raise ValueError("max_rows must be <= 50000.")

        if data_source.source_type in {DataSourceType.CSV, DataSourceType.XLSX}:
            raise ValueError("SQL execution is not supported for file sources (CSV/XLSX).")

        config = data_source.connection_config or {}
        secret = data_source.secret_config or {}

        if data_source.source_type == DataSourceType.POSTGRESQL:
            conn = _postgresql_conn(config, secret)
        elif data_source.source_type == DataSourceType.MYSQL:
            conn = _mysql_conn(config, secret)
        elif data_source.source_type == DataSourceType.SQLSERVER:
            conn = _sqlserver_conn(config, secret)
        elif data_source.source_type == DataSourceType.ORACLE:
            conn = _oracle_conn(config, secret)
        elif data_source.source_type == DataSourceType.FIREBIRD:
            conn = _firebird_conn(config, secret)
        elif data_source.source_type == DataSourceType.SQLITE:
            conn = _sqlite_conn(config)
        elif data_source.source_type == DataSourceType.SNOWFLAKE:
            conn = _snowflake_conn(config, secret)
        else:
            raise ValueError("Unsupported data source type for SQL execution.")

        result = _execute_with_connection(conn, statement, max_rows=max_rows)
        result.latency_ms = int((time.perf_counter() - started_at) * 1000)
        return result
    except ImportError as exc:
        return QueryExecutionResult(
            success=False,
            message=f"Driver not installed for this source type: {exc}",
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )
    except Exception as exc:
        return QueryExecutionResult(
            success=False,
            message=str(exc),
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )


async def execute_sql_on_data_source(
    data_source: DataSource,
    sql: str,
    max_rows: int = 1000,
) -> QueryExecutionResult:
    return await asyncio.to_thread(_run_query_sync, data_source, sql, max_rows)


def _run_query_on_config_sync(
    source_type: DataSourceType,
    connection_config: dict[str, Any],
    secret_config: dict[str, Any] | None,
    sql: str,
    max_rows: int,
) -> QueryExecutionResult:
    started_at = time.perf_counter()
    try:
        statement = _ensure_single_statement(sql)
        if max_rows < 1:
            raise ValueError("max_rows must be greater than 0.")
        if max_rows > 50000:
            raise ValueError("max_rows must be <= 50000.")

        if source_type in {DataSourceType.CSV, DataSourceType.XLSX}:
            raise ValueError("SQL execution is not supported for file sources (CSV/XLSX).")

        config = connection_config
        secret = secret_config or {}

        if source_type == DataSourceType.POSTGRESQL:
            conn = _postgresql_conn(config, secret)
        elif source_type == DataSourceType.MYSQL:
            conn = _mysql_conn(config, secret)
        elif source_type == DataSourceType.SQLSERVER:
            conn = _sqlserver_conn(config, secret)
        elif source_type == DataSourceType.ORACLE:
            conn = _oracle_conn(config, secret)
        elif source_type == DataSourceType.FIREBIRD:
            conn = _firebird_conn(config, secret)
        elif source_type == DataSourceType.SQLITE:
            conn = _sqlite_conn(config)
        elif source_type == DataSourceType.SNOWFLAKE:
            conn = _snowflake_conn(config, secret)
        else:
            raise ValueError("Unsupported data source type for SQL execution.")

        result = _execute_with_connection(conn, statement, max_rows=max_rows)
        result.latency_ms = int((time.perf_counter() - started_at) * 1000)
        return result
    except ImportError as exc:
        return QueryExecutionResult(
            success=False,
            message=f"Driver not installed for this source type: {exc}",
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )
    except Exception as exc:
        return QueryExecutionResult(
            success=False,
            message=str(exc),
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )


async def execute_sql_on_config(
    source_type: DataSourceType,
    connection_config: dict[str, Any],
    secret_config: dict[str, Any] | None,
    sql: str,
    max_rows: int = 1000,
) -> QueryExecutionResult:
    return await asyncio.to_thread(
        _run_query_on_config_sync,
        source_type,
        connection_config,
        secret_config,
        sql,
        max_rows,
    )
