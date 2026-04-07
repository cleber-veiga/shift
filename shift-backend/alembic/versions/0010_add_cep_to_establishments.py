"""add cep to establishments

Revision ID: 0010_add_cep_to_establishments
Revises: 0009_org_competitors
Create Date: 2026-04-07 09:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0010_add_cep_to_establishments"
down_revision: Union[str, None] = "0009_org_competitors"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("establishments", sa.Column("cep", sa.String(length=8), nullable=True))


def downgrade() -> None:
    op.drop_column("establishments", "cep")
