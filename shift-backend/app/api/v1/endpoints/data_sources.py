from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.data_source import DataSource
from app.models.organization_member import OrganizationMember
from app.models.project import Project
from app.models.roles import OrganizationMemberRole, WorkspaceMemberRole
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.schemas.data_source import (
    DataSourceConnectionTestResponse,
    DataSourceCreate,
    DataSourceRead,
    DataSourceSQLExecuteRequest,
    DataSourceSQLExecuteResponse,
    DataSourceUpdate,
)
from app.services.data_source_connection import test_data_source_connection
from app.services.data_source_query import execute_sql_on_data_source

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


async def get_workspace_member(
    db: AsyncSession,
    workspace_id: UUID,
    user_id: UUID,
) -> WorkspaceMember | None:
    return await db.scalar(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )


def can_manage_data_source(
    workspace_member: WorkspaceMember | None,
    org_member: OrganizationMember | None,
) -> bool:
    return (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )


@router.post("/projects/{project_id}/data-sources", response_model=DataSourceRead, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    project_id: UUID,
    payload: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataSource:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    existing = await db.scalar(
        select(DataSource).where(
            DataSource.project_id == project_id,
            DataSource.name == payload.name.strip(),
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Data source already exists for this project.")

    connection_config = None
    file_config = None
    secret_config = None

    if payload.database is not None:
        connection_config = {
            "connection_url": payload.database.connection_url,
            "host": payload.database.host,
            "port": payload.database.port,
            "database": payload.database.database,
            "schema_name": payload.database.schema_name,
            "username": payload.database.username,
            "ssl_mode": payload.database.ssl_mode,
            "sqlite_path": payload.database.sqlite_path,
            "account": payload.database.account,
            "warehouse": payload.database.warehouse,
            "role": payload.database.role,
            "service_name": payload.database.service_name,
            "sid": payload.database.sid,
            "dsn": payload.database.dsn,
            "charset": payload.database.charset,
            "client_library_path": payload.database.client_library_path,
            "odbc_driver": payload.database.odbc_driver,
        }
        secret_config = {"password": payload.database.password}

    if payload.file is not None:
        file_config = {
            "file_name": payload.file.file_name,
            "file_path": payload.file.file_path,
            "storage_key": payload.file.storage_key,
            "delimiter": payload.file.delimiter,
            "encoding": payload.file.encoding,
            "sheet_name": payload.file.sheet_name,
            "has_header": payload.file.has_header,
        }

    data_source = DataSource(
        project_id=project_id,
        created_by_id=current_user.id,
        name=payload.name.strip(),
        source_type=payload.source_type,
        connection_config=connection_config,
        file_config=file_config,
        secret_config=secret_config,
        is_active=payload.is_active,
    )
    db.add(data_source)
    await db.commit()
    await db.refresh(data_source)
    return data_source


@router.get("/projects/{project_id}/data-sources", response_model=list[DataSourceRead])
async def list_data_sources(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DataSource]:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    can_test = (
        workspace_member is not None and workspace_member.role == WorkspaceMemberRole.MANAGER
    ) or (
        org_member is not None and org_member.role in {OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER}
    )
    if not can_test:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    data_sources = await db.scalars(
        select(DataSource)
        .where(DataSource.project_id == project_id)
        .order_by(DataSource.created_at.desc())
    )
    return list(data_sources)


@router.put("/data-sources/{data_source_id}", response_model=DataSourceRead)
async def update_data_source(
    data_source_id: UUID,
    payload: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    existing = await db.scalar(
        select(DataSource).where(
            DataSource.project_id == data_source.project_id,
            DataSource.name == payload.name.strip(),
            DataSource.id != data_source.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Data source already exists for this project.")

    connection_config = None
    file_config = None
    secret_config = None

    if payload.database is not None:
        connection_config = {
            "connection_url": payload.database.connection_url,
            "host": payload.database.host,
            "port": payload.database.port,
            "database": payload.database.database,
            "schema_name": payload.database.schema_name,
            "username": payload.database.username,
            "ssl_mode": payload.database.ssl_mode,
            "sqlite_path": payload.database.sqlite_path,
            "account": payload.database.account,
            "warehouse": payload.database.warehouse,
            "role": payload.database.role,
            "service_name": payload.database.service_name,
            "sid": payload.database.sid,
            "dsn": payload.database.dsn,
            "charset": payload.database.charset,
            "client_library_path": payload.database.client_library_path,
            "odbc_driver": payload.database.odbc_driver,
        }
        secret_config = {"password": payload.database.password}

    if payload.file is not None:
        file_config = {
            "file_name": payload.file.file_name,
            "file_path": payload.file.file_path,
            "storage_key": payload.file.storage_key,
            "delimiter": payload.file.delimiter,
            "encoding": payload.file.encoding,
            "sheet_name": payload.file.sheet_name,
            "has_header": payload.file.has_header,
        }

    data_source.name = payload.name.strip()
    data_source.source_type = payload.source_type
    data_source.connection_config = connection_config
    data_source.file_config = file_config
    data_source.secret_config = secret_config
    data_source.is_active = payload.is_active

    await db.commit()
    await db.refresh(data_source)
    return data_source


@router.delete("/data-sources/{data_source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    data_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    data_source = await db.scalar(select(DataSource).where(DataSource.id == data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    project = await db.scalar(select(Project).where(Project.id == data_source.project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions.")

    await db.delete(data_source)
    await db.commit()


@router.post("/data-sources/{data_source_id}/test-connection", response_model=DataSourceConnectionTestResponse)
async def test_connection(
    data_source_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataSourceConnectionTestResponse:
    data_source = await db.scalar(select(DataSource).where(DataSource.id == data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    project = await db.scalar(select(Project).where(Project.id == data_source.project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    result = await test_data_source_connection(data_source)
    return DataSourceConnectionTestResponse(
        success=result.success,
        message=result.message,
        latency_ms=result.latency_ms,
    )


@router.post("/data-sources/{data_source_id}/query", response_model=DataSourceSQLExecuteResponse)
async def execute_sql(
    data_source_id: UUID,
    payload: DataSourceSQLExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DataSourceSQLExecuteResponse:
    data_source = await db.scalar(select(DataSource).where(DataSource.id == data_source_id))
    if not data_source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found.")

    project = await db.scalar(select(Project).where(Project.id == data_source.project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")

    workspace = await db.scalar(select(Workspace).where(Workspace.id == project.workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    result = await execute_sql_on_data_source(
        data_source=data_source,
        sql=payload.sql,
        max_rows=payload.max_rows,
    )
    return DataSourceSQLExecuteResponse(
        success=result.success,
        message=result.message,
        columns=result.columns,
        rows=result.rows,
        rowcount=result.rowcount,
        latency_ms=result.latency_ms,
        truncated=result.truncated,
    )
