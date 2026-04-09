from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.v1.endpoints.data_sources import can_manage_data_source, get_org_member, get_workspace_member
from app.models.database_node import DatabaseConnection, DatabaseTableTemplate
from app.models.project import Project
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.database_node import (
    DatabaseAssistantRequest,
    DatabaseAssistantResponse,
    DatabaseConnectionCreate,
    DatabaseConnectionRead,
    DatabaseConnectionUpdate,
    DatabasePreviewRequest,
    DatabasePreviewResponse,
    DatabaseTableTemplateCreate,
    DatabaseTableTemplateRead,
)
from app.services.database_node.service import DatabaseNodeService

router = APIRouter(prefix="/database-node")


async def _require_workspace_access(db: AsyncSession, workspace_id: UUID, user_id: UUID) -> Workspace:
    workspace = await db.scalar(select(Workspace).where(Workspace.id == workspace_id))
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace não encontrado.")
    workspace_member = await get_workspace_member(db, workspace_id, user_id)
    org_member = await get_org_member(db, workspace.organization_id, user_id)
    if not workspace_member and not org_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para o workspace.")
    return workspace


async def _require_project_access(db: AsyncSession, project_id: UUID, user_id: UUID) -> tuple[Project, Workspace]:
    project = await db.scalar(select(Project).where(Project.id == project_id))
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    workspace = await _require_workspace_access(db, project.workspace_id, user_id)
    return project, workspace


@router.get("/workspaces/{workspace_id}/connections", response_model=list[DatabaseConnectionRead])
async def list_connections(
    workspace_id: UUID,
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DatabaseConnection]:
    await _require_workspace_access(db, workspace_id, current_user.id)
    query = select(DatabaseConnection).where(
        or_(DatabaseConnection.workspace_id == workspace_id, DatabaseConnection.workspace_id.is_(None))
    )
    if project_id:
        query = query.where(or_(DatabaseConnection.project_id == project_id, DatabaseConnection.project_id.is_(None)))
    rows = await db.scalars(query.order_by(DatabaseConnection.name.asc()))
    return list(rows)


@router.post("/projects/{project_id}/connections", response_model=DatabaseConnectionRead, status_code=status.HTTP_201_CREATED)
async def create_connection(
    project_id: UUID,
    payload: DatabaseConnectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatabaseConnection:
    project, workspace = await _require_project_access(db, project_id, current_user.id)
    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para criar conexões.")

    connection = DatabaseConnection(
        workspace_id=workspace.id,
        project_id=project.id,
        created_by_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        source_type=payload.source_type,
        scope=payload.scope,
        visibility=payload.visibility,
        connection_config=payload.database.model_dump(mode="json", exclude={"password"}, exclude_none=True),
        secret_config={"password": payload.database.password} if payload.database.password else {},
        tags=payload.tags,
        policy=payload.policy.model_dump(mode="json"),
        allow_schema_capture=payload.allow_schema_capture,
        allow_ai_assistant=payload.allow_ai_assistant,
        is_active=payload.is_active,
    )
    db.add(connection)
    await db.commit()
    await db.refresh(connection)
    return connection


@router.put("/connections/{connection_id}", response_model=DatabaseConnectionRead)
async def update_connection(
    connection_id: UUID,
    payload: DatabaseConnectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatabaseConnection:
    connection = await db.scalar(select(DatabaseConnection).where(DatabaseConnection.id == connection_id))
    if not connection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conexão não encontrada.")
    if not connection.workspace_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conexões globais do seed devem ser geridas por configuração administrativa.")
    workspace = await _require_workspace_access(db, connection.workspace_id, current_user.id)
    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para atualizar conexões.")

    data = payload.model_dump(exclude_unset=True)
    if payload.database is not None:
        data["connection_config"] = payload.database.model_dump(mode="json", exclude={"password"}, exclude_none=True)
        data["secret_config"] = {"password": payload.database.password} if payload.database.password else {}
        data.pop("database", None)
    if payload.policy is not None:
        data["policy"] = payload.policy.model_dump(mode="json")
    for key, value in data.items():
        setattr(connection, key, value)
    db.add(connection)
    await db.commit()
    await db.refresh(connection)
    return connection


@router.post("/preview", response_model=DatabasePreviewResponse)
async def preview_query(
    payload: DatabasePreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatabasePreviewResponse:
    _ = current_user
    service = DatabaseNodeService(db)
    return await service.preview(payload)


@router.post("/assistant", response_model=DatabaseAssistantResponse)
async def assistant(
    payload: DatabaseAssistantRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatabaseAssistantResponse:
    _ = current_user
    service = DatabaseNodeService(db)
    return await service.mock_assistant(payload)


@router.post("/workspaces/{workspace_id}/table-templates", response_model=DatabaseTableTemplateRead, status_code=status.HTTP_201_CREATED)
async def create_table_template(
    workspace_id: UUID,
    payload: DatabaseTableTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DatabaseTableTemplate:
    workspace = await _require_workspace_access(db, workspace_id, current_user.id)
    workspace_member = await get_workspace_member(db, workspace.id, current_user.id)
    org_member = await get_org_member(db, workspace.organization_id, current_user.id)
    if not can_manage_data_source(workspace_member, org_member):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para criar templates de tabela.")

    template = DatabaseTableTemplate(
        workspace_id=workspace.id,
        created_by_id=current_user.id,
        connection_id=payload.connection_id,
        name=payload.name.strip(),
        description=payload.description,
        source_type=payload.source_type,
        schema_name=payload.schema_name,
        table_name=payload.table_name,
        write_mode=payload.write_mode.value,
        primary_key_columns=payload.primary_key_columns,
        columns=[column.model_dump(mode="json") for column in payload.columns],
        default_mapping=payload.default_mapping,
        tags=payload.tags,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/workspaces/{workspace_id}/table-templates", response_model=list[DatabaseTableTemplateRead])
async def list_table_templates(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DatabaseTableTemplate]:
    await _require_workspace_access(db, workspace_id, current_user.id)
    rows = await db.scalars(
        select(DatabaseTableTemplate)
        .where(DatabaseTableTemplate.workspace_id == workspace_id)
        .order_by(DatabaseTableTemplate.name.asc())
    )
    return list(rows)
