import uuid
import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ExecutionStatusEnum(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"

class NodeExecutionStatusEnum(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[ExecutionStatusEnum] = mapped_column(
        Enum(ExecutionStatusEnum, name="execution_status_enum", native_enum=False),
        nullable=False,
        default=ExecutionStatusEnum.PENDING,
        index=True,
    )

    triggered_by: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")

    input_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="executions")
    nodes: Mapped[list["NodeExecution"]] = relationship(
        "NodeExecution",
        back_populates="execution",
        cascade="all, delete-orphan",
    )


class NodeExecution(Base):
    __tablename__ = "node_executions"
    __table_args__ = (
        UniqueConstraint("execution_id", "node_id", name="uq_node_execution_execution_node"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_executions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    node_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String(50), nullable=False)
    node_name: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[NodeExecutionStatusEnum] = mapped_column(
        Enum(NodeExecutionStatusEnum, name="node_execution_status_enum", native_enum=False),
        nullable=False,
        default=NodeExecutionStatusEnum.PENDING,
    )

    input_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    execution: Mapped["WorkflowExecution"] = relationship("WorkflowExecution", back_populates="nodes")
