from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.data_source import DataSourceType
from app.schemas.competitor_schema_catalog import SchemaTableRead

DATABASE_TYPES = {
    DataSourceType.POSTGRESQL,
    DataSourceType.MYSQL,
    DataSourceType.SQLSERVER,
    DataSourceType.ORACLE,
    DataSourceType.FIREBIRD,
    DataSourceType.SQLITE,
    DataSourceType.SNOWFLAKE,
}


class WorkspaceSchemaCatalogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    erp_id: UUID
    created_by_id: UUID
    captured_from_data_source_id: UUID | None
    database_type: DataSourceType
    schema_definition: list[SchemaTableRead]
    last_executed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WorkspaceSchemaCatalogExecuteRequest(BaseModel):
    data_source_id: UUID
    max_rows: int = Field(default=20000, ge=1, le=50000)
    save_result: bool = True


class WorkspaceSchemaCatalogExecuteResponse(BaseModel):
    success: bool
    message: str
    database_type: DataSourceType | None = None
    tables: list[SchemaTableRead] = Field(default_factory=list)
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False
    saved_catalog_id: UUID | None = None


class WorkspaceSchemaCatalogListQuery(BaseModel):
    database_type: DataSourceType | None = None
    erp_id: UUID | None = None

    @model_validator(mode="after")
    def validate_database_type(self) -> "WorkspaceSchemaCatalogListQuery":
        if self.database_type is not None and self.database_type not in DATABASE_TYPES:
            raise ValueError("database_type must be a database source type.")
        return self

