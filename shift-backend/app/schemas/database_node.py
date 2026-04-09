from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.data_source import DataSourceType
from app.schemas.data_source import DATABASE_TYPES, DataSourceCreate, DatabaseConnectionInput


class DatabaseConnectionScope(StrEnum):
    PROJECT = "project"
    WORKSPACE = "workspace"
    GLOBAL = "global"
    PUBLIC = "public"
    EPHEMERAL = "ephemeral"


class DatabaseConnectionVisibility(StrEnum):
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC_TEST = "public_test"


class DatabaseQueryMode(StrEnum):
    RAW_SQL = "raw_sql"
    MANUAL_SELECT = "manual_select"
    VISUAL_BUILDER = "visual_builder"
    TEMPLATE = "template"


class DatabaseExecutionIntent(StrEnum):
    READ = "read"
    WRITE = "write"
    UPSERT = "upsert"
    DDL = "ddl"


class DatabaseWriteMode(StrEnum):
    CUSTOM_SQL = "custom_sql"
    INSERT_ROWS = "insert_rows"
    UPDATE_ROWS = "update_rows"
    UPSERT_ROWS = "upsert_rows"
    DELETE_ROWS = "delete_rows"


class DatabaseBindingRequirement(StrEnum):
    OPTIONAL = "optional"
    REQUIRED = "required"
    ALWAYS_REBIND = "always_rebind"


class QueryRiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    BLOCKED = "blocked"


class DatabaseConnectionPolicy(BaseModel):
    allow_read: bool = True
    allow_insert: bool = False
    allow_update: bool = False
    allow_delete: bool = False
    allow_ddl: bool = False
    require_where_for_update_delete: bool = True
    require_limit_for_select: bool = False
    forbid_select_star: bool = False
    max_rows_read: int = Field(default=1000, ge=1, le=100000)
    max_rows_write: int = Field(default=10000, ge=1, le=100000)
    max_execution_ms: int = Field(default=30000, ge=1000, le=300000)
    block_multi_statement: bool = True
    block_comment_tokens: bool = False
    require_manual_approval_for_high_risk: bool = False


class DatabaseConnectionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    source_type: DataSourceType
    database: DatabaseConnectionInput
    scope: DatabaseConnectionScope = DatabaseConnectionScope.PROJECT
    visibility: DatabaseConnectionVisibility = DatabaseConnectionVisibility.PRIVATE
    workspace_id: UUID | None = None
    project_id: UUID | None = None
    is_active: bool = True
    tags: list[str] = Field(default_factory=list)
    policy: DatabaseConnectionPolicy = Field(default_factory=DatabaseConnectionPolicy)
    allow_schema_capture: bool = True
    allow_ai_assistant: bool = True

    @model_validator(mode="after")
    def validate_database_type(self) -> "DatabaseConnectionCreate":
        if self.source_type not in DATABASE_TYPES:
            raise ValueError("Somente tipos de banco relacional sao suportados pelo registry de conexoes do no de banco.")
        DataSourceCreate(
            name=self.name,
            source_type=self.source_type,
            database=self.database,
            file=None,
            is_active=self.is_active,
        )
        return self


class DatabaseConnectionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    database: DatabaseConnectionInput | None = None
    is_active: bool | None = None
    tags: list[str] | None = None
    policy: DatabaseConnectionPolicy | None = None
    allow_schema_capture: bool | None = None
    allow_ai_assistant: bool | None = None


class DatabaseConnectionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    source_type: DataSourceType
    scope: DatabaseConnectionScope
    visibility: DatabaseConnectionVisibility
    workspace_id: UUID | None = None
    project_id: UUID | None = None
    connection_config: dict[str, Any]
    is_active: bool
    tags: list[str] = Field(default_factory=list)
    policy: DatabaseConnectionPolicy = Field(default_factory=DatabaseConnectionPolicy)
    allow_schema_capture: bool = True
    allow_ai_assistant: bool = True
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime


class DatabaseBindingReference(BaseModel):
    connection_id: UUID | None = None
    binding_key: str | None = Field(default=None, max_length=120)
    source_type: DataSourceType | None = None
    database: DatabaseConnectionInput | None = None
    requirement: DatabaseBindingRequirement = DatabaseBindingRequirement.OPTIONAL
    allow_manual_entry: bool = True
    allow_public_test_connections: bool = True
    persist_credentials_in_workflow: bool = False

    @model_validator(mode="after")
    def validate_binding(self) -> "DatabaseBindingReference":
        has_registry_connection = self.connection_id is not None
        has_inline = self.source_type is not None or self.database is not None
        if has_registry_connection and has_inline:
            raise ValueError("Informe connection_id ou source_type/database, nunca ambos.")
        if has_inline and (self.source_type is None or self.database is None):
            raise ValueError("source_type e database sao obrigatorios quando a conexao for inline.")
        if has_inline:
            DataSourceCreate(
                name="database_binding_reference",
                source_type=self.source_type,
                database=self.database,
                file=None,
                is_active=True,
            )
        return self


