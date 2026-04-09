from typing import Any, Optional
from pydantic import BaseModel, Field
from .enum import TransformationKind, SupportedLanguage, FileFormat

class FieldMapping(BaseModel):
    source: str = Field(..., description="Caminho do campo de origem. Ex: data.nome_cliente")
    target: str = Field(..., description="Nome do campo de destino")
    transform: Optional[str] = Field(None, description="Expressão Python para transformar o valor. Ex: value.strip().upper()")
    default: Optional[Any] = Field(None, description="Valor padrão se o campo de origem não existir")

class MapperConfig(BaseModel):
    kind: TransformationKind = TransformationKind.MAPPER
    mappings: list[FieldMapping] = Field(..., min_length=1)
    drop_unmapped: bool = Field(True, description="Se verdadeiro, remove campos não mapeados do resultado")
    output_field: str = Field("mapped", description="Campo no contexto para o resultado")

class CodeConfig(BaseModel):
    kind: TransformationKind = TransformationKind.CODE
    language: SupportedLanguage = Field(SupportedLanguage.PYTHON)
    code: str = Field(..., description="Código a ser executado. Deve retornar um valor via 'return'. Tem acesso à variável 'data' com o contexto.")
    output_field: str = Field("result", description="Campo no contexto para o valor retornado pelo código")
    timeout_seconds: int = Field(30, ge=1, le=300)

class DateTimeConfig(BaseModel):
    kind: TransformationKind = TransformationKind.DATETIME
    operation: str = Field(..., description="Operação: parse, format, add, subtract, diff, now")
    input_field: Optional[str] = Field(None, description="Campo de entrada com a data")
    input_format: Optional[str] = Field(None, description="Formato de entrada. Ex: '%d/%m/%Y'")
    output_format: str = Field("%Y-%m-%dT%H:%M:%S", description="Formato de saída")
    add_value: Optional[int] = Field(None, description="Valor a adicionar/subtrair")
    add_unit: Optional[str] = Field(None, description="Unidade: seconds, minutes, hours, days, weeks, months, years")
    output_field: str = Field("datetime_result")

class DataConverterConfig(BaseModel):
    kind: TransformationKind = TransformationKind.DATA_CONVERTER
    input_format: FileFormat = Field(..., description="Formato de entrada")
    output_format: FileFormat = Field(..., description="Formato de saída")
    input_field: str = Field("data", description="Campo no contexto com os dados de entrada")
    output_field: str = Field("converted", description="Campo no contexto para o resultado convertido")
    csv_delimiter: str = Field(",", description="Delimitador para CSV")
    csv_has_header: bool = Field(True)
