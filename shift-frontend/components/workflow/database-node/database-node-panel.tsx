"use client"

import { useEffect, useMemo, useState } from "react"

import {
  askDatabaseAssistant,
  type DatabaseAssistantResponse,
  type DatabaseBindingReference,
  type DatabaseConnection,
  defaultDatabaseConnectionPolicy,
  type DatabaseManualSelectDefinition,
  previewDatabaseNode,
  type DatabasePreviewResponse,
  type DatabaseQueryMode,
  type QueryRiskLevel,
} from "@/lib/database-node"
import type { DataSourceDatabaseInput, DataSourceType } from "@/lib/auth"

export type DatabaseNodeConfig = {
  binding: DatabaseBindingReference
  mode: DatabaseQueryMode
  sql?: string | null
  manual_select?: DatabaseManualSelectDefinition | null
  shell_mode?: boolean
  enforce_rebind?: boolean
  template_id?: string | null
}

type DatabaseNodePanelProps = {
  workspaceId: string
  projectId?: string
  availableConnections: DatabaseConnection[]
  value: DatabaseNodeConfig
  onChange: (next: DatabaseNodeConfig) => void
}

const QUERY_MODES: Array<{ value: DatabaseQueryMode; label: string; description: string }> = [
  {
    value: "raw_sql",
    label: "SQL bruto",
    description: "Controle total para consultas complexas e expressões específicas do dialeto.",
  },
  {
    value: "manual_select",
    label: "Seleção manual",
    description: "Escolha tabela, colunas, filtros, ordenação e limite sem digitar SQL livre.",
  },
  {
    value: "visual_builder",
    label: "Construção manual",
    description: "Modo visual para montar a consulta com foco em joins e filtros reutilizáveis.",
  },
  {
    value: "template",
    label: "Template de tabela",
    description: "Reaproveite um modelo de escrita/leitura alinhado ao schema de destino.",
  },
]

const RISK_COLORS: Record<QueryRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  blocked: "bg-red-100 text-red-800 border-red-200",
}

function emptyDatabaseInput(): DataSourceDatabaseInput {
  return {
    host: "",
    port: null,
    database: "",
    schema_name: "",
    username: "",
    password: "",
    ssl_mode: "prefer",
  }
}

