from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.data_source import DataSourceType
from app.schemas.data_source import DatabaseConnectionInput

DATABASE_TYPES = {
    DataSourceType.POSTGRESQL,
    DataSourceType.MYSQL,
    DataSourceType.SQLSERVER,
    DataSourceType.ORACLE,
    DataSourceType.FIREBIRD,
    DataSourceType.SQLITE,
    DataSourceType.SNOWFLAKE,
}


class SchemaColumnInput(BaseModel):
    column_name: str = Field(min_length=1, max_length=255)
    data_type: str = Field(min_length=1, max_length=255)
    is_nullable: bool = True


class SchemaTableInput(BaseModel):
    table_name: str = Field(min_length=1, max_length=255)
    schema_name: str | None = Field(default=None, max_length=255)
    columns: list[SchemaColumnInput] = Field(default_factory=list)


class CompetitorSchemaCatalogUpsert(BaseModel):
    source_system: str = Field(min_length=1, max_length=120)
    target_system: str = Field(min_length=1, max_length=120)
    database_type: DataSourceType
    tables: list[SchemaTableInput] = Field(default_factory=list)
    captured_from_data_source_id: UUID | None = None

    @model_validator(mode="after")
    def validate_database_type(self) -> "CompetitorSchemaCatalogUpsert":
        if self.database_type not in DATABASE_TYPES:
            raise ValueError("database_type must be a database source type.")
        return self


class CompetitorSchemaCatalogExecuteRequest(BaseModel):
    source_system: str = Field(min_length=1, max_length=120)
    target_system: str = Field(min_length=1, max_length=120)
    data_source_id: UUID | None = None
    manual_config: DatabaseConnectionInput | None = None
    database_type: DataSourceType | None = None
    max_rows: int = Field(default=20000, ge=1, le=50000)
    save_result: bool = True

    @model_validator(mode="after")
    def validate_input(self) -> "CompetitorSchemaCatalogExecuteRequest":
        if not self.data_source_id and not self.manual_config:
            raise ValueError("Either data_source_id or manual_config must be provided.")
        if self.manual_config and not self.database_type:
            raise ValueError("database_type is required when using manual_config.")
        return self


class SchemaColumnRead(BaseModel):
    column_name: str
    data_type: str
    is_nullable: bool


class SchemaTableRead(BaseModel):
    table_name: str
    schema_name: str | None
    columns: list[SchemaColumnRead]


class CompetitorSchemaCatalogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    competitor_id: UUID
    created_by_id: UUID
    captured_from_data_source_id: UUID | None
    source_system: str
    target_system: str
    database_type: DataSourceType
    schema_definition: list[SchemaTableRead]
    last_executed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CompetitorSchemaCatalogExecuteResponse(BaseModel):
    success: bool
    message: str
    database_type: DataSourceType | None = None
    tables: list[SchemaTableRead] = Field(default_factory=list)
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False
    saved_catalog_id: UUID | None = None
