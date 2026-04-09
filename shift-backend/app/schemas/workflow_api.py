"""
Schemas Pydantic para os endpoints da API de Workflows.
Separados dos schemas de definição de nós para clareza.
"""
import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.schemas.workflow.base import WorkflowDefinition
from app.models.workflow_execution import ExecutionStatusEnum, NodeExecutionStatusEnum


# ------------------------------------------------------------------
# Workflow CRUD
# ------------------------------------------------------------------

class WorkflowCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    definition: WorkflowDefinition
    player_id: Optional[uuid.UUID] = None
    type: str = Field("workflow", pattern="^(workflow|migration|config)$")
    active: bool = True
    public: bool = False

class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    definition: Optional[WorkflowDefinition] = None
    player_id: Optional[uuid.UUID] = None
    type: Optional[str] = Field(None, pattern="^(workflow|migration|config)$")
    active: Optional[bool] = None
    public: Optional[bool] = None

class WorkflowRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: Optional[str]
    definition: WorkflowDefinition
    player_id: Optional[uuid.UUID]
    type: str
    status: str
    active: bool
    public: bool
    last_run_at: Optional[datetime]
    last_run_status: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class WorkflowListItem(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    status: str
    active: bool
    last_run_at: Optional[datetime]
    last_run_status: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ------------------------------------------------------------------
# Execuções
# ------------------------------------------------------------------

class ExecutionTrigger(BaseModel):
    input_data: Optional[dict[str, Any]] = Field(None, description="Dados de entrada para o workflow")

class NodeExecutionRead(BaseModel):
    id: uuid.UUID
    node_id: str
    node_type: str
    node_name: str
    status: NodeExecutionStatusEnum
    input_data: Optional[dict[str, Any]]
    output_data: Optional[dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}

class ExecutionRead(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    status: ExecutionStatusEnum
    triggered_by: str
    input_data: Optional[dict[str, Any]]
    output_data: Optional[dict[str, Any]]
    error_message: Optional[str]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    nodes: list[NodeExecutionRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}

class ExecutionListItem(BaseModel):
    id: uuid.UUID
    status: ExecutionStatusEnum
    triggered_by: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}

class ExecutionStatistics(BaseModel):
    total: int
    success: int
    failed: int
    running: int
    cancelled: int
    success_rate: float

class PaginatedExecutions(BaseModel):
    items: list[ExecutionListItem]
    total: int
    limit: int
    offset: int
