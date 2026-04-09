from collections import Counter, deque
from typing import Any

from pydantic import BaseModel, Field, model_validator

from .action_config import (
    EmailSenderConfig,
    ExecuteSubWorkflowConfig,
    HttpRequestConfig,
    NoSQLDatabaseConfig,
    SqlDatabaseConfig,
)
from .ai_config import AgentConfig, ChatMemoryConfig, LLMConfig, VectorStoreConfig
from .enum import AIKind, ActionKind, LogicKind, NodeGroup, StorageKind, TransformationKind, TriggerKind
from .logic_config import ErrorCatchConfig, IfConfig, LoopConfig, MergeConfig, SwitchConfig, WaitConfig
from .storage_config import FileStorageConfig, GlobalStateConfig
from .transformation_config import CodeConfig, DataConverterConfig, DateTimeConfig, MapperConfig
from .trigger_config import (
    CronTriggerConfig,
    EventQueueTriggerConfig,
    ManualTriggerConfig,
    SubWorkflowTriggerConfig,
    WebhookTriggerConfig,
)

NodeConfigModel = (
    CronTriggerConfig
    | WebhookTriggerConfig
    | ManualTriggerConfig
    | SubWorkflowTriggerConfig
    | EventQueueTriggerConfig
    | HttpRequestConfig
    | SqlDatabaseConfig
    | EmailSenderConfig
    | ExecuteSubWorkflowConfig
    | NoSQLDatabaseConfig
    | IfConfig
    | SwitchConfig
    | LoopConfig
    | MergeConfig
    | ErrorCatchConfig
    | WaitConfig
    | MapperConfig
    | CodeConfig
    | DateTimeConfig
    | DataConverterConfig
    | GlobalStateConfig
    | FileStorageConfig
    | LLMConfig
    | ChatMemoryConfig
    | VectorStoreConfig
    | AgentConfig
)

NODE_CONFIG_REGISTRY: dict[str, type[BaseModel]] = {
    TriggerKind.CRON.value: CronTriggerConfig,
    TriggerKind.WEBHOOK.value: WebhookTriggerConfig,
    TriggerKind.MANUAL.value: ManualTriggerConfig,
    TriggerKind.SUB_WORKFLOW.value: SubWorkflowTriggerConfig,
    TriggerKind.EVENT_QUEUE.value: EventQueueTriggerConfig,
    ActionKind.HTTP_REQUEST.value: HttpRequestConfig,
    ActionKind.SQL_DATABASE.value: SqlDatabaseConfig,
    ActionKind.EMAIL_SENDER.value: EmailSenderConfig,
    ActionKind.EXECUTE_SUB_WORKFLOW.value: ExecuteSubWorkflowConfig,
    ActionKind.NOSQL_DATABASE.value: NoSQLDatabaseConfig,
    LogicKind.IF.value: IfConfig,
    LogicKind.SWITCH.value: SwitchConfig,
    LogicKind.LOOP.value: LoopConfig,
    LogicKind.MERGE.value: MergeConfig,
    LogicKind.ERROR_CATCH.value: ErrorCatchConfig,
    LogicKind.WAIT.value: WaitConfig,
    TransformationKind.MAPPER.value: MapperConfig,
    TransformationKind.CODE.value: CodeConfig,
    TransformationKind.DATETIME.value: DateTimeConfig,
    TransformationKind.DATA_CONVERTER.value: DataConverterConfig,
    StorageKind.GLOBAL_STATE.value: GlobalStateConfig,
    StorageKind.FILE_STORAGE.value: FileStorageConfig,
    AIKind.LLM.value: LLMConfig,
    AIKind.CHAT_MEMORY.value: ChatMemoryConfig,
    AIKind.VECTOR_STORE.value: VectorStoreConfig,
    AIKind.AGENT.value: AgentConfig,
}

NODE_GROUP_REGISTRY: dict[str, NodeGroup] = {
    **{kind.value: NodeGroup.TRIGGER for kind in TriggerKind},
    **{kind.value: NodeGroup.ACTION for kind in ActionKind},
    **{kind.value: NodeGroup.LOGIC for kind in LogicKind},
    **{kind.value: NodeGroup.TRANSFORMATION for kind in TransformationKind},
    **{kind.value: NodeGroup.STORAGE for kind in StorageKind},
    **{kind.value: NodeGroup.AI for kind in AIKind},
}


class NodePosition(BaseModel):
    x: float = 0.0
    y: float = 0.0


class EdgeCondition(BaseModel):
    expression: str = Field(
        ...,
        min_length=1,
        description="Expressao booleana avaliada de forma segura contra o contexto da execucao.",
    )


