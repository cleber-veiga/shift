from typing import Any, Optional
from pydantic import BaseModel, Field
from .enum import AIKind, LLMProvider, MemoryType, VectorStoreOperation

class LLMConfig(BaseModel):
    kind: AIKind = AIKind.LLM
    provider: LLMProvider = Field(LLMProvider.OPENAI)
    model: str = Field(..., description="Nome do modelo. Ex: gpt-4o, claude-3-5-sonnet-20241022")
    system_prompt: Optional[str] = Field(None, description="Prompt de sistema. Suporta templates.")
    user_prompt: str = Field(..., description="Prompt do usuário. Suporta templates com {{variavel}}")
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1, le=128000)
    json_mode: bool = Field(False, description="Se verdadeiro, força a resposta em JSON")
    output_field: str = Field("llm_response", description="Campo no contexto para a resposta")

class ChatMemoryConfig(BaseModel):
    kind: AIKind = AIKind.CHAT_MEMORY
    memory_type: MemoryType = Field(MemoryType.BUFFER)
    session_id_field: str = Field(..., description="Campo no contexto com o ID da sessão de chat")
    max_messages: int = Field(20, ge=1, le=200, description="Número máximo de mensagens mantidas na memória")
    summary_model: Optional[str] = Field(None, description="Modelo para sumarizar (apenas para memory_type=summary)")
    output_field: str = Field("chat_history", description="Campo no contexto com o histórico formatado")

class VectorStoreConfig(BaseModel):
    kind: AIKind = AIKind.VECTOR_STORE
    connection_id: str = Field(..., description="ID da conexão com o vector store (Qdrant, Pinecone, etc.)")
    collection: str = Field(..., description="Nome da coleção/índice")
    operation: VectorStoreOperation = Field(VectorStoreOperation.SEARCH)
    embedding_model: str = Field("text-embedding-3-small", description="Modelo de embedding")
    query_field: Optional[str] = Field(None, description="Campo no contexto com o texto de busca (para SEARCH)")
    document_field: Optional[str] = Field(None, description="Campo no contexto com o documento a inserir (para INSERT)")
    top_k: int = Field(5, ge=1, le=100, description="Número de resultados retornados (para SEARCH)")
    score_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Limiar mínimo de similaridade")
    metadata: Optional[dict[str, Any]] = Field(None, description="Metadados adicionais para INSERT. Suporta templates.")
    output_field: str = Field("vector_results")

class AgentTool(BaseModel):
    name: str = Field(..., description="Nome da ferramenta")
    workflow_id: Optional[str] = Field(None, description="ID do workflow que implementa esta ferramenta")
    description: str = Field(..., description="Descrição do que a ferramenta faz (usada pelo LLM para decidir quando usá-la)")

class AgentConfig(BaseModel):
    kind: AIKind = AIKind.AGENT
    provider: LLMProvider = Field(LLMProvider.OPENAI)
    model: str = Field(..., description="Modelo LLM do agente")
    system_prompt: str = Field(..., description="Instruções do agente. Suporta templates.")
    tools: list[AgentTool] = Field(default_factory=list, description="Ferramentas disponíveis para o agente")
    max_iterations: int = Field(10, ge=1, le=50, description="Número máximo de iterações do agente")
    memory_type: Optional[MemoryType] = Field(None, description="Tipo de memória para o agente")
    output_field: str = Field("agent_response")
