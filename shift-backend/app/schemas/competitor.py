from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.data_source import DataSourceType


class CompetitorProductBase(BaseModel):
    product_name: str = Field(min_length=1, max_length=120)
    database_type: DataSourceType


class CompetitorProductCreate(CompetitorProductBase):
    pass


class CompetitorProductRead(CompetitorProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    competitor_id: UUID


class CompetitorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=3000)
    products: list[CompetitorProductCreate] = Field(default_factory=list)


class CompetitorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=3000)
    products: list[CompetitorProductCreate] | None = Field(default=None)


class CompetitorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    products: list[CompetitorProductRead]
    created_at: datetime
    updated_at: datetime
