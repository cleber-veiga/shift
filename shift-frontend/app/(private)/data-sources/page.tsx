
"use client"

import { MorphLoader } from "@/components/ui/morph-loader"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SchemaTreeView } from "@/components/concorrentes/schema-tree-view"
import { useDashboard } from "@/lib/context/dashboard-context"
import {
  createProjectDataSource,
  deleteDataSource,
  executeWorkspaceSchemaCatalog,
  listProjectDataSources,
  listWorkspaceSchemaCatalogs,
  testDataSourceConnection,
  updateDataSource,
  type DataSource,
  type DataSourcePayload,
  type DataSourceType,
  type SchemaTable,
} from "@/lib/auth"
import { Database, FileSpreadsheet, FileText, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DATA_SOURCE_TYPE_OPTIONS: Array<{ value: DataSourceType; label: string }> = [
  { value: "POSTGRESQL", label: "PostgreSQL" },
  { value: "MYSQL", label: "MySQL" },
  { value: "SQLSERVER", label: "SQL Server" },
  { value: "ORACLE", label: "Oracle" },
  { value: "FIREBIRD", label: "Firebird" },
  { value: "SQLITE", label: "SQLite" },
  { value: "SNOWFLAKE", label: "Snowflake" },
  { value: "CSV", label: "CSV" },
  { value: "XLSX", label: "XLSX" },
]

const DATABASE_TYPES: DataSourceType[] = [
  "POSTGRESQL",
  "MYSQL",
  "SQLSERVER",
  "ORACLE",
  "FIREBIRD",
  "SQLITE",
  "SNOWFLAKE",
]

const FILE_TYPES: DataSourceType[] = ["CSV", "XLSX"]

type FormState = {
  name: string
  source_type: DataSourceType
  is_active: boolean
  database: {
    connection_url: string
    host: string
    port: string
    database: string
    schema_name: string
    username: string
    password: string
    ssl_mode: string
    sqlite_path: string
    account: string
    warehouse: string
    role: string
    service_name: string
    sid: string
    dsn: string
    charset: string
    client_library_path: string
    odbc_driver: string
  }
  file: {
    file_name: string
    file_path: string
    storage_key: string
    delimiter: string
    encoding: string
    sheet_name: string
    has_header: boolean
  }
}

function emptyFormState(): FormState {
  return {
    name: "",
    source_type: "POSTGRESQL",
    is_active: true,
    database: {
      connection_url: "",
      host: "",
      port: "",
      database: "",
      schema_name: "",
      username: "",
      password: "",
      ssl_mode: "",
      sqlite_path: "",
      account: "",
      warehouse: "",
      role: "",
      service_name: "",
      sid: "",
      dsn: "",
      charset: "UTF8",
      client_library_path: "",
      odbc_driver: "ODBC Driver 18 for SQL Server",
    },
    file: {
      file_name: "",
      file_path: "",
      storage_key: "",
      delimiter: ",",
      encoding: "UTF-8",
      sheet_name: "",
      has_header: true,
    },
  }
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function toBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  return fallback
}

function buildFormStateFromDataSource(source: DataSource): FormState {
  const connection = source.connection_config ?? {}
  const file = source.file_config ?? {}

  return {
    name: source.name,
    source_type: source.source_type,
    is_active: source.is_active,
    database: {
      connection_url: toStringValue(connection.connection_url),
      host: toStringValue(connection.host),
      port: toStringValue(connection.port),
      database: toStringValue(connection.database),
      schema_name: toStringValue(connection.schema_name),
      username: toStringValue(connection.username),
      password: "",
      ssl_mode: toStringValue(connection.ssl_mode),
      sqlite_path: toStringValue(connection.sqlite_path),
      account: toStringValue(connection.account),
      warehouse: toStringValue(connection.warehouse),
      role: toStringValue(connection.role),
      service_name: toStringValue(connection.service_name),
      sid: toStringValue(connection.sid),
      dsn: toStringValue(connection.dsn),
      charset: toStringValue(connection.charset) || "UTF8",
      client_library_path: toStringValue(connection.client_library_path),
      odbc_driver: toStringValue(connection.odbc_driver) || "ODBC Driver 18 for SQL Server",
    },
    file: {
      file_name: toStringValue(file.file_name),
      file_path: toStringValue(file.file_path),
      storage_key: toStringValue(file.storage_key),
      delimiter: toStringValue(file.delimiter) || ",",
      encoding: toStringValue(file.encoding) || "UTF-8",
      sheet_name: toStringValue(file.sheet_name),
      has_header: toBooleanValue(file.has_header, true),
    },
  }
}

function normalizeValue(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formStateToPayload(form: FormState): DataSourcePayload {
  const payload: DataSourcePayload = {
    name: form.name.trim(),
    source_type: form.source_type,
    is_active: form.is_active,
  }

  if (DATABASE_TYPES.includes(form.source_type)) {
    payload.database = {
      connection_url: normalizeValue(form.database.connection_url),
      host: normalizeValue(form.database.host),
      port: normalizeValue(form.database.port) ? Number.parseInt(form.database.port, 10) : null,
      database: normalizeValue(form.database.database),
      schema_name: normalizeValue(form.database.schema_name),
      username: normalizeValue(form.database.username),
      password: normalizeValue(form.database.password),
      ssl_mode: normalizeValue(form.database.ssl_mode),
      sqlite_path: normalizeValue(form.database.sqlite_path),
      account: normalizeValue(form.database.account),
      warehouse: normalizeValue(form.database.warehouse),
      role: normalizeValue(form.database.role),
      service_name: normalizeValue(form.database.service_name),
      sid: normalizeValue(form.database.sid),
      dsn: normalizeValue(form.database.dsn),
      charset: normalizeValue(form.database.charset),
      client_library_path: normalizeValue(form.database.client_library_path),
      odbc_driver: normalizeValue(form.database.odbc_driver),
    }
  }

  if (FILE_TYPES.includes(form.source_type)) {
    payload.file = {
      file_name: form.file.file_name.trim(),
      file_path: normalizeValue(form.file.file_path),
      storage_key: normalizeValue(form.file.storage_key),
      delimiter: normalizeValue(form.file.delimiter),
      encoding: normalizeValue(form.file.encoding),
      sheet_name: normalizeValue(form.file.sheet_name),
      has_header: form.file.has_header,
    }
  }

  return payload
}

function typeLabel(type: DataSourceType): string {
  return DATA_SOURCE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "number" | "password"
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-7 w-full rounded-md border border-border bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-primary/20"
      />
    </label>
  )
}

export default function DataSourcesPage() {
  const { selectedProject, selectedWorkspace, selectedOrgId, workspacesByOrg } = useDashboard()

  const [items, setItems] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")
  const [connectionTestMessage, setConnectionTestMessage] = useState("")
  const [connectionTestSuccess, setConnectionTestSuccess] = useState(false)
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | "new">("new")
  const [form, setForm] = useState<FormState>(emptyFormState())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [schemaTables, setSchemaTables] = useState<SchemaTable[]>([])
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaError, setSchemaError] = useState("")
  const [schemaHasCatalog, setSchemaHasCatalog] = useState(false)
  const [schemaFetching, setSchemaFetching] = useState(false)
  const [schemaSearch, setSchemaSearch] = useState("")

  const isEditing = selectedDataSourceId !== "new"
  const selectedItem = useMemo(
    () => (isEditing ? items.find((item) => item.id === selectedDataSourceId) ?? null : null),
    [isEditing, items, selectedDataSourceId]
  )

  const workspaceId = selectedProject?.workspace_id ?? null
  const workspaceFromProject = useMemo(() => {
    if (!selectedOrgId || !workspaceId) return null
    return (workspacesByOrg[selectedOrgId] ?? []).find((ws) => ws.id === workspaceId) ?? null
  }, [selectedOrgId, workspaceId, workspacesByOrg])

  const effectiveWorkspace = useMemo(() => {
    if (!workspaceId) return null
    if (selectedWorkspace?.id === workspaceId) return selectedWorkspace
    return workspaceFromProject
  }, [selectedWorkspace, workspaceFromProject, workspaceId])

  const workspaceErpId = effectiveWorkspace?.erp_id ?? null
  const schemaIsDatabase = selectedItem ? DATABASE_TYPES.includes(selectedItem.source_type) : false
  const selectedItemId = selectedItem?.id ?? null
  const selectedItemType = selectedItem?.source_type ?? null

  const filteredSchemaTables = useMemo(() => {
    const query = schemaSearch.trim().toLowerCase()
    if (!query) return schemaTables
    return schemaTables.filter((table) => {
      const schemaName = table.schema_name ? table.schema_name.toLowerCase() : ""
      return schemaName.includes(query) || table.table_name.toLowerCase().includes(query)
    })
  }, [schemaSearch, schemaTables])

  useEffect(() => {
    async function loadSchema() {
      setSchemaError("")
      setSchemaTables([])
      setSchemaHasCatalog(false)

      if (!workspaceId || !selectedItemId || !selectedItemType) return
      if (!schemaIsDatabase) return
      if (!workspaceErpId) return

      setSchemaLoading(true)
      try {
        const catalogs = await listWorkspaceSchemaCatalogs(workspaceId, {
          database_type: selectedItemType,
        })
        const current = catalogs[0]
        if (!current) {
          setSchemaTables([])
          setSchemaHasCatalog(false)
          return
        }
        setSchemaTables(current.schema_definition ?? [])
        setSchemaHasCatalog(true)
      } catch (err) {
        setSchemaError(err instanceof Error ? err.message : "Falha ao carregar schema do workspace.")
      } finally {
        setSchemaLoading(false)
      }
    }

    void loadSchema()
    setSchemaSearch("")
  }, [workspaceId, workspaceErpId, selectedItemId, selectedItemType, schemaIsDatabase])

  async function handleFetchSchema() {
    setSchemaError("")
    if (!workspaceId) {
      setSchemaError("Workspace nao selecionado.")
      return
    }
    if (!workspaceErpId) {
      setSchemaError("Workspace nao possui ERP configurado.")
      return
    }
    if (!selectedItem) {
      setSchemaError("Selecione uma fonte de dados.")
      return
    }
    if (!schemaIsDatabase) {
      setSchemaError("Schema nao disponivel para fontes de arquivo.")
      return
    }

    setSchemaFetching(true)
    try {
      const response = await executeWorkspaceSchemaCatalog(workspaceId, {
        data_source_id: selectedItem.id,
        save_result: true,
      })
      if (!response.success) {
        setSchemaError(response.message)
        return
      }
      setSchemaTables(response.tables ?? [])
      setSchemaHasCatalog(true)
      setSaveSuccess("Schema capturado com sucesso.")
    } catch (err) {
      setSchemaError(err instanceof Error ? err.message : "Falha ao buscar schema.")
    } finally {
      setSchemaFetching(false)
    }
  }

  async function loadDataSources(projectId: string) {
    setLoading(true)
    setError("")

    try {
      const response = await listProjectDataSources(projectId)
      setItems(response)

      if (response.length > 0) {
        setSelectedDataSourceId(response[0].id)
        setForm(buildFormStateFromDataSource(response[0]))
      } else {
        setSelectedDataSourceId("new")
        setForm(emptyFormState())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar fontes de dados.")
      setItems([])
      setSelectedDataSourceId("new")
      setForm(emptyFormState())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSaveError("")
    setSaveSuccess("")
    setConnectionTestMessage("")
    setConnectionTestSuccess(false)

    if (selectedProject?.id) {
      loadDataSources(selectedProject.id)
      return
    }

    setItems([])
    setSelectedDataSourceId("new")
    setForm(emptyFormState())
  }, [selectedProject?.id])

  function handleSelectNew() {
    setSelectedDataSourceId("new")
    setForm(emptyFormState())
    setSaveError("")
    setSaveSuccess("")
    setConnectionTestMessage("")
    setConnectionTestSuccess(false)
  }

  function handleSelectExisting(item: DataSource) {
    setSelectedDataSourceId(item.id)
    setForm(buildFormStateFromDataSource(item))
    setSaveError("")
    setSaveSuccess("")
    setConnectionTestMessage("")
    setConnectionTestSuccess(false)
  }

  async function refreshAndSelect(idToSelect?: string | "new") {
    if (!selectedProject?.id) return

    const response = await listProjectDataSources(selectedProject.id)
    setItems(response)

    if (idToSelect === "new") {
      setSelectedDataSourceId("new")
      setForm(emptyFormState())
      return
    }

    if (idToSelect) {
      const found = response.find((item) => item.id === idToSelect)
      if (found) {
        setSelectedDataSourceId(found.id)
        setForm(buildFormStateFromDataSource(found))
        return
      }
    }

    if (response.length > 0) {
      setSelectedDataSourceId(response[0].id)
      setForm(buildFormStateFromDataSource(response[0]))
      return
    }

    setSelectedDataSourceId("new")
    setForm(emptyFormState())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedProject?.id) {
      setSaveError("Selecione um projeto antes de salvar a fonte de dados.")
      return
    }

    setSaving(true)
    setSaveError("")
    setSaveSuccess("")

    try {
      const payload = formStateToPayload(form)

      if (selectedDataSourceId === "new") {
        const created = await createProjectDataSource(selectedProject.id, payload)
        await refreshAndSelect(created.id)
        setSaveSuccess("Fonte de dados criada com sucesso.")
      } else {
        const updated = await updateDataSource(selectedDataSourceId, payload)
        await refreshAndSelect(updated.id)
        setSaveSuccess("Fonte de dados atualizada com sucesso.")
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao salvar fonte de dados.")
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    if (!selectedItem) return
    setSaveError("")
    setSaveSuccess("")
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!selectedItem) return
    setDeleting(true)
    setSaveError("")
    setSaveSuccess("")

    try {
      await deleteDataSource(selectedItem.id)
      await refreshAndSelect()
      setDeleteDialogOpen(false)
      setSaveSuccess("Fonte de dados removida com sucesso.")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao remover fonte de dados.")
    } finally {
      setDeleting(false)
    }
  }

  async function handleTestConnection() {
    if (!selectedItem) return

    setTestingConnection(true)
    setConnectionTestMessage("")
    setConnectionTestSuccess(false)

    try {
      const result = await testDataSourceConnection(selectedItem.id)
      const latencySuffix = typeof result.latency_ms === "number" ? ` (${result.latency_ms}ms)` : ""
      setConnectionTestSuccess(result.success)
      setConnectionTestMessage(`${result.message}${latencySuffix}`)
    } catch (err) {
      setConnectionTestSuccess(false)
      setConnectionTestMessage(
        err instanceof Error ? err.message : "Falha ao testar conexao da fonte de dados."
      )
    } finally {
      setTestingConnection(false)
    }
  }

  const isDatabase = DATABASE_TYPES.includes(form.source_type)
  const isFile = FILE_TYPES.includes(form.source_type)

  if (!selectedProject) {
    return (
      <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 overflow-hidden bg-background">
        <aside className="w-[320px] shrink-0 border-r border-border p-6 bg-background/50">
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-xs text-muted-foreground">Selecione um projeto</p>
          </div>
        </aside>
        <section className="flex-1 bg-muted/20 p-6 sm:p-10 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fontes de Dados</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Selecione um projeto no menu lateral para gerenciar as fontes de dados vinculadas a ele.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 overflow-hidden bg-background">
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover fonte de dados"
        description={
          selectedItem
            ? `Deseja remover a fonte de dados "${selectedItem.name}" deste projeto?`
            : "Deseja remover esta fonte de dados?"
        }
        confirmText="Remover"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
      <aside className="w-[260px] shrink-0 border-r border-border p-3 bg-background/50 overflow-y-auto">
        <button
          type="button"
          onClick={handleSelectNew}
          className={`flex h-8 w-full items-center gap-2 rounded-md border px-3 text-[11px] font-semibold transition-all shadow-sm ${
            selectedDataSourceId === "new" 
              ? "border-primary bg-primary/5 text-primary" 
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          <Plus className="size-3.5" />
          Nova fonte de dados
        </button>

        <div className="mt-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <MorphLoader className="size-6 morph-muted" />
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-[10px] text-muted-foreground">
                Nenhuma fonte cadastrada.
              </p>
            </div>
          ) : null}

          {!loading
            ? items.map((item) => {
                const active = item.id === selectedDataSourceId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectExisting(item)}
                    className={`group w-full rounded-lg border p-2 text-left transition-all ${
                      active 
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/10" 
                        : "border-transparent hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex size-7 shrink-0 items-center justify-center rounded border border-border bg-background shadow-sm transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {FILE_TYPES.includes(item.source_type) ? (
                          item.source_type === "XLSX" ? (
                            <FileSpreadsheet className="size-3.5" />
                          ) : (
                            <FileText className="size-3.5" />
                          )
                        ) : (
                          <Database className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[11px] font-bold leading-none ${active ? "text-primary" : "text-foreground"}`}>
                          {item.name}
                        </p>
                        <p className="mt-1 text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{typeLabel(item.source_type)}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            : null}
        </div>
      </aside>

      <section className="flex-1 overflow-hidden bg-muted/20 p-3 sm:p-4">
        <div className="mx-auto max-w-7xl h-full">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden h-full">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] divide-y divide-border lg:divide-y-0 lg:divide-x h-full">
              <div className="p-4 sm:p-6 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledInput
                      label="Nome"
                      value={form.name}
                      onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                      required
                    />

                    <label className="space-y-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Tipo *</span>
                      <Select
                        value={form.source_type}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            source_type: value as DataSourceType,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATA_SOURCE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  </div>

                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      className="size-4 rounded border-border"
                    />
                    Fonte ativa
                  </label>

                {isDatabase ? (
                  <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Configuracao de Banco
                    </h2>

                    {form.source_type === "SQLITE" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <LabeledInput
                          label="Caminho do SQLite"
                          value={form.database.sqlite_path}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, sqlite_path: value },
                            }))
                          }
                          required
                        />
                        <LabeledInput
                          label="Connection URL"
                          value={form.database.connection_url}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, connection_url: value },
                            }))
                          }
                          placeholder="Opcional"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <LabeledInput
                            label="Host"
                            value={form.database.host}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, host: value },
                              }))
                            }
                            required={form.source_type !== "FIREBIRD"}
                          />
                          <LabeledInput
                            label="Porta"
                            type="number"
                            value={form.database.port}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, port: value },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <LabeledInput
                            label="Database"
                            value={form.database.database}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, database: value },
                              }))
                            }
                            required={form.source_type !== "FIREBIRD"}
                          />
                          <LabeledInput
                            label="Schema"
                            value={form.database.schema_name}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, schema_name: value },
                              }))
                            }
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <LabeledInput
                            label="Usuario"
                            value={form.database.username}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, username: value },
                              }))
                            }
                            required
                          />
                          <LabeledInput
                            label="Senha"
                            type="password"
                            value={form.database.password}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, password: value },
                              }))
                            }
                            required
                          />
                        </div>

                        <p className="-mt-1 text-[10px] text-muted-foreground">
                          Em edicoes, informe a senha novamente para salvar alteracoes.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <LabeledInput
                            label="Connection URL"
                            value={form.database.connection_url}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, connection_url: value },
                              }))
                            }
                            placeholder="Opcional"
                          />
                          <LabeledInput
                            label="SSL Mode"
                            value={form.database.ssl_mode}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                database: { ...current.database, ssl_mode: value },
                              }))
                            }
                            placeholder="Opcional"
                          />
                        </div>
                      </>
                    )}

                    {form.source_type === "FIREBIRD" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <LabeledInput
                          label="DSN"
                          value={form.database.dsn}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, dsn: value },
                            }))
                          }
                        />
                        <LabeledInput
                          label="Charset"
                          value={form.database.charset}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, charset: value },
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    {form.source_type === "ORACLE" ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <LabeledInput
                          label="Service Name"
                          value={form.database.service_name}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, service_name: value },
                            }))
                          }
                        />
                        <LabeledInput
                          label="SID"
                          value={form.database.sid}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, sid: value },
                            }))
                          }
                        />
                        <LabeledInput
                          label="Oracle Client Path"
                          value={form.database.client_library_path}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, client_library_path: value },
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    {form.source_type === "SQLSERVER" ? (
                      <LabeledInput
                        label="ODBC Driver"
                        value={form.database.odbc_driver}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            database: { ...current.database, odbc_driver: value },
                          }))
                        }
                      />
                    ) : null}

                    {form.source_type === "SNOWFLAKE" ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <LabeledInput
                          label="Account"
                          value={form.database.account}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, account: value },
                            }))
                          }
                        />
                        <LabeledInput
                          label="Warehouse"
                          value={form.database.warehouse}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, warehouse: value },
                            }))
                          }
                        />
                        <LabeledInput
                          label="Role"
                          value={form.database.role}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              database: { ...current.database, role: value },
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

            {isFile ? (
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Configuracao de Arquivo
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="Nome do arquivo"
                    value={form.file.file_name}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, file_name: value },
                      }))
                    }
                    required
                  />
                  <LabeledInput
                    label="Delimiter"
                    value={form.file.delimiter}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, delimiter: value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="File path"
                    value={form.file.file_path}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, file_path: value },
                      }))
                    }
                    placeholder="Caminho local ou de rede"
                  />
                  <LabeledInput
                    label="Storage key"
                    value={form.file.storage_key}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, storage_key: value },
                      }))
                    }
                    placeholder="S3/GCS/Azure etc"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledInput
                    label="Encoding"
                    value={form.file.encoding}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, encoding: value },
                      }))
                    }
                  />
                  <LabeledInput
                    label="Sheet name"
                    value={form.file.sheet_name}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, sheet_name: value },
                      }))
                    }
                    placeholder={form.source_type === "XLSX" ? "Opcional para XLSX" : "Nao aplicavel para CSV"}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={form.file.has_header}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        file: { ...current.file, has_header: event.target.checked },
                      }))
                    }
                    className="size-4 rounded border-border"
                  />
                  Arquivo possui cabecalho
                </label>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
                {error}
              </p>
            ) : null}

            {saveError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
                {saveError}
              </p>
            ) : null}

            {saveSuccess ? (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2 py-1.5 text-[11px] text-emerald-600">
                {saveSuccess}
              </p>
            ) : null}

            {connectionTestMessage ? (
              <p
                className={`rounded-md border px-2 py-1.5 text-[11px] ${
                  connectionTestSuccess
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600"
                    : "border-destructive/40 bg-destructive/5 text-destructive"
                }`}
              >
                {connectionTestMessage}
              </p>
            ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-7 items-center rounded-md bg-foreground px-3 text-[11px] font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : isEditing ? "Salvar alteracoes" : "Criar fonte"}
                  </button>

                  {isEditing && isDatabase ? (
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection || saving}
                      className="inline-flex h-7 items-center rounded-md border border-border px-3 text-[11px] font-semibold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {testingConnection ? "Testando..." : "Testar conexao"}
                    </button>
                  ) : null}

                  {isEditing ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-destructive/40 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      {deleting ? "Removendo..." : "Excluir"}
                    </button>
                  ) : null}
                </div>
              </form>
              </div>

              <div className="p-4 sm:p-6 flex flex-col min-h-0 overflow-hidden">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">Schema do Banco</h2>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {workspaceErpId
                        ? `Workspace: ${effectiveWorkspace?.name ?? "-"} | DB: ${selectedItem?.source_type ?? "-"}`
                        : "Defina um ERP no workspace para vincular o schema."}
                    </p>
                  </div>
                  {schemaIsDatabase && isEditing && !schemaHasCatalog ? (
                    <button
                      type="button"
                      onClick={handleFetchSchema}
                      disabled={schemaFetching || !selectedItem || !workspaceId || !workspaceErpId}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-md bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                    >
                      {schemaFetching ? <MorphLoader className="size-3" /> : null}
                      Buscar
                    </button>
                  ) : null}
                </div>

                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={schemaSearch}
                      onChange={(e) => setSchemaSearch(e.target.value)}
                      placeholder="Buscar tabela..."
                      disabled={!schemaHasCatalog || schemaLoading}
                      className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-[11px] outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                {schemaError ? (
                  <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                    {schemaError}
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-hidden">
                  {!isEditing ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                      <p className="text-[11px] text-muted-foreground">Salve a fonte de dados para buscar o schema.</p>
                    </div>
                  ) : !schemaIsDatabase ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                      <p className="text-[11px] text-muted-foreground">Schema nao disponivel para fontes de arquivo.</p>
                    </div>
                  ) : !workspaceErpId ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                      <p className="text-[11px] text-muted-foreground">Workspace nao possui ERP configurado.</p>
                    </div>
                  ) : schemaLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <MorphLoader className="size-6 morph-muted" />
                    </div>
                  ) : schemaHasCatalog ? (
                    <SchemaTreeView tables={filteredSchemaTables} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                      <p className="text-[11px] text-muted-foreground">
                        Nenhum schema cadastrado para este workspace e tipo de banco.
                      </p>
                      <button
                        type="button"
                        onClick={handleFetchSchema}
                        disabled={schemaFetching || !selectedItem || !workspaceId || !workspaceErpId}
                        className="mt-3 inline-flex items-center gap-2 h-8 px-4 rounded-md border border-border bg-background text-[11px] font-bold hover:bg-accent transition-all disabled:opacity-50"
                      >
                        {schemaFetching ? <MorphLoader className="size-3" /> : null}
                        Buscar schema
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  </div>
)
}
