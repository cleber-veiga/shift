"""add organization competitors

Revision ID: 0009_org_competitors
Revises: 0008_add_firebird_data_source
Create Date: 2026-04-06 20:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0009_org_competitors"
down_revision: Union[str, None] = "0008_add_firebird_data_source"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "competitors",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_competitors_organization_id"), "competitors", ["organization_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_competitors_organization_id"), table_name="competitors")
    op.drop_table("competitors")
