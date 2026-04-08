import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.data_source import DataSourceType


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    organization: Mapped["Organization"] = relationship(back_populates="competitors")
    schema_catalogs: Mapped[list["CompetitorSchemaCatalog"]] = relationship(
        back_populates="competitor",
        cascade="all, delete-orphan",
    )
    products: Mapped[list["CompetitorProduct"]] = relationship(
        back_populates="competitor",
        cascade="all, delete-orphan",
    )


class CompetitorProduct(Base):
    __tablename__ = "competitor_products"
    __table_args__ = (
        UniqueConstraint(
            "competitor_id",
            "product_name",
            name="uq_competitor_product_combo",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_name: Mapped[str] = mapped_column(String(120), nullable=False)
    database_type: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type", native_enum=False),
        nullable=False,
    )

    competitor: Mapped["Competitor"] = relationship(back_populates="products")
