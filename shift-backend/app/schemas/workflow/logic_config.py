from pydantic import BaseModel, Field
from typing import List, Optional
from app.schemas.workflow.enum import Operator, MergeMode, CombineStrategy



class Condition(BaseModel):
    """Uma regra individual de comparação."""
    left_operand: str = Field(..., description="A variável a ser avaliada (ex: '{{cliente.status}}')")
    operator: Operator = Field(default=Operator.EQUALS, description="Operador lógico")
    right_operand: Optional[str] = Field(None, description="O valor esperado (ex: 'pago'). Nulo se o operador for 'is_empty'")

class IfNodeConfig(BaseModel):
    """Configuração para o nó Condicional (If/Else)."""
    
    combine_mode: str = Field(
        default="AND", 
        description="Como avaliar múltiplas regras: 'AND' (todas devem ser verdadeiras) ou 'OR' (apenas uma basta)"
    )
    conditions: List[Condition] = Field(..., description="Lista de regras a serem avaliadas")

class SwitchRoute(BaseModel):
    """Uma rota de saída específica do Switch."""
    route_name: str = Field(..., description="Nome da porta de saída na UI (ex: 'Boleto', 'Cartão')")
    operator: Operator = Field(default=Operator.EQUALS, description="Operador lógico")
    compare_value: str = Field(..., description="Valor que ativa esta rota (ex: 'credit_card')")

class SwitchNodeConfig(BaseModel):
    """Configuração para o nó de Múltiplas Escolhas (Router)."""
    
    input_value: str = Field(
        ..., 
        description="A variável base que será testada contra todas as rotas (ex: '{{pagamento.metodo}}')"
    )
    routes: List[SwitchRoute] = Field(
        ..., 
        description="Lista de caminhos possíveis"
    )
    enable_fallback: bool = Field(
        default=True, 
        description="Se habilitado, cria uma porta de saída 'Default' para os casos em que nenhuma rota combinar"
    )

class LoopNodeConfig(BaseModel):
    """Configuração para o nó Iterador (For-Each)."""
    
    source_array: str = Field(
        ..., 
        description="O caminho onde a lista está no JSON atual (ex: '{{response.data.clientes}}')"
    )
    batch_size: int = Field(
        default=1, 
        description="Quantos itens o loop libera por vez. 1 para sequencial, >1 para processamento em lotes."
    )
    exit_on_error: bool = Field(
        default=False, 
        description="Se True, o loop inteiro é cancelado se um item falhar. Se False, ele pula o item com erro e continua."
    )


class MergeNodeConfig(BaseModel):
    """Configuração para o nó Agrupador (Merge / Wait)."""
    
    mode: MergeMode = Field(default=MergeMode.WAIT_ALL, description="Modo de espera das execuções")
    data_strategy: CombineStrategy = Field(
        default=CombineStrategy.MERGE_BY_KEY, 
        description="Como combinar o payload resultante"
    )

class ErrorCatchNodeConfig(BaseModel):
    """Configuração para interceptar e tratar erros de nós anteriores."""
    
    catch_all: bool = Field(
        default=False, 
        description="Se True, captura QUALQUER erro. Se False, apenas os tipos especificados."
    )
    
    error_types: Optional[List[str]] = Field(
        default=None, 
        description="Tipos específicos de erro a capturar (ex: ['timeout', 'auth_failed', 'not_found'])"
    )
    
    # Comportamento
    retry_enabled: bool = Field(
        default=False, 
        description="Se True, tenta executar o nó anterior novamente"
    )
    retry_count: int = Field(
        default=3, 
        description="Quantas vezes tentar novamente"
    )
    retry_delay_seconds: int = Field(
        default=5, 
        description="Tempo de espera entre tentativas (em segundos)"
    )
    
    # Injeção de contexto
    error_property: str = Field(
        default="error_info", 
        description="Onde injetar detalhes do erro no payload (ex: error_info.message, error_info.code)"
    )

class WaitNodeConfig(BaseModel):
    """Configuração para pausar o fluxo por um tempo determinado."""
    
    wait_type: str = Field(
        ..., 
        description="Tipo de espera (fixed_duration, until_time, until_condition)"
    )
    
    # Para fixed_duration
    duration_seconds: Optional[int] = Field(
        default=None, 
        description="Quantos segundos esperar (ex: 300 para 5 minutos)"
    )
    
    # Para until_time
    target_time: Optional[str] = Field(
        default=None, 
        description="Hora específica (ex: '2024-12-25 18:00:00' ou '{{webhook.scheduled_time}}')"
    )
    
    # Para until_condition
    condition_expression: Optional[str] = Field(
        default=None, 
        description="Expressão que, quando verdadeira, libera o fluxo (ex: '{{status}} == completed')"
    )
    condition_check_interval: int = Field(
        default=10, 
        description="A cada quantos segundos verificar a condição"
    )