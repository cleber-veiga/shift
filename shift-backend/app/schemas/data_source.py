from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.data_source import DataSourceType

DATABASE_TYPES = {
    DataSourceType.POSTGRESQL,
    DataSourceType.MYSQL,
    DataSourceType.SQLSERVER,
    DataSourceType.ORACLE,
    DataSourceType.FIREBIRD,
    DataSourceType.SQLITE,
    DataSourceType.SNOWFLAKE,
}
FILE_TYPES = {DataSourceType.CSV, DataSourceType.XLSX}


class DatabaseConnectionInput(BaseModel):
    connection_url: str | None = Field(default=None, max_length=2000)
    host: str | None = Field(default=None, max_length=255)
    port: int | None = Field(default=None, ge=1, le=65535)
    database: str | None = Field(default=None, max_length=255)
    schema_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, max_length=255)
    ssl_mode: str | None = Field(default=None, max_length=30)
    sqlite_path: str | None = Field(default=None, max_length=1000)
    account: str | None = Field(default=None, max_length=255)
    warehouse: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)
    service_name: str | None = Field(default=None, max_length=255)
    sid: str | None = Field(default=None, max_length=255)
    dsn: str | None = Field(default=None, max_length=1000)
    charset: str | None = Field(default="UTF8", max_length=40)
    client_library_path: str | None = Field(default=None, max_length=1000)
    odbc_driver: str | None = Field(default="ODBC Driver 18 for SQL Server", max_length=255)


class FileSourceInput(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)
    file_path: str | None = Field(default=None, max_length=1000)
    storage_key: str | None = Field(default=None, max_length=1000)
    delimiter: str | None = Field(default=None, max_length=5)
    encoding: str | None = Field(default=None, max_length=40)
    sheet_name: str | None = Field(default=None, max_length=255)
    has_header: bool = True


class DataSourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    source_type: DataSourceType
    database: DatabaseConnectionInput | None = None
    file: FileSourceInput | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_payload(self) -> "DataSourceCreate":
        if self.source_type in DATABASE_TYPES:
            if self.database is None:
                raise ValueError("database payload is required for database source types.")
            if self.file is not None:
                raise ValueError("file payload is not allowed for database source types.")

            if self.source_type == DataSourceType.SQLITE:
                if not self.database.sqlite_path:
                    raise ValueError("sqlite_path is required for SQLITE.")
            elif self.source_type == DataSourceType.FIREBIRD:
                if self.database.connection_url:
                    required_fields = [self.database.username, self.database.password]
                    if any(not item for item in required_fields):
                        raise ValueError("username and password are required when using Firebird connection_url.")
                    return self
                if self.database.dsn:
                    required_fields = [self.database.username, self.database.password]
                    if any(not item for item in required_fields):
                        raise ValueError("username and password are required when using Firebird dsn.")
                else:
                    required_fields = [
                        self.database.host,
                        self.database.database,
                        self.database.username,
                        self.database.password,
                    ]
                    if any(not item for item in required_fields):
                        raise ValueError("host, database, username and password are required for FIREBIRD.")
            elif self.source_type == DataSourceType.SNOWFLAKE:
                required_fields = [self.database.host, self.database.database, self.database.username, self.database.password]
                if any(not item for item in required_fields):
                    raise ValueError("host, database, username and password are required for SNOWFLAKE.")
            else:
                required_fields = [self.database.host, self.database.database, self.database.username, self.database.password]
                if any(not item for item in required_fields):
                    raise ValueError("host, database, username and password are required.")

        if self.source_type in FILE_TYPES:
            if self.file is None:
                raise ValueError("file payload is required for file source types.")
            if self.database is not None:
                raise ValueError("database payload is not allowed for file source types.")
            if not self.file.file_path and not self.file.storage_key:
                raise ValueError("file_path or storage_key is required for file sources.")

        return self


class DataSourceUpdate(DataSourceCreate):
    pass


class DataSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    created_by_id: UUID
    name: str
    source_type: DataSourceType
    connection_config: dict[str, Any] | None
    file_config: dict[str, Any] | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DataSourceConnectionTestResponse(BaseModel):
    success: bool
    message: str
    latency_ms: int | None = None


class DataSourceSQLExecuteRequest(BaseModel):
    sql: str = Field(min_length=1, max_length=50000)
    max_rows: int = Field(default=1000, ge=1, le=5000)


class DataSourceSQLExecuteResponse(BaseModel):
    success: bool
    message: str
    columns: list[str] | None = None
    rows: list[dict[str, Any]] | None = None
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False
