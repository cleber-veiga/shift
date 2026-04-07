import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.data_source import DataSourceType


class CompetitorSchemaCatalog(Base):
    __tablename__ = "competitor_schema_catalogs"
    __table_args__ = (
        UniqueConstraint(
            "competitor_id",
            "source_system",
            "target_system",
            "database_type",
            name="uq_competitor_schema_catalog_combo",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    captured_from_data_source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("data_sources.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_system: Mapped[str] = mapped_column(String(120), nullable=False)
    target_system: Mapped[str] = mapped_column(String(120), nullable=False)
    database_type: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type", native_enum=False),
        nullable=False,
    )
    schema_definition: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    last_executed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
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

    competitor: Mapped["Competitor"] = relationship(back_populates="schema_catalogs")
    created_by: Mapped["User"] = relationship()
    captured_from_data_source: Mapped["DataSource"] = relationship()
