from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.extraction_job import ExtractionJobStatus


class ExtractionJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_extraction_id: UUID
    status: ExtractionJobStatus
    total_rows_extracted: int
    last_cursor_value: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None


class ExtractionJobStartRequest(BaseModel):
    cursor_override: str | None = Field(default=None, max_length=255)


class ExtractionJobStartResponse(BaseModel):
    job_id: UUID
