import type {
  DatabaseConnectionOption,
  ExtractionNodeSubType,
  ExtractionWorkflowNode,
  OutputSchemaColumn,
  ScheduleTriggerConfig,
} from "@/lib/workflow/extraction/types"

const OUTPUT_HANDLE = {
  id: "output" as const,
  type: "source" as const,
  position: "right" as const,
  label: "Dados" as const,
}

const MOCK_SCHEMA: OutputSchemaColumn[] = [
  { name: "id", type: "number", nullable: false },
  { name: "nome", type: "string", nullable: false },
]

export const DATABASE_CONNECTIONS: DatabaseConnectionOption[] = [
  { id: "conn-main", name: "Produção - PostgreSQL", engine: "postgres" },
  { id: "conn-staging", name: "Staging - SQL Server", engine: "sqlserver" },
  { id: "conn-legacy", name: "Legado - Oracle", engine: "oracle" },
]

export const TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/New_York",
  "UTC",
  "Europe/London",
  "Asia/Tokyo",
]

function createDefaultScheduleConfig(): ScheduleTriggerConfig {
  return {
    mode: "every",
    cronExpression: "*/15 * * * *",
    everyMinutes: 15,
    timezone: "America/Sao_Paulo",
    nextRuns: [],
  }
}

export function createDefaultExtractionNode(subType: ExtractionNodeSubType, id: string): ExtractionWorkflowNode {
  if (subType === "database") {
    return {
      id,
      type: "input",
      subType,
      position: { x: 0, y: 0 },
      data: {
        label: "Fonte SQL",
        icon: "database",
        config: {
          connectionId: DATABASE_CONNECTIONS[0]?.id ?? "",
          query: "SELECT id, nome FROM clientes LIMIT 100",
        },
        status: "idle",
        errorMessage: null,
        outputSchema: MOCK_SCHEMA,
        validationState: "idle",
        validationErrors: [],
      },
      handles: [OUTPUT_HANDLE],
    }
  }

  if (subType === "file") {
    return {
      id,
      type: "input",
      subType,
      position: { x: 0, y: 0 },
      data: {
        label: "Arquivo",
        icon: "file",
        config: {
          filePath: "",
          fileType: "csv",
          delimiter: ",",
          encoding: "utf-8",
          skipRows: 0,
          sampleContent: "",
          previewRows: [],
        },
        status: "idle",
        errorMessage: null,
        outputSchema: [],
        validationState: "idle",
        validationErrors: [],
      },
      handles: [OUTPUT_HANDLE],
    }
  }

  if (subType === "http") {
    return {
      id,
      type: "input",
      subType,
      position: { x: 0, y: 0 },
      data: {
        label: "HTTP Request",
        icon: "globe",
        config: {
          url: "",
          method: "GET",
          headers: [{ id: "h-1", key: "Accept", value: "application/json", enabled: true }],
          queryParams: [],
          authentication: {
            type: "none",
            token: "",
            username: "",
            password: "",
            apiKeyHeader: "x-api-key",
            apiKeyValue: "",
          },
          body: "",
        },
        status: "idle",
        errorMessage: null,
        outputSchema: [],
        validationState: "idle",
        validationErrors: [],
      },
      handles: [OUTPUT_HANDLE],
    }
  }

  if (subType === "webhook") {
    return {
      id,
      type: "input",
      subType,
      position: { x: 0, y: 0 },
      data: {
        label: "Webhook Trigger",
        icon: "webhook",
        config: {
          url: `https://hooks.shift.local/${id}`,
          expectedSchema: [],
          payloadHistory: [],
        },
        status: "idle",
        errorMessage: null,
        outputSchema: [],
        validationState: "idle",
        validationErrors: [],
      },
      handles: [OUTPUT_HANDLE],
    }
  }

  return {
    id,
    type: "input",
    subType,
    position: { x: 0, y: 0 },
    data: {
      label: "Schedule Trigger",
      icon: "clock",
      config: createDefaultScheduleConfig(),
      status: "idle",
      errorMessage: null,
      outputSchema: [],
      validationState: "idle",
      validationErrors: [],
    },
    handles: [OUTPUT_HANDLE],
  }
}

export function nodeTypeFromSubType(subType: ExtractionNodeSubType) {
  if (subType === "database") return "databaseInput"
  if (subType === "file") return "fileInput"
  if (subType === "http") return "httpRequest"
  if (subType === "webhook") return "webhookTrigger"
  return "scheduleTrigger"
}
