from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.schemas.workflow.enum import HttpMethod, SqlOperation



class HttpRequestNodeConfig(BaseModel):
    """Configuração para disparar chamadas HTTP para o mundo externo."""
    
    url: str = Field(..., description="URL de destino (suporta variáveis de fluxo, ex: https://api.site.com/{{user_id}})")
    method: HttpMethod = Field(default=HttpMethod.GET, description="O método da requisição")
    
    # Autenticação (Referência a um cofre de chaves)
    credential_id: Optional[str] = Field(
        default=None, 
        description="ID da credencial (Bearer Token, Basic Auth) no cofre de segurança"
    )
    
    # Payload e Configurações
    headers: Optional[Dict[str, str]] = Field(default=None, description="Cabeçalhos customizados")
    query_params: Optional[Dict[str, str]] = Field(default=None, description="Parâmetros de URL (?key=value)")
    body: Optional[Dict[str, Any]] = Field(default=None, description="O corpo da requisição (geralmente JSON)")
    
    # Resiliência
    timeout: int = Field(default=30, description="Tempo máximo em segundos antes de falhar por timeout")
    ignore_ssl_errors: bool = Field(default=False, description="Ignorar erros de certificado (útil para dev/locais)")


class SqlDatabaseNodeConfig(BaseModel):
    """Configuração para interagir com bancos de dados relacionais."""
    
    credential_id: str = Field(..., description="ID da credencial (contém Host, User, Pass, DB)")
    operation: SqlOperation = Field(default=SqlOperation.SELECT, description="Tipo de operação padrão")
    
    query: str = Field(..., description="A query SQL a ser executada")
    parameters: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Parâmetros seguros para a query (Bind Variables), ex: {'id': 10}"
    )


class EmailSenderNodeConfig(BaseModel):
    """Configuração para disparo de e-mails via SMTP ou APIs padrão."""
    
    credential_id: str = Field(..., description="ID da credencial (SMTP, AWS SES, SendGrid, etc.)")
    
    to_address: str = Field(..., description="Destinatário(s) - separados por vírgula")
    cc_address: Optional[str] = Field(default=None, description="Com cópia")
    bcc_address: Optional[str] = Field(default=None, description="Com cópia oculta")
    
    subject: str = Field(..., description="Assunto do e-mail")
    body_text: Optional[str] = Field(default=None, description="Corpo do e-mail em texto plano (Fallback)")
    body_html: Optional[str] = Field(default=None, description="Corpo do e-mail rico em HTML")
    
    # Arquivos anexos gerados nos passos anteriores
    attachments_keys: Optional[list[str]] = Field(
        default=None, 
        description="Chaves do payload atual que contêm arquivos binários para anexar"
    )


class ExecuteSubWorkflowNodeConfig(BaseModel):
    """Configuração para acionar um fluxo filho a partir do fluxo atual."""
    
    workflow_id: str = Field(..., description="ID do fluxo filho que será executado")
    
    # Comportamento de Orquestração
    wait_for_response: bool = Field(
        default=True, 
        description="Se True, este nó pausa e espera o fluxo filho acabar para pegar o resultado. Se False, dispara e segue (Fire-and-Forget)."
    )
    
    # Passagem de Dados
    pass_all_data: bool = Field(
        default=True, 
        description="Se True, passa todo o JSON atual para o filho. Se False, passa apenas os inputs mapeados abaixo."
    )
    mapped_inputs: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Dados específicos enviados ao fluxo filho, ex: {'cliente_id': '{{cliente.id}}'}"
    )


class NoSQLDatabaseNodeConfig(BaseModel):
    """Configuração para interagir com bancos NoSQL (MongoDB, DynamoDB, Firestore)."""
    
    credential_id: str = Field(..., description="ID da credencial no cofre")
    database_type: str = Field(
        ..., 
        description="Tipo de banco (mongodb, dynamodb, firestore, redis)"
    )
    
    operation: str = Field(
        ..., 
        description="Operação (find, insert, update, delete, upsert)"
    )
    
    collection_name: str = Field(..., description="Nome da coleção/tabela")
    
    # Para operações de busca
    query: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Filtro de busca (ex: {'status': 'active'})"
    )
    
    # Para operações de escrita
    document: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Documento a ser inserido/atualizado"
    )
    
    # Para upsert
    upsert_key: Optional[str] = Field(
        default=None, 
        description="Campo único para identificar se deve atualizar ou inserir"
    )
    
    # Resiliência
    timeout: int = Field(default=30, ge=1, le=300)