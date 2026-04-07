import asyncio
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.models.data_source import DataSource, DataSourceType
from app.services.firebird_client import connect_firebird


@dataclass
class ConnectionTestResult:
    success: bool
    message: str
    latency_ms: int | None = None


def _test_postgresql(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
    import psycopg

    conn_url = config.get("connection_url")
    password = (secret or {}).get("password")
    if conn_url:
        with psycopg.connect(conn_url, connect_timeout=10) as conn:
            with conn.cursor() as cur:
                cur.execute("select 1")
                cur.fetchone()
        return

    with psycopg.connect(
        host=config.get("host"),
        port=config.get("port") or 5432,
        dbname=config.get("database"),
        user=config.get("username"),
        password=password,
        connect_timeout=10,
        sslmode=config.get("ssl_mode") or "prefer",
    ) as conn:
        with conn.cursor() as cur:
            cur.execute("select 1")
            cur.fetchone()


def _test_mysql(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
    import pymysql

    conn = pymysql.connect(
        host=config.get("host"),
        port=config.get("port") or 3306,
        user=config.get("username"),
        password=(secret or {}).get("password"),
        database=config.get("database"),
        connect_timeout=10,
    )
    try:
        with conn.cursor() as cur:
            cur.execute("select 1")
            cur.fetchone()
    finally:
        conn.close()


def _test_sqlserver(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
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
        "Connection Timeout=10;"
    )
    conn = pyodbc.connect(conn_str)
    try:
        cur = conn.cursor()
        cur.execute("select 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()


def _test_oracle(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
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

    conn = oracledb.connect(user=user, password=password, dsn=dsn)
    try:
        with conn.cursor() as cur:
            cur.execute("select 1 from dual")
            cur.fetchone()
    finally:
        conn.close()


def _test_firebird(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
    conn = connect_firebird(config=config, secret=secret)

    try:
        cur = conn.cursor()
        cur.execute("select 1 from rdb$database")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()


def _test_sqlite(config: dict[str, Any]) -> None:
    sqlite_path = config.get("sqlite_path")
    if not sqlite_path:
        raise ValueError("sqlite_path is required for SQLITE.")

    path = Path(sqlite_path)
    if not path.exists():
        raise ValueError("SQLite file not found.")

    conn = sqlite3.connect(sqlite_path, timeout=10)
    try:
        cur = conn.cursor()
        cur.execute("select 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()


def _test_snowflake(config: dict[str, Any], secret: dict[str, Any] | None) -> None:
    import snowflake.connector

    account = config.get("account") or config.get("host")
    if not account:
        raise ValueError("account (or host) is required for SNOWFLAKE.")

    conn = snowflake.connector.connect(
        account=account,
        user=config.get("username"),
        password=(secret or {}).get("password"),
        warehouse=config.get("warehouse"),
        database=config.get("database"),
        schema=config.get("schema_name"),
        role=config.get("role"),
        login_timeout=10,
    )
    try:
        cur = conn.cursor()
        cur.execute("select 1")
        cur.fetchone()
        cur.close()
    finally:
        conn.close()


def _test_file_source(data_source: DataSource) -> ConnectionTestResult:
    file_config = data_source.file_config or {}
    file_path = file_config.get("file_path")
    storage_key = file_config.get("storage_key")

    if file_path:
        if Path(file_path).exists():
            return ConnectionTestResult(success=True, message="File source is reachable.")
        return ConnectionTestResult(success=False, message="file_path does not exist.")

    if storage_key:
        return ConnectionTestResult(
            success=True,
            message="storage_key provided. Reachability depends on external storage integration.",
        )

    return ConnectionTestResult(success=False, message="file_path or storage_key is required.")


def _test_database_source(data_source: DataSource) -> None:
    config = data_source.connection_config or {}
    secret = data_source.secret_config or {}

    if data_source.source_type == DataSourceType.POSTGRESQL:
        _test_postgresql(config, secret)
        return
    if data_source.source_type == DataSourceType.MYSQL:
        _test_mysql(config, secret)
        return
    if data_source.source_type == DataSourceType.SQLSERVER:
        _test_sqlserver(config, secret)
        return
    if data_source.source_type == DataSourceType.ORACLE:
        _test_oracle(config, secret)
        return
    if data_source.source_type == DataSourceType.FIREBIRD:
        _test_firebird(config, secret)
        return
    if data_source.source_type == DataSourceType.SQLITE:
        _test_sqlite(config)
        return
    if data_source.source_type == DataSourceType.SNOWFLAKE:
        _test_snowflake(config, secret)
        return

    raise ValueError("Unsupported database source type.")


def _test_connection_sync(data_source: DataSource) -> ConnectionTestResult:
    started_at = time.perf_counter()
    try:
        if data_source.source_type in {DataSourceType.CSV, DataSourceType.XLSX}:
            result = _test_file_source(data_source)
            if result.latency_ms is None:
                result.latency_ms = int((time.perf_counter() - started_at) * 1000)
            return result

        _test_database_source(data_source)
        return ConnectionTestResult(
            success=True,
            message="Connection successful.",
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )
    except ImportError as exc:
        return ConnectionTestResult(
            success=False,
            message=f"Driver not installed for this source type: {exc}",
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )
    except Exception as exc:
        return ConnectionTestResult(
            success=False,
            message=str(exc),
            latency_ms=int((time.perf_counter() - started_at) * 1000),
        )


async def test_data_source_connection(data_source: DataSource) -> ConnectionTestResult:
    return await asyncio.to_thread(_test_connection_sync, data_source)