function ensureManualSelect(input?: DatabaseManualSelectDefinition | null): DatabaseManualSelectDefinition {
  return (
    input ?? {
      base_schema_name: null,
      base_table_name: "",
      base_alias: "",
      columns: [],
      joins: [],
      filters: [],
      sorts: [],
      limit: 100,
      offset: 0,
      distinct: false,
    }
  )
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function DatabaseNodePanel({
  workspaceId,
  projectId,
  availableConnections,
  value,
  onChange,
}: DatabaseNodePanelProps) {
  const [preview, setPreview] = useState<DatabasePreviewResponse | null>(null)
  const [assistant, setAssistant] = useState<DatabaseAssistantResponse | null>(null)
  const [assistantPrompt, setAssistantPrompt] = useState("")
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingAssistant, setLoadingAssistant] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedConnection = useMemo(
    () => availableConnections.find((item) => item.id === value.binding.connection_id) ?? null,
    [availableConnections, value.binding.connection_id]
  )

  const effectiveMode = value.mode ?? "raw_sql"
  const manualSelect = ensureManualSelect(value.manual_select)
  const manualEntryEnabled = value.binding.allow_manual_entry ?? true
  const bindingRequirement = value.binding.requirement ?? "optional"
  const inlineType = value.binding.source_type ?? selectedConnection?.source_type ?? "POSTGRESQL"
  const inlineDatabase = value.binding.database ?? emptyDatabaseInput()

  useEffect(() => {
    if (selectedConnection && !value.binding.connection_id) {
      onChange({
        ...value,
        binding: {
          ...value.binding,
          connection_id: selectedConnection.id,
        },
      })
    }
  }, [onChange, selectedConnection, value])

  function updateBinding(partial: Partial<DatabaseBindingReference>) {
    onChange({
      ...value,
      binding: {
        ...value.binding,
        ...partial,
      },
    })
  }

  function updateManualSelect(partial: Partial<DatabaseManualSelectDefinition>) {
    onChange({
      ...value,
      manual_select: {
        ...manualSelect,
        ...partial,
      },
    })
  }

  async function handlePreview() {
    setLoadingPreview(true)
    setErrorMessage(null)
    try {
      const response = await previewDatabaseNode({
        binding: value.binding,
        mode: effectiveMode,
        sql: value.sql ?? undefined,
        manual_select:
          effectiveMode === "manual_select" || effectiveMode === "visual_builder"
            ? manualSelect
            : undefined,
        max_rows: 50,
      })
      setPreview(response)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao pré-visualizar.")
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleAssistant() {
    setLoadingAssistant(true)
    setErrorMessage(null)
    try {
      const response = await askDatabaseAssistant({
        binding: value.binding,
        user_prompt: assistantPrompt || "Sugira uma consulta segura e performática para este binding.",
        mode: effectiveMode,
        current_sql: value.sql ?? undefined,
        manual_select:
          effectiveMode === "manual_select" || effectiveMode === "visual_builder"
            ? manualSelect
            : undefined,
        max_schema_tables: 40,
      })
      setAssistant(response)
      if (response.suggested_sql) {
        onChange({
          ...value,
          sql: response.suggested_sql,
        })
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao consultar o copiloto SQL.")
    } finally {
      setLoadingAssistant(false)
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-neutral-900">Nó de banco avançado</h3>
        <p className="text-sm leading-6 text-neutral-600">
          Este painel foi desenhado para uma plataforma ETL. O foco não é apenas consultar dados,
          mas governar conexões, reaproveitar schemas, forçar rebinding em cascas e usar IA com
          contexto real de banco.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-800">Conexão do registry</label>
          <select
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            value={value.binding.connection_id ?? ""}
            onChange={(event) => {
              const nextId = event.target.value || null
              const nextConnection = availableConnections.find((item) => item.id === nextId) ?? null
              updateBinding({
                connection_id: nextId,
                source_type: nextConnection ? null : value.binding.source_type ?? null,
                database: nextConnection ? null : value.binding.database ?? null,
              })
            }}
          >
            <option value="">Selecionar manualmente no runtime</option>
            {availableConnections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name} · {connection.source_type} · {connection.scope}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500">
            Projeto: {projectId ?? "não informado"} · Workspace: {workspaceId}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-800">Requisito do binding</label>
          <select
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            value={bindingRequirement}
            onChange={(event) => updateBinding({ requirement: event.target.value as DatabaseBindingReference["requirement"] })}
          >
            <option value="optional">Opcional</option>
            <option value="required">Obrigatório</option>
            <option value="always_rebind">Sempre rebinding na casca</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={manualEntryEnabled}
              onChange={(event) => updateBinding({ allow_manual_entry: event.target.checked })}
            />
            Permitir informar credenciais manualmente
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(value.binding.allow_public_test_connections ?? true)}
              onChange={(event) => updateBinding({ allow_public_test_connections: event.target.checked })}
            />
            Permitir conexões públicas de teste
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={Boolean(value.binding.persist_credentials_in_workflow ?? false)}
              onChange={(event) => updateBinding({ persist_credentials_in_workflow: event.target.checked })}
            />
            Persistir credenciais no workflow (não recomendado)
          </label>
        </div>
      </section>

      {manualEntryEnabled && !value.binding.connection_id ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-neutral-300 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-800">Tipo de banco</label>
              <select
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                value={inlineType}
                onChange={(event) => updateBinding({ source_type: event.target.value as DataSourceType })}
              >
                {[
                  "POSTGRESQL",
                  "MYSQL",
                  "SQLSERVER",
                  "ORACLE",
                  "FIREBIRD",
                  "SQLITE",
                  "SNOWFLAKE",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Field
              label="Host"
              value={String(inlineDatabase.host ?? "")}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, host: next } })}
            />
            <Field
              label="Porta"
              value={inlineDatabase.port?.toString() ?? ""}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, port: parseNumber(next) } })}
            />
            <Field
              label="Database"
              value={String(inlineDatabase.database ?? "")}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, database: next } })}
            />
            <Field
              label="Schema"
              value={String(inlineDatabase.schema_name ?? "")}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, schema_name: next } })}
            />
            <Field
              label="Usuário"
              value={String(inlineDatabase.username ?? "")}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, username: next } })}
            />
            <Field
              label="Senha"
              type="password"
              value={String(inlineDatabase.password ?? "")}
              onChange={(next) => updateBinding({ database: { ...inlineDatabase, password: next } })}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <label className="text-sm font-medium text-neutral-800">Modo de construção</label>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {QUERY_MODES.map((mode) => {
              const active = mode.value === effectiveMode
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onChange({ ...value, mode: mode.value })}
                  className={[
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-blue-600 bg-blue-50 shadow-sm"
                      : "border-neutral-200 bg-white hover:border-neutral-300",
                  ].join(" ")}
                >
                  <div className="font-medium text-neutral-900">{mode.label}</div>
                  <div className="mt-1 text-xs leading-5 text-neutral-600">{mode.description}</div>
                </button>
              )
            })}
          </div>
        </div>

        {effectiveMode === "raw_sql" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800">SQL bruto</label>
            <textarea
              className="min-h-[220px] w-full rounded-2xl border border-neutral-300 px-4 py-3 font-mono text-sm"
              value={value.sql ?? ""}
              onChange={(event) => onChange({ ...value, sql: event.target.value })}
              placeholder="SELECT id, name FROM customers WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days' LIMIT 100"
            />
          </div>
        ) : null}

        {effectiveMode === "manual_select" || effectiveMode === "visual_builder" ? (
          <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Field
                label="Schema base"
                value={manualSelect.base_schema_name ?? ""}
                onChange={(next) => updateManualSelect({ base_schema_name: next || null })}
              />
              <Field
                label="Tabela base"
                value={manualSelect.base_table_name}
                onChange={(next) => updateManualSelect({ base_table_name: next })}
              />
              <Field
                label="Alias"
                value={manualSelect.base_alias ?? ""}
                onChange={(next) => updateManualSelect({ base_alias: next || null })}
              />
              <Field
                label="Limite"
                value={manualSelect.limit?.toString() ?? ""}
                onChange={(next) => updateManualSelect({ limit: parseNumber(next) })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-900">Colunas</h4>
                <button
                  type="button"
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium"
                  onClick={() =>
                    updateManualSelect({
                      columns: [
                        ...manualSelect.columns,
                        { schema_name: manualSelect.base_schema_name, table_name: manualSelect.base_table_name, column_name: "", alias: "" },
                      ],
                    })
                  }
                >
                  Adicionar coluna
                </button>
              </div>
              <div className="space-y-3">
                {manualSelect.columns.map((column, index) => (
                  <div key={`${column.table_name}-${index}`} className="grid gap-3 md:grid-cols-4">
                    <Field
                      label="Tabela"
                      value={column.table_name}
                      onChange={(next) => {
                        const nextColumns = [...manualSelect.columns]
                        nextColumns[index] = { ...column, table_name: next }
                        updateManualSelect({ columns: nextColumns })
                      }}
                    />
                    <Field
                      label="Coluna"
                      value={column.column_name}
                      onChange={(next) => {
                        const nextColumns = [...manualSelect.columns]
                        nextColumns[index] = { ...column, column_name: next }
                        updateManualSelect({ columns: nextColumns })
                      }}
                    />
                    <Field
                      label="Alias"
                      value={column.alias ?? ""}
                      onChange={(next) => {
                        const nextColumns = [...manualSelect.columns]
                        nextColumns[index] = { ...column, alias: next || null }
                        updateManualSelect({ columns: nextColumns })
                      }}
                    />
                    <button
                      type="button"
                      className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                      onClick={() => updateManualSelect({ columns: manualSelect.columns.filter((_, current) => current !== index) })}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-neutral-900">Copiloto SQL</h4>
              <p className="text-sm text-neutral-600">
                Usa contexto de schema e políticas do binding para sugerir SQL conservador.
              </p>
            </div>
          </div>
          <textarea
            className="min-h-[120px] w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm"
            value={assistantPrompt}
            onChange={(event) => setAssistantPrompt(event.target.value)}
            placeholder="Exemplo: monte uma consulta que busque pedidos pagos nos últimos 30 dias agrupados por cliente"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              onClick={handleAssistant}
              disabled={loadingAssistant}
            >
              {loadingAssistant ? "Gerando..." : "Pedir sugestão à IA"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
              onClick={handlePreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? "Pré-visualizando..." : "Pré-visualizar consulta"}
            </button>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {assistant ? <AssistantCard response={assistant} /> : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-neutral-900">Guard rails efetivos</h4>
            <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600">
              padrão recomendado
            </span>
          </div>
          <ul className="space-y-2 text-sm leading-6 text-neutral-700">
            <li>Leitura permitida, escrita desabilitada por padrão.</li>
            <li>Recomendado exigir LIMIT em consultas exploratórias.</li>
            <li>Update/Delete devem exigir WHERE quando habilitados.</li>
            <li>Credenciais não devem persistir em workflows-casca.</li>
            <li>Consultas de alto risco devem exigir aprovação manual.</li>
          </ul>
          <pre className="overflow-x-auto rounded-2xl bg-neutral-950 p-4 text-xs text-neutral-100">
            {JSON.stringify(defaultDatabaseConnectionPolicy, null, 2)}
          </pre>
        </div>
      </section>

      {preview ? (
        <section className="space-y-3 rounded-2xl border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-neutral-900">Pré-visualização</h4>
              <p className="text-sm text-neutral-600">{preview.message}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${RISK_COLORS[preview.risk_level]}`}>
              Risco {preview.risk_level}
            </span>
          </div>
          {preview.warnings.length ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {preview.warnings.join(" · ")}
            </div>
          ) : null}
          {preview.generated_sql ? (
            <pre className="overflow-x-auto rounded-2xl bg-neutral-950 p-4 text-xs text-neutral-100">
              {preview.generated_sql}
            </pre>
          ) : null}
          {preview.rows?.length ? <PreviewTable preview={preview} /> : null}
        </section>
      ) : null}
    </div>
  )
}

function AssistantCard({ response }: { response: DatabaseAssistantResponse }) {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-neutral-900">Resposta do copiloto</div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${RISK_COLORS[response.risk_level]}`}>
          Risco {response.risk_level}
        </span>
      </div>
      {response.explanation ? <p className="text-sm leading-6 text-neutral-700">{response.explanation}</p> : null}
      {response.warnings.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {response.warnings.join(" · ")}
        </div>
      ) : null}
      {response.suggested_sql ? (
        <pre className="overflow-x-auto rounded-2xl bg-neutral-950 p-4 text-xs text-neutral-100">
          {response.suggested_sql}
        </pre>
      ) : null}
    </div>
  )
}

function PreviewTable({ preview }: { preview: DatabasePreviewResponse }) {
  const columns = preview.columns ?? []
  const rows = preview.rows ?? []

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left font-medium text-neutral-700">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-4 py-3 align-top text-neutral-700">
                    {String(row[column] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-medium text-neutral-800">{label}</span>
      <input
        type={type}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
