"""add conglomerates establishments contacts

Revision ID: 0004_conglomerates_contacts
Revises: 0003_orgs_workspaces
Create Date: 2026-04-06 17:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_conglomerates_contacts"
down_revision: Union[str, None] = "0003_orgs_workspaces"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conglomerates",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "name", name="uq_conglomerate_org_name"),
    )
    op.create_index(op.f("ix_conglomerates_organization_id"), "conglomerates", ["organization_id"], unique=False)

    op.create_table(
        "establishments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conglomerate_id", sa.UUID(), nullable=False),
        sa.Column("corporate_name", sa.String(length=255), nullable=False),
        sa.Column("trade_name", sa.String(length=255), nullable=True),
        sa.Column("cnpj", sa.String(length=14), nullable=False),
        sa.Column("cnae", sa.String(length=20), nullable=False),
        sa.Column("state_registration", sa.String(length=40), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["conglomerate_id"], ["conglomerates.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cnpj", name="uq_establishment_cnpj"),
    )
    op.create_index(op.f("ix_establishments_conglomerate_id"), "establishments", ["conglomerate_id"], unique=False)
    op.create_index(op.f("ix_establishments_cnpj"), "establishments", ["cnpj"], unique=False)

    op.create_table(
        "contacts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workspace_id", sa.UUID(), nullable=False),
        sa.Column("conglomerate_id", sa.UUID(), nullable=False),
        sa.Column("establishment_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cpf", sa.String(length=11), nullable=False),
        sa.Column("whatsapp", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("job_title", sa.String(length=120), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["conglomerate_id"], ["conglomerates.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["establishment_id"], ["establishments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "cpf", name="uq_contact_workspace_cpf"),
        sa.UniqueConstraint("workspace_id", "email", name="uq_contact_workspace_email"),
    )
    op.create_index(op.f("ix_contacts_workspace_id"), "contacts", ["workspace_id"], unique=False)
    op.create_index(op.f("ix_contacts_conglomerate_id"), "contacts", ["conglomerate_id"], unique=False)
    op.create_index(op.f("ix_contacts_establishment_id"), "contacts", ["establishment_id"], unique=False)
    op.create_index(op.f("ix_contacts_cpf"), "contacts", ["cpf"], unique=False)

    op.alter_column("conglomerates", "is_active", server_default=None)
    op.alter_column("establishments", "is_active", server_default=None)
    op.alter_column("contacts", "is_primary", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_contacts_cpf"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_establishment_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_conglomerate_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_workspace_id"), table_name="contacts")
    op.drop_table("contacts")

    op.drop_index(op.f("ix_establishments_cnpj"), table_name="establishments")
    op.drop_index(op.f("ix_establishments_conglomerate_id"), table_name="establishments")
    op.drop_table("establishments")

    op.drop_index(op.f("ix_conglomerates_organization_id"), table_name="conglomerates")
    op.drop_table("conglomerates")
