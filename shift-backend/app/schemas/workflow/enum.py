from enum import Enum


class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class SqlOperation(str, Enum):
    SELECT = "SELECT"
    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    CUSTOM = "CUSTOM" # Para DDL como CREATE TABLE, DROP, etc.


class Operator(str, Enum):
    EQUALS = "=="
    NOT_EQUALS = "!="
    GREATER_THAN = ">"
    LESS_THAN = "<"
    CONTAINS = "contains"
    IS_EMPTY = "is_empty"

class MergeMode(str, Enum):
    WAIT_ALL = "wait_all" # Espera as duas portas (Input 1 e Input 2) terminarem
    PASS_THROUGH = "pass_through" # A primeira ramificação que chegar passa, e o nó ignora a mais lenta

class CombineStrategy(str, Enum):
    MERGE_BY_KEY = "merge_by_key" # Junta os dois JSONs num só (A+B = AB)
    APPEND_ARRAY = "append_array" # Cria uma lista com os dois resultados [A, B]
    KEEP_INPUT_1 = "keep_input_1" # Descarta os dados da ramificação 2 e segue só com o JSON da 1


class DataType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"

class SupportedLanguage(str, Enum):
    PYTHON = "python"         # Muito pedido por engenheiros de dados


class DataFormat(str, Enum):
    JSON = "json"
    XML = "xml"
    CSV = "csv"
    TEXT = "text"
    BASE64 = "base64"


class StateOperation(str, Enum):
    SET = "set"       # Salva ou atualiza um valor
    GET = "get"       # Recupera um valor
    DELETE = "delete" # Apaga a variável

class StateScope(str, Enum):
    WORKFLOW = "workflow" # A variável só é visível para futuras execuções deste mesmo fluxo
    GLOBAL = "global"     # A variável pode ser lida por QUALQUER outro fluxo do seu sistema

class FileOperation(str, Enum):
    READ = "read"   # Lê do disco e joga para o payload em base64 ou buffer
    WRITE = "write" # Pega do payload e salva no disco
    DELETE = "delete"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"

class MemoryStrategy(str, Enum):
    BUFFER = "buffer"               # Guarda e envia as últimas N mensagens
    BUFFER_WINDOW = "buffer_window" # Guarda mensagens dos últimos N minutos
    SUMMARY = "summary"             # Pede pro LLM resumir as conversas antigas para economizar tokens


class VectorOperation(str, Enum):
    UPSERT = "upsert" # Adicionar/Atualizar documentos no banco vetorial
    SEARCH = "search" # Buscar contexto semelhante à pergunta