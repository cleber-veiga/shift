from pydantic import BaseModel, Field
from typing import Any, Optional
from app.schemas.workflow.enum import StateOperation, StateScope, FileOperation

class GlobalStateNodeConfig(BaseModel):
    """Configuração para salvar/recuperar variáveis persistentes do sistema."""
    
    operation: StateOperation = Field(default=StateOperation.GET, description="O que fazer com a variável")
    scope: StateScope = Field(default=StateScope.WORKFLOW, description="Quem pode enxergar essa variável")
    
    key: str = Field(..., description="O nome da variável (ex: 'ultimo_id_sincronizado')")
    
    value: Optional[str] = Field(
        default=None, 
        description="O valor a ser salvo (apenas usado se operation == SET). Suporta expressões ex: '{{response.data.id}}'"
    )
    
    target_property: Optional[str] = Field(
        default="state_value", 
        description="Onde injetar o valor recuperado no JSON atual (apenas usado se operation == GET)"
    )


class FileStorageNodeConfig(BaseModel):
    """Configuração para manipulação de arquivos no sistema de arquivos do servidor."""
    
    operation: FileOperation = Field(..., description="Operação a ser realizada no sistema de arquivos")
    
    file_path: str = Field(
        ..., 
        description="Caminho absoluto ou relativo do arquivo (ex: '/tmp/relatorio_{{date}}.pdf')"
    )
    
    # Para operação WRITE (De onde vem o arquivo)
    source_binary_property: Optional[str] = Field(
        default=None, 
        description="Qual campo do JSON contém os dados binários ou base64 para serem gravados"
    )
    
    # Para operação READ (Para onde vai o arquivo)
    target_binary_property: Optional[str] = Field(
        default="file_data", 
        description="Onde anexar o conteúdo do arquivo lido no JSON"
    )
    
    fail_on_missing: bool = Field(
        default=True, 
        description="Se True, o fluxo quebra se tentar ler/deletar um arquivo que não existe"
    )