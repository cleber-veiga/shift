"""add competitor schema catalogs

Revision ID: 0012_competitor_schema_catalogs
Revises: 0011_add_erp_code
Create Date: 2026-04-07 21:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0012_competitor_schema_catalogs"
down_revision: Union[str, None] = "0011_add_erp_code"
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
        "competitor_schema_catalogs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("competitor_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("captured_from_data_source_id", sa.UUID(), nullable=True),
        sa.Column("source_system", sa.String(length=120), nullable=False),
        sa.Column("target_system", sa.String(length=120), nullable=False),
        sa.Column("database_type", data_source_type, nullable=False),
        sa.Column("schema_definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("last_executed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["competitor_id"], ["competitors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["captured_from_data_source_id"], ["data_sources.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "competitor_id",
            "source_system",
            "target_system",
            "database_type",
            name="uq_competitor_schema_catalog_combo",
        ),
    )
    op.create_index(
        op.f("ix_competitor_schema_catalogs_competitor_id"),
        "competitor_schema_catalogs",
        ["competitor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_competitor_schema_catalogs_created_by_id"),
        "competitor_schema_catalogs",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_competitor_schema_catalogs_captured_from_data_source_id"),
        "competitor_schema_catalogs",
        ["captured_from_data_source_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_competitor_schema_catalogs_captured_from_data_source_id"),
        table_name="competitor_schema_catalogs",
    )
    op.drop_index(op.f("ix_competitor_schema_catalogs_created_by_id"), table_name="competitor_schema_catalogs")
    op.drop_index(op.f("ix_competitor_schema_catalogs_competitor_id"), table_name="competitor_schema_catalogs")
    op.drop_table("competitor_schema_catalogs")
