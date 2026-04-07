"""add erps and workspace erp_id

Revision ID: 0014_erps_and_workspace_erp_id
Revises: 0fa874e49474
Create Date: 2026-04-07 23:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_erps_and_workspace_erp_id"
down_revision: Union[str, None] = "0fa874e49474"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "erps",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=60), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_erps_slug"),
        sa.UniqueConstraint("code", name="uq_erps_code"),
    )
    op.create_index(op.f("ix_erps_code"), "erps", ["code"], unique=False)
    op.create_index(op.f("ix_erps_slug"), "erps", ["slug"], unique=False)

    op.add_column("workspaces", sa.Column("erp_id", sa.UUID(), nullable=True))
    op.create_index(op.f("ix_workspaces_erp_id"), "workspaces", ["erp_id"], unique=False)
    op.create_foreign_key(
        "fk_workspaces_erp_id_erps",
        "workspaces",
        "erps",
        ["erp_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_workspaces_erp_id_erps", "workspaces", type_="foreignkey")
    op.drop_index(op.f("ix_workspaces_erp_id"), table_name="workspaces")
    op.drop_column("workspaces", "erp_id")

    op.drop_index(op.f("ix_erps_slug"), table_name="erps")
    op.drop_index(op.f("ix_erps_code"), table_name="erps")
    op.drop_table("erps")
