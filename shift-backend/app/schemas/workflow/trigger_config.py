from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator
from .enum import TriggerKind, HttpMethod

class CronTriggerConfig(BaseModel):
    kind: TriggerKind = TriggerKind.CRON
    expression: str = Field(..., description="Expressão cron (6 campos: seg min hora dia mes dia_semana)")
    timezone: str = Field("America/Sao_Paulo", description="Fuso horário para execução")
    active: bool = Field(True)

    @field_validator("expression")
    @classmethod
    def validate_cron_expression(cls, v: str) -> str:
        parts = v.strip().split()
        if len(parts) != 6:
            raise ValueError("Expressão cron deve ter 6 campos: segundos minutos horas dia mês dia_semana")
        return v

class WebhookTriggerConfig(BaseModel):
    kind: TriggerKind = TriggerKind.WEBHOOK
    method: HttpMethod = Field(HttpMethod.POST, description="Método HTTP aceito")
    path: str = Field(..., description="Caminho do webhook (ex: /meu-webhook)")
    secret: Optional[str] = Field(None, description="Secret para validação HMAC")
    response_mode: str = Field("on_received", description="'on_received' retorna imediatamente; 'on_last_node' aguarda fim do workflow")

    @field_validator("path")
    @classmethod
    def validate_path(cls, v: str) -> str:
        if not v.startswith("/"):
            raise ValueError("O caminho do webhook deve começar com '/'")
        return v

class ManualTriggerConfig(BaseModel):
    kind: TriggerKind = TriggerKind.MANUAL
    input_schema: Optional[dict[str, Any]] = Field(None, description="JSON Schema dos dados de entrada esperados ao disparar manualmente")

class SubWorkflowTriggerConfig(BaseModel):
    kind: TriggerKind = TriggerKind.SUB_WORKFLOW
    input_schema: Optional[dict[str, Any]] = Field(None, description="JSON Schema dos dados esperados do workflow pai")

class EventQueueTriggerConfig(BaseModel):
    kind: TriggerKind = TriggerKind.EVENT_QUEUE
    queue_name: str = Field(..., description="Nome da fila (RabbitMQ, Kafka, etc.)")
    connection_id: str = Field(..., description="ID da conexão de mensageria cadastrada")
    consumer_group: Optional[str] = Field(None, description="Grupo de consumidores (Kafka)")
    batch_size: int = Field(1, ge=1, le=1000, description="Número de mensagens por lote")