class DatabaseColumnRef(BaseModel):
    schema_name: str | None = Field(default=None, max_length=255)
    table_name: str = Field(min_length=1, max_length=255)
    column_name: str = Field(min_length=1, max_length=255)
    alias: str | None = Field(default=None, max_length=255)


class DatabaseFilterCondition(BaseModel):
    column: str = Field(min_length=1, max_length=255)
    operator: str = Field(min_length=1, max_length=50)
    value: Any = None
    combinator: str = Field(default="and", pattern="^(and|or)$")


class DatabaseSortRule(BaseModel):
    column: str = Field(min_length=1, max_length=255)
    direction: str = Field(default="asc", pattern="^(asc|desc)$")


class DatabaseJoinDefinition(BaseModel):
    join_type: str = Field(default="inner", pattern="^(inner|left|right|full)$")
    schema_name: str | None = Field(default=None, max_length=255)
    table_name: str = Field(min_length=1, max_length=255)
    alias: str | None = Field(default=None, max_length=255)
    on_sql: str = Field(min_length=1, max_length=5000)


class DatabaseManualSelectDefinition(BaseModel):
    base_schema_name: str | None = Field(default=None, max_length=255)
    base_table_name: str = Field(min_length=1, max_length=255)
    base_alias: str | None = Field(default=None, max_length=255)
    columns: list[DatabaseColumnRef] = Field(default_factory=list)
    joins: list[DatabaseJoinDefinition] = Field(default_factory=list)
    filters: list[DatabaseFilterCondition] = Field(default_factory=list)
    sorts: list[DatabaseSortRule] = Field(default_factory=list)
    limit: int | None = Field(default=1000, ge=1, le=100000)
    offset: int | None = Field(default=None, ge=0, le=1000000)
    distinct: bool = False


class DatabaseTableTemplateColumn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    data_type: str = Field(min_length=1, max_length=255)
    nullable: bool = True
    primary_key: bool = False
    description: str | None = Field(default=None, max_length=1000)


class DatabaseTableTemplateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    connection_id: UUID | None = None
    source_type: DataSourceType
    schema_name: str | None = Field(default=None, max_length=255)
    table_name: str = Field(min_length=1, max_length=255)
    write_mode: DatabaseWriteMode = DatabaseWriteMode.INSERT_ROWS
    primary_key_columns: list[str] = Field(default_factory=list)
    columns: list[DatabaseTableTemplateColumn] = Field(default_factory=list)
    default_mapping: dict[str, str] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)


class DatabaseTableTemplateRead(DatabaseTableTemplateCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime


class DatabasePreviewRequest(BaseModel):
    binding: DatabaseBindingReference
    mode: DatabaseQueryMode = DatabaseQueryMode.RAW_SQL
    sql: str | None = Field(default=None, max_length=50000)
    manual_select: DatabaseManualSelectDefinition | None = None
    max_rows: int = Field(default=100, ge=1, le=1000)


class DatabasePreviewResponse(BaseModel):
    success: bool
    message: str
    columns: list[str] | None = None
    rows: list[dict[str, Any]] | None = None
    rowcount: int | None = None
    latency_ms: int | None = None
    truncated: bool = False
    generated_sql: str | None = None
    risk_level: QueryRiskLevel = QueryRiskLevel.LOW
    warnings: list[str] = Field(default_factory=list)


class DatabaseAssistantRequest(BaseModel):
    binding: DatabaseBindingReference
    user_prompt: str = Field(min_length=1, max_length=10000)
    mode: DatabaseQueryMode = DatabaseQueryMode.RAW_SQL
    dialect_hint: str | None = Field(default=None, max_length=120)
    current_sql: str | None = Field(default=None, max_length=50000)
    manual_select: DatabaseManualSelectDefinition | None = None
    max_schema_tables: int = Field(default=40, ge=1, le=200)


class DatabaseAssistantResponse(BaseModel):
    success: bool
    message: str
    suggested_sql: str | None = None
    suggested_mode: DatabaseQueryMode | None = None
    explanation: str | None = None
    risk_level: QueryRiskLevel = QueryRiskLevel.LOW
    warnings: list[str] = Field(default_factory=list)
    schema_context: dict[str, Any] | None = None
