"""add workflow engine tables

Revision ID: 0020_workflow_engine_tables
Revises: 0019_projects_player_id
Create Date: 2026-04-09 10:15:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0020_workflow_engine_tables"
down_revision: Union[str, None] = "0019_projects_player_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workflows",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("player_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=False, server_default="workflow"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("public", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_run_status", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["workspace_players.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_workflow_workspace_name"),
    )
    op.create_index(op.f("ix_workflows_created_at"), "workflows", ["created_at"], unique=False)
    op.create_index(op.f("ix_workflows_player_id"), "workflows", ["player_id"], unique=False)
    op.create_index(op.f("ix_workflows_workspace_id"), "workflows", ["workspace_id"], unique=False)

    op.create_table(
        "workflow_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "running",
                "success",
                "failed",
                "cancelled",
                name="execution_status_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("triggered_by", sa.String(length=50), nullable=False),
        sa.Column("input_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workflow_executions_started_at"), "workflow_executions", ["started_at"], unique=False)
    op.create_index(op.f("ix_workflow_executions_status"), "workflow_executions", ["status"], unique=False)
    op.create_index(op.f("ix_workflow_executions_workflow_id"), "workflow_executions", ["workflow_id"], unique=False)

    op.create_table(
        "node_executions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("execution_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("node_id", sa.String(length=100), nullable=False),
        sa.Column("node_type", sa.String(length=50), nullable=False),
        sa.Column("node_name", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "running",
                "success",
                "failed",
                "skipped",
                name="node_execution_status_enum",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("input_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("output_data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["execution_id"], ["workflow_executions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("execution_id", "node_id", name="uq_node_execution_execution_node"),
    )
    op.create_index(op.f("ix_node_executions_execution_id"), "node_executions", ["execution_id"], unique=False)
    op.create_index(op.f("ix_node_executions_node_id"), "node_executions", ["node_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_node_executions_node_id"), table_name="node_executions")
    op.drop_index(op.f("ix_node_executions_execution_id"), table_name="node_executions")
    op.drop_table("node_executions")

    op.drop_index(op.f("ix_workflow_executions_workflow_id"), table_name="workflow_executions")
    op.drop_index(op.f("ix_workflow_executions_status"), table_name="workflow_executions")
    op.drop_index(op.f("ix_workflow_executions_started_at"), table_name="workflow_executions")
    op.drop_table("workflow_executions")

    op.drop_index(op.f("ix_workflows_workspace_id"), table_name="workflows")
    op.drop_index(op.f("ix_workflows_player_id"), table_name="workflows")
    op.drop_index(op.f("ix_workflows_created_at"), table_name="workflows")
    op.drop_table("workflows")
