from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.erp import ERP
from app.models.user import User
from app.schemas.erp import ERPCreate, ERPRead, ERPUpdate

router = APIRouter()


@router.post("", response_model=ERPRead, status_code=status.HTTP_201_CREATED)
async def create_erp(
    payload: ERPCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ERP:
    existing = await db.scalar(select(ERP).where((ERP.slug == payload.slug.strip()) | (ERP.code == payload.code.strip())))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ERP already exists.")

    erp = ERP(
        name=payload.name.strip(),
        slug=payload.slug.strip(),
        code=payload.code.strip(),
    )
    db.add(erp)
    await db.commit()
    await db.refresh(erp)
    return erp


@router.get("", response_model=list[ERPRead])
async def list_erps(
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ERP]:
    query = select(ERP)
    if q:
        like = f"%{q.strip().lower()}%"
        query = query.where(
            (ERP.name.ilike(like)) | (ERP.slug.ilike(like)) | (ERP.code.ilike(like))
        )
    erps = await db.scalars(query.order_by(ERP.name.asc()))
    return list(erps)


@router.get("/{erp_id}", response_model=ERPRead)
async def get_erp(
    erp_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ERP:
    erp = await db.scalar(select(ERP).where(ERP.id == erp_id))
    if not erp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ERP not found.")
    return erp


@router.put("/{erp_id}", response_model=ERPRead)
async def update_erp(
    erp_id: UUID,
    payload: ERPUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ERP:
    erp = await db.scalar(select(ERP).where(ERP.id == erp_id))
    if not erp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ERP not found.")

    next_slug = payload.slug.strip() if payload.slug is not None else None
    next_code = payload.code.strip() if payload.code is not None else None
    if next_slug is not None or next_code is not None:
        clauses = []
        if next_slug is not None:
            clauses.append(ERP.slug == next_slug)
        if next_code is not None:
            clauses.append(ERP.code == next_code)
        conflict_query = select(ERP).where(ERP.id != erp.id, or_(*clauses))
        conflict = await db.scalar(conflict_query)
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="ERP already exists.")

    if payload.name is not None:
        erp.name = payload.name.strip()
    if next_slug is not None:
        erp.slug = next_slug
    if next_code is not None:
        erp.code = next_code

    await db.commit()
    await db.refresh(erp)
    return erp


@router.delete("/{erp_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_erp(
    erp_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    erp = await db.scalar(select(ERP).where(ERP.id == erp_id))
    if not erp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ERP not found.")

    await db.execute(delete(ERP).where(ERP.id == erp_id))
    await db.commit()
