from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.schemas.workflow.enum import HttpMethod


class CronNodeConfig(BaseModel):
    """Configuração para nó cron."""
    expression: str = Field(..., description="Expressão cron")
    timezone: str = Field(default="UTC", description="Timezone")


class WebhookNodeConfig(BaseModel):
    """Configuração para nó de gatilho via Webhook (HTTP Receiver)."""
    
    path: str = Field(..., description="Caminho único da URL (ex: 'pagamentos-stripe' ou um UUID)")
    method: HttpMethod = Field(default=HttpMethod.POST, description="Método HTTP esperado")
    
    # Controle de Resposta
    response_mode: str = Field(
        default="on_received", 
        description="'on_received' (responde 200 na hora) ou 'on_finished' (espera o fluxo acabar para responder)"
    )
    response_code: int = Field(default=200, description="Status code de sucesso (ex: 200, 201, 202)")
    
    # Segurança básica
    auth_type: str = Field(
        default="none", 
        description="Tipo de autenticação esperada (none, basic_auth, header_token)"
    )


class ManualNodeConfig(BaseModel):
    """Configuração para nó de execução manual/teste."""
    
    inject_data: bool = Field(
        default=False, 
        description="Se verdadeiro, injeta o mock_payload como entrada inicial do fluxo."
    )
    mock_payload: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="O JSON fictício para simular o evento real durante os testes."
    )


class SubWorkflowConfig(BaseModel):
    """Configuração para o gatilho que recebe chamadas de outros fluxos."""
    
    expected_inputs: Optional[List[str]] = Field(
        default=None, 
        description="Lista de chaves que obrigatoriamente devem vir no payload do fluxo pai (validação)."
    )
    response_data: str = Field(
        default="all_data", 
        description="Define o que retornar ao fluxo pai: 'all_data' (retorna o output do último nó) ou 'specific_node' (retorna o output de um nó específico)."
    )


class EventQueueConfig(BaseModel):
    """Configuração para gatilho via fila de mensageria (RabbitMQ, Kafka, SQS)."""
    
    queue_provider: str = Field(
        ..., 
        description="Provedor da fila (rabbitmq, kafka, aws_sqs, azure_servicebus)"
    )
    credential_id: str = Field(..., description="ID da credencial no cofre")
    
    queue_name: str = Field(..., description="Nome da fila/tópico a escutar")
    
    # Comportamento
    auto_ack: bool = Field(
        default=True, 
        description="Se True, marca a mensagem como consumida automaticamente"
    )
    max_retries: int = Field(
        default=3, 
        description="Quantas vezes tentar processar uma mensagem antes de descartar"
    )
    
    # Mapeamento
    message_property: str = Field(
        default="message_body", 
        description="Onde injetar o corpo da mensagem no payload do fluxo"
    )

class PollingConfig(BaseModel):
    """Configuração para gatilho de pesquisa periódica (Polling)."""
    
    source_type: str = Field(
        ..., 
        description="Tipo de fonte (database, file_folder, http_endpoint )"
    )
    credential_id: Optional[str] = Field(
        default=None, 
        description="ID da credencial (se necessário para a fonte)"
    )
    
    # Configuração de Polling
    interval_seconds: int = Field(
        default=300, 
        description="Intervalo entre verificações em segundos (mínimo 60)"
    )
    
    # Para database
    query: Optional[str] = Field(
        default=None, 
        description="Query SQL para buscar novos registros (ex: SELECT * FROM logs WHERE created_at > {{last_check}})"
    )
    
    # Para file_folder
    folder_path: Optional[str] = Field(
        default=None, 
        description="Caminho da pasta a monitorar (ex: /uploads/incoming)"
    )
    file_pattern: Optional[str] = Field(
        default="*", 
        description="Padrão de arquivo (ex: *.csv, *.json)"
    )
    
    # Para http_endpoint
    endpoint_url: Optional[str] = Field(
        default=None, 
        description="URL a fazer polling (ex: https://api.site.com/status )"
    )
    
    # Detecção de Mudança
    last_check_property: str = Field(
        default="last_poll_time", 
        description="Onde guardar o timestamp da última verificação bem-sucedida"
    )