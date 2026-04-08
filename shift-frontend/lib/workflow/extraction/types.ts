import type { Edge, Node, XYPosition } from "@xyflow/react"

export type ExtractionNodeSubType = "database" | "file" | "http" | "webhook" | "schedule"

export type ExtractionExecutionStatus = "idle" | "running" | "success" | "error"

export type ExtractionValidationState = "idle" | "validating" | "ready" | "error"

export type OutputSchemaType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object"
  | "array"
  | "unknown"

export interface OutputSchemaColumn {
  name: string
  type: OutputSchemaType
  nullable?: boolean
}

export interface WorkflowHandleDefinition {
  id: "output"
  type: "source"
  position: "right"
  label: "Dados"
}

export interface DatabaseConnectionOption {
  id: string
  name: string
  engine: "postgres" | "mysql" | "sqlserver" | "oracle"
}

export interface KeyValueItem {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface WebhookPayloadHistoryItem {
  id: string
  receivedAt: string
  payload: string
}

export interface DatabaseInputConfig {
  connectionId: string
  query: string
}

export type FileType = "csv" | "json" | "xlsx" | "xml"

export interface FileInputConfig {
  filePath: string
  fileType: FileType
  delimiter: string
  encoding: string
  skipRows: number
  sampleContent: string
  previewRows: string[][]
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export type HttpAuthType = "none" | "bearer" | "basic" | "apiKey"

export interface HttpAuthConfig {
  type: HttpAuthType
  token: string
  username: string
  password: string
  apiKeyHeader: string
  apiKeyValue: string
}

export interface HttpRequestConfig {
  url: string
  method: HttpMethod
  headers: KeyValueItem[]
  queryParams: KeyValueItem[]
  authentication: HttpAuthConfig
  body: string
}

export interface WebhookTriggerConfig {
  url: string
  expectedSchema: OutputSchemaColumn[]
  payloadHistory: WebhookPayloadHistoryItem[]
}

export interface ScheduleTriggerConfig {
  mode: "cron" | "every"
  cronExpression: string
  everyMinutes: number
  timezone: string
  nextRuns: string[]
}

export type ExtractionNodeConfig =
  | DatabaseInputConfig
  | FileInputConfig
  | HttpRequestConfig
  | WebhookTriggerConfig
  | ScheduleTriggerConfig

export interface ExtractionNodeData {
  label: string
  icon: string
  config: ExtractionNodeConfig
  status: ExtractionExecutionStatus
  errorMessage: string | null
  outputSchema: OutputSchemaColumn[]
  validationState: ExtractionValidationState
  validationErrors: string[]
}

export interface ExtractionWorkflowNode {
  id: string
  type: "input"
  subType: ExtractionNodeSubType
  position: XYPosition
  data: ExtractionNodeData
  handles: [WorkflowHandleDefinition]
}

export type ExtractionWorkflowEdge = Edge

export interface ExtractionConfigChangeEvent {
  nodeId: string
  subType: ExtractionNodeSubType
  config: ExtractionNodeConfig
}

export interface ExtractionSchemaChangeEvent {
  nodeId: string
  schema: OutputSchemaColumn[]
}

export interface ExtractionWorkflowEvents {
  onNodeConfigChange?: (event: ExtractionConfigChangeEvent) => void
  onNodeSchemaChange?: (event: ExtractionSchemaChangeEvent) => void
}

export interface ExtractionReactFlowNodeData {
  workflowNode: ExtractionWorkflowNode
  isSelected: boolean
}

export type ExtractionReactFlowNode = Node<ExtractionReactFlowNodeData>
