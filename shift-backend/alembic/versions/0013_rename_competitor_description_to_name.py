"""rename competitor description to name

Revision ID: 0013_rename_comp_name
Revises: 0012_competitor_schema_catalogs
Create Date: 2026-04-07 22:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0013_rename_comp_name"
down_revision: Union[str, None] = "0012_competitor_schema_catalogs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('competitors', 'description', new_column_name='name')


def downgrade() -> None:
    op.alter_column('competitors', 'name', new_column_name='description')
