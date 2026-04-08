"""add workspace players

Revision ID: 0018_workspace_players
Revises: 0017_extraction_layer_tables
Create Date: 2026-04-07 17:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0018_workspace_players"
down_revision: Union[str, None] = "0017_extraction_layer_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    workspace_player_database_type = sa.Enum(
        "POSTGRESQL",
        "MYSQL",
        "SQLSERVER",
        "ORACLE",
        "FIREBIRD",
        "SQLITE",
        "SNOWFLAKE",
        name="workspace_player_database_type",
        native_enum=False,
    )

    op.create_table(
        "workspace_players",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("database_type", workspace_player_database_type, nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "name", name="uq_workspace_player_workspace_name"),
    )
    op.create_index(op.f("ix_workspace_players_workspace_id"), "workspace_players", ["workspace_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_workspace_players_workspace_id"), table_name="workspace_players")
    op.drop_table("workspace_players")
