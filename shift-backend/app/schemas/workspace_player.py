from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.workspace_player import WorkspacePlayerDatabaseType


class WorkspacePlayerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    database_type: WorkspacePlayerDatabaseType


class WorkspacePlayerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    database_type: WorkspacePlayerDatabaseType | None = None


class WorkspacePlayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    name: str
    database_type: WorkspacePlayerDatabaseType
