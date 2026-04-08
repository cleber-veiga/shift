from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProjectExtractionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    data_source_id: UUID
    template_id: UUID
    batch_size: int | None = Field(default=None, ge=1)


class ProjectExtractionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    data_source_id: UUID
    template_id: UUID
    name: str
    is_active: bool
    batch_size: int
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
