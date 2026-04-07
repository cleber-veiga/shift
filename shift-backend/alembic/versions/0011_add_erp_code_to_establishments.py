"""add erp code to establishments

Revision ID: 0011_add_erp_code
Revises: 0010_add_cep_to_establishments
Create Date: 2026-04-07 11:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0011_add_erp_code"
down_revision: Union[str, None] = "0010_add_cep_to_establishments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("establishments", sa.Column("erp_code", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("establishments", "erp_code")