class EdgeBase(BaseModel):
    id: str = Field(..., min_length=1, description="ID unico da aresta")
    from_node_id: str = Field(..., min_length=1, description="ID do no de origem")
    to_node_id: str = Field(..., min_length=1, description="ID do no de destino")
    from_handle: str | None = Field(
        None,
        description="Handle de saida do no de origem (ex: true, false, default)",
    )
    to_handle: str | None = Field(
        None,
        description="Handle de entrada do no de destino",
    )
    condition: EdgeCondition | None = Field(None, description="Condicao para seguir esta aresta")


class NodeBase(BaseModel):
    node_id: str = Field(..., min_length=1, description="ID unico do no no workflow")
    name: str = Field(..., min_length=1, description="Nome legivel do no")
    group: NodeGroup = Field(..., description="Grupo ao qual o no pertence")
    type: str = Field(..., min_length=1, description="Tipo especifico do no")
    config: dict[str, Any] = Field(
        default_factory=dict,
        description="Configuracao especifica do no, validada de acordo com o tipo.",
    )
    position: NodePosition = Field(default_factory=NodePosition, description="Posicao visual no canvas")
    notes: str | None = Field(None, description="Anotacoes do desenvolvedor sobre este no")
    disabled: bool = Field(False, description="Se verdadeiro, o no e ignorado durante a execucao")

    @model_validator(mode="after")
    def validate_config(self) -> "NodeBase":
        config_model = NODE_CONFIG_REGISTRY.get(self.type)
        if config_model is None:
            raise ValueError(f"Tipo de no nao suportado: '{self.type}'")

        expected_group = NODE_GROUP_REGISTRY[self.type]
        if self.group != expected_group:
            raise ValueError(
                f"No '{self.node_id}' possui group='{self.group.value}', "
                f"mas o tipo '{self.type}' pertence a '{expected_group.value}'."
            )

        validated_config = config_model.model_validate(self.config)
        validated_kind = getattr(validated_config, "kind", None)
        validated_kind_value = getattr(validated_kind, "value", validated_kind)
        if validated_kind_value != self.type:
            raise ValueError(
                f"Configuracao do no '{self.node_id}' e incompativel com o tipo '{self.type}'."
            )

        self.config = validated_config.model_dump(mode="json", exclude_none=True)
        return self


class WorkflowDefinition(BaseModel):
    version: str = Field("1.0", description="Versao do schema do workflow")
    variables: dict[str, Any] = Field(
        default_factory=dict,
        description="Variaveis globais disponiveis em todos os nos",
    )
    nodes: list[NodeBase] = Field(default_factory=list, description="Lista de todos os nos do workflow")
    edges: list[EdgeBase] = Field(default_factory=list, description="Lista de todas as arestas do workflow")

    @model_validator(mode="after")
    def validate_graph(self) -> "WorkflowDefinition":
        node_ids = [node.node_id for node in self.nodes]
        duplicate_nodes = [node_id for node_id, count in Counter(node_ids).items() if count > 1]
        if duplicate_nodes:
            raise ValueError(f"IDs de no duplicados: {sorted(duplicate_nodes)}")

        edge_ids = [edge.id for edge in self.edges]
        duplicate_edges = [edge_id for edge_id, count in Counter(edge_ids).items() if count > 1]
        if duplicate_edges:
            raise ValueError(f"IDs de aresta duplicados: {sorted(duplicate_edges)}")

        known_nodes = set(node_ids)
        for edge in self.edges:
            if edge.from_node_id not in known_nodes:
                raise ValueError(
                    f"Aresta '{edge.id}' referencia no de origem inexistente: '{edge.from_node_id}'"
                )
            if edge.to_node_id not in known_nodes:
                raise ValueError(
                    f"Aresta '{edge.id}' referencia no de destino inexistente: '{edge.to_node_id}'"
                )

        if self.nodes and not self._is_acyclic():
            raise ValueError("A definicao do workflow possui ciclo. O motor suporta apenas DAGs.")

        return self

    def _is_acyclic(self) -> bool:
        in_degree: dict[str, int] = {node.node_id: 0 for node in self.nodes}
        adjacency: dict[str, list[str]] = {node.node_id: [] for node in self.nodes}

        for edge in self.edges:
            adjacency[edge.from_node_id].append(edge.to_node_id)
            in_degree[edge.to_node_id] += 1

        queue = deque(node_id for node_id, degree in in_degree.items() if degree == 0)
        visited = 0

        while queue:
            node_id = queue.popleft()
            visited += 1
            for successor_id in adjacency[node_id]:
                in_degree[successor_id] -= 1
                if in_degree[successor_id] == 0:
                    queue.append(successor_id)

        return visited == len(self.nodes)
