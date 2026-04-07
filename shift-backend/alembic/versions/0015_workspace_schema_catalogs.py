"""add workspace schema catalogs

Revision ID: 0015_workspace_schema_catalogs
Revises: 0014_erps_and_workspace_erp_id
Create Date: 2026-04-08 00:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0015_workspace_schema_catalogs"
down_revision: Union[str, None] = "0014_erps_and_workspace_erp_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    data_source_type = sa.Enum(
        "POSTGRESQL",
        "MYSQL",
        "SQLSERVER",
        "ORACLE",
        "FIREBIRD",
        "SQLITE",
        "SNOWFLAKE",
        "CSV",
        "XLSX",
        name="data_source_type",
        native_enum=False,
    )

    op.create_table(
        "workspace_schema_catalogs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("erp_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("captured_from_data_source_id", sa.UUID(), nullable=True),
        sa.Column("database_type", data_source_type, nullable=False),
        sa.Column("schema_definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("last_executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["erp_id"], ["erps.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["captured_from_data_source_id"], ["data_sources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workspace_id",
            "erp_id",
            "database_type",
            name="uq_workspace_schema_catalog_combo",
        ),
    )
    op.create_index(op.f("ix_workspace_schema_catalogs_workspace_id"), "workspace_schema_catalogs", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_workspace_schema_catalogs_erp_id"), "workspace_schema_catalogs", ["erp_id"], unique=False)
    op.create_index(op.f("ix_workspace_schema_catalogs_created_by_id"), "workspace_schema_catalogs", ["created_by_id"], unique=False)
    op.create_index(
        op.f("ix_workspace_schema_catalogs_captured_from_data_source_id"),
        "workspace_schema_catalogs",
        ["captured_from_data_source_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_workspace_schema_catalogs_captured_from_data_source_id"), table_name="workspace_schema_catalogs")
    op.drop_index(op.f("ix_workspace_schema_catalogs_created_by_id"), table_name="workspace_schema_catalogs")
    op.drop_index(op.f("ix_workspace_schema_catalogs_erp_id"), table_name="workspace_schema_catalogs")
    op.drop_index(op.f("ix_workspace_schema_catalogs_workspace_id"), table_name="workspace_schema_catalogs")
    op.drop_table("workspace_schema_catalogs")

