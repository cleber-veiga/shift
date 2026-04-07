"""add project source system

Revision ID: 0006_project_source_system
Revises: 0005_workspace_projects
Create Date: 2026-04-06 18:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0006_project_source_system"
down_revision: Union[str, None] = "0005_workspace_projects"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("source_system", sa.String(length=120), nullable=False, server_default="UNSPECIFIED"),
    )
    op.alter_column("projects", "source_system", server_default=None)


def downgrade() -> None:
    op.drop_column("projects", "source_system")
