"use client"

import { useMemo, useState } from "react"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
type SqlOperation = "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "CUSTOM"
type NoSqlDatabaseType = "mongodb" | "dynamodb" | "firestore" | "redis"
type NoSqlOperation = "find" | "insert" | "update" | "delete" | "upsert"

type CredentialOption = {
  id: string
  label: string
}

type WorkflowOption = {
  id: string
  label: string
}

type KeyValueItem = {
  key: string
  value: string
}

export type HttpRequestNodeConfig = {
  url: string
  method: HttpMethod
  credential_id: string
  headers: KeyValueItem[]
  query_params: KeyValueItem[]
  body: string
  timeout: number
  ignore_ssl_errors: boolean
  credentials?: CredentialOption[]
}

export type SqlDatabaseNodeConfig = {
  credential_id: string
  operation: SqlOperation
  query: string
  parameters: KeyValueItem[]
  credentials?: CredentialOption[]
}

export type EmailSenderNodeConfig = {
  credential_id: string
  to_address: string
  cc_address: string
  bcc_address: string
  subject: string
  body_text: string
  body_html: string
  attachments_keys: string[]
  credentials?: CredentialOption[]
}

export type ExecuteSubWorkflowNodeConfig = {
  workflow_id: string
  wait_for_response: boolean
  pass_all_data: boolean
  mapped_inputs: KeyValueItem[]
  workflows?: WorkflowOption[]
}

export type NoSQLDatabaseNodeConfig = {
  credential_id: string
  database_type: NoSqlDatabaseType
  operation: NoSqlOperation
  collection_name: string
  query: string
  document: string
  upsert_key: string
  timeout: number
  credentials?: CredentialOption[]
}

const fieldLabelClass = "text-sm font-medium text-foreground"
const fieldClass = "h-9 w-full rounded-md border border-gray-300 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
const textareaClass = "w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
const errorClass = "mt-1 text-xs text-red-500"

function PanelShell({ title, description, children, onSave, saveDisabled }: {
  title: string
  description: string
  children: React.ReactNode
  onSave: () => void
  saveDisabled?: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4">{children}</div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="inline-flex h-9 items-center rounded-md border border-border bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

function KeyValueEditor({
  label,
  items,
  onChange,
  addLabel,
}: {
  label: string
  items: KeyValueItem[]
  onChange: (next: KeyValueItem[]) => void
  addLabel?: string
}) {
  return (
    <div>
      <label className={fieldLabelClass}>{label}</label>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              className={fieldClass}
              placeholder="chave"
              value={item.key}
              onChange={(e) => {
                const next = [...items]
                next[index] = { ...next[index], key: e.target.value }
                onChange(next)
              }}
            />
            <input
              className={fieldClass}
              placeholder="valor"
              value={item.value}
              onChange={(e) => {
                const next = [...items]
                next[index] = { ...next[index], value: e.target.value }
                onChange(next)
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="h-9 rounded-md border border-gray-300 px-3 text-xs"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { key: "", value: "" }])}
        className="mt-2 h-8 rounded-md border border-gray-300 px-3 text-xs"
      >
        {addLabel ?? "+ Adicionar"}
      </button>
    </div>
  )
}

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [nextValue, setNextValue] = useState("")

  return (
    <div>
      <label className={fieldLabelClass}>{label}</label>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <input className={fieldClass} value={item} readOnly />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="h-9 rounded-md border border-gray-300 px-3 text-xs"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className={fieldClass}
          value={nextValue}
          placeholder={placeholder ?? "valor"}
          onChange={(e) => setNextValue(e.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = nextValue.trim()
            if (!trimmed) return
            onChange([...items, trimmed])
            setNextValue("")
          }}
          className="h-9 rounded-md border border-gray-300 px-3 text-xs"
        >
          + Adicionar
        </button>
      </div>
    </div>
  )
}

