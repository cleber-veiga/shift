from typing import Any, Optional
from pydantic import BaseModel, Field
from .enum import LogicKind, ConditionOperator

class ConditionRule(BaseModel):
    field: str = Field(..., description="Caminho do campo no contexto. Ex: data.status")
    operator: ConditionOperator
    value: Any = Field(None, description="Valor de comparação (não necessário para is_empty/is_not_empty)")

class ConditionGroup(BaseModel):
    operator: str = Field("AND", pattern="^(AND|OR)$")
    rules: list[ConditionRule] = Field(..., min_length=1)

class IfConfig(BaseModel):
    kind: LogicKind = LogicKind.IF
    condition: ConditionGroup = Field(..., description="Grupo de condições que determina o caminho True ou False")

class SwitchCase(BaseModel):
    label: str = Field(..., description="Rótulo da saída (ex: 'ativo', 'inativo')")
    handle: str = Field(..., description="Handle de saída único para esta rota")
    condition: ConditionGroup

class SwitchConfig(BaseModel):
    kind: LogicKind = LogicKind.SWITCH
    cases: list[SwitchCase] = Field(..., min_length=1, description="Lista de casos avaliados em ordem")
    default_handle: str = Field("default", description="Handle de saída quando nenhum caso for satisfeito")

class LoopConfig(BaseModel):
    kind: LogicKind = LogicKind.LOOP
    items_path: str = Field(..., description="Caminho para o array no contexto. Ex: data.rows")
    item_variable: str = Field("item", description="Nome da variável que representa cada item dentro do loop")
    batch_size: int = Field(1, ge=1, le=1000, description="Quantos itens processar por iteração")

class MergeConfig(BaseModel):
    kind: LogicKind = LogicKind.MERGE
    mode: str = Field("wait_all", pattern="^(wait_all|first_wins)$", description="'wait_all' aguarda todos os ramos; 'first_wins' usa o primeiro que chegar")
    merge_key: Optional[str] = Field(None, description="Chave para fazer join dos resultados quando mode=wait_all")

class ErrorCatchConfig(BaseModel):
    kind: LogicKind = LogicKind.ERROR_CATCH
    catch_node_ids: list[str] = Field(default_factory=list, description="IDs dos nós monitorados. Vazio = monitora todos os nós anteriores.")
    error_output_field: str = Field("error", description="Campo no contexto onde o erro será armazenado")

class WaitConfig(BaseModel):
    kind: LogicKind = LogicKind.WAIT
    seconds: Optional[int] = Field(None, ge=1, le=86400, description="Aguardar N segundos fixos")
    until_expression: Optional[str] = Field(None, description="Expressão Python que retorna um datetime. Ex: datetime.now() + timedelta(hours=1)")
    webhook_resume: bool = Field(False, description="Se verdadeiro, aguarda um webhook externo para retomar a execução")
