"""add firebird data source type

Revision ID: 0008_add_firebird_data_source
Revises: 0007_project_data_sources
Create Date: 2026-04-06 19:20:00
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0008_add_firebird_data_source"
down_revision: Union[str, None] = "0007_project_data_sources"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS data_source_type")
    op.execute("ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS ck_data_sources_source_type")
    op.execute(
        """
        ALTER TABLE data_sources
        ADD CONSTRAINT ck_data_sources_source_type
        CHECK (
            source_type IN (
                'POSTGRESQL',
                'MYSQL',
                'SQLSERVER',
                'ORACLE',
                'FIREBIRD',
                'SQLITE',
                'SNOWFLAKE',
                'CSV',
                'XLSX'
            )
        )
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS ck_data_sources_source_type")
    op.execute(
        """
        ALTER TABLE data_sources
        ADD CONSTRAINT ck_data_sources_source_type
        CHECK (
            source_type IN (
                'POSTGRESQL',
                'MYSQL',
                'SQLSERVER',
                'ORACLE',
                'SQLITE',
                'SNOWFLAKE',
                'CSV',
                'XLSX'
            )
        )
        """
    )
