from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.schemas.workflow.enum import LLMProvider, MemoryStrategy, VectorOperation

class LLMNodeConfig(BaseModel):
    """Configuração para requisições diretas a Modelos de Linguagem (LLMs)."""
    
    provider: LLMProvider = Field(default=LLMProvider.OPENAI, description="Provedor da IA")
    credential_id: str = Field(..., description="ID da chave de API no cofre")
    model_name: str = Field(default="gpt-4o", description="Nome do modelo (ex: 'gpt-4o', 'gemini-1.5-pro')")
    
    # Construção do Prompt
    system_prompt: Optional[str] = Field(
        default="Você é um assistente útil.", 
        description="O papel e as regras do modelo."
    )
    user_prompt: str = Field(
        ..., 
        description="A entrada dinâmica (ex: 'Resuma este texto: {{response.data.texto}}')"
    )
    
    # Parâmetros de Inferência
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Criatividade (0 = rígido, 1+ = criativo)")
    max_tokens: Optional[int] = Field(default=None, description="Limite máximo de palavras/tokens gerados")
    json_mode: bool = Field(default=False, description="Forçar o LLM a responder em formato JSON válido")


class ChatMemoryNodeConfig(BaseModel):
    """Configuração para persistência e injeção de histórico conversacional."""
    
    session_id: str = Field(
        ..., 
        description="Identificador único da conversa (ex: '{{webhook.body.numero_whatsapp}}')"
    )
    strategy: MemoryStrategy = Field(default=MemoryStrategy.BUFFER, description="Estratégia de retenção")
    
    window_size: int = Field(
        default=10, 
        description="Quantas interações (pergunta/resposta) manter na memória curta"
    )
    
    target_property: str = Field(
        default="chat_history", 
        description="Onde o histórico será injetado no payload para o nó LLM consumir"
    )


class VectorStoreNodeConfig(BaseModel):
    """Configuração para integração com bancos vetoriais (Pinecone, Qdrant, Chroma)."""
    
    database_provider: str = Field(..., description="Provedor do banco (ex: 'pinecone')")
    credential_id: str = Field(..., description="Credencial do banco vetorial")
    operation: VectorOperation = Field(..., description="Ação a ser executada")
    
    index_name: str = Field(..., description="Nome do índice ou coleção onde os dados estão")
    embedding_model: str = Field(default="text-embedding-3-small", description="Modelo usado para vetorizar")
    
    # Para Operação SEARCH (Busca)
    search_query: Optional[str] = Field(
        default=None, 
        description="O que o usuário perguntou (ex: '{{user.pergunta}}')"
    )
    top_k: int = Field(default=4, description="Quantos fragmentos de texto semelhantes retornar")
    
    # Para Operação UPSERT (Gravação)
    document_text: Optional[str] = Field(
        default=None, 
        description="O texto a ser salvo (ex: conteúdo de um PDF lido num nó anterior)"
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Filtros extras (ex: {'departamento': 'RH', 'ano': 2024})"
    )


class AgentNodeConfig(BaseModel):
    """Configuração para orquestração de Agentes Autônomos (ReAct, OpenAI Functions)."""
    
    llm_node_reference: str = Field(..., description="ID do nó LLM que servirá de 'cérebro' para o agente")
    
    agent_role: str = Field(
        ..., 
        description="A persona e o objetivo (ex: 'Você é um agente de suporte técnico resolvendo chamados.')"
    )
    
    # Aqui está a mágica: O Agente pode chamar NÓS DE AÇÃO do seu sistema
    allowed_tools: List[str] = Field(
        ..., 
        description="Lista com os IDs de outros nós do sistema que este agente tem permissão para usar sozinho (ex: ['sql_node_1', 'http_node_stripe'])"
    )
    
    max_iterations: int = Field(
        default=5, 
        description="Limite de passos que o agente pode dar sozinho antes de ser forçado a parar (evita loops infinitos e custos altos)"
    )
    
    require_human_approval: bool = Field(
        default=False, 
        description="Se True, o fluxo pausa e pede aprovação manual antes do agente executar uma ferramenta perigosa (ex: deletar banco)"
    )