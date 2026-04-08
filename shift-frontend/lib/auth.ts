export type User = {
  id: string
  email: string
  full_name: string | null
  is_active: boolean
  is_verified: boolean
  auth_provider: string
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export type OrganizationRole = "OWNER" | "MANAGER" | "MEMBER" | "GUEST"

export type Organization = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type ERP = {
  id: string
  name: string
  slug: string
  code: string
  created_at: string
  updated_at: string
}

export type OrganizationMembership = {
  id: string
  user_id: string
  organization_id: string
  role: OrganizationRole
  created_at: string
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: "bearer"
  access_token_expires_at: number
  refresh_token_expires_at: number
  user: User
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
  full_name?: string
}

export type CreateOrganizationPayload = {
  name: string
  slug: string
}

export type CreateWorkspacePayload = {
  name: string
  organization_id: string
  erp_id?: string | null
}

export type UpdateWorkspacePayload = {
  name?: string
}

export type WorkspacePlayerDatabaseType =
  | "POSTGRESQL"
  | "MYSQL"
  | "SQLSERVER"
  | "ORACLE"
  | "FIREBIRD"
  | "SQLITE"
  | "SNOWFLAKE"

export type WorkspacePlayer = {
  id: string
  workspace_id: string
  name: string
  database_type: WorkspacePlayerDatabaseType
}

export type CreateWorkspacePlayerPayload = {
  name: string
  database_type: WorkspacePlayerDatabaseType
}

export type UpdateWorkspacePlayerPayload = {
  name?: string
  database_type?: WorkspacePlayerDatabaseType
}

export type Workspace = {
  id: string
  name: string
  organization_id: string
  erp_id?: string | null
  created_by_id: string
  created_at: string
}

export type Project = {
  id: string
  workspace_id: string
  conglomerate_id: string
  player_id: string | null
  created_by_id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export type CreateProjectPayload = {
  name: string
  player_id: string
  conglomerate_id: string
  start_date: string
  end_date: string
  description?: string | null
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>

export type DataSourceType =
  | "POSTGRESQL"
  | "MYSQL"
  | "SQLSERVER"
  | "ORACLE"
  | "FIREBIRD"
  | "SQLITE"
  | "SNOWFLAKE"
  | "CSV"
  | "XLSX"

export type DataSourceDatabaseInput = {
  connection_url?: string | null
  host?: string | null
  port?: number | null
  database?: string | null
  schema_name?: string | null
  username?: string | null
  password?: string | null
  ssl_mode?: string | null
  sqlite_path?: string | null
  account?: string | null
  warehouse?: string | null
  role?: string | null
  service_name?: string | null
  sid?: string | null
  dsn?: string | null
  charset?: string | null
  client_library_path?: string | null
  odbc_driver?: string | null
}

export type DataSourceFileInput = {
  file_name: string
  file_path?: string | null
  storage_key?: string | null
  delimiter?: string | null
  encoding?: string | null
  sheet_name?: string | null
  has_header?: boolean
}

export type DataSourcePayload = {
  name: string
  source_type: DataSourceType
  is_active?: boolean
  database?: DataSourceDatabaseInput
  file?: DataSourceFileInput
}

export type DataSource = {
  id: string
  project_id: string
  created_by_id: string
  name: string
  source_type: DataSourceType
  connection_config: Record<string, unknown> | null
  file_config: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DataSourceConnectionTestResponse = {
  success: boolean
  message: string
  latency_ms: number | null
}

export type Conglomerate = {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateConglomeratePayload = {
  name: string
  description?: string | null
  is_active?: boolean
}

export type CompetitorProduct = {
  id: string
  competitor_id: string
  product_name: string
  database_type: DataSourceType
}

export type Competitor = {
  id: string
  organization_id: string
  name: string
  products: CompetitorProduct[]
  created_at: string
  updated_at: string
}

export type CreateCompetitorProductPayload = {
  product_name: string
  database_type: DataSourceType
}

export type CreateCompetitorPayload = {
  name: string
  products: CreateCompetitorProductPayload[]
}

export type SchemaColumn = {
  column_name: string
  data_type: string
  is_nullable: boolean
}

export type SchemaTable = {
  table_name: string
  schema_name: string | null
  columns: SchemaColumn[]
}

export type CompetitorSchemaCatalog = {
  id: string
  competitor_id: string
  created_by_id: string
  captured_from_data_source_id: string | null
  source_system: string
  target_system: string
  database_type: DataSourceType
  schema_definition: SchemaTable[]
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

export type ExecuteSchemaCatalogPayload = {
  source_system: string
  target_system: string
  data_source_id?: string | null
  manual_config?: DataSourceDatabaseInput | null
  database_type?: DataSourceType | null
  max_rows?: number
  save_result?: boolean
}

export type ExecuteSchemaCatalogResponse = {
  success: boolean
  message: string
  database_type: DataSourceType | null
  tables: SchemaTable[]
  rowcount: number | null
  latency_ms: number | null
  truncated: boolean
  saved_catalog_id: string | null
}

export type ExtractionMode = "SCHEMA_SELECTION" | "CUSTOM_SQL"

export type CompetitorExtractionTemplate = {
  id: string
  competitor_id: string
  name: string
  extraction_mode: ExtractionMode
  schema_selection_config: Record<string, unknown> | null
  custom_sql_query: string | null
  default_batch_size: number
  created_by_id: string
  created_at: string
  updated_at: string
}

export type CreateCompetitorExtractionTemplatePayload = {
  name: string
  competitor_id: string
  extraction_mode: ExtractionMode
  default_batch_size: number
  schema_selection_config?: Record<string, unknown> | null
  custom_sql_query?: string | null
}

export type ProjectExtraction = {
  id: string
  project_id: string
  data_source_id: string
  template_id: string
  name: string
  is_active: boolean
  batch_size: number
  created_by_id: string
  created_at: string
  updated_at: string
  last_execution_status?: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | null
  total_rows_extracted?: number | null
  last_execution?: {
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
    total_rows_extracted: number | null
  } | null
}

export type CreateProjectExtractionPayload = {
  name: string
  data_source_id: string
  template_id: string
  batch_size?: number | null
}

export type WorkspaceSchemaCatalog = {
  id: string
  workspace_id: string
  erp_id: string
  created_by_id: string
  captured_from_data_source_id: string | null
  database_type: DataSourceType
  schema_definition: SchemaTable[]
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

export type ExecuteWorkspaceSchemaCatalogPayload = {
  data_source_id: string
  max_rows?: number
  save_result?: boolean
}

export type ExecuteWorkspaceSchemaCatalogResponse = {
  success: boolean
  message: string
  database_type: DataSourceType | null
  tables: SchemaTable[]
  rowcount: number | null
  latency_ms: number | null
  truncated: boolean
  saved_catalog_id: string | null
}

export type Establishment = {
  id: string
  conglomerate_id: string
  corporate_name: string
  trade_name: string | null
  cnpj: string
  erp_code: number | null
  cnae: string
  state_registration: string | null
  cep: string | null
  city: string | null
  state: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateEstablishmentPayload = {
  corporate_name: string
  trade_name?: string | null
  cnpj: string
  erp_code?: number | null
  cnae: string
  state_registration?: string | null
  cep?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  is_active?: boolean
}

export type CnpjLookupResult = Record<string, unknown>

export type CepLookupResult = {
  cep: string
  street?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  complement?: string | null
}

const SESSION_STORAGE_KEY = "shift.auth.session"
const SELECTED_ORGANIZATION_STORAGE_KEY = "shift.selected.organization_id"
const SELECTED_WORKSPACE_STORAGE_KEY = "shift.selected.workspace_id"
const SELECTED_PROJECT_STORAGE_KEY = "shift.selected.project_id"

export type AuthSession = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  refreshTokenExpiresAt: number
  user: User
}

function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL
  return value && value.trim().length > 0 ? value.trim() : "http://localhost:8000/api/v1"
}

function isBrowser() {
  return typeof window !== "undefined"
}

function toSession(response: TokenResponse): AuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    accessTokenExpiresAt: response.access_token_expires_at,
    refreshTokenExpiresAt: response.refresh_token_expires_at,
    user: response.user,
  }
}

export function getStoredSession(): AuthSession | null {
  if (!isBrowser()) return null

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

export function storeSession(session: AuthSession) {
  if (!isBrowser()) return
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  if (!isBrowser()) return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function setSelectedOrganizationId(organizationId: string) {
  if (!isBrowser()) return
  window.localStorage.setItem(SELECTED_ORGANIZATION_STORAGE_KEY, organizationId)
}

export function getSelectedOrganizationId(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(SELECTED_ORGANIZATION_STORAGE_KEY)
}

export function clearSelectedOrganizationId() {
  if (!isBrowser()) return
  window.localStorage.removeItem(SELECTED_ORGANIZATION_STORAGE_KEY)
}

export function setSelectedWorkspaceId(workspaceId: string) {
  if (!isBrowser()) return
  window.localStorage.setItem(SELECTED_WORKSPACE_STORAGE_KEY, workspaceId)
}

export function getSelectedWorkspaceId(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(SELECTED_WORKSPACE_STORAGE_KEY)
}

export function clearSelectedWorkspaceId() {
  if (!isBrowser()) return
  window.localStorage.removeItem(SELECTED_WORKSPACE_STORAGE_KEY)
}

export function setSelectedProjectId(projectId: string) {
  if (!isBrowser()) return
  window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, projectId)
}

export function getSelectedProjectId(): string | null {
  if (!isBrowser()) return null
  return window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)
}

export function clearSelectedProjectId() {
  if (!isBrowser()) return
  window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
}

function isAccessTokenExpired(session: AuthSession) {
  const now = Math.floor(Date.now() / 1000)
  return session.accessTokenExpiresAt <= now + 10
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      detail?:
        | string
        | Array<{
            loc?: Array<string | number>
            msg?: string
          }>
    }
    if (typeof data.detail === "string" && data.detail.trim().length > 0) {
      return data.detail
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0]
      const msg = typeof first?.msg === "string" ? first.msg.trim() : ""
      const loc =
        Array.isArray(first?.loc) && first.loc.length > 0
          ? first.loc.map((item) => String(item)).join(".")
          : ""
      if (msg && loc) {
        return `${loc}: ${msg}`
      }
      if (msg) {
        return msg
      }
    }
  } catch {
    // ignore parse error and return generic message
  }

  return `Erro na requisição (${response.status}).`
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const raw = await response.text()
  if (!raw) {
    return undefined as T
  }

  return JSON.parse(raw) as T
}
async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return parseResponseBody<T>(response)
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

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const data = await request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const session = toSession(data)
  storeSession(session)
  return session
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const data = await request<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  const session = toSession(data)
  storeSession(session)
  return session
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const data = await request<TokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  const session = toSession(data)
  storeSession(session)
  return session
}

