from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.conglomerate import Conglomerate
from app.models.establishment import Establishment
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.roles import OrganizationMemberRole
from app.models.user import User
from app.schemas.conglomerate import (
    AddressLookupByCEPRead,
    ConglomerateCreate,
    ConglomerateRead,
    ConglomerateUpdate,
    EstablishmentCreate,
    EstablishmentRead,
    EstablishmentUpdate,
)
from app.schemas.contact import only_digits
from app.services.brasil_lookup import (
    LookupServiceError,
    fetch_address_by_cep,
    fetch_company_by_cnpj,
)

router = APIRouter()


async def get_org_member(
    db: AsyncSession,
    organization_id: UUID,
    user_id: UUID,
) -> OrganizationMember | None:
    return await db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )


@router.post("/organizations/{organization_id}/conglomerates", response_model=ConglomerateRead, status_code=status.HTTP_201_CREATED)
async def create_conglomerate(
    organization_id: UUID,
    payload: ConglomerateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Conglomerate:
    organization = await db.scalar(select(Organization).where(Organization.id == organization_id))
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    membership = await get_org_member(db, organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot create conglomerates.")

    existing = await db.scalar(
        select(Conglomerate).where(
            Conglomerate.organization_id == organization_id,
            Conglomerate.name == payload.name.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conglomerate already exists.")

    conglomerate = Conglomerate(
        organization_id=organization_id,
        name=payload.name.strip(),
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(conglomerate)
    await db.commit()
    await db.refresh(conglomerate)
    return conglomerate


@router.get("/organizations/{organization_id}/conglomerates", response_model=list[ConglomerateRead])
async def list_conglomerates(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Conglomerate]:
    membership = await get_org_member(db, organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    conglomerates = await db.scalars(
        select(Conglomerate)
        .where(Conglomerate.organization_id == organization_id)
        .order_by(Conglomerate.created_at.desc())
    )
    return list(conglomerates)


@router.get("/conglomerates/{conglomerate_id}", response_model=ConglomerateRead)
async def get_conglomerate(
    conglomerate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Conglomerate:
    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    return conglomerate


@router.put("/conglomerates/{conglomerate_id}", response_model=ConglomerateRead)
async def update_conglomerate(
    conglomerate_id: UUID,
    payload: ConglomerateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Conglomerate:
    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot update conglomerates.")

    normalized_name = payload.name.strip()
    existing = await db.scalar(
        select(Conglomerate).where(
            Conglomerate.organization_id == conglomerate.organization_id,
            Conglomerate.name == normalized_name,
            Conglomerate.id != conglomerate.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conglomerate already exists.")

    conglomerate.name = normalized_name
    conglomerate.description = payload.description
    conglomerate.is_active = payload.is_active

    await db.commit()
    await db.refresh(conglomerate)
    return conglomerate


@router.delete("/conglomerates/{conglomerate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conglomerate(
    conglomerate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot delete conglomerates.")

    await db.delete(conglomerate)
    await db.commit()


@router.post("/conglomerates/{conglomerate_id}/establishments", response_model=EstablishmentRead, status_code=status.HTTP_201_CREATED)
async def create_establishment(
    conglomerate_id: UUID,
    payload: EstablishmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Establishment:
    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role not in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    cnpj_digits = only_digits(payload.cnpj)
    if len(cnpj_digits) != 14:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CNPJ must have 14 digits.")
    cep_digits = only_digits(payload.cep) if payload.cep else None
    if cep_digits is not None and len(cep_digits) != 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CEP must have 8 digits.")

    existing_cnpj = await db.scalar(select(Establishment).where(Establishment.cnpj == cnpj_digits))
    if existing_cnpj:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CNPJ already registered.")

    establishment = Establishment(
        conglomerate_id=conglomerate_id,
        corporate_name=payload.corporate_name.strip(),
        trade_name=payload.trade_name.strip() if payload.trade_name else None,
        cnpj=cnpj_digits,
        erp_code=payload.erp_code,
        cnae=payload.cnae.strip(),
        state_registration=payload.state_registration.strip() if payload.state_registration else None,
        cep=cep_digits,
        city=payload.city.strip() if payload.city else None,
        state=payload.state.strip().upper() if payload.state else None,
        notes=payload.notes,
        is_active=payload.is_active,
    )
    db.add(establishment)
    await db.commit()
    await db.refresh(establishment)
    return establishment


@router.get("/conglomerates/{conglomerate_id}/establishments", response_model=list[EstablishmentRead])
async def list_establishments(
    conglomerate_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Establishment]:
    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    establishments = await db.scalars(
        select(Establishment)
        .where(Establishment.conglomerate_id == conglomerate_id)
        .order_by(Establishment.created_at.desc())
    )
    return list(establishments)


@router.put("/establishments/{establishment_id}", response_model=EstablishmentRead)
async def update_establishment(
    establishment_id: UUID,
    payload: EstablishmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Establishment:
    establishment = await db.scalar(select(Establishment).where(Establishment.id == establishment_id))
    if not establishment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establishment not found.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == establishment.conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role not in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    cnpj_digits = only_digits(payload.cnpj)
    if len(cnpj_digits) != 14:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CNPJ must have 14 digits.")
    cep_digits = only_digits(payload.cep) if payload.cep else None
    if cep_digits is not None and len(cep_digits) != 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="CEP must have 8 digits.")

    existing_cnpj = await db.scalar(
        select(Establishment).where(
            Establishment.cnpj == cnpj_digits,
            Establishment.id != establishment.id,
        )
    )
    if existing_cnpj:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CNPJ already registered.")

    establishment.corporate_name = payload.corporate_name.strip()
    establishment.trade_name = payload.trade_name.strip() if payload.trade_name else None
    establishment.cnpj = cnpj_digits
    establishment.erp_code = payload.erp_code
    establishment.cnae = payload.cnae.strip()
    establishment.state_registration = payload.state_registration.strip() if payload.state_registration else None
    establishment.cep = cep_digits
    establishment.city = payload.city.strip() if payload.city else None
    establishment.state = payload.state.strip().upper() if payload.state else None
    establishment.notes = payload.notes
    establishment.is_active = payload.is_active

    await db.commit()
    await db.refresh(establishment)
    return establishment


@router.delete("/establishments/{establishment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_establishment(
    establishment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    establishment = await db.scalar(select(Establishment).where(Establishment.id == establishment_id))
    if not establishment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Establishment not found.")

    conglomerate = await db.scalar(select(Conglomerate).where(Conglomerate.id == establishment.conglomerate_id))
    if not conglomerate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conglomerate not found.")

    membership = await get_org_member(db, conglomerate.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role not in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    await db.delete(establishment)
    await db.commit()


@router.get("/lookups/cnpj/{cnpj}", response_model=dict[str, Any])
async def lookup_company_by_cnpj(
    cnpj: str,
    _: User = Depends(get_current_user),
) -> dict[str, Any]:
    try:
        result = await fetch_company_by_cnpj(cnpj)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except LookupServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CNPJ not found.")

    return result


@router.get("/lookups/cep/{cep}", response_model=AddressLookupByCEPRead)
async def lookup_address_by_cep(
    cep: str,
    _: User = Depends(get_current_user),
) -> AddressLookupByCEPRead:
    try:
        result = await fetch_address_by_cep(cep)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except LookupServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CEP not found.")

    return AddressLookupByCEPRead(**result)
