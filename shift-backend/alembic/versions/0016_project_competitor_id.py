"""replace project source_system with competitor_id

Revision ID: 0016_project_competitor_id
Revises: 0015_workspace_schema_catalogs
Create Date: 2026-04-07 09:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0016_project_competitor_id"
down_revision: Union[str, None] = "0015_workspace_schema_catalogs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("competitor_id", sa.UUID(), nullable=True))
    op.create_index(op.f("ix_projects_competitor_id"), "projects", ["competitor_id"], unique=False)
    op.create_foreign_key(
        "fk_projects_competitor_id_competitors",
        "projects",
        "competitors",
        ["competitor_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.drop_column("projects", "source_system")


def downgrade() -> None:
    op.add_column(
        "projects",
        sa.Column(
            "source_system",
            sa.String(length=120),
            nullable=False,
            server_default="UNSPECIFIED",
        ),
    )
    op.alter_column("projects", "source_system", server_default=None)

    op.drop_constraint("fk_projects_competitor_id_competitors", "projects", type_="foreignkey")
    op.drop_index(op.f("ix_projects_competitor_id"), table_name="projects")
    op.drop_column("projects", "competitor_id")
