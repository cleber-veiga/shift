from pathlib import Path
from typing import Any


def _build_firebird_database_value(config: dict[str, Any]) -> str:
    connection_url = config.get("connection_url")
    if connection_url:
        return str(connection_url)

    dsn = config.get("dsn")
    if dsn:
        return str(dsn)

    host = config.get("host")
    port = int(config.get("port") or 3050)
    database = config.get("database")
    if not host or not database:
        raise ValueError("host and database are required for FIREBIRD when dsn is not used.")

    return f"{host}/{port}:{database}"


def _resolve_firebird_client_library(config: dict[str, Any]) -> str | None:
    configured = config.get("client_library_path")
    if configured:
        path = Path(str(configured))
        if path.exists():
            return str(path)

    candidates = [
        r"C:\Program Files\Firebird\Firebird_5_0\fbclient.dll",
        r"C:\Program Files\Firebird\Firebird_4_0\fbclient.dll",
        r"C:\Program Files\Firebird\Firebird_3_0\fbclient.dll",
        r"C:\Program Files\Firebird\Firebird_2_5\bin\fbclient.dll",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return None


def connect_firebird(
    config: dict[str, Any],
    secret: dict[str, Any] | None,
):
    user = config.get("username")
    password = (secret or {}).get("password")
    role = config.get("role")
    charset = config.get("charset") or "UTF8"
    database_value = _build_firebird_database_value(config)
    client_library = _resolve_firebird_client_library(config)

    firebird_driver_error: Exception | None = None
    try:
        from firebird import driver as fb_driver

        if client_library:
            fb_driver.driver_config.fb_client_library.value = client_library

        return fb_driver.connect(
            database=database_value,
            user=user,
            password=password,
            role=role,
            charset=charset,
        )
    except Exception as exc:
        firebird_driver_error = exc

    try:
        import fdb

        kwargs: dict[str, Any] = {
            "dsn": database_value,
            "user": user,
            "password": password,
            "role": role,
            "charset": charset,
        }
        if client_library:
            kwargs["fb_library_name"] = client_library
        return fdb.connect(**kwargs)
    except Exception as fdb_error:
        if firebird_driver_error is not None:
            raise RuntimeError(
                f"firebird-driver error: {firebird_driver_error}; "
                f"fdb error: {fdb_error}"
            ) from fdb_error
        raise
