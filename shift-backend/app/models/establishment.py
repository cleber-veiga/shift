import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Establishment(Base):
    __tablename__ = "establishments"
    __table_args__ = (UniqueConstraint("cnpj", name="uq_establishment_cnpj"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conglomerate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("conglomerates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    corporate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    trade_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cnpj: Mapped[str] = mapped_column(String(14), nullable=False, index=True)
    erp_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cnae: Mapped[str] = mapped_column(String(20), nullable=False)
    state_registration: Mapped[str | None] = mapped_column(String(40), nullable=True)
    cep: Mapped[str | None] = mapped_column(String(8), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
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

    conglomerate: Mapped["Conglomerate"] = relationship(back_populates="establishments")
    contacts: Mapped[list["Contact"]] = relationship(back_populates="establishment")
