"use client"

import {
  type DataSourceDatabaseInput,
  type DataSourceType,
  getValidSession,
} from "./auth"

function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL
  return value && value.trim().length > 0 ? value.trim() : "http://localhost:8000/api/v1"
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>
    }
    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.map((item) => item.msg || "Erro de validação").join("; ")
    }
  } catch {
    // noop
  }
  return `Falha HTTP ${response.status}`
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const raw = await response.text()
  if (!raw) return undefined as T
  return JSON.parse(raw) as T
}

async function authorizedRequest<T>(path: string, init: RequestInit): Promise<T> {
  const session = await getValidSession()
  if (!session) {
    throw new Error("Sua sessão expirou. Faça login novamente.")
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return parseResponseBody<T>(response)
}

export type DatabaseConnectionScope = "project" | "workspace" | "global" | "public" | "ephemeral"
export type DatabaseConnectionVisibility = "private" | "shared" | "public_test"
export type DatabaseQueryMode = "raw_sql" | "manual_select" | "visual_builder" | "template"
export type DatabaseWriteMode =
  | "custom_sql"
  | "insert_rows"
  | "update_rows"
  | "upsert_rows"
  | "delete_rows"
export type DatabaseBindingRequirement = "optional" | "required" | "always_rebind"
export type QueryRiskLevel = "low" | "medium" | "high" | "blocked"

export type DatabaseConnectionPolicy = {
  allow_read: boolean
  allow_insert: boolean
  allow_update: boolean
  allow_delete: boolean
  allow_ddl: boolean
  require_where_for_update_delete: boolean
  require_limit_for_select: boolean
  forbid_select_star: boolean
  max_rows_read: number
  max_rows_write: number
  max_execution_ms: number
  block_multi_statement: boolean
  block_comment_tokens: boolean
  require_manual_approval_for_high_risk: boolean
}

export type DatabaseConnectionPayload = {
  name: string
  description?: string | null
  source_type: DataSourceType
  database: DataSourceDatabaseInput
  scope?: DatabaseConnectionScope
  visibility?: DatabaseConnectionVisibility
  workspace_id?: string | null
  project_id?: string | null
  is_active?: boolean
  tags?: string[]
  policy?: Partial<DatabaseConnectionPolicy>
  allow_schema_capture?: boolean
  allow_ai_assistant?: boolean
}

export type DatabaseConnection = {
  id: string
  name: string
  description: string | null
  source_type: DataSourceType
  scope: DatabaseConnectionScope
  visibility: DatabaseConnectionVisibility
  workspace_id: string | null
  project_id: string | null
  connection_config: Record<string, unknown>
  is_active: boolean
  tags: string[]
  policy: DatabaseConnectionPolicy
  allow_schema_capture: boolean
  allow_ai_assistant: boolean
  created_by_id: string
  created_at: string
  updated_at: string
}

export type DatabaseBindingReference = {
  connection_id?: string | null
  binding_key?: string | null
  source_type?: DataSourceType | null
  database?: DataSourceDatabaseInput | null
  requirement?: DatabaseBindingRequirement
  allow_manual_entry?: boolean
  allow_public_test_connections?: boolean
  persist_credentials_in_workflow?: boolean
}

export type DatabaseColumnRef = {
  schema_name?: string | null
  table_name: string
  column_name: string
  alias?: string | null
}

export type DatabaseFilterCondition = {
  column: string
  operator: string
  value?: unknown
  combinator?: "and" | "or"
}

export type DatabaseSortRule = {
  column: string
  direction?: "asc" | "desc"
}

export type DatabaseJoinDefinition = {
  join_type?: "inner" | "left" | "right" | "full"
  schema_name?: string | null
  table_name: string
  alias?: string | null
  on_sql: string
}

export type DatabaseManualSelectDefinition = {
  base_schema_name?: string | null
  base_table_name: string
  base_alias?: string | null
  columns: DatabaseColumnRef[]
  joins: DatabaseJoinDefinition[]
  filters: DatabaseFilterCondition[]
  sorts: DatabaseSortRule[]
  limit?: number | null
  offset?: number | null
  distinct?: boolean
}

export type DatabasePreviewPayload = {
  binding: DatabaseBindingReference
  mode: DatabaseQueryMode
  sql?: string | null
  manual_select?: DatabaseManualSelectDefinition | null
  max_rows?: number
}

export type DatabasePreviewResponse = {
  success: boolean
  message: string
  columns?: string[] | null
  rows?: Array<Record<string, unknown>> | null
  rowcount?: number | null
  latency_ms?: number | null
  truncated: boolean
  generated_sql?: string | null
  risk_level: QueryRiskLevel
  warnings: string[]
}

export type DatabaseAssistantPayload = {
  binding: DatabaseBindingReference
  user_prompt: string
  mode: DatabaseQueryMode
  dialect_hint?: string | null
  current_sql?: string | null
  manual_select?: DatabaseManualSelectDefinition | null
  max_schema_tables?: number
}

export type DatabaseAssistantResponse = {
  success: boolean
  message: string
  suggested_sql?: string | null
  suggested_mode?: DatabaseQueryMode | null
  explanation?: string | null
  risk_level: QueryRiskLevel
  warnings: string[]
  schema_context?: Record<string, unknown> | null
}

export type DatabaseTableTemplateColumn = {
  name: string
  data_type: string
  nullable: boolean
  primary_key: boolean
  description?: string | null
}

export type DatabaseTableTemplate = {
  id: string
  workspace_id: string
  created_by_id: string
  connection_id?: string | null
  name: string
  description?: string | null
  source_type: DataSourceType
  schema_name?: string | null
  table_name: string
  write_mode: DatabaseWriteMode
  primary_key_columns: string[]
  columns: DatabaseTableTemplateColumn[]
  default_mapping: Record<string, string>
  tags: string[]
  created_at: string
  updated_at: string
}

export type DatabaseTableTemplatePayload = Omit<DatabaseTableTemplate, "id" | "workspace_id" | "created_by_id" | "created_at" | "updated_at"> & {
  connection_id?: string | null
}

export const defaultDatabaseConnectionPolicy: DatabaseConnectionPolicy = {
  allow_read: true,
  allow_insert: false,
  allow_update: false,
  allow_delete: false,
  allow_ddl: false,
  require_where_for_update_delete: true,
  require_limit_for_select: true,
  forbid_select_star: false,
  max_rows_read: 1000,
  max_rows_write: 10000,
  max_execution_ms: 30000,
  block_multi_statement: true,
  block_comment_tokens: false,
  require_manual_approval_for_high_risk: true,
}

export async function listDatabaseConnections(workspaceId: string, projectId?: string) {
  const query = new URLSearchParams()
  if (projectId) query.append("project_id", projectId)
  const suffix = query.toString() ? `?${query.toString()}` : ""
  return authorizedRequest<DatabaseConnection[]>(
    `/database-node/workspaces/${workspaceId}/connections${suffix}`,
    { method: "GET" }
  )
}

export async function createDatabaseConnection(projectId: string, payload: DatabaseConnectionPayload) {
  return authorizedRequest<DatabaseConnection>(`/database-node/projects/${projectId}/connections`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      policy: { ...defaultDatabaseConnectionPolicy, ...(payload.policy ?? {}) },
    }),
  })
}

export async function updateDatabaseConnection(connectionId: string, payload: Partial<DatabaseConnectionPayload>) {
  return authorizedRequest<DatabaseConnection>(`/database-node/connections/${connectionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function previewDatabaseNode(payload: DatabasePreviewPayload) {
  return authorizedRequest<DatabasePreviewResponse>(`/database-node/preview`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function askDatabaseAssistant(payload: DatabaseAssistantPayload) {
  return authorizedRequest<DatabaseAssistantResponse>(`/database-node/assistant`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function listDatabaseTableTemplates(workspaceId: string) {
  return authorizedRequest<DatabaseTableTemplate[]>(
    `/database-node/workspaces/${workspaceId}/table-templates`,
    { method: "GET" }
  )
}

export async function createDatabaseTableTemplate(workspaceId: string, payload: DatabaseTableTemplatePayload) {
  return authorizedRequest<DatabaseTableTemplate>(
    `/database-node/workspaces/${workspaceId}/table-templates`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}
