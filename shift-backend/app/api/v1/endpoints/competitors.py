from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.competitor import Competitor, CompetitorProduct
from app.models.competitor_schema_catalog import CompetitorSchemaCatalog
from app.models.data_source import DataSource, DataSourceType
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.roles import OrganizationMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.competitor import CompetitorCreate, CompetitorRead, CompetitorUpdate
from app.schemas.competitor_schema_catalog import (
    CompetitorSchemaCatalogExecuteRequest,
    CompetitorSchemaCatalogExecuteResponse,
    CompetitorSchemaCatalogRead,
    CompetitorSchemaCatalogUpsert,
    SchemaTableRead,
)
from app.services.schema_introspection import (
    introspect_schema_from_config,
    introspect_schema_from_data_source,
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


def can_manage_competitor_schema(membership: OrganizationMember | None) -> bool:
    return membership is not None and membership.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}


async def get_competitor_with_membership(
    db: AsyncSession,
    competitor_id: UUID,
    user_id: UUID,
) -> tuple[Competitor, OrganizationMember]:
    competitor = await db.scalar(select(Competitor).where(Competitor.id == competitor_id))
    if not competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found.")

    membership = await get_org_member(db, competitor.organization_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    return competitor, membership


def schema_tables_to_payload(tables: list[SchemaTableRead]) -> list[dict[str, object]]:
    return [
        {
            "table_name": table.table_name,
            "schema_name": table.schema_name,
            "columns": [
                {
                    "column_name": column.column_name,
                    "data_type": column.data_type,
                    "is_nullable": column.is_nullable,
                }
                for column in table.columns
            ],
        }
        for table in tables
    ]


async def validate_data_source_same_organization(
    db: AsyncSession,
    data_source_id: UUID,
    organization_id: UUID,
) -> DataSource:
    data_source = await db.scalar(select(DataSource).where(DataSource.id == data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    project = await db.scalar(select(Project).where(Project.id == data_source.project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    if workspace.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source must belong to the same organization as the competitor.",
        )

    return data_source


@router.post("/organizations/{organization_id}/competitors", response_model=CompetitorRead, status_code=status.HTTP_201_CREATED)
async def create_competitor(
    organization_id: UUID,
    payload: CompetitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Competitor:
    organization = await db.scalar(select(Organization).where(Organization.id == organization_id))
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    membership = await get_org_member(db, organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot create competitors.")

    competitor = Competitor(
        organization_id=organization_id,
        name=payload.name.strip(),
    )
    if payload.products:
        competitor.products = [
            CompetitorProduct(
                product_name=p.product_name.strip(),
                database_type=p.database_type,
            )
            for p in payload.products
        ]
    db.add(competitor)
    await db.commit()
    await db.refresh(competitor)
    # Reload with products for the response model
    stmt = select(Competitor).where(Competitor.id == competitor.id).options(selectinload(Competitor.products))
    competitor = await db.scalar(stmt)
    return competitor


@router.get("/organizations/{organization_id}/competitors", response_model=list[CompetitorRead])
async def list_competitors(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Competitor]:
    membership = await get_org_member(db, organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")

    stmt = (
        select(Competitor)
        .where(Competitor.organization_id == organization_id)
        .options(selectinload(Competitor.products))
        .order_by(Competitor.created_at.desc())
    )
    competitors = await db.scalars(stmt)
    return list(competitors)


@router.put("/competitors/{competitor_id}", response_model=CompetitorRead)
async def update_competitor(
    competitor_id: UUID,
    payload: CompetitorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Competitor:
    stmt = (
        select(Competitor)
        .where(Competitor.id == competitor_id)
        .options(selectinload(Competitor.products))
    )
    competitor = await db.scalar(stmt)
    if not competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found.")

    membership = await get_org_member(db, competitor.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot update competitors.")

    if payload.name is not None:
        competitor.name = payload.name.strip()

    if payload.products is not None:
        # Simple replacement: delete old, add new
        await db.execute(delete(CompetitorProduct).where(CompetitorProduct.competitor_id == competitor.id))
        competitor.products = [
            CompetitorProduct(
                competitor_id=competitor.id,
                product_name=p.product_name.strip(),
                database_type=p.database_type,
            )
            for p in payload.products
        ]

    await db.commit()
    await db.refresh(competitor)
    return competitor


@router.delete("/competitors/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competitor(
    competitor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    competitor = await db.scalar(select(Competitor).where(Competitor.id == competitor_id))
    if not competitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competitor not found.")

    membership = await get_org_member(db, competitor.organization_id, current_user.id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization.")
    if membership.role == OrganizationMemberRole.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guests cannot delete competitors.")

    await db.delete(competitor)
    await db.commit()


@router.post("/competitors/{competitor_id}/schema-catalogs", response_model=CompetitorSchemaCatalogRead)
async def upsert_schema_catalog(
    competitor_id: UUID,
    payload: CompetitorSchemaCatalogUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompetitorSchemaCatalog:
    competitor, membership = await get_competitor_with_membership(db, competitor_id, current_user.id)
    if not can_manage_competitor_schema(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    if payload.captured_from_data_source_id is not None:
        await validate_data_source_same_organization(
            db=db,
            data_source_id=payload.captured_from_data_source_id,
            organization_id=competitor.organization_id,
        )

    existing = await db.scalar(
        select(CompetitorSchemaCatalog).where(
            CompetitorSchemaCatalog.competitor_id == competitor.id,
            CompetitorSchemaCatalog.source_system == payload.source_system.strip(),
            CompetitorSchemaCatalog.target_system == payload.target_system.strip(),
            CompetitorSchemaCatalog.database_type == payload.database_type,
        )
    )
    serialized_tables = schema_tables_to_payload(
        [
            SchemaTableRead(
                table_name=table.table_name.strip(),
                schema_name=table.schema_name.strip() if table.schema_name else None,
                columns=[
                    column.model_copy(
                        update={
                            "column_name": column.column_name.strip(),
                            "data_type": column.data_type.strip(),
                        }
                    )
                    for column in table.columns
                ],
            )
            for table in payload.tables
        ]
    )

    if existing is None:
        catalog = CompetitorSchemaCatalog(
            competitor_id=competitor.id,
            created_by_id=current_user.id,
            captured_from_data_source_id=payload.captured_from_data_source_id,
            source_system=payload.source_system.strip(),
            target_system=payload.target_system.strip(),
            database_type=payload.database_type,
            schema_definition=serialized_tables,
        )
        db.add(catalog)
    else:
        catalog = existing
        catalog.captured_from_data_source_id = payload.captured_from_data_source_id
        catalog.schema_definition = serialized_tables

    await db.commit()
    await db.refresh(catalog)
    return catalog


@router.get("/competitors/{competitor_id}/schema-catalogs", response_model=list[CompetitorSchemaCatalogRead])
async def list_schema_catalogs(
    competitor_id: UUID,
    source_system: str | None = None,
    target_system: str | None = None,
    database_type: DataSourceType | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CompetitorSchemaCatalog]:
    competitor, _ = await get_competitor_with_membership(db, competitor_id, current_user.id)

    query = select(CompetitorSchemaCatalog).where(CompetitorSchemaCatalog.competitor_id == competitor.id)
    if source_system:
        query = query.where(CompetitorSchemaCatalog.source_system == source_system.strip())
    if target_system:
        query = query.where(CompetitorSchemaCatalog.target_system == target_system.strip())
    if database_type:
        query = query.where(CompetitorSchemaCatalog.database_type == database_type)

    catalogs = await db.scalars(query.order_by(CompetitorSchemaCatalog.updated_at.desc()))
    return list(catalogs)


@router.get("/competitors/{competitor_id}/schema-catalogs/{catalog_id}", response_model=CompetitorSchemaCatalogRead)
async def get_schema_catalog(
    competitor_id: UUID,
    catalog_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompetitorSchemaCatalog:
    competitor, _ = await get_competitor_with_membership(db, competitor_id, current_user.id)

    catalog = await db.scalar(
        select(CompetitorSchemaCatalog).where(
            CompetitorSchemaCatalog.id == catalog_id,
            CompetitorSchemaCatalog.competitor_id == competitor.id,
        )
    )
    if not catalog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schema catalog not found.")
    return catalog


@router.post(
    "/competitors/{competitor_id}/schema-catalogs/execute",
    response_model=CompetitorSchemaCatalogExecuteResponse,
)
async def execute_schema_catalog(
    competitor_id: UUID,
    payload: CompetitorSchemaCatalogExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompetitorSchemaCatalogExecuteResponse:
    competitor, membership = await get_competitor_with_membership(db, competitor_id, current_user.id)
    if not can_manage_competitor_schema(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    data_source = None
    if payload.data_source_id:
        data_source = await validate_data_source_same_organization(
            db=db,
            data_source_id=payload.data_source_id,
            organization_id=competitor.organization_id,
        )

        introspection = await introspect_schema_from_data_source(
            data_source=data_source,
            max_rows=payload.max_rows,
        )
    else:
         # manual_config case
         config_dict = payload.manual_config.model_dump()
         password = config_dict.pop("password", None)
         secret_config = {"password": password} if password else None
         
         introspection = await introspect_schema_from_config(
             source_type=payload.database_type,
             connection_config=config_dict,
             secret_config=secret_config,
             max_rows=payload.max_rows,
         )

    if not introspection.success:
        return CompetitorSchemaCatalogExecuteResponse(
            success=False,
            message=introspection.message,
            database_type=introspection.database_type,
            rowcount=introspection.rowcount,
            latency_ms=introspection.latency_ms,
            truncated=introspection.truncated,
        )

    tables = introspection.tables or []
    saved_catalog_id = None

    if payload.save_result:
        db_type = data_source.source_type if data_source else payload.database_type
        existing = await db.scalar(
            select(CompetitorSchemaCatalog).where(
                CompetitorSchemaCatalog.competitor_id == competitor.id,
                CompetitorSchemaCatalog.source_system == payload.source_system.strip(),
                CompetitorSchemaCatalog.target_system == payload.target_system.strip(),
                CompetitorSchemaCatalog.database_type == db_type,
            )
        )
        serialized_tables = schema_tables_to_payload(tables)

        if existing is None:
            catalog = CompetitorSchemaCatalog(
                competitor_id=competitor.id,
                created_by_id=current_user.id,
                captured_from_data_source_id=data_source.id if data_source else None,
                source_system=payload.source_system.strip(),
                target_system=payload.target_system.strip(),
                database_type=db_type,
                schema_definition=serialized_tables,
            )
            db.add(catalog)
        else:
            catalog = existing
            catalog.captured_from_data_source_id = data_source.id if data_source else None
            catalog.schema_definition = serialized_tables
        catalog.last_executed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(catalog)
        saved_catalog_id = catalog.id

    return CompetitorSchemaCatalogExecuteResponse(
        success=True,
        message=introspection.message,
        database_type=introspection.database_type,
        tables=tables,
        rowcount=introspection.rowcount,
        latency_ms=introspection.latency_ms,
        truncated=introspection.truncated,
        saved_catalog_id=saved_catalog_id,
    )
