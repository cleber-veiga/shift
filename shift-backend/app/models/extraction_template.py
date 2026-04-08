import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ExtractionMode(StrEnum):
    SCHEMA_SELECTION = "SCHEMA_SELECTION"
    CUSTOM_SQL = "CUSTOM_SQL"


class ExtractionTemplate(Base):
    __tablename__ = "extraction_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("competitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    extraction_mode: Mapped[ExtractionMode] = mapped_column(
        Enum(ExtractionMode, name="extraction_mode", native_enum=False),
        nullable=False,
    )
    schema_selection_config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    custom_sql_query: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_batch_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
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

    competitor: Mapped["Competitor"] = relationship()
    created_by: Mapped["User"] = relationship()
    project_extractions: Mapped[list["ProjectExtraction"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
    )
