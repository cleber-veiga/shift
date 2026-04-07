"""add project data sources

Revision ID: 0007_project_data_sources
Revises: 0006_project_source_system
Create Date: 2026-04-06 18:55:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0007_project_data_sources"
down_revision: Union[str, None] = "0006_project_source_system"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    data_source_type = sa.Enum(
        "POSTGRESQL",
        "MYSQL",
        "SQLSERVER",
        "ORACLE",
        "SQLITE",
        "SNOWFLAKE",
        "CSV",
        "XLSX",
        name="data_source_type",
        native_enum=False,
    )

    op.create_table(
        "data_sources",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("source_type", data_source_type, nullable=False),
        sa.Column("connection_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("file_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("secret_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "name", name="uq_data_source_project_name"),
    )
    op.create_index(op.f("ix_data_sources_project_id"), "data_sources", ["project_id"], unique=False)
    op.create_index(op.f("ix_data_sources_created_by_id"), "data_sources", ["created_by_id"], unique=False)

    op.alter_column("data_sources", "is_active", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_data_sources_created_by_id"), table_name="data_sources")
    op.drop_index(op.f("ix_data_sources_project_id"), table_name="data_sources")
    op.drop_table("data_sources")
