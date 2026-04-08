"""add extraction layer tables

Revision ID: 0017_extraction_layer_tables
Revises: 0016_project_competitor_id
Create Date: 2026-04-07 14:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0017_extraction_layer_tables"
down_revision: Union[str, None] = "0016_project_competitor_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


EXTRACTION_MODE_ENUM = sa.Enum(
    "SCHEMA_SELECTION",
    "CUSTOM_SQL",
    name="extraction_mode",
    native_enum=False,
)

EXTRACTION_JOB_STATUS_ENUM = sa.Enum(
    "PENDING",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "PARTIAL",
    name="extraction_job_status",
    native_enum=False,
)


def upgrade() -> None:
    op.create_table(
        "extraction_templates",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("competitor_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("extraction_mode", EXTRACTION_MODE_ENUM, nullable=False),
        sa.Column("schema_selection_config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("custom_sql_query", sa.Text(), nullable=True),
        sa.Column("default_batch_size", sa.Integer(), nullable=False, server_default=sa.text("1000")),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["competitor_id"], ["competitors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_extraction_templates_competitor_id"), "extraction_templates", ["competitor_id"], unique=False)
    op.create_index(op.f("ix_extraction_templates_created_by_id"), "extraction_templates", ["created_by_id"], unique=False)

    op.create_table(
        "project_extractions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("data_source_id", sa.UUID(), nullable=False),
        sa.Column("template_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("batch_size", sa.Integer(), nullable=False, server_default=sa.text("1000")),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["data_source_id"], ["data_sources.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["template_id"], ["extraction_templates.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_extractions_project_id"), "project_extractions", ["project_id"], unique=False)
    op.create_index(op.f("ix_project_extractions_data_source_id"), "project_extractions", ["data_source_id"], unique=False)
    op.create_index(op.f("ix_project_extractions_template_id"), "project_extractions", ["template_id"], unique=False)
    op.create_index(op.f("ix_project_extractions_created_by_id"), "project_extractions", ["created_by_id"], unique=False)

    op.create_table(
        "extraction_jobs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_extraction_id", sa.UUID(), nullable=False),
        sa.Column("status", EXTRACTION_JOB_STATUS_ENUM, nullable=False, server_default=sa.text("'PENDING'")),
        sa.Column("total_rows_extracted", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_cursor_value", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["project_extraction_id"], ["project_extractions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_extraction_jobs_project_extraction_id"), "extraction_jobs", ["project_extraction_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_extraction_jobs_project_extraction_id"), table_name="extraction_jobs")
    op.drop_table("extraction_jobs")

    op.drop_index(op.f("ix_project_extractions_created_by_id"), table_name="project_extractions")
    op.drop_index(op.f("ix_project_extractions_template_id"), table_name="project_extractions")
    op.drop_index(op.f("ix_project_extractions_data_source_id"), table_name="project_extractions")
    op.drop_index(op.f("ix_project_extractions_project_id"), table_name="project_extractions")
    op.drop_table("project_extractions")

    op.drop_index(op.f("ix_extraction_templates_created_by_id"), table_name="extraction_templates")
    op.drop_index(op.f("ix_extraction_templates_competitor_id"), table_name="extraction_templates")
    op.drop_table("extraction_templates")
