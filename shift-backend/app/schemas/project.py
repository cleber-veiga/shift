from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    competitor_id: UUID
    conglomerate_id: UUID
    start_date: date
    end_date: date
    description: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_date_range(self) -> "ProjectCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date.")
        return self


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    conglomerate_id: UUID
    competitor_id: UUID | None
    created_by_id: UUID
    name: str
    description: str | None
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime
