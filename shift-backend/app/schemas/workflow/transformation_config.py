from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from app.schemas.workflow.enum import DataType, DataFormat, SupportedLanguage



class MappingAssignment(BaseModel):
    """Uma regra individual de mapeamento."""
    target_field: str = Field(..., description="A chave que será criada/atualizada (ex: 'cliente.nome_completo')")
    source_value: str = Field(..., description="O valor ou expressão que vai popular a chave (ex: '{{nome}} {{sobrenome}}')")
    type: DataType = Field(default=DataType.STRING, description="Força a conversão de tipo (cast) durante o mapeamento")

class MapperNodeConfig(BaseModel):
    """Configuração para o nó de Mapeamento (Set/Mutate)."""
    
    keep_only_set_fields: bool = Field(
        default=False, 
        description="Se True, apaga todo o JSON anterior e passa para a frente APENAS os campos definidos no assignments."
    )
    assignments: List[MappingAssignment] = Field(..., description="Lista de chaves a serem criadas ou modificadas")


class CodeNodeConfig(BaseModel):
    """Configuração para execução de scripts customizados."""
    
    language: SupportedLanguage = Field(default=SupportedLanguage.PYTHON, description="Linguagem do script")
    code: str = Field(
        ..., 
        description="O código em si. Deve acessar o payload via uma variável global (ex: 'return items[0].json;')"
    )
    
    # Comportamento de execução (Crucial para listas)
    run_once_for_all: bool = Field(
        default=True, 
        description="Se True, o script recebe o Array inteiro de uma vez. Se False, o motor roda o script N vezes (uma para cada item da lista)."
    )

class DateTimeNodeConfig(BaseModel):
    """Configuração para manipulação e formatação de datas e timestamps."""
    
    property_to_format: str = Field(..., description="Caminho do campo atual (ex: '{{pedido.data_criacao}}')")
    target_property: str = Field(
        ..., 
        description="Onde salvar o resultado. Se for igual a property_to_format, sobrescreve o valor."
    )
    
    # Formatação
    from_format: str = Field(default="auto", description="O formato de entrada ('auto', 'ISO8601', 'DD/MM/YYYY', 'X' para timestamp)")
    to_format: str = Field(..., description="O formato de saída desejado (ex: 'YYYY-MM-DD HH:mm:ss')")
    
    # Fusos Horários
    from_timezone: str = Field(default="UTC", description="Fuso horário de origem (ex: 'America/Sao_Paulo')")
    to_timezone: str = Field(default="UTC", description="Fuso horário de destino")


class DataConverterNodeConfig(BaseModel):
    """Configuração para conversão de estruturas de dados/arquivos."""
    
    input_format: DataFormat = Field(..., description="O formato atual do dado")
    output_format: DataFormat = Field(..., description="O formato que o dado deve assumir")
    
    source_property: str = Field(
        default="data", 
        description="Qual campo do payload contém os dados a serem convertidos"
    )
    target_property: str = Field(
        default="data_converted", 
        description="Onde o resultado convertido será armazenado"
    )
    
    # Opções específicas dependendo da conversão
    options: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Opções extras. Ex: para CSV pode conter {'delimiter': ';', 'header_row': True}"
    )