from pydantic import BaseModel, field_validator
from datetime import datetime, timedelta
from typing import Optional, Union
from pydantic import Field
from typing import List, Dict, Any
from typing import Any

from app.schemas.workflow.action_config import (
    HttpRequestNodeConfig,
    SqlDatabaseNodeConfig,
    EmailSenderNodeConfig,
    ExecuteSubWorkflowNodeConfig,
    NoSQLDatabaseNodeConfig,
)

from app.schemas.workflow.llm_config import (
    LLMNodeConfig,
    ChatMemoryNodeConfig,
    VectorStoreNodeConfig,
    AgentNodeConfig,
)

from app.schemas.workflow.logic_config import (
    IfNodeConfig,
    SwitchNodeConfig,
    LoopNodeConfig,
    MergeNodeConfig,
    ErrorCatchNodeConfig,
    WaitNodeConfig,
)

from app.schemas.workflow.state_config import (
    GlobalStateNodeConfig,
    FileStorageNodeConfig,
)

from app.schemas.workflow.transformation_config import (
    MapperNodeConfig,
    CodeNodeConfig,
    DateTimeNodeConfig,
    DataConverterNodeConfig,
)

from app.schemas.workflow.trigger_config import (
    CronNodeConfig,
    WebhookNodeConfig,
    ManualNodeConfig,
    SubWorkflowConfig,
    EventQueueConfig,
    PollingConfig,
)


NodeConfigUnion = Union[
    HttpRequestNodeConfig,
    SqlDatabaseNodeConfig,
    EmailSenderNodeConfig,
    ExecuteSubWorkflowNodeConfig,
    NoSQLDatabaseNodeConfig,
    LLMNodeConfig,
    ChatMemoryNodeConfig,
    VectorStoreNodeConfig,
    AgentNodeConfig,
    IfNodeConfig,
    SwitchNodeConfig,
    LoopNodeConfig,
    MergeNodeConfig,
    ErrorCatchNodeConfig,
    WaitNodeConfig,
    GlobalStateNodeConfig,
    FileStorageNodeConfig,
    MapperNodeConfig,
    CodeNodeConfig,
    DateTimeNodeConfig,
    DataConverterNodeConfig,
    CronNodeConfig,
    WebhookNodeConfig,
    ManualNodeConfig,
    SubWorkflowConfig,
    EventQueueConfig,
    PollingConfig
]

# Schemas base
class BaseSchema(BaseModel):
    """Schema base com configuração comum."""
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Schemas para Nodes
class NodeBase(BaseSchema):
    """Schema base para nós."""
    node_id: str = Field(..., description="ID único do nó dentro do fluxo")
    type: str = Field(..., description="Tipo do nó (cron, sql, condition, llm, etc.)")
    config: NodeConfigUnion = Field(..., description="Configuração específica do nó")
    position_x: int = Field(default=0, description="Posição X no editor visual")
    position_y: int = Field(default=0, description="Posição Y no editor visual")

# Schemas para Edges
class EdgeBase(BaseSchema):
    """Schema base para arestas."""
    from_node_id: str = Field(..., description="ID do nó de origem")
    to_node_id: str = Field(..., description="ID do nó de destino")
    condition: Optional[Dict[str, Any]] = Field(None, description="Condição para roteamento")

# Schemas para Workflows
class WorkflowDefinition(BaseModel):
    """Schema para definição de fluxo de trabalho."""

    nodes: List[NodeBase] = Field(..., description="Lista de nós do fluxo")
    edges: List[EdgeBase] = Field(..., description="Lista de arestas do fluxo")
    variables: Optional[Dict[str, Any]] = Field(default={}, description="Variáveis globais do fluxo")

    @field_validator('edges')
    def validate_edges_reference_existing_nodes(cls, edges, values):
        """Garante que edges só conectam nós que existem."""
        if 'nodes' not in values:
            return edges
            
        node_ids = {node.node_id for node in values['nodes']}
        
        for edge in edges:
            if edge.from_node_id not in node_ids:
                raise ValueError(f"Edge referencia from_node_id inexistente: {edge.from_node_id}")
            if edge.to_node_id not in node_ids:
                raise ValueError(f"Edge referencia to_node_id inexistente: {edge.to_node_id}")
                
        return edges    

class WorkflowBase(BaseSchema):
    """Schema base para fluxos de trabalho."""
    
    name : str = Field(..., min_length=1, max_length=255, description="Nome do fluxo")
    description : Optional[str] = Field(None, description="Descrição do fluxo")
    definition: WorkflowDefinition = Field(..., description="Definição completa do fluxo")
    active : bool = Field(True, description="Se o fluxo está ativo")