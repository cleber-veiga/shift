from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.data_source import DataSource
from app.models.data_source import DataSourceType
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.roles import OrganizationMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_schema_catalog import WorkspaceSchemaCatalog
from app.schemas.workspace_schema_catalog import (
    WorkspaceSchemaCatalogExecuteRequest,
    WorkspaceSchemaCatalogExecuteResponse,
    WorkspaceSchemaCatalogRead,
)
from app.services.schema_introspection import introspect_schema_from_data_source

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


def can_manage_workspace_schema(membership: OrganizationMember | None) -> bool:
    return membership is not None and membership.role in {
        OrganizationMemberRole.OWNER,
        OrganizationMemberRole.MANAGER,
        OrganizationMemberRole.MEMBER,
    }

async def validate_data_source_same_workspace(
    db: AsyncSession,
    data_source_id: UUID,
    workspace_id: UUID,
) -> DataSource:
    data_source = await db.scalar(select(DataSource).where(DataSource.id == data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    project = await db.scalar(select(Project).where(Project.id == data_source.project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    if project.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data source must belong to the same workspace.",
        )

    return data_source


@router.get("/{workspace_id}/schema-catalogs", response_model=list[WorkspaceSchemaCatalogRead])
async def list_workspace_schema_catalogs(
    workspace_id: UUID,
    database_type: DataSourceType | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[WorkspaceSchemaCatalog]:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    membership = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_workspace_schema(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    if workspace.erp_id is None:
        return []

    stmt = select(WorkspaceSchemaCatalog).where(
        WorkspaceSchemaCatalog.workspace_id == workspace.id,
        WorkspaceSchemaCatalog.erp_id == workspace.erp_id,
    )
    if database_type:
        stmt = stmt.where(WorkspaceSchemaCatalog.database_type == database_type)

    catalogs = await db.scalars(stmt.order_by(WorkspaceSchemaCatalog.updated_at.desc()))
    return list(catalogs)


@router.post(
    "/{workspace_id}/schema-catalogs/execute",
    response_model=WorkspaceSchemaCatalogExecuteResponse,
)
async def execute_workspace_schema_catalog(
    workspace_id: UUID,
    payload: WorkspaceSchemaCatalogExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> WorkspaceSchemaCatalogExecuteResponse:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    membership = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_workspace_schema(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    if workspace.erp_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace does not have an ERP configured.",
        )

    data_source = await validate_data_source_same_workspace(
        db=db,
        data_source_id=payload.data_source_id,
        workspace_id=workspace.id,
    )

    introspection = await introspect_schema_from_data_source(
        data_source=data_source,
        max_rows=payload.max_rows,
    )
    if not introspection.success:
        return WorkspaceSchemaCatalogExecuteResponse(
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
        existing = await db.scalar(
            select(WorkspaceSchemaCatalog).where(
                WorkspaceSchemaCatalog.workspace_id == workspace.id,
                WorkspaceSchemaCatalog.erp_id == workspace.erp_id,
                WorkspaceSchemaCatalog.database_type == data_source.source_type,
            )
        )
        serialized_tables = [
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

        if existing is None:
            catalog = WorkspaceSchemaCatalog(
                workspace_id=workspace.id,
                erp_id=workspace.erp_id,
                created_by_id=current_user.id,
                captured_from_data_source_id=data_source.id,
                database_type=data_source.source_type,
                schema_definition=serialized_tables,
            )
            db.add(catalog)
        else:
            catalog = existing
            catalog.captured_from_data_source_id = data_source.id
            catalog.schema_definition = serialized_tables
        catalog.last_executed_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(catalog)
        saved_catalog_id = catalog.id

    return WorkspaceSchemaCatalogExecuteResponse(
        success=True,
        message="Schema introspected successfully.",
        database_type=introspection.database_type,
        tables=tables,
        rowcount=introspection.rowcount,
        latency_ms=introspection.latency_ms,
        truncated=introspection.truncated,
        saved_catalog_id=saved_catalog_id,
    )

