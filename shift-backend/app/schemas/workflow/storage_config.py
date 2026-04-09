from typing import Any, Optional
from pydantic import BaseModel, Field
from .enum import StorageKind, StateOperation, FileOperation, FileFormat

class GlobalStateConfig(BaseModel):
    kind: StorageKind = StorageKind.GLOBAL_STATE
    operation: StateOperation = Field(..., description="Operação: get, set, delete, increment")
    key: str = Field(..., description="Chave do estado global. Suporta templates: {{variavel}}")
    value: Optional[Any] = Field(None, description="Valor a ser armazenado (para operação 'set')")
    increment_by: Optional[float] = Field(None, description="Valor para incrementar (para operação 'increment')")
    scope: str = Field("workflow", pattern="^(workflow|workspace|global)$", description="Escopo do estado: workflow (apenas esta execução), workspace (compartilhado no workspace), global (toda a plataforma)")
    output_field: str = Field("state_value", description="Campo no contexto para o valor lido (operação 'get')")

class FileStorageConfig(BaseModel):
    kind: StorageKind = StorageKind.FILE_STORAGE
    operation: FileOperation = Field(..., description="Operação: read, write, append, delete")
    path: str = Field(..., description="Caminho do arquivo. Suporta templates.")
    format: FileFormat = Field(FileFormat.JSON, description="Formato do arquivo")
    input_field: Optional[str] = Field(None, description="Campo no contexto com os dados a escrever (para write/append)")
    output_field: str = Field("file_content", description="Campo no contexto para o conteúdo lido (para read)")
    csv_delimiter: str = Field(",")
    encoding: str = Field("utf-8")
