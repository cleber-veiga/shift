"use client"

import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type LlmProvider = "openai" | "gemini" | "anthropic"
type MemoryStrategy = "buffer" | "buffer_window" | "summary"
type VectorDatabaseProvider = "pinecone" | "qdrant" | "chroma"
type VectorOperation = "UPSERT" | "SEARCH"

type CredentialOption = {
  id: string
  label: string
}

type KeyValueItem = {
  key: string
  value: string
}

type ToolOption = {
  id: string
  label: string
  description: string
}

type LlmNodeOption = {
  id: string
  label: string
}

export type LLMNodeConfig = {
  provider: LlmProvider
  credential_id: string
  model_name: string
  system_prompt: string
  user_prompt: string
  temperature: number
  max_tokens: number
  json_mode: boolean
  credentials?: CredentialOption[]
}

export type ChatMemoryNodeConfig = {
  session_id: string
  strategy: MemoryStrategy
  window_size: number
  target_property: string
}

export type VectorStoreNodeConfig = {
  database_provider: VectorDatabaseProvider
  credential_id: string
  operation: VectorOperation
  index_name: string
  embedding_model: string
  search_query: string
  top_k: number
  document_text: string
  metadata: KeyValueItem[]
  credentials?: CredentialOption[]
}

export type AgentNodeConfig = {
  llm_node_reference: string
  agent_role: string
  allowed_tools: string[]
  max_iterations: number
  require_human_approval: boolean
  llm_nodes?: LlmNodeOption[]
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
              className="h-9 rounded-md border border-gray-300 px-3 text-xs"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 h-9 rounded-md border border-gray-300 px-3 text-xs"
        onClick={() => onChange([...items, { key: "", value: "" }])}
      >
        {addLabel ?? "+ Adicionar"}
      </button>
    </div>
  )
}

const modelOptionsByProvider: Record<LlmProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"],
  anthropic: ["claude-3-5-sonnet", "claude-3-haiku", "claude-3-opus"],
}

const defaultCredentialOptions: CredentialOption[] = [
  { id: "cred-openai-main", label: "OpenAI Principal" },
  { id: "cred-gemini-main", label: "Gemini Principal" },
  { id: "cred-anthropic-main", label: "Anthropic Principal" },
]

const embeddingModelOptions = [
  "text-embedding-3-small",
  "text-embedding-3-large",
  "multilingual-e5-large",
]

const toolOptions: ToolOption[] = [
  { id: "sql", label: "SQL", description: "Consulta e atualiza dados em banco relacional." },
  { id: "http", label: "HTTP", description: "Faz chamadas para APIs externas." },
  { id: "email", label: "Email", description: "Envia emails transacionais e notificacoes." },
  { id: "storage", label: "Storage", description: "Le e grava arquivos/estado persistente." },
]

const defaultLlmNodeOptions: LlmNodeOption[] = [
  { id: "node-llm-1", label: "LLM Principal" },
  { id: "node-llm-2", label: "LLM Fallback" },
]

function estimateTokens(text: string) {
  const chars = text.trim().length
  if (chars === 0) return 0
  return Math.ceil(chars / 4)
}

