from enum import Enum

class NodeGroup(str, Enum):
    TRIGGER = "trigger"
    ACTION = "action"
    LOGIC = "logic"
    TRANSFORMATION = "transformation"
    STORAGE = "storage"
    AI = "ai"

class TriggerKind(str, Enum):
    CRON = "cron"
    WEBHOOK = "webhook"
    MANUAL = "manual"
    SUB_WORKFLOW = "sub_workflow"
    EVENT_QUEUE = "event_queue"

class ActionKind(str, Enum):
    HTTP_REQUEST = "http_request"
    SQL_DATABASE = "sql_database"
    EMAIL_SENDER = "email_sender"
    EXECUTE_SUB_WORKFLOW = "execute_sub_workflow"
    NOSQL_DATABASE = "nosql_database"

class LogicKind(str, Enum):
    IF = "if"
    SWITCH = "switch"
    LOOP = "loop"
    MERGE = "merge"
    ERROR_CATCH = "error_catch"
    WAIT = "wait"

class TransformationKind(str, Enum):
    MAPPER = "mapper"
    CODE = "code"
    DATETIME = "datetime"
    DATA_CONVERTER = "data_converter"

class StorageKind(str, Enum):
    GLOBAL_STATE = "global_state"
    FILE_STORAGE = "file_storage"

class AIKind(str, Enum):
    LLM = "llm"
    CHAT_MEMORY = "chat_memory"
    VECTOR_STORE = "vector_store"
    AGENT = "agent"

class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"

class SqlOperation(str, Enum):
    SELECT = "select"
    INSERT = "insert"
    UPDATE = "update"
    UPSERT = "upsert"
    DELETE = "delete"
    EXECUTE = "execute"

class FileFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    XLSX = "xlsx"
    PARQUET = "parquet"
    TXT = "txt"

class ConditionOperator(str, Enum):
    EQUALS = "=="
    NOT_EQUALS = "!="
    GREATER_THAN = ">"
    LESS_THAN = "<"
    GREATER_OR_EQUAL = ">="
    LESS_OR_EQUAL = "<="
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"

class SupportedLanguage(str, Enum):
    PYTHON = "python"

class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"

class MemoryType(str, Enum):
    BUFFER = "buffer"
    SUMMARY = "summary"
    WINDOW = "window"

class VectorStoreOperation(str, Enum):
    SEARCH = "search"
    INSERT = "insert"
    DELETE = "delete"

class StateOperation(str, Enum):
    GET = "get"
    SET = "set"
    DELETE = "delete"
    INCREMENT = "increment"

class FileOperation(str, Enum):
    READ = "read"
    WRITE = "write"
    APPEND = "append"
    DELETE = "delete"
