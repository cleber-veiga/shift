from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.extraction_template import ExtractionMode


class ExtractionTemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    competitor_id: UUID
    extraction_mode: ExtractionMode
    schema_selection_config: dict[str, Any] | None = None
    custom_sql_query: str | None = Field(default=None, max_length=50000)
    default_batch_size: int = Field(default=1000, ge=1)

    @model_validator(mode="after")
    def validate_mode_payload(self) -> "ExtractionTemplateCreate":
        if self.extraction_mode == ExtractionMode.CUSTOM_SQL and not (self.custom_sql_query or "").strip():
            raise ValueError("custom_sql_query is required when extraction_mode is CUSTOM_SQL.")
        return self


class ExtractionTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    competitor_id: UUID | None = None
    extraction_mode: ExtractionMode | None = None
    schema_selection_config: dict[str, Any] | None = None
    custom_sql_query: str | None = Field(default=None, max_length=50000)
    default_batch_size: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_mode_payload(self) -> "ExtractionTemplateUpdate":
        if self.extraction_mode == ExtractionMode.CUSTOM_SQL and not (self.custom_sql_query or "").strip():
            raise ValueError("custom_sql_query is required when extraction_mode is CUSTOM_SQL.")
        return self


class ExtractionTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    competitor_id: UUID
    name: str
    extraction_mode: ExtractionMode
    schema_selection_config: dict[str, Any] | None
    custom_sql_query: str | None
    default_batch_size: int
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
