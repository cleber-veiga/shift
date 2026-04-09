import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Workflow(Base):
    __tablename__ = "workflows"
    __table_args__ = (UniqueConstraint("workspace_id", "name", name="uq_workflow_workspace_name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    definition: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    player_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspace_players.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    type: Mapped[str] = mapped_column(String(50), nullable=False, default="workflow")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_run_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        onupdate=func.now(),
    )

    workspace: Mapped["Workspace"] = relationship(back_populates="workflows")
    player: Mapped["WorkspacePlayer"] = relationship(back_populates="workflows")
    executions: Mapped[list["WorkflowExecution"]] = relationship(
        "WorkflowExecution",
        back_populates="workflow",
        cascade="all, delete-orphan",
    )
