from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ERPCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=1, max_length=60)


class ERPUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, min_length=2, max_length=120)
    code: str | None = Field(default=None, min_length=1, max_length=60)


class ERPRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    code: str
    created_at: datetime
    updated_at: datetime
