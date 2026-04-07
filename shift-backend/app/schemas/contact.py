from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def only_digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


class ContactCreate(BaseModel):
    conglomerate_id: UUID
    establishment_id: UUID | None = None
    name: str = Field(min_length=2, max_length=255)
    cpf: str = Field(min_length=11, max_length=14)
    whatsapp: str = Field(min_length=10, max_length=20)
    email: EmailStr
    job_title: str = Field(min_length=2, max_length=120)
    is_primary: bool = False
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("cpf")
    @classmethod
    def normalize_cpf(cls, value: str) -> str:
        normalized = only_digits(value)
        if len(normalized) != 11:
            raise ValueError("CPF must have 11 digits.")
        return normalized

    @field_validator("whatsapp")
    @classmethod
    def normalize_whatsapp(cls, value: str) -> str:
        normalized = only_digits(value)
        if len(normalized) < 10:
            raise ValueError("WhatsApp number is invalid.")
        return normalized


class ContactUpdate(ContactCreate):
    pass


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    conglomerate_id: UUID
    establishment_id: UUID | None
    name: str
    cpf: str
    whatsapp: str
    email: EmailStr
    job_title: str
    is_primary: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime
