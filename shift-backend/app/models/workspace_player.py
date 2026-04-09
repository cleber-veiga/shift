import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class WorkspacePlayerDatabaseType(StrEnum):
    POSTGRESQL = "POSTGRESQL"
    MYSQL = "MYSQL"
    SQLSERVER = "SQLSERVER"
    ORACLE = "ORACLE"
    FIREBIRD = "FIREBIRD"
    SQLITE = "SQLITE"
    SNOWFLAKE = "SNOWFLAKE"


class WorkspacePlayer(Base):
    __tablename__ = "workspace_players"
    __table_args__ = (UniqueConstraint("workspace_id", "name", name="uq_workspace_player_workspace_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    database_type: Mapped[WorkspacePlayerDatabaseType] = mapped_column(
        Enum(WorkspacePlayerDatabaseType, name="workspace_player_database_type", native_enum=False),
        nullable=False,
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="players")
    projects: Mapped[list["Project"]] = relationship(back_populates="player")
    workflows: Mapped[list["Workflow"]] = relationship(back_populates="player")