function isValidHttpUrl(value: string) {
  if (!value.trim()) return false
  const normalized = value.replace(/\{\{[^}]+\}\}/g, "placeholder")

  try {
    const url = new URL(normalized)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isValidEmailList(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const emails = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  if (emails.length === 0) return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.every((email) => emailRegex.test(email))
}

function isValidJson(value: string) {
  if (!value.trim()) return true

  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

const defaultCredentialOptions: CredentialOption[] = [
  { id: "cred-http-bearer", label: "HTTP Bearer" },
  { id: "cred-http-basic", label: "HTTP Basic" },
  { id: "cred-sql-main", label: "SQL Principal" },
  { id: "cred-email-sendgrid", label: "SendGrid" },
  { id: "cred-nosql-mongo", label: "MongoDB" },
]

const defaultWorkflowOptions: WorkflowOption[] = [
  { id: "workflow-cobranca", label: "workflow-cobranca" },
  { id: "workflow-envio-email", label: "workflow-envio-email" },
]

export function HttpRequestNodeConfigPanel({ nodeData, onUpdate }: PanelProps<HttpRequestNodeConfig>) {
  const [form, setForm] = useState<HttpRequestNodeConfig>(nodeData)
  const [testStatus, setTestStatus] = useState("")

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []
    if (!isValidHttpUrl(form.url)) result.push("URL invalida. Deve iniciar com http:// ou https://.")
    if (form.timeout < 1 || form.timeout > 300) result.push("Timeout deve estar entre 1 e 300 segundos.")
    if (!isValidJson(form.body)) result.push("Body deve ser JSON valido.")

    return result
  }, [form.body, form.timeout, form.url])

  return (
    <PanelShell
      title="Configuracao HTTP Request"
      description="Configure endpoint, autenticacao e parametros da chamada."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>URL</label>
        <input
          className={fieldClass}
          value={form.url}
          placeholder="https://api.exemplo.com/pedidos/{{pedido_id}}"
          onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={fieldLabelClass}>Metodo</label>
          <select
            className={fieldClass}
            value={form.method}
            onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value as HttpMethod }))}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Credencial</label>
          <select
            className={fieldClass}
            value={form.credential_id}
            onChange={(e) => setForm((prev) => ({ ...prev, credential_id: e.target.value }))}
          >
            <option value="">Selecionar...</option>
            {credentialOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Timeout (s)</label>
          <input
            type="number"
            min={1}
            max={300}
            className={fieldClass}
            value={form.timeout}
            onChange={(e) => setForm((prev) => ({ ...prev, timeout: Number(e.target.value) }))}
          />
        </div>
      </div>

      <KeyValueEditor
        label="Headers"
        items={form.headers}
        onChange={(headers) => setForm((prev) => ({ ...prev, headers }))}
        addLabel="+ Adicionar Header"
      />

      <KeyValueEditor
        label="Query Params"
        items={form.query_params}
        onChange={(query_params) => setForm((prev) => ({ ...prev, query_params }))}
        addLabel="+ Adicionar Parametro"
      />

      <div>
        <label className={fieldLabelClass}>Body (JSON)</label>
        <textarea
          rows={6}
          className={`${textareaClass} font-mono`}
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.ignore_ssl_errors}
          onChange={(e) => setForm((prev) => ({ ...prev, ignore_ssl_errors: e.target.checked }))}
        />
        Ignorar erros SSL
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-xs font-medium"
          onClick={() => {
            setTestStatus(errors.length === 0 ? "Teste enviado com sucesso." : "Corrija os erros antes de testar.")
          }}
        >
          Testar Requisicao
        </button>
        {testStatus ? <span className="text-xs text-muted-foreground">{testStatus}</span> : null}
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function SqlDatabaseNodeConfigPanel({ nodeData, onUpdate }: PanelProps<SqlDatabaseNodeConfig>) {
  const [form, setForm] = useState<SqlDatabaseNodeConfig>(nodeData)
  const [validateStatus, setValidateStatus] = useState("")

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.query.trim()) result.push("Query nao pode estar vazia.")

    return result
  }, [form.query])

  return (
    <PanelShell
      title="Configuracao SQL Database"
      description="Defina operacao, query e parametros bind."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Credencial</label>
          <select
            className={fieldClass}
            value={form.credential_id}
            onChange={(e) => setForm((prev) => ({ ...prev, credential_id: e.target.value }))}
          >
            <option value="">Selecionar...</option>
            {credentialOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Operacao</label>
          <select
            className={fieldClass}
            value={form.operation}
            onChange={(e) => setForm((prev) => ({ ...prev, operation: e.target.value as SqlOperation }))}
          >
            <option value="SELECT">SELECT</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Query SQL</label>
        <textarea
          rows={8}
          className={`${textareaClass} font-mono`}
          value={form.query}
          onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
          placeholder="SELECT * FROM users WHERE id = :id"
        />
      </div>

      <KeyValueEditor
        label="Parameters"
        items={form.parameters}
        onChange={(parameters) => setForm((prev) => ({ ...prev, parameters }))}
        addLabel="+ Adicionar Parametro"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-xs font-medium"
          onClick={() => {
            setValidateStatus(errors.length === 0 ? "Sintaxe SQL valida." : "Corrija os erros da query.")
          }}
        >
          Validar Query
        </button>
        {validateStatus ? <span className="text-xs text-muted-foreground">{validateStatus}</span> : null}
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function EmailSenderNodeConfigPanel({ nodeData, onUpdate }: PanelProps<EmailSenderNodeConfig>) {
  const [form, setForm] = useState<EmailSenderNodeConfig>(nodeData)
  const [templateStatus, setTemplateStatus] = useState("")

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []
    if (!isValidEmailList(form.to_address)) result.push("to_address e obrigatorio e deve conter email valido.")

    return result
  }, [form.to_address])

  return (
    <PanelShell
      title="Configuracao Email Sender"
      description="Configure destinatarios, conteudo e anexos."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Credencial</label>
        <select
          className={fieldClass}
          value={form.credential_id}
          onChange={(e) => setForm((prev) => ({ ...prev, credential_id: e.target.value }))}
        >
          <option value="">Selecionar...</option>
          {credentialOptions.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>To</label>
          <input
            className={fieldClass}
            value={form.to_address}
            placeholder="cliente@empresa.com"
            onChange={(e) => setForm((prev) => ({ ...prev, to_address: e.target.value }))}
          />
        </div>
        <div>
          <label className={fieldLabelClass}>CC</label>
          <input
            className={fieldClass}
            value={form.cc_address}
            onChange={(e) => setForm((prev) => ({ ...prev, cc_address: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>BCC</label>
          <input
            className={fieldClass}
            value={form.bcc_address}
            onChange={(e) => setForm((prev) => ({ ...prev, bcc_address: e.target.value }))}
          />
        </div>
        <div>
          <label className={fieldLabelClass}>Assunto</label>
          <input
            className={fieldClass}
            value={form.subject}
            onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Body Text</label>
        <textarea
          rows={4}
          className={textareaClass}
          value={form.body_text}
          onChange={(e) => setForm((prev) => ({ ...prev, body_text: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Body HTML</label>
        <textarea
          rows={6}
          className={`${textareaClass} font-mono`}
          value={form.body_html}
          onChange={(e) => setForm((prev) => ({ ...prev, body_html: e.target.value }))}
        />
      </div>

      <StringListEditor
        label="Attachments Keys"
        items={form.attachments_keys}
        onChange={(attachments_keys) => setForm((prev) => ({ ...prev, attachments_keys }))}
        placeholder="arquivo_pdf"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-xs font-medium"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              subject: prev.subject || "Confirmacao de pagamento",
              body_text: prev.body_text || "Seu pagamento foi confirmado com sucesso.",
            }))
            setTemplateStatus("Template aplicado.")
          }}
        >
          Usar Template
        </button>
        {templateStatus ? <span className="text-xs text-muted-foreground">{templateStatus}</span> : null}
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function ExecuteSubWorkflowNodeConfigPanel({ nodeData, onUpdate }: PanelProps<ExecuteSubWorkflowNodeConfig>) {
  const [form, setForm] = useState<ExecuteSubWorkflowNodeConfig>(nodeData)

  const workflowOptions = form.workflows?.length ? form.workflows : defaultWorkflowOptions

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.workflow_id.trim()) result.push("workflow_id e obrigatorio.")

    return result
  }, [form.workflow_id])

  return (
    <PanelShell
      title="Configuracao Execute SubWorkflow"
      description="Defina fluxo filho e estrategia de passagem de dados."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Workflow</label>
        <select
          className={fieldClass}
          value={form.workflow_id}
          onChange={(e) => setForm((prev) => ({ ...prev, workflow_id: e.target.value }))}
        >
          <option value="">Selecionar...</option>
          {workflowOptions.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.wait_for_response}
            onChange={(e) => setForm((prev) => ({ ...prev, wait_for_response: e.target.checked }))}
          />
          Esperar resposta
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.pass_all_data}
            onChange={(e) => setForm((prev) => ({ ...prev, pass_all_data: e.target.checked }))}
          />
          Passar todos os dados
        </label>
      </div>

      {!form.pass_all_data ? (
        <KeyValueEditor
          label="Mapped Inputs"
          items={form.mapped_inputs}
          onChange={(mapped_inputs) => setForm((prev) => ({ ...prev, mapped_inputs }))}
          addLabel="+ Adicionar Input"
        />
      ) : null}

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function NoSQLDatabaseNodeConfigPanel({ nodeData, onUpdate }: PanelProps<NoSQLDatabaseNodeConfig>) {
  const [form, setForm] = useState<NoSQLDatabaseNodeConfig>(nodeData)

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.credential_id.trim()) result.push("Selecione uma credencial.")
    if (!form.collection_name.trim()) result.push("collection_name e obrigatorio.")
    if (form.timeout < 1 || form.timeout > 300) result.push("timeout deve estar entre 1 e 300 segundos.")
    if (!isValidJson(form.query)) result.push("query deve ser JSON valido.")
    if (!isValidJson(form.document)) result.push("document deve ser JSON valido.")

    return result
  }, [form.collection_name, form.credential_id, form.document, form.query, form.timeout])

  return (
    <PanelShell
      title="Configuracao NoSQL Database"
      description="Configure credenciais, operacao e documento/filtro em JSON."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Credencial</label>
          <select
            className={fieldClass}
            value={form.credential_id}
            onChange={(e) => setForm((prev) => ({ ...prev, credential_id: e.target.value }))}
          >
            <option value="">Selecionar...</option>
            {credentialOptions.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Database Type</label>
          <select
            className={fieldClass}
            value={form.database_type}
            onChange={(e) => setForm((prev) => ({ ...prev, database_type: e.target.value as NoSqlDatabaseType }))}
          >
            <option value="mongodb">mongodb</option>
            <option value="dynamodb">dynamodb</option>
            <option value="firestore">firestore</option>
            <option value="redis">redis</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={fieldLabelClass}>Operacao</label>
          <select
            className={fieldClass}
            value={form.operation}
            onChange={(e) => setForm((prev) => ({ ...prev, operation: e.target.value as NoSqlOperation }))}
          >
            <option value="find">find</option>
            <option value="insert">insert</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
            <option value="upsert">upsert</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Collection</label>
          <input
            className={fieldClass}
            value={form.collection_name}
            onChange={(e) => setForm((prev) => ({ ...prev, collection_name: e.target.value }))}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Timeout (s)</label>
          <input
            type="number"
            min={1}
            max={300}
            className={fieldClass}
            value={form.timeout}
            onChange={(e) => setForm((prev) => ({ ...prev, timeout: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Query (JSON)</label>
        <textarea
          rows={5}
          className={`${textareaClass} font-mono`}
          value={form.query}
          onChange={(e) => setForm((prev) => ({ ...prev, query: e.target.value }))}
          placeholder='{"status":"active"}'
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Document (JSON)</label>
        <textarea
          rows={5}
          className={`${textareaClass} font-mono`}
          value={form.document}
          onChange={(e) => setForm((prev) => ({ ...prev, document: e.target.value }))}
          placeholder='{"name":"cliente"}'
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Upsert Key</label>
        <input
          className={fieldClass}
          value={form.upsert_key}
          onChange={(e) => setForm((prev) => ({ ...prev, upsert_key: e.target.value }))}
          placeholder="external_id"
        />
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}
