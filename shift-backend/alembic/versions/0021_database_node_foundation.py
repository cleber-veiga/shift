"""database node foundation

Revision ID: 0021_database_node_foundation
Revises: 0020_workflow_engine_tables
Create Date: 2026-04-09 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0021_database_node_foundation"
down_revision: str | None = "0020_workflow_engine_tables"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "database_connections",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("source_type", sa.Enum(
            "POSTGRESQL", "MYSQL", "SQLSERVER", "ORACLE", "FIREBIRD", "SQLITE", "SNOWFLAKE", "CSV", "XLSX",
            name="data_source_type", native_enum=False
        ), nullable=False),
        sa.Column("scope", sa.Enum("project", "workspace", "global", "public", "ephemeral", name="database_connection_scope", native_enum=False), nullable=False),
        sa.Column("visibility", sa.Enum("private", "shared", "public_test", name="database_connection_visibility", native_enum=False), nullable=False),
        sa.Column("connection_config", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("secret_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("policy", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("allow_schema_capture", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("allow_ai_assistant", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "project_id", "name", name="uq_db_connection_scope_name"),
    )
    op.create_index(op.f("ix_database_connections_workspace_id"), "database_connections", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_database_connections_project_id"), "database_connections", ["project_id"], unique=False)
    op.create_index(op.f("ix_database_connections_created_by_id"), "database_connections", ["created_by_id"], unique=False)

    op.create_table(
        "database_table_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("connection_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("source_type", sa.Enum(
            "POSTGRESQL", "MYSQL", "SQLSERVER", "ORACLE", "FIREBIRD", "SQLITE", "SNOWFLAKE", "CSV", "XLSX",
            name="data_source_type", native_enum=False
        ), nullable=False),
        sa.Column("schema_name", sa.String(length=255), nullable=True),
        sa.Column("table_name", sa.String(length=255), nullable=False),
        sa.Column("write_mode", sa.String(length=40), nullable=False),
        sa.Column("primary_key_columns", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("columns", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("default_mapping", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["connection_id"], ["database_connections.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_db_table_template_workspace_name"),
    )
    op.create_index(op.f("ix_database_table_templates_workspace_id"), "database_table_templates", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_database_table_templates_created_by_id"), "database_table_templates", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_database_table_templates_connection_id"), "database_table_templates", ["connection_id"], unique=False)

    op.create_table(
        "workflow_database_binding_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("node_id", sa.String(length=255), nullable=False),
        sa.Column("binding_key", sa.String(length=120), nullable=False),
        sa.Column("binding_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workflow_database_binding_snapshots_workflow_id"), "workflow_database_binding_snapshots", ["workflow_id"], unique=False)
    op.create_index(op.f("ix_workflow_database_binding_snapshots_node_id"), "workflow_database_binding_snapshots", ["node_id"], unique=False)
    op.create_index(op.f("ix_workflow_database_binding_snapshots_binding_key"), "workflow_database_binding_snapshots", ["binding_key"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_workflow_database_binding_snapshots_binding_key"), table_name="workflow_database_binding_snapshots")
    op.drop_index(op.f("ix_workflow_database_binding_snapshots_node_id"), table_name="workflow_database_binding_snapshots")
    op.drop_index(op.f("ix_workflow_database_binding_snapshots_workflow_id"), table_name="workflow_database_binding_snapshots")
    op.drop_table("workflow_database_binding_snapshots")

    op.drop_index(op.f("ix_database_table_templates_connection_id"), table_name="database_table_templates")
    op.drop_index(op.f("ix_database_table_templates_created_by_id"), table_name="database_table_templates")
    op.drop_index(op.f("ix_database_table_templates_workspace_id"), table_name="database_table_templates")
    op.drop_table("database_table_templates")

    op.drop_index(op.f("ix_database_connections_created_by_id"), table_name="database_connections")
    op.drop_index(op.f("ix_database_connections_project_id"), table_name="database_connections")
    op.drop_index(op.f("ix_database_connections_workspace_id"), table_name="database_connections")
    op.drop_table("database_connections")