export async function fetchMe(accessToken: string): Promise<User> {
  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return (await response.json()) as User
}

export async function getValidSession(): Promise<AuthSession | null> {
  const session = getStoredSession()
  if (!session) return null

  if (!isAccessTokenExpired(session)) {
    return session
  }

  const now = Math.floor(Date.now() / 1000)
  if (session.refreshTokenExpiresAt <= now) {
    clearSession()
    return null
  }

  try {
    return await refreshSession(session.refreshToken)
  } catch {
    clearSession()
    return null
  }
}

export async function logout() {
  const session = getStoredSession()

  if (session) {
    try {
      await request<{ detail: string }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      })
    } catch {
      // best effort logout
    }
  }

  clearSession()
  clearSelectedOrganizationId()
  clearSelectedWorkspaceId()
  clearSelectedProjectId()
}

export async function listOrganizations(): Promise<Organization[]> {
  return authorizedRequest<Organization[]>("/organizations", { method: "GET" })
}

export async function listErps(params?: { q?: string }): Promise<ERP[]> {
  const query = new URLSearchParams()
  if (params?.q) query.append("q", params.q)
  const queryString = query.toString()
  const path = `/erps${queryString ? `?${queryString}` : ""}`
  return authorizedRequest<ERP[]>(path, { method: "GET" })
}

