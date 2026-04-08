"""replace project competitor_id with player_id

Revision ID: 0019_projects_player_id
Revises: 0018_workspace_players
Create Date: 2026-04-07 17:45:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0019_projects_player_id"
down_revision: Union[str, None] = "0018_workspace_players"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("player_id", sa.UUID(), nullable=True))
    op.create_index(op.f("ix_projects_player_id"), "projects", ["player_id"], unique=False)
    op.create_foreign_key(
        "fk_projects_player_id_workspace_players",
        "projects",
        "workspace_players",
        ["player_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.drop_constraint("fk_projects_competitor_id_competitors", "projects", type_="foreignkey")
    op.drop_index(op.f("ix_projects_competitor_id"), table_name="projects")
    op.drop_column("projects", "competitor_id")


def downgrade() -> None:
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

    op.drop_constraint("fk_projects_player_id_workspace_players", "projects", type_="foreignkey")
    op.drop_index(op.f("ix_projects_player_id"), table_name="projects")
    op.drop_column("projects", "player_id")
