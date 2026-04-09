from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.data_source import DataSourceType
from app.schemas.data_source import DataSourceCreate, DatabaseConnectionInput

from .enum import ActionKind, HttpMethod, SqlOperation


class HttpHeader(BaseModel):
    key: str
    value: str


class HttpRequestConfig(BaseModel):
    kind: ActionKind = ActionKind.HTTP_REQUEST
    url: str = Field(..., description="URL de destino. Suporta templates: {{variavel}}")
    method: HttpMethod = Field(HttpMethod.GET)
    headers: list[HttpHeader] = Field(default_factory=list)
    body: Any | None = Field(None, description="Corpo da requisicao. Suporta templates.")
    timeout_seconds: int = Field(30, ge=1, le=300)
    retry_count: int = Field(0, ge=0, le=5)
    output_field: str = Field("response", description="Campo do contexto para armazenar a resposta")

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value.startswith(("http://", "https://", "{{")):
            raise ValueError("URL deve comecar com http://, https:// ou ser uma variavel de template")
        return value


class SqlColumnMapping(BaseModel):
    source: str = Field(..., description="Campo de origem no contexto")
    target: str = Field(..., description="Coluna de destino na tabela")


class SqlDatabaseConfig(BaseModel):
    kind: ActionKind = ActionKind.SQL_DATABASE
    operation: SqlOperation = Field(SqlOperation.SELECT)
    query: str | None = Field(
        None,
        description="SQL a executar. Suporta templates no formato {{variavel}}",
    )
    data_source_id: UUID | None = Field(
        None,
        description="Fonte de dados persistida a ser usada na execucao.",
    )
    source_type: DataSourceType | None = Field(
        None,
        description="Tipo do banco quando a conexao for inline no proprio no.",
    )
    database: DatabaseConnectionInput | None = Field(
        None,
        description="Configuracao de conexao inline para execucao SQL.",
    )
    max_rows: int = Field(1000, ge=1, le=50000, description="Limite maximo de linhas retornadas")
    timeout_seconds: int = Field(30, ge=1, le=300, description="Reservado para drivers que suportem timeout explicito")
    output_field: str = Field("query_result", description="Campo do contexto para armazenar o resultado")
    include_metadata: bool = Field(
        True,
        description="Se verdadeiro, salva colunas, rowcount, truncation e latency junto das linhas.",
    )
    fail_on_error: bool = Field(
        True,
        description="Se verdadeiro, falhas da consulta interrompem o workflow.",
    )

    @model_validator(mode="after")
    def validate_input(self) -> "SqlDatabaseConfig":
        if self.operation not in {SqlOperation.SELECT, SqlOperation.EXECUTE}:
            raise ValueError(
                "O no SQL inicial suporta apenas as operacoes SELECT e EXECUTE."
            )

        if not self.query or not self.query.strip():
            raise ValueError("query e obrigatoria para o no SQL.")

        has_inline_connection = self.source_type is not None or self.database is not None
        has_data_source = self.data_source_id is not None

        if has_data_source and has_inline_connection:
            raise ValueError("Informe data_source_id ou source_type/database, nao ambos.")
        if not has_data_source and not has_inline_connection:
            raise ValueError("Informe data_source_id ou source_type/database para o no SQL.")
        if has_inline_connection and (self.source_type is None or self.database is None):
            raise ValueError("source_type e database sao obrigatorios quando a conexao e inline.")
        if has_inline_connection and self.source_type is not None and self.database is not None:
            DataSourceCreate(
                name="workflow_sql_node",
                source_type=self.source_type,
                database=self.database,
                file=None,
                is_active=True,
            )

        return self


class EmailSenderConfig(BaseModel):
    kind: ActionKind = ActionKind.EMAIL_SENDER
    smtp_connection_id: str = Field(..., description="ID da conexao SMTP cadastrada")
    to: list[str] = Field(..., min_length=1, description="Lista de destinatarios. Suporta templates.")
    cc: list[str] = Field(default_factory=list)
    bcc: list[str] = Field(default_factory=list)
    subject: str = Field(..., description="Assunto do e-mail. Suporta templates.")
    body: str = Field(..., description="Corpo do e-mail (HTML). Suporta templates.")
    attachments: list[str] = Field(default_factory=list, description="Caminhos de arquivos para anexar")


class ExecuteSubWorkflowConfig(BaseModel):
    kind: ActionKind = ActionKind.EXECUTE_SUB_WORKFLOW
    workflow_id: str = Field(..., description="ID do workflow filho a ser executado")
    input_data: dict[str, Any] | None = Field(
        None,
        description="Dados de entrada para o sub-workflow. Suporta templates.",
    )
    wait_for_completion: bool = Field(True, description="Se falso, dispara e nao aguarda o resultado")
    output_field: str = Field("sub_result", description="Campo no contexto para o resultado do sub-workflow")


class NoSQLDatabaseConfig(BaseModel):
    kind: ActionKind = ActionKind.NOSQL_DATABASE
    connection_id: str = Field(..., description="ID da conexao NoSQL cadastrada")
    collection: str = Field(..., description="Nome da colecao/tabela")
    operation: str = Field("find", description="Operacao: find, insert_one, insert_many, update_one, delete_one")
    filter: dict[str, Any] | None = Field(None, description="Filtro da operacao. Suporta templates.")
    document: Any | None = Field(None, description="Documento para insert/update. Suporta templates.")
    output_field: str = Field("result", description="Campo no contexto para o resultado")