export async function listWorkspaceSchemaCatalogs(
  workspace_id: string,
  params?: { database_type?: DataSourceType }
): Promise<WorkspaceSchemaCatalog[]> {
  const query = new URLSearchParams()
  if (params?.database_type) query.append("database_type", params.database_type)
  const queryString = query.toString()
  const path = `/workspaces/${workspace_id}/schema-catalogs${queryString ? `?${queryString}` : ""}`
  return authorizedRequest<WorkspaceSchemaCatalog[]>(path, { method: "GET" })
}

export async function executeWorkspaceSchemaCatalog(
  workspace_id: string,
  payload: ExecuteWorkspaceSchemaCatalogPayload
): Promise<ExecuteWorkspaceSchemaCatalogResponse> {
  return authorizedRequest<ExecuteWorkspaceSchemaCatalogResponse>(
    `/workspaces/${workspace_id}/schema-catalogs/execute`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function createOrganization(
  payload: CreateOrganizationPayload
): Promise<Organization> {
  return authorizedRequest<Organization>("/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function listOrganizationMembers(
  organizationId: string
): Promise<OrganizationMembership[]> {
  return authorizedRequest<OrganizationMembership[]>(
    `/organizations/${organizationId}/members`,
    { method: "GET" }
  )
}

export async function listOrganizationWorkspaces(
  organizationId: string
): Promise<Workspace[]> {
  return authorizedRequest<Workspace[]>(
    `/workspaces/organization/${organizationId}`,
    { method: "GET" }
  )
}

export async function createWorkspace(payload: CreateWorkspacePayload): Promise<Workspace> {
  return authorizedRequest<Workspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateWorkspace(
  workspaceId: string,
  payload: UpdateWorkspacePayload
): Promise<Workspace> {
  return authorizedRequest<Workspace>(`/workspaces/${workspaceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function listWorkspaceProjects(
  workspaceId: string
): Promise<Project[]> {
  return authorizedRequest<Project[]>(`/workspaces/${workspaceId}/projects`, {
    method: "GET",
  })
}

export async function createWorkspacePlayer(
  workspaceId: string,
  payload: CreateWorkspacePlayerPayload
): Promise<WorkspacePlayer> {
  return authorizedRequest<WorkspacePlayer>(`/workspaces/${workspaceId}/players`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function listWorkspacePlayers(
  workspaceId: string
): Promise<WorkspacePlayer[]> {
  return authorizedRequest<WorkspacePlayer[]>(`/workspaces/${workspaceId}/players`, {
    method: "GET",
  })
}

export async function getWorkspacePlayer(
  workspaceId: string,
  playerId: string
): Promise<WorkspacePlayer> {
  return authorizedRequest<WorkspacePlayer>(`/workspaces/${workspaceId}/players/${playerId}`, {
    method: "GET",
  })
}

export async function updateWorkspacePlayer(
  workspaceId: string,
  playerId: string,
  payload: UpdateWorkspacePlayerPayload
): Promise<WorkspacePlayer> {
  return authorizedRequest<WorkspacePlayer>(`/workspaces/${workspaceId}/players/${playerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteWorkspacePlayer(
  workspaceId: string,
  playerId: string
): Promise<void> {
  return authorizedRequest<void>(`/workspaces/${workspaceId}/players/${playerId}`, {
    method: "DELETE",
  })
}

export async function createWorkspaceProject(
  workspaceId: string,
  payload: CreateProjectPayload
): Promise<Project> {
  return authorizedRequest<Project>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload
): Promise<Project> {
  return authorizedRequest<Project>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function listOrganizationConglomerates(
  organizationId: string
): Promise<Conglomerate[]> {
  return authorizedRequest<Conglomerate[]>(
    `/organizations/${organizationId}/conglomerates`,
    { method: "GET" }
  )
}

export async function listOrganizationCompetitors(
  organization_id: string
): Promise<Competitor[]> {
  return authorizedRequest<Competitor[]>(
    `/organizations/${organization_id}/competitors`,
    { method: "GET" }
  )
}

export async function createCompetitor(
  organization_id: string,
  payload: CreateCompetitorPayload
): Promise<Competitor> {
  return authorizedRequest<Competitor>(
    `/organizations/${organization_id}/competitors`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function updateCompetitor(
  competitor_id: string,
  payload: Partial<CreateCompetitorPayload>
): Promise<Competitor> {
  return authorizedRequest<Competitor>(`/competitors/${competitor_id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function listCompetitorSchemaCatalogs(
  competitor_id: string,
  params?: {
    source_system?: string
    target_system?: string
    database_type?: DataSourceType
  }
): Promise<CompetitorSchemaCatalog[]> {
  const query = new URLSearchParams()
  if (params?.source_system) query.append("source_system", params.source_system)
  if (params?.target_system) query.append("target_system", params.target_system)
  if (params?.database_type) query.append("database_type", params.database_type)

  const queryString = query.toString()
  const path = `/competitors/${competitor_id}/schema-catalogs${queryString ? `?${queryString}` : ""}`

  return authorizedRequest<CompetitorSchemaCatalog[]>(path, { method: "GET" })
}

export async function executeCompetitorSchemaCatalog(
  competitor_id: string,
  payload: ExecuteSchemaCatalogPayload
): Promise<ExecuteSchemaCatalogResponse> {
  return authorizedRequest<ExecuteSchemaCatalogResponse>(
    `/competitors/${competitor_id}/schema-catalogs/execute`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function listCompetitorExtractionTemplates(
  competitor_id: string
): Promise<CompetitorExtractionTemplate[]> {
  return authorizedRequest<CompetitorExtractionTemplate[]>(
    `/competitors/${competitor_id}/extraction-templates`,
    { method: "GET" }
  )
}

export async function createCompetitorExtractionTemplate(
  competitor_id: string,
  payload: CreateCompetitorExtractionTemplatePayload
): Promise<CompetitorExtractionTemplate> {
  return authorizedRequest<CompetitorExtractionTemplate>(
    `/competitors/${competitor_id}/extraction-templates`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function deleteCompetitor(competitorId: string): Promise<void> {
  return authorizedRequest<void>(`/competitors/${competitorId}`, {
    method: "DELETE",
  })
}

export async function createConglomerate(
  organizationId: string,
  payload: CreateConglomeratePayload
): Promise<Conglomerate> {
  return authorizedRequest<Conglomerate>(
    `/organizations/${organizationId}/conglomerates`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function updateEstablishment(
  establishmentId: string,
  payload: Partial<CreateEstablishmentPayload>
): Promise<Establishment> {
  return authorizedRequest<Establishment>(`/establishments/${establishmentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteEstablishment(
  establishmentId: string
): Promise<void> {
  return authorizedRequest<void>(`/establishments/${establishmentId}`, {
    method: "DELETE",
  })
}

export async function getConglomerate(
  conglomerateId: string
): Promise<Conglomerate> {
  return authorizedRequest<Conglomerate>(`/conglomerates/${conglomerateId}`, {
    method: "GET",
  })
}

export async function updateConglomerate(
  conglomerateId: string,
  payload: Partial<CreateConglomeratePayload>
): Promise<Conglomerate> {
  return authorizedRequest<Conglomerate>(`/conglomerates/${conglomerateId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteConglomerate(
  conglomerateId: string
): Promise<void> {
  return authorizedRequest<void>(`/conglomerates/${conglomerateId}`, {
    method: "DELETE",
  })
}

export async function listConglomerateEstablishments(
  conglomerateId: string
): Promise<Establishment[]> {
  return authorizedRequest<Establishment[]>(
    `/conglomerates/${conglomerateId}/establishments`,
    { method: "GET" }
  )
}

export async function createEstablishment(
  conglomerateId: string,
  payload: CreateEstablishmentPayload
): Promise<Establishment> {
  return authorizedRequest<Establishment>(
    `/conglomerates/${conglomerateId}/establishments`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}

export async function lookupCompanyByCnpj(cnpj: string): Promise<CnpjLookupResult> {
  return authorizedRequest<CnpjLookupResult>(`/lookups/cnpj/${cnpj}`, {
    method: "GET",
  })
}

export async function lookupAddressByCep(cep: string): Promise<CepLookupResult> {
  return authorizedRequest<CepLookupResult>(`/lookups/cep/${cep}`, {
    method: "GET",
  })
}

export async function listProjectDataSources(projectId: string): Promise<DataSource[]> {
  return authorizedRequest<DataSource[]>(`/projects/${projectId}/data-sources`, {
    method: "GET",
  })
}

export async function createProjectDataSource(
  projectId: string,
  payload: DataSourcePayload
): Promise<DataSource> {
  return authorizedRequest<DataSource>(`/projects/${projectId}/data-sources`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateDataSource(
  dataSourceId: string,
  payload: DataSourcePayload
): Promise<DataSource> {
  return authorizedRequest<DataSource>(`/data-sources/${dataSourceId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteDataSource(dataSourceId: string): Promise<void> {
  return authorizedRequest<void>(`/data-sources/${dataSourceId}`, {
    method: "DELETE",
  })
}

export async function listProjectExtractions(projectId: string): Promise<ProjectExtraction[]> {
  return authorizedRequest<ProjectExtraction[]>(`/projects/${projectId}/extractions`, {
    method: "GET",
  })
}

export async function listProjectExtractionTemplates(
  projectId: string
): Promise<CompetitorExtractionTemplate[]> {
  return authorizedRequest<CompetitorExtractionTemplate[]>(
    `/projects/${projectId}/extraction-templates`,
    {
      method: "GET",
    }
  )
}

export async function createProjectExtraction(
  projectId: string,
  payload: CreateProjectExtractionPayload
): Promise<ProjectExtraction> {
  return authorizedRequest<ProjectExtraction>(`/projects/${projectId}/extractions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function startProjectExtraction(projectExtractionId: string): Promise<void> {
  return authorizedRequest<void>(`/project-extractions/${projectExtractionId}/start`, {
    method: "POST",
  })
}

export async function testDataSourceConnection(
  dataSourceId: string
): Promise<DataSourceConnectionTestResponse> {
  return authorizedRequest<DataSourceConnectionTestResponse>(
    `/data-sources/${dataSourceId}/test-connection`,
    {
      method: "POST",
    }
  )
}
