from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.data_source import DataSourceType
from app.schemas.database_node import (
    DatabaseConnectionScope,
    DatabaseConnectionVisibility,
)


class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    __table_args__ = (
        UniqueConstraint("workspace_id", "project_id", "name", name="uq_db_connection_scope_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_type: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type", native_enum=False),
        nullable=False,
    )
    scope: Mapped[DatabaseConnectionScope] = mapped_column(
        Enum(DatabaseConnectionScope, name="database_connection_scope", native_enum=False),
        nullable=False,
        default=DatabaseConnectionScope.PROJECT,
    )
    visibility: Mapped[DatabaseConnectionVisibility] = mapped_column(
        Enum(DatabaseConnectionVisibility, name="database_connection_visibility", native_enum=False),
        nullable=False,
        default=DatabaseConnectionVisibility.PRIVATE,
    )
    connection_config: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    secret_config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    policy: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    allow_schema_capture: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    allow_ai_assistant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    workspace: Mapped["Workspace | None"] = relationship()
    project: Mapped["Project | None"] = relationship()
    created_by: Mapped["User"] = relationship()


class DatabaseTableTemplate(Base):
    __tablename__ = "database_table_templates"
    __table_args__ = (
        UniqueConstraint("workspace_id", "name", name="uq_db_table_template_workspace_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    connection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("database_connections.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_type: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type", native_enum=False),
        nullable=False,
    )
    schema_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    table_name: Mapped[str] = mapped_column(String(255), nullable=False)
    write_mode: Mapped[str] = mapped_column(String(40), nullable=False)
    primary_key_columns: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    columns: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    default_mapping: Mapped[dict[str, str]] = mapped_column(JSONB, nullable=False, default=dict)
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    workspace: Mapped["Workspace"] = relationship()
    created_by: Mapped["User"] = relationship()
    connection: Mapped["DatabaseConnection | None"] = relationship()


class WorkflowDatabaseBindingSnapshot(Base):
    __tablename__ = "workflow_database_binding_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    binding_key: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    binding_payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    workflow: Mapped["Workflow"] = relationship()
