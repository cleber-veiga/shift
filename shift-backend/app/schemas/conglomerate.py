from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ConglomerateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class ConglomerateUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class ConglomerateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EstablishmentCreate(BaseModel):
    corporate_name: str = Field(min_length=2, max_length=255)
    trade_name: str | None = Field(default=None, max_length=255)
    cnpj: str = Field(min_length=14, max_length=18)
    erp_code: int | None = Field(default=None, ge=0)
    cnae: str = Field(min_length=2, max_length=20)
    state_registration: str | None = Field(default=None, max_length=40)
    cep: str | None = Field(default=None, min_length=8, max_length=9)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class EstablishmentUpdate(BaseModel):
    corporate_name: str = Field(min_length=2, max_length=255)
    trade_name: str | None = Field(default=None, max_length=255)
    cnpj: str = Field(min_length=14, max_length=18)
    erp_code: int | None = Field(default=None, ge=0)
    cnae: str = Field(min_length=2, max_length=20)
    state_registration: str | None = Field(default=None, max_length=40)
    cep: str | None = Field(default=None, min_length=8, max_length=9)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class EstablishmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conglomerate_id: UUID
    corporate_name: str
    trade_name: str | None
    cnpj: str
    erp_code: int | None
    cnae: str
    state_registration: str | None
    cep: str | None
    city: str | None
    state: str | None
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CompanyLookupByCNPJRead(BaseModel):
    cnpj: str
    corporate_name: str | None = None
    trade_name: str | None = None
    cnae: str | None = None
    state_registration: str | None = None
    cep: str | None = None
    street: str | None = None
    number: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    complement: str | None = None


class AddressLookupByCEPRead(BaseModel):
    cep: str
    street: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    complement: str | None = None