export function LLMNodeConfigPanel({ nodeData, onUpdate }: PanelProps<LLMNodeConfig>) {
  const [form, setForm] = useState<LLMNodeConfig>(nodeData)

  const models = modelOptionsByProvider[form.provider]
  const modelNameValue = models.includes(form.model_name) ? form.model_name : models[0]
  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const tokenEstimate = useMemo(
    () => estimateTokens(form.system_prompt) + estimateTokens(form.user_prompt),
    [form.system_prompt, form.user_prompt]
  )

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.credential_id.trim()) result.push("credential_id obrigatorio.")
    if (!form.model_name.trim()) result.push("model_name obrigatorio.")
    if (form.temperature < 0 || form.temperature > 2) result.push("temperature deve estar entre 0 e 2.")
    if (form.max_tokens < 1) result.push("max_tokens deve ser maior que 0.")

    return result
  }, [form.credential_id, form.max_tokens, form.model_name, form.temperature])

  return (
    <PanelShell
      title="Configuracao LLM"
      description="Defina provedor, prompts e parametros de geracao."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={fieldLabelClass}>Provider</label>
          <Select
            value={form.provider}
            onValueChange={(value) => {
              const provider = value as LlmProvider
              setForm((prev) => ({
                ...prev,
                provider,
                model_name: modelOptionsByProvider[provider][0],
              }))
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">openai</SelectItem>
              <SelectItem value="gemini">gemini</SelectItem>
              <SelectItem value="anthropic">anthropic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={fieldLabelClass}>Credencial</label>
          <Select
            value={form.credential_id}
            onValueChange={(value) => setForm((prev) => ({ ...prev, credential_id: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {credentialOptions.map((credential) => (
                <SelectItem key={credential.id} value={credential.id}>{credential.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={fieldLabelClass}>Model</label>
          <Select
            value={modelNameValue}
            onValueChange={(value) => setForm((prev) => ({ ...prev, model_name: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>System prompt</label>
        <textarea
          className={textareaClass}
          rows={4}
          value={form.system_prompt}
          onChange={(e) => setForm((prev) => ({ ...prev, system_prompt: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>User prompt</label>
        <textarea
          className={textareaClass}
          rows={4}
          value={form.user_prompt}
          onChange={(e) => setForm((prev) => ({ ...prev, user_prompt: e.target.value }))}
          placeholder="Responda para {{cliente_nome}}"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Temperature ({form.temperature.toFixed(2)})</label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            className="mt-2 w-full"
            value={form.temperature}
            onChange={(e) => setForm((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Max tokens</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.max_tokens}
            onChange={(e) => setForm((prev) => ({ ...prev, max_tokens: Number(e.target.value) }))}
          />
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.json_mode}
          onChange={(e) => setForm((prev) => ({ ...prev, json_mode: e.target.checked }))}
        />
        Forcar resposta em JSON
      </label>

      <p className="text-xs text-muted-foreground">Tokens estimados: ~{tokenEstimate}</p>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className={errorClass}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function ChatMemoryNodeConfigPanel({ nodeData, onUpdate }: PanelProps<ChatMemoryNodeConfig>) {
  const [form, setForm] = useState<ChatMemoryNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.session_id.trim()) result.push("session_id obrigatorio.")
    if (form.window_size < 1) result.push("window_size deve ser maior que 0.")

    return result
  }, [form.session_id, form.window_size])

  return (
    <PanelShell
      title="Configuracao Chat Memory"
      description="Defina sessao, estrategia e onde injetar o historico."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Session ID</label>
        <input
          className={fieldClass}
          value={form.session_id}
          placeholder="{{webhook.body.numero_whatsapp}}"
          onChange={(e) => setForm((prev) => ({ ...prev, session_id: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Strategy</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.strategy === "buffer"}
              onChange={() => setForm((prev) => ({ ...prev, strategy: "buffer" }))}
            />
            buffer
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.strategy === "buffer_window"}
              onChange={() => setForm((prev) => ({ ...prev, strategy: "buffer_window" }))}
            />
            buffer_window
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.strategy === "summary"}
              onChange={() => setForm((prev) => ({ ...prev, strategy: "summary" }))}
            />
            summary
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Window size</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.window_size}
            onChange={(e) => setForm((prev) => ({ ...prev, window_size: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Target property</label>
          <input
            className={fieldClass}
            value={form.target_property}
            placeholder="payload.chat_history"
            onChange={(e) => setForm((prev) => ({ ...prev, target_property: e.target.value }))}
          />
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className={errorClass}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function VectorStoreNodeConfigPanel({ nodeData, onUpdate }: PanelProps<VectorStoreNodeConfig>) {
  const [form, setForm] = useState<VectorStoreNodeConfig>(nodeData)

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.credential_id.trim()) result.push("credential_id obrigatorio.")
    if (!form.index_name.trim()) result.push("index_name obrigatorio.")
    if (!form.embedding_model.trim()) result.push("embedding_model obrigatorio.")

    if (form.operation === "SEARCH") {
      if (!form.search_query.trim()) result.push("search_query obrigatorio para SEARCH.")
      if (form.top_k < 1) result.push("top_k deve ser maior que 0.")
    }

    if (form.operation === "UPSERT" && !form.document_text.trim()) {
      result.push("document_text obrigatorio para UPSERT.")
    }

    return result
  }, [form.credential_id, form.document_text, form.embedding_model, form.index_name, form.operation, form.search_query, form.top_k])

  return (
    <PanelShell
      title="Configuracao Vector Store"
      description="Configure operacao de busca ou gravacao de embeddings."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Database provider</label>
          <Select
            value={form.database_provider}
            onValueChange={(value) => setForm((prev) => ({ ...prev, database_provider: value as VectorDatabaseProvider }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pinecone">pinecone</SelectItem>
              <SelectItem value="qdrant">qdrant</SelectItem>
              <SelectItem value="chroma">chroma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={fieldLabelClass}>Credencial</label>
          <Select
            value={form.credential_id}
            onValueChange={(value) => setForm((prev) => ({ ...prev, credential_id: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {credentialOptions.map((credential) => (
                <SelectItem key={credential.id} value={credential.id}>{credential.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Operation</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "UPSERT"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "UPSERT" }))}
            />
            UPSERT
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "SEARCH"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "SEARCH" }))}
            />
            SEARCH
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Index name</label>
          <input
            className={fieldClass}
            value={form.index_name}
            onChange={(e) => setForm((prev) => ({ ...prev, index_name: e.target.value }))}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Embedding model</label>
          <Select
            value={form.embedding_model}
            onValueChange={(value) => setForm((prev) => ({ ...prev, embedding_model: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {embeddingModelOptions.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.operation === "SEARCH" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass}>Search query</label>
            <input
              className={fieldClass}
              value={form.search_query}
              onChange={(e) => setForm((prev) => ({ ...prev, search_query: e.target.value }))}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Top K</label>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={form.top_k}
              onChange={(e) => setForm((prev) => ({ ...prev, top_k: Number(e.target.value) }))}
            />
          </div>
        </div>
      ) : null}

      {form.operation === "UPSERT" ? (
        <>
          <div>
            <label className={fieldLabelClass}>Document text</label>
            <textarea
              rows={5}
              className={textareaClass}
              value={form.document_text}
              onChange={(e) => setForm((prev) => ({ ...prev, document_text: e.target.value }))}
            />
          </div>

          <KeyValueEditor
            label="Metadata"
            items={form.metadata}
            onChange={(metadata) => setForm((prev) => ({ ...prev, metadata }))}
            addLabel="+ Adicionar Metadado"
          />
        </>
      ) : null}

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className={errorClass}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}

export function AgentNodeConfigPanel({ nodeData, onUpdate }: PanelProps<AgentNodeConfig>) {
  const [form, setForm] = useState<AgentNodeConfig>(nodeData)

  const llmNodeOptions = form.llm_nodes?.length ? form.llm_nodes : defaultLlmNodeOptions

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.llm_node_reference.trim()) result.push("llm_node_reference obrigatorio.")
    if (!form.agent_role.trim()) result.push("agent_role obrigatorio.")
    if (form.max_iterations < 1) result.push("max_iterations deve ser maior que 0.")

    return result
  }, [form.agent_role, form.llm_node_reference, form.max_iterations])

  return (
    <PanelShell
      title="Configuracao Agent"
      description="Defina papel, ferramentas e limites de execucao do agente."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>LLM node reference</label>
        <Select
          value={form.llm_node_reference}
          onValueChange={(value) => setForm((prev) => ({ ...prev, llm_node_reference: value }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            {llmNodeOptions.map((node) => (
              <SelectItem key={node.id} value={node.id}>{node.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className={fieldLabelClass}>Agent role</label>
        <textarea
          rows={4}
          className={textareaClass}
          value={form.agent_role}
          onChange={(e) => setForm((prev) => ({ ...prev, agent_role: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Allowed tools</label>
        <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
          {toolOptions.map((tool) => {
            const checked = form.allowed_tools.includes(tool.id)
            return (
              <label key={tool.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setForm((prev) => ({ ...prev, allowed_tools: [...prev.allowed_tools, tool.id] }))
                      return
                    }
                    setForm((prev) => ({ ...prev, allowed_tools: prev.allowed_tools.filter((item) => item !== tool.id) }))
                  }}
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                  <span className="block text-xs text-muted-foreground">{tool.description}</span>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Max iterations</label>
        <input
          type="number"
          min={1}
          className={fieldClass}
          value={form.max_iterations}
          onChange={(e) => setForm((prev) => ({ ...prev, max_iterations: Number(e.target.value) }))}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.require_human_approval}
          onChange={(e) => setForm((prev) => ({ ...prev, require_human_approval: e.target.checked }))}
        />
        Pedir aprovacao manual
      </label>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p key={error} className={errorClass}>{error}</p>
          ))}
        </div>
      ) : null}
    </PanelShell>
  )
}
