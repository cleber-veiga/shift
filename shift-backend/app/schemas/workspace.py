from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.roles import WorkspaceMemberRole


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    organization_id: UUID
    erp_id: UUID | None = None


class WorkspaceUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class WorkspaceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    erp_id: UUID | None
    created_by_id: UUID
    created_at: datetime


class WorkspaceMemberCreate(BaseModel):
    user_id: UUID
    role: WorkspaceMemberRole = WorkspaceMemberRole.CONSULTANT
    permission_overrides: dict[str, Any] | None = None


class WorkspaceMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    workspace_id: UUID
    role: WorkspaceMemberRole
    permission_overrides: dict[str, Any] | None
    created_at: datetime
