"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  EdgeLabelRenderer,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  getBezierPath,
  useEdgesState,
  useNodesState,
  BaseEdge,
  Handle,
  Position,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  ArrowLeftRight,
  Bot,
  Braces,
  CalendarDays,
  Clock3,
  Code2,
  Database,
  FolderOpen,
  FileText,
  GitBranch,
  GitMerge,
  Globe,
  Hand,
  GitFork,
  Link2,
  Mail,
  MessagesSquare,
  MousePointer,
  MousePointerClick,
  PencilLine,
  Play,
  Plus,
  Power,
  Rows3,
  Save,
  Shield,
  Repeat2,
  Sparkles,
  WandSparkles,
  KeyRound,
  Trash2,
  Webhook,
  Workflow,
  X,
  Zap,
} from "lucide-react"
import { useDashboardHeader } from "@/lib/context/header-context"
import {
  CronNodeConfigPanel,
  EventQueueTriggerConfigPanel,
  getNextExecutionTimes,
  ManualNodeConfigPanel,
  SubWorkflowTriggerConfigPanel,
  WebhookNodeConfigPanel,
  type CronNodeConfig,
  type EventQueueTriggerConfig,
  type ManualNodeConfig,
  type SubWorkflowTriggerConfig,
  type WebhookNodeConfig,
} from "@/components/workflow/config-panels/trigger-config-panels"
import {
  EmailSenderNodeConfigPanel,
  ExecuteSubWorkflowNodeConfigPanel,
  HttpRequestNodeConfigPanel,
  NoSQLDatabaseNodeConfigPanel,
  SqlDatabaseNodeConfigPanel,
  type EmailSenderNodeConfig,
  type ExecuteSubWorkflowNodeConfig,
  type HttpRequestNodeConfig,
  type NoSQLDatabaseNodeConfig,
  type SqlDatabaseNodeConfig,
} from "@/components/workflow/config-panels/action-config-panels"
import {
  ErrorCatchNodeConfigPanel,
  IfNodeConfigPanel,
  LoopNodeConfigPanel,
  MergeNodeConfigPanel,
  SwitchNodeConfigPanel,
  WaitNodeConfigPanel,
  type ErrorCatchNodeConfig,
  type IfNodeConfig,
  type LoopNodeConfig,
  type MergeNodeConfig,
  type SwitchNodeConfig,
  type WaitNodeConfig,
} from "@/components/workflow/config-panels/logic-config-panels"
import {
  FileStorageNodeConfigPanel,
  GlobalStateNodeConfigPanel,
  type FileStorageNodeConfig,
  type GlobalStateNodeConfig,
} from "@/components/workflow/config-panels/storage-config-panels"
import {
  CodeNodeConfigPanel,
  DataConverterNodeConfigPanel,
  DateTimeNodeConfigPanel,
  MapperNodeConfigPanel,
  type CodeNodeConfig,
  type DataConverterNodeConfig,
  type DateTimeNodeConfig,
  type MapperNodeConfig,
} from "@/components/workflow/config-panels/transformation-config-panels"
import {
  AgentNodeConfigPanel,
  ChatMemoryNodeConfigPanel,
  LLMNodeConfigPanel,
  VectorStoreNodeConfigPanel,
  type AgentNodeConfig,
  type ChatMemoryNodeConfig,
  type LLMNodeConfig,
  type VectorStoreNodeConfig,
} from "@/components/workflow/config-panels/ai-config-panels"

type WorkflowNodeKind =
  | "cronTrigger"
  | "webhookTrigger"
  | "manualTrigger"
  | "subWorkflowTrigger"
  | "eventQueueTrigger"
  | "httpRequestAction"
  | "sqlDatabaseAction"
  | "emailSenderAction"
  | "executeSubWorkflowAction"
  | "noSqlDatabaseAction"
  | "ifLogic"
  | "switchLogic"
  | "loopLogic"
  | "mergeLogic"
  | "errorCatchLogic"
  | "waitLogic"
  | "mapperTransform"
  | "codeTransform"
  | "dateTimeTransform"
  | "dataConverterTransform"
  | "globalStateStorage"
  | "fileStorage"
  | "llmAi"
  | "chatMemoryAi"
  | "vectorStoreAi"
  | "agentAi"

type TriggerNodeKind =
  | "cronTrigger"
  | "webhookTrigger"
  | "manualTrigger"
  | "subWorkflowTrigger"
  | "eventQueueTrigger"

type ActionNodeKind =
  | "httpRequestAction"
  | "sqlDatabaseAction"
  | "emailSenderAction"
  | "executeSubWorkflowAction"
  | "noSqlDatabaseAction"

type LogicNodeKind =
  | "ifLogic"
  | "switchLogic"
  | "loopLogic"
  | "mergeLogic"
  | "errorCatchLogic"
  | "waitLogic"

type StorageNodeKind = "globalStateStorage" | "fileStorage"

type TransformationNodeKind =
  | "mapperTransform"
  | "codeTransform"
  | "dateTimeTransform"
  | "dataConverterTransform"

type AINodeKind = "llmAi" | "chatMemoryAi" | "vectorStoreAi" | "agentAi"

type TriggerNodeConfigByKind = {
  cronTrigger: CronNodeConfig
  webhookTrigger: WebhookNodeConfig
  manualTrigger: ManualNodeConfig
  subWorkflowTrigger: SubWorkflowTriggerConfig
  eventQueueTrigger: EventQueueTriggerConfig
}

type ActionNodeConfigByKind = {
  httpRequestAction: HttpRequestNodeConfig
  sqlDatabaseAction: SqlDatabaseNodeConfig
  emailSenderAction: EmailSenderNodeConfig
  executeSubWorkflowAction: ExecuteSubWorkflowNodeConfig
  noSqlDatabaseAction: NoSQLDatabaseNodeConfig
}

type LogicNodeConfigByKind = {
  ifLogic: IfNodeConfig
  switchLogic: SwitchNodeConfig
  loopLogic: LoopNodeConfig
  mergeLogic: MergeNodeConfig
  errorCatchLogic: ErrorCatchNodeConfig
  waitLogic: WaitNodeConfig
}

type StorageNodeConfigByKind = {
  globalStateStorage: GlobalStateNodeConfig
  fileStorage: FileStorageNodeConfig
}

type TransformationNodeConfigByKind = {
  mapperTransform: MapperNodeConfig
  codeTransform: CodeNodeConfig
  dateTimeTransform: DateTimeNodeConfig
  dataConverterTransform: DataConverterNodeConfig
}

type AINodeConfigByKind = {
  llmAi: LLMNodeConfig
  chatMemoryAi: ChatMemoryNodeConfig
  vectorStoreAi: VectorStoreNodeConfig
  agentAi: AgentNodeConfig
}

type ConfigurableNodeKind =
  | TriggerNodeKind
  | ActionNodeKind
  | LogicNodeKind
  | StorageNodeKind
  | TransformationNodeKind
  | AINodeKind
type ConfigurableNodeConfigByKind = TriggerNodeConfigByKind &
  ActionNodeConfigByKind &
  LogicNodeConfigByKind &
  StorageNodeConfigByKind &
  TransformationNodeConfigByKind &
  AINodeConfigByKind

type WorkflowNodeData = {
  label: string
  description?: string
  exportId?: string
  kind: WorkflowNodeKind
  enabled?: boolean
  isRunning?: boolean
  config?: ConfigurableNodeConfigByKind[ConfigurableNodeKind]
  onOpenConfig?: (nodeId: string) => void
}

function isTriggerKind(kind: WorkflowNodeKind): kind is TriggerNodeKind {
  return (
    kind === "cronTrigger" ||
    kind === "webhookTrigger" ||
    kind === "manualTrigger" ||
    kind === "subWorkflowTrigger" ||
    kind === "eventQueueTrigger"
  )
}

function isActionKind(kind: WorkflowNodeKind): kind is ActionNodeKind {
  return (
    kind === "httpRequestAction" ||
    kind === "sqlDatabaseAction" ||
    kind === "emailSenderAction" ||
    kind === "executeSubWorkflowAction" ||
    kind === "noSqlDatabaseAction"
  )
}

function isLogicKind(kind: WorkflowNodeKind): kind is LogicNodeKind {
  return (
    kind === "ifLogic" ||
    kind === "switchLogic" ||
    kind === "loopLogic" ||
    kind === "mergeLogic" ||
    kind === "errorCatchLogic" ||
    kind === "waitLogic"
  )
}

function isStorageKind(kind: WorkflowNodeKind): kind is StorageNodeKind {
  return kind === "globalStateStorage" || kind === "fileStorage"
}

function isTransformationKind(kind: WorkflowNodeKind): kind is TransformationNodeKind {
  return (
    kind === "mapperTransform" ||
    kind === "codeTransform" ||
    kind === "dateTimeTransform" ||
    kind === "dataConverterTransform"
  )
}

function isAIKind(kind: WorkflowNodeKind): kind is AINodeKind {
  return kind === "llmAi" || kind === "chatMemoryAi" || kind === "vectorStoreAi" || kind === "agentAi"
}

function getDefaultTriggerConfig(kind: TriggerNodeKind): TriggerNodeConfigByKind[TriggerNodeKind] {
  switch (kind) {
    case "cronTrigger":
      return {
        expression: "*/5 * * * *",
        timezone: "America/Sao_Paulo",
        schedule_kind: "every_5_min",
        specific_hour: 8,
        specific_minute: 0,
        all_weekdays: true,
        weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
        all_months: true,
        months: [],
        all_month_days: true,
        month_days: [],
      }
    case "webhookTrigger":
      return {
        path: "",
        method: "POST",
        response_mode: "on_received",
        response_code: 200,
        auth_type: "none",
      }
    case "manualTrigger":
      return { inject_data: false, mock_payload: "{\"pedido_id\":123}" }
    case "subWorkflowTrigger":
      return { expected_inputs: ["pedido_id"], response_data: "all_data", node_id: "" }
    case "eventQueueTrigger":
      return {
        queue_provider: "rabbitmq",
        credential_id: "cred-rabbitmq-main",
        queue_name: "pedidos_novos",
        auto_ack: true,
        max_retries: 3,
        message_property: "payload.message",
      }
  }
}

function getDefaultActionConfig(kind: ActionNodeKind): ActionNodeConfigByKind[ActionNodeKind] {
  switch (kind) {
    case "httpRequestAction":
      return {
        url: "https://api.exemplo.com/pedidos/{{pedido_id}}",
        method: "GET",
        credential_id: "cred-http-bearer",
        headers: [],
        query_params: [],
        body: "{}",
        timeout: 30,
        ignore_ssl_errors: false,
      }
    case "sqlDatabaseAction":
      return {
        credential_id: "cred-sql-main",
        operation: "SELECT",
        query: "SELECT * FROM users WHERE id = :id",
        parameters: [{ key: "id", value: "10" }],
      }
    case "emailSenderAction":
      return {
        credential_id: "cred-email-sendgrid",
        to_address: "cliente@empresa.com",
        cc_address: "",
        bcc_address: "",
        subject: "Confirmacao de pagamento",
        body_text: "Seu pagamento foi confirmado com sucesso.",
        body_html: "<p>Seu pagamento foi confirmado com sucesso.</p>",
        attachments_keys: [],
      }
    case "executeSubWorkflowAction":
      return {
        workflow_id: "workflow-cobranca",
        wait_for_response: true,
        pass_all_data: true,
        mapped_inputs: [],
      }
    case "noSqlDatabaseAction":
      return {
        credential_id: "cred-nosql-mongo",
        database_type: "mongodb",
        operation: "find",
        collection_name: "pedidos",
        query: "{\"status\":\"active\"}",
        document: "{}",
        upsert_key: "external_id",
        timeout: 30,
      }
  }
}

function getDefaultLogicConfig(kind: LogicNodeKind): LogicNodeConfigByKind[LogicNodeKind] {
  switch (kind) {
    case "ifLogic":
      return {
        combine_mode: "AND",
        conditions: [{ left_operand: "{{status}}", operator: "==", right_operand: "pago" }],
      }
    case "switchLogic":
      return {
        input_value: "{{pagamento.metodo}}",
        routes: [{ route_name: "Cartao", operator: "==", compare_value: "credit_card" }],
        enable_fallback: true,
      }
    case "loopLogic":
      return {
        source_array: "{{response.data.clientes}}",
        batch_size: 1,
        exit_on_error: true,
      }
    case "mergeLogic":
      return {
        mode: "wait_all",
        data_strategy: "merge_by_key",
      }
    case "errorCatchLogic":
      return {
        catch_all: true,
        error_types: [],
        retry_enabled: false,
        retry_count: 3,
        retry_delay_seconds: 5,
        error_property: "payload.error",
      }
    case "waitLogic":
      return {
        wait_type: "fixed_duration",
        duration_seconds: 60,
        target_time: "",
        condition_expression: "",
        condition_check_interval: 10,
      }
  }
}

function getDefaultStorageConfig(kind: StorageNodeKind): StorageNodeConfigByKind[StorageNodeKind] {
  switch (kind) {
    case "globalStateStorage":
      return {
        operation: "SET",
        scope: "workflow",
        key: "ultimo_id_sincronizado",
        value: "{{payload.id}}",
        target_property: "payload.state.ultimo_id",
      }
    case "fileStorage":
      return {
        operation: "READ",
        file_path: "/tmp/relatorio_{{date}}.pdf",
        source_binary_property: "payload.file_binary",
        target_binary_property: "payload.file_binary",
        fail_on_missing: true,
      }
  }
}

function getDefaultTransformationConfig(
  kind: TransformationNodeKind
): TransformationNodeConfigByKind[TransformationNodeKind] {
  switch (kind) {
    case "mapperTransform":
      return {
        keep_only_set_fields: true,
        assignments: [{ target_field: "cliente.nome_completo", source_value: "{{nome}} {{sobrenome}}", type: "string" }],
      }
    case "codeTransform":
      return {
        language: "javascript",
        code: "function transform(payload) {\\n  payload.normalized = true\\n  return payload\\n}",
        run_once_for_all: false,
      }
    case "dateTimeTransform":
      return {
        property_to_format: "{{pedido.data_criacao}}",
        target_property: "data_formatada",
        from_format: "ISO8601",
        to_format: "YYYY-MM-DD HH:mm:ss",
        from_timezone: "UTC",
        to_timezone: "America/Sao_Paulo",
      }
    case "dataConverterTransform":
      return {
        input_format: "xml",
        output_format: "json",
        source_property: "data",
        target_property: "payload.converted",
        options: [],
      }
  }
}

function getDefaultAIConfig(kind: AINodeKind): AINodeConfigByKind[AINodeKind] {
  switch (kind) {
    case "llmAi":
      return {
        provider: "openai",
        credential_id: "cred-openai-main",
        model_name: "gpt-4o",
        system_prompt: "Voce e um assistente util para operacoes.",
        user_prompt: "{{payload.mensagem}}",
        temperature: 0.7,
        max_tokens: 512,
        json_mode: false,
      }
    case "chatMemoryAi":
      return {
        session_id: "{{webhook.body.numero_whatsapp}}",
        strategy: "buffer_window",
        window_size: 10,
        target_property: "payload.chat_history",
      }
    case "vectorStoreAi":
      return {
        database_provider: "qdrant",
        credential_id: "cred-qdrant-main",
        operation: "SEARCH",
        index_name: "kb_clientes",
        embedding_model: "text-embedding-3-small",
        search_query: "{{payload.pergunta}}",
        top_k: 5,
        document_text: "",
        metadata: [],
      }
    case "agentAi":
      return {
        llm_node_reference: "node-llm-1",
        agent_role: "Atue como agente de suporte ao cliente.",
        allowed_tools: ["sql", "http"],
        max_iterations: 5,
        require_human_approval: false,
      }
  }
}

const kindAccent: Record<WorkflowNodeKind, string> = {
  cronTrigger: "#7e22ce",
  webhookTrigger: "#7e22ce",
  manualTrigger: "#7e22ce",
  subWorkflowTrigger: "#7e22ce",
  eventQueueTrigger: "#7e22ce",
  httpRequestAction: "#2563eb",
  sqlDatabaseAction: "#2563eb",
  emailSenderAction: "#2563eb",
  executeSubWorkflowAction: "#2563eb",
  noSqlDatabaseAction: "#2563eb",
  ifLogic: "#c2410c",
  switchLogic: "#c2410c",
  loopLogic: "#c2410c",
  mergeLogic: "#c2410c",
  errorCatchLogic: "#c2410c",
  waitLogic: "#c2410c",
  mapperTransform: "#0891b2",
  codeTransform: "#0891b2",
  dateTimeTransform: "#0891b2",
  dataConverterTransform: "#0891b2",
  globalStateStorage: "#475569",
  fileStorage: "#475569",
  llmAi: "#db2777",
  chatMemoryAi: "#db2777",
  vectorStoreAi: "#db2777",
  agentAi: "#db2777",
}

const kindIcon: Record<WorkflowNodeKind, React.ElementType> = {
  cronTrigger: Clock3,
  webhookTrigger: Link2,
  manualTrigger: MousePointerClick,
  subWorkflowTrigger: Workflow,
  eventQueueTrigger: Rows3,
  httpRequestAction: Globe,
  sqlDatabaseAction: Database,
  emailSenderAction: Mail,
  executeSubWorkflowAction: Workflow,
  noSqlDatabaseAction: Braces,
  ifLogic: GitBranch,
  switchLogic: GitFork,
  loopLogic: Repeat2,
  mergeLogic: GitMerge,
  errorCatchLogic: Shield,
  waitLogic: Clock3,
  mapperTransform: Rows3,
  codeTransform: Code2,
  dateTimeTransform: CalendarDays,
  dataConverterTransform: FileText,
  globalStateStorage: KeyRound,
  fileStorage: FolderOpen,
  llmAi: Sparkles,
  chatMemoryAi: MessagesSquare,
  vectorStoreAi: Database,
  agentAi: Bot,
}

function WorkflowNode({ id, data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const { setNodes, setEdges } = useReactFlow()
  const AccentIcon = kindIcon[data.kind]
  const accent = kindAccent[data.kind]
  const enabled = data.enabled !== false

  const updateData = useCallback(
    (next: Partial<WorkflowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...(n.data as WorkflowNodeData), ...next } } : n))
      )
    },
    [id, setNodes]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
    },
    [id, setEdges, setNodes]
  )

  const handleToggleEnabled = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      updateData({ enabled: !enabled })
    },
    [enabled, updateData]
  )

  const handleRun = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      updateData({ isRunning: true })
      window.setTimeout(() => updateData({ isRunning: false }), 900)
    },
    [updateData]
  )

  return (
    <div
      className={`group relative w-[180px] rounded-2xl border border-border bg-card transition-shadow ${
        selected ? "shadow-[0_4px_24px_rgba(0,0,0,0.12)]" : "shadow-sm hover:shadow-md"
      }`}
      onDoubleClick={() => data.onOpenConfig?.(id)}
      style={{
        borderTopWidth: 3,
        borderTopStyle: "solid",
        borderTopColor: accent,
        opacity: enabled ? 1 : 0.55,
      }}
    >
      <div className="nodrag nopan pointer-events-none absolute -top-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-transparent bg-transparent px-1 py-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <button
          type="button"
          onClick={handleRun}
          title="Rodar nó"
          aria-label="Rodar nó"
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Play className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleToggleEnabled}
          title={enabled ? "Desligar nó" : "Ligar nó"}
          aria-label={enabled ? "Desligar nó" : "Ligar nó"}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Power className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          title="Remover nó"
          aria-label="Remover nó"
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-background !bg-muted-foreground/60 hover:!bg-primary"
      />
      <div className="flex flex-col items-center gap-3 px-4 pb-3 pt-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)` }}
        >
          <AccentIcon className="size-7" style={{ color: accent }} />
        </div>
        <input
          value={data.label}
          onChange={(e) => updateData({ label: e.target.value })}
          placeholder="Nome do nó"
          className="nodrag nopan h-7 w-full rounded-md border border-transparent bg-background/60 px-2 text-center text-xs font-medium text-foreground outline-none transition-all hover:border-border focus:border-border focus:bg-background focus:ring-1 focus:ring-primary/20"
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-background !bg-muted-foreground/60 hover:!bg-primary"
      />
      {data.isRunning ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-success/30" />
      ) : null}
    </div>
  )
}

type TriggerNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function TriggerNodeFrame({ id, data, icon: Icon, title, children }: TriggerNodeProps) {
  return (
    <div
      className="relative w-[240px] rounded-xl border border-purple-200 border-l-4 border-l-purple-500 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-purple-700">{title}</div>
      </div>
      {children}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-purple-500"
      />
    </div>
  )
}

function CronNode({ id, data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const { setNodes, setEdges } = useReactFlow()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const config =
    ((data.config as CronNodeConfig | undefined) ?? (getDefaultTriggerConfig("cronTrigger") as CronNodeConfig)) as CronNodeConfig
  const expression = config.expression || "*/5 * * * *"
  const nextRun = useMemo(() => getNextExecutionTimes(expression, 1)[0] ?? null, [expression])

  const nextRunLabel = useMemo(() => {
    if (!nextRun) return "Próxima run: —"
    const now = new Date()
    const isToday =
      now.getFullYear() === nextRun.getFullYear() &&
      now.getMonth() === nextRun.getMonth() &&
      now.getDate() === nextRun.getDate()
    const time = nextRun.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    if (isToday) return `Próxima run: Hoje às ${time}`
    const date = nextRun.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    return `Próxima run: ${date} às ${time}`
  }, [nextRun])

  const enabled = data.enabled !== false

  const updateData = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...(n.data as WorkflowNodeData), ...patch } } : n)))
    },
    [id, setNodes]
  )

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }, [id, setEdges, setNodes])

  const handleToggleEnabled = useCallback(() => {
    updateData({ enabled: !enabled })
    setMenuOpen(false)
  }, [enabled, updateData])

  const handleRun = useCallback(() => {
    updateData({ isRunning: true })
    window.setTimeout(() => updateData({ isRunning: false }), 900)
    setMenuOpen(false)
  }, [updateData])

  useEffect(() => {
    if (!menuOpen) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as unknown as globalThis.Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    // Use capture phase so we can detect the click before ReactFlow intercepts it
    document.addEventListener("mousedown", onMouseDown, true)
    return () => document.removeEventListener("mousedown", onMouseDown, true)
  }, [menuOpen])

  return (
    <div
      className="group relative w-[340px] rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
      onDoubleClick={() => data.onOpenConfig?.(id)}
      style={{
        borderColor: `color-mix(in oklab, ${kindAccent.cronTrigger} 45%, var(--border))`,
        borderWidth: 1,
        opacity: enabled ? 1 : 0.55,
      }}
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: kindAccent.cronTrigger }}
          >
            <Clock3 className="size-4 text-white" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={data.label}
                onChange={(e) => updateData({ label: e.target.value })}
                className="nodrag nopan h-7 w-[220px] max-w-full bg-transparent px-0 text-[15px] font-semibold leading-none text-foreground outline-none placeholder:text-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Cron"
              />
              <PencilLine className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="nodrag nopan inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Opções"
          >
            <span className="text-lg leading-none">···</span>
          </button>

          {menuOpen ? (
            <div className="nodrag nopan absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              <button
                type="button"
                onClick={handleRun}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Play className="size-4 text-primary" />
                Executar este nó
              </button>
              <button
                type="button"
                onClick={handleToggleEnabled}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Power className="size-4 text-muted-foreground" />
                {enabled ? "Desativar nó" : "Ativar nó"}
              </button>
              <div className="border-t border-border" />
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="bg-muted/[0.18] px-4 pb-4 pt-3">
        <div className="grid grid-cols-[92px_1fr] items-center gap-y-2 text-sm">
          <div className="text-[12px] font-medium text-muted-foreground">Expressão</div>
          <div className="flex justify-end">
            <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 font-mono text-[12px] text-foreground">
              {expression}
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {data.description?.trim() ? (
            <div className="line-clamp-2 text-[12px] text-muted-foreground">{data.description}</div>
          ) : null}
          <div className="rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-muted-foreground">
            {nextRunLabel}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !top-1/2 !h-3.5 !w-3.5 !-translate-y-1/2 !rounded-full !border-[2.5px] !border-card hover:!scale-125 transition-transform"
        style={{ backgroundColor: kindAccent.cronTrigger }}
      />
      {data.isRunning ? (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-success/30" />
      ) : null}
    </div>
  )
}

function WebhookNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TriggerNodeFrame id={id} data={data} icon={Webhook} title="Webhook">
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          POST
        </span>
        <span className="max-w-[150px] truncate text-[11px] text-purple-700">/api/pagamentos</span>
      </div>
    </TriggerNodeFrame>
  )
}

function ManualNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TriggerNodeFrame id={id} data={data} icon={MousePointerClick} title="Manual">
      <button
        type="button"
        className="pointer-events-none inline-flex h-7 items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 text-[11px] font-medium text-purple-700"
      >
        <Play className="size-3" />
        Executar Agora
      </button>
    </TriggerNodeFrame>
  )
}

function SubWorkflowTriggerNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TriggerNodeFrame id={id} data={data} icon={Workflow} title="Subworkflow Trigger">
      <p className="text-[11px] text-purple-700">Aguardando fluxo pai...</p>
    </TriggerNodeFrame>
  )
}

function EventQueueTriggerNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TriggerNodeFrame id={id} data={data} icon={Rows3} title="Event Queue Trigger">
      <p className="text-[11px] text-purple-700">topic: pedidos_novos</p>
    </TriggerNodeFrame>
  )
}

type ActionNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function ActionNodeFrame({ id, data, icon: Icon, title, children }: ActionNodeProps) {
  return (
    <div
      className="relative w-[260px] rounded-xl border border-blue-200 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-xl bg-blue-50/70" />
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
      <div className="relative mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-blue-700">{title}</div>
      </div>
      <div className="relative">{children}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
    </div>
  )
}

function HttpRequestNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <ActionNodeFrame id={id} data={data} icon={Globe} title="HTTP Request">
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          GET
        </span>
        <span className="max-w-[170px] truncate text-[11px] text-blue-700">https://api.shift.io/v1/orders</span>
      </div>
    </ActionNodeFrame>
  )
}

function SqlDatabaseNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <ActionNodeFrame id={id} data={data} icon={Database} title="SQL Database">
      <div className="space-y-1">
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          SELECT
        </span>
        <p className="max-w-[210px] truncate text-[11px] text-blue-700">SELECT * FROM users...</p>
      </div>
    </ActionNodeFrame>
  )
}

function EmailSenderNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <ActionNodeFrame id={id} data={data} icon={Mail} title="Email Sender">
      <div className="space-y-1 text-[11px] text-blue-700">
        <p className="truncate">To: financeiro@empresa.com</p>
        <p className="truncate">Assunto: Confirmacao de pagamento</p>
      </div>
    </ActionNodeFrame>
  )
}

function ExecuteSubWorkflowNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <ActionNodeFrame id={id} data={data} icon={Workflow} title="Execute SubWorkflow">
      <p className="truncate text-[11px] text-blue-700">Fluxo filho: workflow-cobranca</p>
    </ActionNodeFrame>
  )
}

function NoSQLDatabaseNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <ActionNodeFrame id={id} data={data} icon={Braces} title="NoSQL Database">
      <div className="flex items-center gap-2 text-[11px] text-blue-700">
        <span className="truncate">collection: pedidos</span>
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          find
        </span>
      </div>
    </ActionNodeFrame>
  )
}

type LogicNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function LogicNodeFrame({ id, data, icon: Icon, title, children }: LogicNodeProps) {
  return (
    <div
      className="relative w-[260px] rounded-xl border border-orange-200 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-orange-700">{title}</div>
      </div>
      {children}
    </div>
  )
}

function IfNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={GitBranch} title="If">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <p className="max-w-[180px] truncate text-[11px] text-orange-700">status == &apos;pago&apos;</p>
      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "38%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-emerald-500"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ top: "68%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-red-500"
      />
    </LogicNodeFrame>
  )
}

function SwitchNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={GitFork} title="Switch">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <p className="text-[11px] text-orange-700">Variavel: status_aprovacao</p>
      <Handle
        id="aprovado"
        type="source"
        position={Position.Right}
        style={{ top: "28%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-emerald-500"
      />
      <Handle
        id="recusado"
        type="source"
        position={Position.Right}
        style={{ top: "50%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-red-500"
      />
      <Handle
        id="pendente"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-amber-500"
      />
    </LogicNodeFrame>
  )
}

function LoopNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={Repeat2} title="Loop">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <p className="text-[11px] text-orange-700">Para cada item da lista</p>
      <Handle
        id="item"
        type="source"
        position={Position.Right}
        style={{ top: "40%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <Handle
        id="done"
        type="source"
        position={Position.Right}
        style={{ top: "70%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500"
      />
    </LogicNodeFrame>
  )
}

function MergeNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={GitMerge} title="Merge">
      <Handle
        id="in-1"
        type="target"
        position={Position.Left}
        style={{ top: "35%" }}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <Handle
        id="in-2"
        type="target"
        position={Position.Left}
        style={{ top: "65%" }}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <p className="text-[11px] text-orange-700">Une mÃƒÆ’Ã‚Âºltiplos caminhos em um fluxo</p>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
    </LogicNodeFrame>
  )
}

function ErrorCatchNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={Shield} title="Error Catch">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-400"
      />
      <p className="text-[11px] text-orange-700">Captura exceÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes na execuÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o</p>
      <Handle
        id="normal"
        type="source"
        position={Position.Right}
        style={{ top: "40%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <Handle
        id="error"
        type="source"
        position={Position.Right}
        style={{ top: "70%" }}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-red-500"
      />
    </LogicNodeFrame>
  )
}

function WaitNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <LogicNodeFrame id={id} data={data} icon={Clock3} title="Wait">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
      <p className="text-[11px] text-orange-700">Wait 5 mins</p>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-orange-500"
      />
    </LogicNodeFrame>
  )
}

type TransformationNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function TransformationNodeFrame({ id, data, icon: Icon, title, children }: TransformationNodeProps) {
  return (
    <div
      className="relative w-[260px] rounded-xl border border-cyan-200 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-cyan-500"
      />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-cyan-700">{title}</div>
      </div>
      {children}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-cyan-500"
      />
    </div>
  )
}

function MapperNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TransformationNodeFrame id={id} data={data} icon={Rows3} title="Mapper">
      <div className="space-y-1 text-[11px] text-cyan-700">
        <p className="truncate">nome -&gt; full_name</p>
        <p className="truncate">cpf -&gt; document_id</p>
      </div>
    </TransformationNodeFrame>
  )
}

function CodeNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TransformationNodeFrame id={id} data={data} icon={Code2} title="Code">
      <div className="space-y-2">
        <span className="inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
          Python
        </span>
        <div className="rounded-md bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-100">
          payload[&quot;amount&quot;] = int(payload[&quot;amount&quot;])
        </div>
      </div>
    </TransformationNodeFrame>
  )
}

function DateTimeNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TransformationNodeFrame id={id} data={data} icon={CalendarDays} title="DateTime">
      <p className="text-[11px] text-cyan-700">ISO8601 -&gt; DD/MM/YYYY</p>
    </TransformationNodeFrame>
  )
}

function DataConverterNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <TransformationNodeFrame id={id} data={data} icon={FileText} title="Data Converter">
      <p className="text-[11px] text-cyan-700">XML -&gt; JSON</p>
    </TransformationNodeFrame>
  )
}

type StorageNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function StorageNodeFrame({ id, data, icon: Icon, title, children }: StorageNodeProps) {
  return (
    <div
      className="relative w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-500"
      />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-slate-700">{title}</div>
      </div>
      {children}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-500"
      />
    </div>
  )
}

function GlobalStateNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <StorageNodeFrame id={id} data={data} icon={KeyRound} title="Global State">
      <div className="flex items-center gap-2 text-[11px] text-slate-700">
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          SET
        </span>
        <span className="truncate">key: ultimo_id</span>
      </div>
    </StorageNodeFrame>
  )
}

function FileStorageNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <StorageNodeFrame id={id} data={data} icon={FolderOpen} title="File Storage">
      <div className="space-y-1 text-[11px] text-slate-700">
        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
          WRITE
        </span>
        <p className="truncate">/tmp/relatorio.pdf</p>
      </div>
    </StorageNodeFrame>
  )
}

type AiNodeProps = {
  id: string
  data: WorkflowNodeData
  icon: React.ElementType
  title: string
  children: React.ReactNode
}

function AiNodeFrame({ id, data, icon: Icon, title, children }: AiNodeProps) {
  return (
    <div
      className="relative w-[270px] rounded-xl border border-pink-200 bg-white p-3 shadow-sm"
      onDoubleClick={() => data.onOpenConfig?.(id)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-pink-500"
      />
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-pink-50 text-pink-700">
          <Icon className="size-4" />
        </div>
        <div className="text-xs font-semibold text-pink-700">{title}</div>
      </div>
      {children}
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px] !h-3 !w-3 !rounded-full !border-2 !border-white !bg-pink-500"
      />
    </div>
  )
}

function LLMNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <AiNodeFrame id={id} data={data} icon={Sparkles} title="LLM">
      <div className="space-y-1 text-[11px] text-pink-700">
        <p className="font-medium">OpenAI gpt-4o</p>
        <p className="truncate">System: Voce e um assistente de suporte financeiro.</p>
      </div>
    </AiNodeFrame>
  )
}

function ChatMemoryNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <AiNodeFrame id={id} data={data} icon={MessagesSquare} title="Chat Memory">
      <p className="text-[11px] text-pink-700">Window: 10 msgs</p>
    </AiNodeFrame>
  )
}

function VectorStoreNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <AiNodeFrame id={id} data={data} icon={Database} title="Vector Store">
      <div className="flex items-center gap-2 text-[11px] text-pink-700">
        <span className="inline-flex rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">
          SEARCH
        </span>
        <span className="truncate">index: kb_clientes</span>
      </div>
    </AiNodeFrame>
  )
}

function AgentNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <AiNodeFrame id={id} data={data} icon={Bot} title="Agent">
      <div className="space-y-1 text-[11px] text-pink-700">
        <p className="truncate">Role: Support</p>
        <p className="truncate">Tools: SQL, HTTP</p>
      </div>
    </AiNodeFrame>
  )
}

function StandardNode({ id, data }: NodeProps<Node<WorkflowNodeData>>) {
  const { setNodes, setEdges } = useReactFlow()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const accent = kindAccent[data.kind] ?? "var(--primary)"
  const Icon = kindIcon[data.kind] ?? Workflow
  const enabled = data.enabled !== false

  const updateData = useCallback(
    (patch: Partial<WorkflowNodeData>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...(n.data as WorkflowNodeData), ...patch } } : n)))
    },
    [id, setNodes]
  )

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setMenuOpen(false)
  }, [id, setEdges, setNodes])

  const handleToggleEnabled = useCallback(() => {
    updateData({ enabled: !enabled })
    setMenuOpen(false)
  }, [enabled, updateData])

  const handleRun = useCallback(() => {
    updateData({ isRunning: true })
    window.setTimeout(() => updateData({ isRunning: false }), 900)
    setMenuOpen(false)
  }, [updateData])

  useEffect(() => {
    if (!menuOpen) return
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as unknown as globalThis.Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown, true)
    return () => document.removeEventListener("mousedown", onMouseDown, true)
  }, [menuOpen])

  const rows = useMemo(() => {
    if (data.kind === "webhookTrigger") {
      const config = (data.config ?? getDefaultTriggerConfig("webhookTrigger")) as WebhookNodeConfig
      const authLabel =
        config.auth_type === "none"
          ? "Nenhuma"
          : config.auth_type === "basic_auth"
            ? "Basic Auth"
            : "Token no Header"
      return [
        { label: "Método", value: config.method, badge: true },
        { label: "URL", value: `/webhook/${config.path || "—"}` },
        { label: "Auth", value: authLabel },
      ]
    }

    if (data.kind === "manualTrigger") {
      const config = (data.config ?? getDefaultTriggerConfig("manualTrigger")) as ManualNodeConfig
      return [
        { label: "Modo", value: config.inject_data ? "Com dados" : "Sem dados" },
        { label: "Payload", value: config.inject_data ? "Ativo" : "—" },
      ]
    }

    if (data.kind === "httpRequestAction") {
      const config = (data.config ?? getDefaultActionConfig("httpRequestAction")) as HttpRequestNodeConfig
      return [
        { label: "Método", value: config.method, badge: true },
        { label: "URL", value: config.url },
      ]
    }

    if (data.kind === "sqlDatabaseAction") {
      const config = (data.config ?? getDefaultActionConfig("sqlDatabaseAction")) as SqlDatabaseNodeConfig
      return [
        { label: "Operação", value: config.operation },
        { label: "Credencial", value: config.credential_id },
      ]
    }

    if (data.kind === "emailSenderAction") {
      const config = (data.config ?? getDefaultActionConfig("emailSenderAction")) as EmailSenderNodeConfig
      return [
        { label: "Para", value: config.to_address },
        { label: "Assunto", value: config.subject },
      ]
    }

    if (data.kind === "executeSubWorkflowAction") {
      const config = (data.config ?? getDefaultActionConfig("executeSubWorkflowAction")) as ExecuteSubWorkflowNodeConfig
      return [
        { label: "Workflow", value: config.workflow_id },
        { label: "Aguardar", value: config.wait_for_response ? "Sim" : "Não" },
      ]
    }

    if (data.kind === "noSqlDatabaseAction") {
      const config = (data.config ?? getDefaultActionConfig("noSqlDatabaseAction")) as NoSQLDatabaseNodeConfig
      return [
        { label: "DB", value: config.database_type },
        { label: "Coleção", value: config.collection_name },
      ]
    }

    if (data.kind === "eventQueueTrigger") {
      const config = (data.config ?? getDefaultTriggerConfig("eventQueueTrigger")) as EventQueueTriggerConfig
      return [
        { label: "Provider", value: config.queue_provider },
        { label: "Fila", value: config.queue_name },
      ]
    }

    if (data.kind === "subWorkflowTrigger") {
      const config = (data.config ?? getDefaultTriggerConfig("subWorkflowTrigger")) as SubWorkflowTriggerConfig
      return [
        { label: "Inputs", value: `${config.expected_inputs?.length ?? 0}` },
        { label: "Resposta", value: config.response_data },
      ]
    }

    if (data.kind === "mapperTransform") return [{ label: "Tipo", value: "Mapper" }]
    if (data.kind === "codeTransform") return [{ label: "Tipo", value: "Code" }]
    if (data.kind === "dateTimeTransform") return [{ label: "Tipo", value: "DateTime" }]
    if (data.kind === "dataConverterTransform") return [{ label: "Tipo", value: "Converter" }]
    if (data.kind === "globalStateStorage") return [{ label: "Tipo", value: "Global State" }]
    if (data.kind === "fileStorage") return [{ label: "Tipo", value: "File Storage" }]
    if (data.kind === "llmAi") return [{ label: "Tipo", value: "LLM" }]
    if (data.kind === "chatMemoryAi") return [{ label: "Tipo", value: "Chat Memory" }]
    if (data.kind === "vectorStoreAi") return [{ label: "Tipo", value: "Vector Store" }]
    if (data.kind === "agentAi") return [{ label: "Tipo", value: "Agent" }]

    if (data.kind === "ifLogic") return [{ label: "Tipo", value: "If" }]
    if (data.kind === "switchLogic") return [{ label: "Tipo", value: "Switch" }]
    if (data.kind === "loopLogic") return [{ label: "Tipo", value: "Loop" }]
    if (data.kind === "mergeLogic") return [{ label: "Tipo", value: "Merge" }]
    if (data.kind === "errorCatchLogic") return [{ label: "Tipo", value: "Error Catch" }]
    if (data.kind === "waitLogic") return [{ label: "Tipo", value: "Wait" }]

    return []
  }, [data.config, data.kind])

  const leftHandles = useMemo(() => {
    if (data.kind === "mergeLogic") {
      return [
        { id: "in-1", top: "35%" },
        { id: "in-2", top: "65%" },
      ]
    }
    return [{ id: undefined, top: "50%" }]
  }, [data.kind])

  const rightHandles = useMemo(() => {
    if (data.kind === "ifLogic") return [{ id: "true", top: "38%" }, { id: "false", top: "68%" }]
    if (data.kind === "switchLogic") return [{ id: "aprovado", top: "28%" }, { id: "recusado", top: "50%" }, { id: "pendente", top: "72%" }]
    if (data.kind === "loopLogic") return [{ id: "item", top: "40%" }, { id: "done", top: "70%" }]
    if (data.kind === "errorCatchLogic") return [{ id: "normal", top: "40%" }, { id: "error", top: "70%" }]
    return [{ id: undefined, top: "50%" }]
  }, [data.kind])

  return (
    <div
      className="group relative w-[340px] rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
      onDoubleClick={() => data.onOpenConfig?.(id)}
      style={{
        borderColor: `color-mix(in oklab, ${accent} 45%, var(--border))`,
        borderWidth: 1,
        opacity: enabled ? 1 : 0.55,
      }}
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: accent }}>
            <Icon className="size-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={data.label}
                onChange={(e) => updateData({ label: e.target.value })}
                className="nodrag nopan h-7 w-[220px] max-w-full bg-transparent px-0 text-[15px] font-semibold leading-none text-foreground outline-none placeholder:text-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Nome"
              />
              <PencilLine className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="nodrag nopan inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Opções"
          >
            <span className="text-lg leading-none">···</span>
          </button>

          {menuOpen ? (
            <div className="nodrag nopan absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              <button
                type="button"
                onClick={handleRun}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Play className="size-4 text-primary" />
                Executar este nó
              </button>
              <button
                type="button"
                onClick={handleToggleEnabled}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
              >
                <Power className="size-4 text-muted-foreground" />
                {enabled ? "Desativar nó" : "Ativar nó"}
              </button>
              <div className="border-t border-border" />
              <button
                type="button"
                onClick={handleDelete}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Excluir
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {rows.length ? (
        <>
          <div className="border-t border-border" />
          <div className="bg-muted/[0.18] px-4 pb-4 pt-3">
          <div className="grid grid-cols-[92px_1fr] items-center gap-y-2 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="contents">
                <div className="text-[12px] font-medium text-muted-foreground">{row.label}</div>
                <div className="flex justify-end">
                  {row.badge ? (
                    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-1 text-[12px] font-semibold text-foreground">
                      {row.value}
                    </span>
                  ) : (
                    <span className="max-w-[220px] truncate text-[12px] text-foreground">{row.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.description?.trim() ? (
            <div className="mt-3 line-clamp-2 text-[12px] text-muted-foreground">{data.description}</div>
          ) : null}
          </div>
        </>
      ) : (
        <div className="px-4 pb-4">{data.description?.trim() ? <div className="line-clamp-2 text-[12px] text-muted-foreground">{data.description}</div> : null}</div>
      )}

      {leftHandles.map((h) => (
        <Handle
          key={h.id ?? "in"}
          id={h.id}
          type="target"
          position={Position.Left}
          className="!-left-[6px] !h-3.5 !w-3.5 !-translate-y-1/2 !rounded-full !border-[2.5px] !border-card transition-transform hover:!scale-125"
          style={{ top: h.top, backgroundColor: accent }}
        />
      ))}
      {rightHandles.map((h) => (
        <Handle
          key={h.id ?? "out"}
          id={h.id}
          type="source"
          position={Position.Right}
          style={{ top: h.top, backgroundColor: accent }}
          className="!-right-[6px] !h-3.5 !w-3.5 !-translate-y-1/2 !rounded-full !border-[2.5px] !border-card transition-transform hover:!scale-125"
        />
      ))}

      {data.isRunning ? <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-success/30" /> : null}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  cronTrigger: CronNode,
  webhookTrigger: StandardNode,
  manualTrigger: StandardNode,
  subWorkflowTrigger: StandardNode,
  eventQueueTrigger: StandardNode,
  httpRequestAction: StandardNode,
  sqlDatabaseAction: StandardNode,
  emailSenderAction: StandardNode,
  executeSubWorkflowAction: StandardNode,
  noSqlDatabaseAction: StandardNode,
  ifLogic: StandardNode,
  switchLogic: StandardNode,
  loopLogic: StandardNode,
  mergeLogic: StandardNode,
  errorCatchLogic: StandardNode,
  waitLogic: StandardNode,
  mapperTransform: StandardNode,
  codeTransform: StandardNode,
  dateTimeTransform: StandardNode,
  dataConverterTransform: StandardNode,
  globalStateStorage: StandardNode,
  fileStorage: StandardNode,
  llmAi: StandardNode,
  chatMemoryAi: StandardNode,
  vectorStoreAi: StandardNode,
  agentAi: StandardNode,
  workflow: WorkflowNode,
}

type InsertEdgeRequest = {
  edgeId: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  position: { x: number; y: number }
}

type WorkflowEdgeData = {
  onRequestInsert?: (request: InsertEdgeRequest) => void
  condition?: unknown
}

type ExportedWorkflowNode = {
  node_id: string
  group: string
  type: string
  name: string
  description: string
  config: Record<string, unknown>
  position_x: number
  position_y: number
}

type ExportedWorkflowEdge = {
  edge_id: string
  from_node_id: string
  to_node_id: string
  condition: Record<string, unknown> | null
}

type ExportedWorkflow = {
  name: string
  description: string
  active: boolean
  definition: {
    nodes: Array<{
      node_id: string
      type: string
      config: Record<string, unknown>
      position_x: number
      position_y: number
    }>
    edges: Array<{
      from_node_id: string
      to_node_id: string
      condition: Record<string, unknown> | null
    }>
    variables: Record<string, unknown>
  }
}

const exportedNodeTypeByKind: Record<WorkflowNodeKind, string> = {
  cronTrigger: "cron",
  webhookTrigger: "webhook",
  manualTrigger: "manual",
  subWorkflowTrigger: "sub_workflow",
  eventQueueTrigger: "event_queue",
  httpRequestAction: "http_request",
  sqlDatabaseAction: "sql_database",
  emailSenderAction: "email_sender",
  executeSubWorkflowAction: "execute_subworkflow",
  noSqlDatabaseAction: "nosql_database",
  ifLogic: "if",
  switchLogic: "switch",
  loopLogic: "loop",
  mergeLogic: "merge",
  errorCatchLogic: "error_catch",
  waitLogic: "wait",
  mapperTransform: "mapper",
  codeTransform: "code",
  dateTimeTransform: "date_time",
  dataConverterTransform: "data_converter",
  globalStateStorage: "global_state",
  fileStorage: "file_storage",
  llmAi: "llm",
  chatMemoryAi: "chat_memory",
  vectorStoreAi: "vector_store",
  agentAi: "agent",
}

function getNodeGroup(kind: WorkflowNodeKind): string {
  if (isTriggerKind(kind)) return "trigger"
  if (isActionKind(kind)) return "action"
  if (isLogicKind(kind)) return "logic"
  if (isTransformationKind(kind)) return "transformation"
  if (isStorageKind(kind)) return "storage"
  if (isAIKind(kind)) return "ai"
  return ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseObjectFromUnknown(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function parseCondition(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value
  if (typeof value === "string") return parseObjectFromUnknown(value)
  return null
}

function keyValueArrayToRecord(value: unknown): Record<string, string> | null {
  if (!Array.isArray(value)) return null
  const output: Record<string, string> = {}
  for (const item of value) {
    if (!isRecord(item)) continue
    const key = typeof item.key === "string" ? item.key.trim() : ""
    const rawValue = typeof item.value === "string" ? item.value : String(item.value ?? "")
    if (!key) continue
    output[key] = rawValue
  }
  return Object.keys(output).length > 0 ? output : null
}

function keyValueArrayToAnyRecord(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null
  const output: Record<string, unknown> = {}
  for (const item of value) {
    if (!isRecord(item)) continue
    const key = typeof item.key === "string" ? item.key.trim() : ""
    if (!key) continue
    output[key] = item.value ?? ""
  }
  return Object.keys(output).length > 0 ? output : null
}

function normalizeNodeConfig(kind: WorkflowNodeKind, rawConfig: unknown): Record<string, unknown> {
  const config = isRecord(rawConfig) ? rawConfig : {}

  switch (kind) {
    case "cronTrigger":
      return {
        expression: typeof config.expression === "string" ? config.expression : "*/5 * * * *",
        timezone: typeof config.timezone === "string" ? config.timezone : "UTC",
      }
    case "webhookTrigger":
      return {
        path: typeof config.path === "string" ? config.path : "",
        method: typeof config.method === "string" ? config.method : "POST",
        response_mode: typeof config.response_mode === "string" ? config.response_mode : "on_received",
        response_code: typeof config.response_code === "number" ? config.response_code : 200,
        auth_type: typeof config.auth_type === "string" ? config.auth_type : "none",
      }
    case "manualTrigger":
      return {
        inject_data: Boolean(config.inject_data),
        mock_payload: parseObjectFromUnknown(config.mock_payload),
      }
    case "subWorkflowTrigger":
      return {
        expected_inputs: Array.isArray(config.expected_inputs)
          ? config.expected_inputs.filter((item): item is string => typeof item === "string")
          : null,
        response_data: typeof config.response_data === "string" ? config.response_data : "all_data",
      }
    case "eventQueueTrigger":
      return {
        queue_provider: typeof config.queue_provider === "string" ? config.queue_provider : "rabbitmq",
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        queue_name: typeof config.queue_name === "string" ? config.queue_name : "",
        auto_ack: Boolean(config.auto_ack),
        max_retries: typeof config.max_retries === "number" ? config.max_retries : 3,
        message_property: typeof config.message_property === "string" ? config.message_property : "message_body",
      }
    case "httpRequestAction":
      return {
        url: typeof config.url === "string" ? config.url : "",
        method: typeof config.method === "string" ? config.method : "GET",
        credential_id: typeof config.credential_id === "string" && config.credential_id.trim() ? config.credential_id : null,
        headers: keyValueArrayToRecord(config.headers),
        query_params: keyValueArrayToRecord(config.query_params),
        body: parseObjectFromUnknown(config.body),
        timeout: typeof config.timeout === "number" ? config.timeout : 30,
        ignore_ssl_errors: Boolean(config.ignore_ssl_errors),
      }
    case "sqlDatabaseAction":
      return {
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        operation: typeof config.operation === "string" ? config.operation : "SELECT",
        query: typeof config.query === "string" ? config.query : "",
        parameters: keyValueArrayToAnyRecord(config.parameters),
      }
    case "emailSenderAction":
      return {
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        to_address: typeof config.to_address === "string" ? config.to_address : "",
        cc_address: typeof config.cc_address === "string" && config.cc_address.trim() ? config.cc_address : null,
        bcc_address: typeof config.bcc_address === "string" && config.bcc_address.trim() ? config.bcc_address : null,
        subject: typeof config.subject === "string" ? config.subject : "",
        body_text: typeof config.body_text === "string" && config.body_text.trim() ? config.body_text : null,
        body_html: typeof config.body_html === "string" && config.body_html.trim() ? config.body_html : null,
        attachments_keys: Array.isArray(config.attachments_keys)
          ? config.attachments_keys.filter((item): item is string => typeof item === "string")
          : null,
      }
    case "executeSubWorkflowAction":
      return {
        workflow_id: typeof config.workflow_id === "string" ? config.workflow_id : "",
        wait_for_response: Boolean(config.wait_for_response),
        pass_all_data: Boolean(config.pass_all_data),
        mapped_inputs: keyValueArrayToAnyRecord(config.mapped_inputs),
      }
    case "noSqlDatabaseAction":
      return {
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        database_type: typeof config.database_type === "string" ? config.database_type : "mongodb",
        operation: typeof config.operation === "string" ? config.operation : "find",
        collection_name: typeof config.collection_name === "string" ? config.collection_name : "",
        query: parseObjectFromUnknown(config.query),
        document: parseObjectFromUnknown(config.document),
        upsert_key: typeof config.upsert_key === "string" && config.upsert_key.trim() ? config.upsert_key : null,
        timeout: typeof config.timeout === "number" ? config.timeout : 30,
      }
    case "ifLogic":
      return {
        combine_mode: typeof config.combine_mode === "string" ? config.combine_mode : "AND",
        conditions: Array.isArray(config.conditions)
          ? config.conditions
              .filter((item): item is Record<string, unknown> => isRecord(item))
              .map((item) => ({
                left_operand: typeof item.left_operand === "string" ? item.left_operand : "",
                operator: typeof item.operator === "string" ? item.operator : "==",
                right_operand:
                  item.operator === "is_empty"
                    ? null
                    : typeof item.right_operand === "string" && item.right_operand.trim()
                      ? item.right_operand
                      : null,
              }))
          : [],
      }
    case "switchLogic":
      return {
        input_value: typeof config.input_value === "string" ? config.input_value : "",
        routes: Array.isArray(config.routes)
          ? config.routes
              .filter((item): item is Record<string, unknown> => isRecord(item))
              .map((item) => ({
                route_name: typeof item.route_name === "string" ? item.route_name : "",
                operator: typeof item.operator === "string" ? item.operator : "==",
                compare_value: typeof item.compare_value === "string" ? item.compare_value : "",
              }))
          : [],
        enable_fallback: Boolean(config.enable_fallback),
      }
    case "loopLogic":
      return {
        source_array: typeof config.source_array === "string" ? config.source_array : "",
        batch_size: typeof config.batch_size === "number" ? config.batch_size : 1,
        exit_on_error: Boolean(config.exit_on_error),
      }
    case "mergeLogic":
      return {
        mode: typeof config.mode === "string" ? config.mode : "wait_all",
        data_strategy: typeof config.data_strategy === "string" ? config.data_strategy : "merge_by_key",
      }
    case "errorCatchLogic":
      return {
        catch_all: Boolean(config.catch_all),
        error_types: Array.isArray(config.error_types)
          ? config.error_types.filter((item): item is string => typeof item === "string")
          : null,
        retry_enabled: Boolean(config.retry_enabled),
        retry_count: typeof config.retry_count === "number" ? config.retry_count : 3,
        retry_delay_seconds: typeof config.retry_delay_seconds === "number" ? config.retry_delay_seconds : 5,
        error_property: typeof config.error_property === "string" ? config.error_property : "error_info",
      }
    case "waitLogic": {
      const waitType = typeof config.wait_type === "string" ? config.wait_type : "fixed_duration"
      return {
        wait_type: waitType,
        duration_seconds: waitType === "fixed_duration" && typeof config.duration_seconds === "number" ? config.duration_seconds : null,
        target_time: waitType === "until_time" && typeof config.target_time === "string" && config.target_time.trim() ? config.target_time : null,
        condition_expression:
          waitType === "until_condition" && typeof config.condition_expression === "string" && config.condition_expression.trim()
            ? config.condition_expression
            : null,
        condition_check_interval: typeof config.condition_check_interval === "number" ? config.condition_check_interval : 10,
      }
    }
    case "globalStateStorage":
      return {
        operation: typeof config.operation === "string" ? config.operation.toLowerCase() : "get",
        scope: typeof config.scope === "string" ? config.scope.toLowerCase() : "workflow",
        key: typeof config.key === "string" ? config.key : "",
        value: typeof config.value === "string" && config.value.trim() ? config.value : null,
        target_property:
          typeof config.target_property === "string" && config.target_property.trim() ? config.target_property : "state_value",
      }
    case "fileStorage":
      return {
        operation: typeof config.operation === "string" ? config.operation.toLowerCase() : "read",
        file_path: typeof config.file_path === "string" ? config.file_path : "",
        source_binary_property:
          typeof config.source_binary_property === "string" && config.source_binary_property.trim()
            ? config.source_binary_property
            : null,
        target_binary_property:
          typeof config.target_binary_property === "string" && config.target_binary_property.trim()
            ? config.target_binary_property
            : "file_data",
        fail_on_missing: Boolean(config.fail_on_missing),
      }
    case "mapperTransform":
      return {
        keep_only_set_fields: Boolean(config.keep_only_set_fields),
        assignments: Array.isArray(config.assignments)
          ? config.assignments
              .filter((item): item is Record<string, unknown> => isRecord(item))
              .map((item) => ({
                target_field: typeof item.target_field === "string" ? item.target_field : "",
                source_value: typeof item.source_value === "string" ? item.source_value : "",
                type: typeof item.type === "string" ? item.type : "string",
              }))
          : [],
      }
    case "codeTransform":
      return {
        language: config.language === "python" ? "python" : "python",
        code: typeof config.code === "string" ? config.code : "",
        run_once_for_all: Boolean(config.run_once_for_all),
      }
    case "dateTimeTransform":
      return {
        property_to_format: typeof config.property_to_format === "string" ? config.property_to_format : "",
        target_property: typeof config.target_property === "string" ? config.target_property : "",
        from_format: typeof config.from_format === "string" ? config.from_format : "auto",
        to_format: typeof config.to_format === "string" ? config.to_format : "",
        from_timezone: typeof config.from_timezone === "string" ? config.from_timezone : "UTC",
        to_timezone: typeof config.to_timezone === "string" ? config.to_timezone : "UTC",
      }
    case "dataConverterTransform":
      return {
        input_format: typeof config.input_format === "string" ? config.input_format : "json",
        output_format: typeof config.output_format === "string" ? config.output_format : "json",
        source_property: typeof config.source_property === "string" ? config.source_property : "data",
        target_property: typeof config.target_property === "string" ? config.target_property : "data_converted",
        options: keyValueArrayToAnyRecord(config.options),
      }
    case "llmAi":
      return {
        provider: typeof config.provider === "string" ? config.provider : "openai",
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        model_name: typeof config.model_name === "string" ? config.model_name : "gpt-4o",
        system_prompt: typeof config.system_prompt === "string" ? config.system_prompt : "Você é um assistente útil.",
        user_prompt: typeof config.user_prompt === "string" ? config.user_prompt : "",
        temperature: typeof config.temperature === "number" ? config.temperature : 0.7,
        max_tokens: typeof config.max_tokens === "number" && config.max_tokens > 0 ? config.max_tokens : null,
        json_mode: Boolean(config.json_mode),
      }
    case "chatMemoryAi":
      return {
        session_id: typeof config.session_id === "string" ? config.session_id : "",
        strategy: typeof config.strategy === "string" ? config.strategy : "buffer",
        window_size: typeof config.window_size === "number" ? config.window_size : 10,
        target_property: typeof config.target_property === "string" ? config.target_property : "chat_history",
      }
    case "vectorStoreAi":
      return {
        database_provider: typeof config.database_provider === "string" ? config.database_provider : "qdrant",
        credential_id: typeof config.credential_id === "string" ? config.credential_id : "",
        operation: typeof config.operation === "string" ? config.operation.toLowerCase() : "search",
        index_name: typeof config.index_name === "string" ? config.index_name : "",
        embedding_model: typeof config.embedding_model === "string" ? config.embedding_model : "text-embedding-3-small",
        search_query: typeof config.search_query === "string" && config.search_query.trim() ? config.search_query : null,
        top_k: typeof config.top_k === "number" ? config.top_k : 4,
        document_text: typeof config.document_text === "string" && config.document_text.trim() ? config.document_text : null,
        metadata: keyValueArrayToAnyRecord(config.metadata),
      }
    case "agentAi":
      return {
        llm_node_reference: typeof config.llm_node_reference === "string" ? config.llm_node_reference : "",
        agent_role: typeof config.agent_role === "string" ? config.agent_role : "",
        allowed_tools: Array.isArray(config.allowed_tools)
          ? config.allowed_tools.filter((item): item is string => typeof item === "string")
          : [],
        max_iterations: typeof config.max_iterations === "number" ? config.max_iterations : 5,
        require_human_approval: Boolean(config.require_human_approval),
      }
  }
}

function WorkflowEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<WorkflowEdgeData>>) {
  const { setEdges } = useReactFlow()
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const removeEdge = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setEdges((eds) => eds.filter((edge) => edge.id !== id))
    },
    [id, setEdges]
  )

  const requestInsert = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      data?.onRequestInsert?.({
        edgeId: id,
        source,
        target,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        position: { x: labelX, y: labelY },
      })
    },
    [data, id, labelX, labelY, source, sourceHandleId, target, targetHandleId]
  )

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: "pointer" }} />
      <BaseEdge id={id} path={edgePath} style={{ stroke: "color-mix(in oklab, var(--foreground) 35%, transparent)", strokeWidth: 1.5 }} />
      {hovered ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <button
              type="button"
              onClick={requestInsert}
              title="Adicionar nó no meio"
              aria-label="Adicionar nó no meio"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={removeEdge}
              title="Remover ligação"
              aria-label="Remover ligação"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  )
}

const edgeTypes: EdgeTypes = {
  workflow: WorkflowEdge,
}

type PaletteItem = {
  kind: WorkflowNodeKind
  label: string
  description: string
}

type PaletteGroup = {
  key: string
  title: string
  shortTitle: string
  helper: string
  icon: React.ElementType
  accent: string
  gradient?: string
  items: PaletteItem[]
}

const palette: PaletteGroup[] = [
  {
    key: "triggers",
    title: "Gatilhos (Triggers)",
    shortTitle: "Gatilhos",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: Zap,
    accent: "color-mix(in oklab, var(--info) 72%, var(--primary) 28%)",
    items: [
      {
        kind: "cronTrigger",
        label: "Cron",
        description: "Dispara o fluxo em horarios definidos por expressao cron.",
      },
      {
        kind: "webhookTrigger",
        label: "Webhook",
        description: "Inicia o fluxo ao receber uma chamada HTTP.",
      },
      {
        kind: "manualTrigger",
        label: "Manual",
        description: "Permite iniciar o fluxo manualmente sob demanda.",
      },
      {
        kind: "subWorkflowTrigger",
        label: "SubWorkflow Trigger",
        description: "Inicia quando acionado por um fluxo pai.",
      },
      {
        kind: "eventQueueTrigger",
        label: "Event Queue Trigger",
        description: "Consome eventos de um topico de mensageria.",
      },
    ],
  },
  {
    key: "actions",
    title: "AÃ§Ãµes e IntegraÃ§Ãµes (Actions)",
    shortTitle: "AÃ§Ãµes",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: ArrowLeftRight,
    accent: "color-mix(in oklab, var(--success) 74%, var(--info) 26%)",
    items: [
      {
        kind: "httpRequestAction",
        label: "RequisiÃ§Ã£o HTTP",
        description: "Dispara chamadas para APIs externas.",
      },
      {
        kind: "sqlDatabaseAction",
        label: "SQL Database",
        description: "Executa operacoes SQL em bancos relacionais.",
      },
      {
        kind: "emailSenderAction",
        label: "Email Sender",
        description: "Envia emails com conteudo dinamico.",
      },
      {
        kind: "executeSubWorkflowAction",
        label: "Execute SubWorkflow",
        description: "Chama e executa um fluxo filho.",
      },
      {
        kind: "noSqlDatabaseAction",
        label: "NoSQL Database",
        description: "Executa operacoes em banco de documentos.",
      },
    ],
  },
  {
    key: "logic",
    title: "Lógica e Controle (Logic)",
    shortTitle: "Lógica",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: GitBranch,
    accent: "var(--warning)",
    items: [
      {
        kind: "ifLogic",
        label: "If",
        description: "Executa ramificaÃ§Ãµes com base em condiÃ§Ã£o booleana.",
      },
      {
        kind: "switchLogic",
        label: "Switch",
        description: "Roteia por mÃºltiplos casos de uma variÃ¡vel.",
      },
      {
        kind: "loopLogic",
        label: "Loop",
        description: "Itera sobre uma coleÃ§Ã£o de itens.",
      },
      {
        kind: "mergeLogic",
        label: "Merge",
        description: "Une dois ou mais caminhos em um fluxo.",
      },
      {
        kind: "errorCatchLogic",
        label: "Error Catch",
        description: "Separa o caminho normal e o caminho de erro.",
      },
      {
        kind: "waitLogic",
        label: "Wait",
        description: "Pausa a execuÃ§Ã£o por um tempo definido.",
      },
    ],
  },
  {
    key: "transformation",
    title: "TransformaÃ§Ã£o de Dados (Transformation)",
    shortTitle: "TransformaÃ§Ã£o",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: WandSparkles,
    accent: "var(--info)",
    items: [
      {
        kind: "mapperTransform",
        label: "Mapper",
        description: "Mapeia e renomeia campos do payload.",
      },
      {
        kind: "codeTransform",
        label: "Code",
        description: "Executa codigo para transformar os dados.",
      },
      {
        kind: "dateTimeTransform",
        label: "DateTime",
        description: "Converte e formata datas entre padrÃµes.",
      },
      {
        kind: "dataConverterTransform",
        label: "Data Converter",
        description: "Converte dados entre formatos estruturados.",
      },
    ],
  },
  {
    key: "storage",
    title: "Memória e Estado (Storage)",
    shortTitle: "Estado",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: Database,
    accent: "color-mix(in oklab, var(--muted-foreground) 80%, var(--secondary) 20%)",
    items: [
      {
        kind: "globalStateStorage",
        label: "Global State",
        description: "LÃª e grava estado global por chave.",
      },
      {
        kind: "fileStorage",
        label: "File Storage",
        description: "Le e grava arquivos no armazenamento.",
      },
    ],
  },
  {
    key: "ai",
    title: "InteligÃªncia Artificial (Cognitive/AI)",
    shortTitle: "IA & Agentes",
    helper: "Selecione um nó para adicionar ao canvas.",
    icon: Sparkles,
    accent: "color-mix(in oklab, var(--destructive) 62%, var(--info) 38%)",
    gradient:
      "linear-gradient(135deg, color-mix(in oklab, var(--destructive) 78%, white 22%) 0%, color-mix(in oklab, var(--info) 70%, var(--destructive) 30%) 100%)",
    items: [
      {
        kind: "llmAi",
        label: "LLM",
        description: "Executa prompts com provedores de modelos.",
      },
      {
        kind: "chatMemoryAi",
        label: "Chat Memory",
        description: "Mantém histórico e janela de contexto da conversa.",
      },
      {
        kind: "vectorStoreAi",
        label: "Vector Store",
        description: "Busca e escrita de embeddings em Ã­ndice vetorial.",
      },
      {
        kind: "agentAi",
        label: "Agent",
        description: "Executa um agente com papel e ferramentas permitidas.",
      },
    ],
  },
]

function WorkflowCanvas({ flowName }: { flowName: string }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<WorkflowNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<WorkflowEdgeData>>([])
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [configNodeId, setConfigNodeId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeCategoryKey, setActiveCategoryKey] = useState(palette[0]?.key ?? "triggers")
  const [pendingInsert, setPendingInsert] = useState<InsertEdgeRequest | null>(null)
  const [pointerMode, setPointerMode] = useState<"select" | "pan">("pan")
  const [jsonModalOpen, setJsonModalOpen] = useState(false)

  const filteredPalette = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return palette
    return palette
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) => item.label.toLowerCase().includes(term) || item.description.toLowerCase().includes(term)
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search])

  const activeCategory = useMemo(
    () => filteredPalette.find((category) => category.key === activeCategoryKey) ?? filteredPalette[0] ?? null,
    [activeCategoryKey, filteredPalette]
  )

  const configNode = useMemo(
    () => nodes.find((node) => node.id === configNodeId) ?? null,
    [configNodeId, nodes]
  )

  const workflowJson = useMemo<ExportedWorkflow>(() => {
    const nodeIdMap = new Map<string, string>()
    for (const node of nodes) {
      nodeIdMap.set(node.id, (node.data as WorkflowNodeData).exportId ?? node.id)
    }

    const exportedNodes: ExportedWorkflowNode[] = nodes.map((node) => {
      const data = node.data as WorkflowNodeData
      return {
        node_id: nodeIdMap.get(node.id) ?? node.id,
        group: getNodeGroup(data.kind),
        type: exportedNodeTypeByKind[data.kind],
        name: data.label,
        description: data.description ?? "",
        config: normalizeNodeConfig(data.kind, data.config),
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
      }
    })

    const exportedEdges: ExportedWorkflowEdge[] = edges.map((edge) => ({
      edge_id: edge.id,
      from_node_id: nodeIdMap.get(edge.source) ?? edge.source,
      to_node_id: nodeIdMap.get(edge.target) ?? edge.target,
      condition: parseCondition(edge.data?.condition),
    }))

    return {
      name: flowName,
      description: "",
      active: true,
      definition: {
        nodes: exportedNodes.map((node) => ({
          node_id: node.node_id,
          type: node.type,
          config: node.config,
          position_x: node.position_x,
          position_y: node.position_y,
        })),
        edges: exportedEdges.map((edge) => ({
          from_node_id: edge.from_node_id,
          to_node_id: edge.to_node_id,
          condition: edge.condition,
        })),
        variables: {},
      },
    }
  }, [edges, flowName, nodes])

  const workflowJsonText = useMemo(() => JSON.stringify(workflowJson, null, 2), [workflowJson])

  const configNodeHeader = useMemo(() => {
    if (!configNode) return null
    const data = configNode.data as WorkflowNodeData
    const Icon = kindIcon[data.kind] ?? Workflow
    const accent = kindAccent[data.kind] ?? "var(--foreground)"
    return { Icon, accent, data }
  }, [configNode])

  const openNodeConfig = useCallback((nodeId: string) => {
    setConfigNodeId(nodeId)
  }, [])

  const updateNodeConfig = useCallback(
    (nodeId: string, config: ConfigurableNodeConfigByKind[ConfigurableNodeKind]) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...(node.data as WorkflowNodeData), config } }
            : node
        )
      )
    },
    [setNodes]
  )

  const updateNodeMeta = useCallback(
    (nodeId: string, patch: Pick<WorkflowNodeData, "label" | "description">) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...(node.data as WorkflowNodeData), ...patch } }
            : node
        )
      )
    },
    [setNodes]
  )

  const onRequestInsert = useCallback((request: InsertEdgeRequest) => {
    setPendingInsert(request)
    setPaletteOpen(true)
  }, [])

  const deleteSelectedElements = useCallback(() => {
    const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id))
    const hasSelectedEdges = edges.some((edge) => edge.selected)
    if (!selectedNodeIds.size && !hasSelectedEdges) return

    setNodes((currentNodes) => currentNodes.filter((node) => !selectedNodeIds.has(node.id)))
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => !edge.selected && !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)
      )
    )

    if (configNodeId && selectedNodeIds.has(configNodeId)) {
      setConfigNodeId(null)
    }
  }, [configNodeId, edges, nodes, setEdges, setNodes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return

      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName
        if (target.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
          return
        }
      }

      const hasSelectedNodes = nodes.some((node) => node.selected)
      const hasSelectedEdges = edges.some((edge) => edge.selected)
      if (!hasSelectedNodes && !hasSelectedEdges) return

      event.preventDefault()
      deleteSelectedElements()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deleteSelectedElements, edges, nodes])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "workflow",
            data: { onRequestInsert },
          },
          eds
        )
      )
    },
    [onRequestInsert, setEdges]
  )

  const addNode = useCallback(
    (item: PaletteItem) => {
      const nodeId = `node-${Date.now()}`
      const exportId = `node_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      const rect = wrapperRef.current?.getBoundingClientRect()
      const center = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

      const position = pendingInsert ? pendingInsert.position : screenToFlowPosition(center)
      const nodeTypeByKind: Record<WorkflowNodeKind, string> = {
        cronTrigger: "cronTrigger",
        webhookTrigger: "webhookTrigger",
        manualTrigger: "manualTrigger",
        subWorkflowTrigger: "subWorkflowTrigger",
        eventQueueTrigger: "eventQueueTrigger",
        httpRequestAction: "httpRequestAction",
        sqlDatabaseAction: "sqlDatabaseAction",
        emailSenderAction: "emailSenderAction",
        executeSubWorkflowAction: "executeSubWorkflowAction",
        noSqlDatabaseAction: "noSqlDatabaseAction",
        ifLogic: "ifLogic",
        switchLogic: "switchLogic",
        loopLogic: "loopLogic",
        mergeLogic: "mergeLogic",
        errorCatchLogic: "errorCatchLogic",
        waitLogic: "waitLogic",
        mapperTransform: "mapperTransform",
        codeTransform: "codeTransform",
        dateTimeTransform: "dateTimeTransform",
        dataConverterTransform: "dataConverterTransform",
        globalStateStorage: "globalStateStorage",
        fileStorage: "fileStorage",
        llmAi: "llmAi",
        chatMemoryAi: "chatMemoryAi",
        vectorStoreAi: "vectorStoreAi",
        agentAi: "agentAi",
      }

      setNodes((nds) => [
        ...nds,
        {
          id: nodeId,
          type: nodeTypeByKind[item.kind],
          position,
          data: {
            kind: item.kind,
            exportId,
            label: item.label,
            description: "",
            enabled: true,
            onOpenConfig: openNodeConfig,
            config: isTriggerKind(item.kind)
              ? getDefaultTriggerConfig(item.kind)
              : isActionKind(item.kind)
                ? getDefaultActionConfig(item.kind)
                : isLogicKind(item.kind)
                  ? getDefaultLogicConfig(item.kind)
                  : isStorageKind(item.kind)
                    ? getDefaultStorageConfig(item.kind)
                    : isTransformationKind(item.kind)
                      ? getDefaultTransformationConfig(item.kind)
                      : isAIKind(item.kind)
                        ? getDefaultAIConfig(item.kind)
                      : undefined,
          },
        },
      ])

      if (pendingInsert) {
        const stamp = Date.now()
        setEdges((eds) => {
          const remaining = eds.filter((edge) => edge.id !== pendingInsert.edgeId)
          return [
            ...remaining,
            {
              id: `e-${pendingInsert.source}-${nodeId}-${stamp}`,
              source: pendingInsert.source,
              sourceHandle: pendingInsert.sourceHandle ?? undefined,
              target: nodeId,
              type: "workflow",
              data: { onRequestInsert },
            },
            {
              id: `e-${nodeId}-${pendingInsert.target}-${stamp + 1}`,
              source: nodeId,
              target: pendingInsert.target,
              targetHandle: pendingInsert.targetHandle ?? undefined,
              type: "workflow",
              data: { onRequestInsert },
            },
          ]
        })
        setPendingInsert(null)
      }

      setPaletteOpen(false)
      setSearch("")
    },
    [onRequestInsert, openNodeConfig, pendingInsert, screenToFlowPosition, setEdges, setNodes]
  )

  return (
    <div ref={wrapperRef} className="relative h-[calc(100vh-3rem)] w-full overflow-hidden">
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent"
          onClick={() => setPaletteOpen(true)}
          aria-label="Adicionar nó"
        >
          <Plus className="size-5" />
        </button>

        <div className="inline-flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setPointerMode("select")}
            aria-label="Modo seleção"
            title="Modo seleção"
            aria-pressed={pointerMode === "select"}
            className={`inline-flex size-9 items-center justify-center border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
              pointerMode === "select" ? "bg-accent text-foreground" : ""
            }`}
          >
            <MousePointer className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPointerMode("pan")}
            aria-label="Modo mão"
            title="Modo mão"
            aria-pressed={pointerMode === "pan"}
            className={`inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
              pointerMode === "pan" ? "bg-accent text-foreground" : ""
            }`}
          >
            <Hand className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setJsonModalOpen(true)}
          aria-label="Visualizar JSON do fluxo"
          title="Visualizar JSON do fluxo"
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <Braces className="size-4" />
          JSON
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "workflow", data: { onRequestInsert } }}
        fitView
        proOptions={{ hideAttribution: true }}
        panOnDrag={pointerMode === "pan"}
        selectionOnDrag={pointerMode === "select"}
        style={{ backgroundColor: "var(--background)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={26}
          size={1.2}
          color="color-mix(in oklab, var(--foreground) 12%, transparent)"
        />
        <Controls
          position="bottom-left"
          className="!border-border !bg-card [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent [&>button:hover]:!text-foreground"
        />
      </ReactFlow>

      {jsonModalOpen ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
          onClick={() => setJsonModalOpen(false)}
        >
          <div
            className="flex h-[min(80vh,760px)] w-[min(980px,95vw)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">JSON do fluxo</h2>
                <p className="text-xs text-muted-foreground">{flowName}</p>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar JSON do fluxo"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-background p-4">
              <pre className="min-h-full rounded-lg border border-border bg-card p-3 font-mono text-xs leading-5 text-foreground">
                {workflowJsonText}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <button
            type="button"
            className="pointer-events-auto inline-flex min-w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40"
            onClick={() => setPaletteOpen(true)}
          >
            <Plus className="size-5" />
            Adicionar
          </button>
        </div>
      ) : null}

      {configNode &&
      (isTriggerKind((configNode.data as WorkflowNodeData).kind) ||
        isActionKind((configNode.data as WorkflowNodeData).kind) ||
        isLogicKind((configNode.data as WorkflowNodeData).kind) ||
        isStorageKind((configNode.data as WorkflowNodeData).kind) ||
        isTransformationKind((configNode.data as WorkflowNodeData).kind) ||
        isAIKind((configNode.data as WorkflowNodeData).kind)) ? (
        <div className="absolute right-0 top-0 z-40 h-full w-[560px] max-w-[92vw] overflow-hidden border-l border-border bg-card shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="relative border-b border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setConfigNodeId(null)}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fechar configurações"
              >
                <X className="size-4" />
              </button>

              <div className="pr-10">
                <div className="flex items-start gap-2">
                  {configNodeHeader ? (
                    <div
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: configNodeHeader.accent,
                      }}
                    >
                      {(() => {
                        const HeaderIcon = configNodeHeader.Icon
                        return <HeaderIcon className="size-3 text-white" />
                      })()}
                    </div>
                  ) : (
                    <div className="mt-0.5 size-6 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <input
                      value={(configNode.data as WorkflowNodeData).label}
                      onChange={(e) =>
                        updateNodeMeta(configNode.id, {
                          label: e.target.value,
                          description: (configNode.data as WorkflowNodeData).description,
                        })
                      }
                      placeholder="Nome do nó"
                      className="h-8 w-full bg-transparent px-0 text-sm font-semibold leading-none text-foreground outline-none placeholder:text-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>

                <input
                  value={(configNode.data as WorkflowNodeData).description ?? ""}
                  onChange={(e) =>
                    updateNodeMeta(configNode.id, {
                      label: (configNode.data as WorkflowNodeData).label,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add descrição"
                  className="mt-1 h-8 w-full bg-transparent px-0 text-xs leading-none text-muted-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {(configNode.data as WorkflowNodeData).kind === "cronTrigger" ? (
                <CronNodeConfigPanel
                  key={configNode.id}
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as CronNodeConfig | undefined) ??
                      getDefaultTriggerConfig("cronTrigger")) as CronNodeConfig
                  }
                  accentColor={configNodeHeader?.accent}
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "webhookTrigger" ? (
                <WebhookNodeConfigPanel
                  key={configNode.id}
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as WebhookNodeConfig | undefined) ??
                      getDefaultTriggerConfig("webhookTrigger")) as WebhookNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "manualTrigger" ? (
                <ManualNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as ManualNodeConfig | undefined) ??
                      getDefaultTriggerConfig("manualTrigger")) as ManualNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "subWorkflowTrigger" ? (
                <SubWorkflowTriggerConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as SubWorkflowTriggerConfig | undefined) ??
                      getDefaultTriggerConfig("subWorkflowTrigger")) as SubWorkflowTriggerConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "eventQueueTrigger" ? (
                <EventQueueTriggerConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as EventQueueTriggerConfig | undefined) ??
                      getDefaultTriggerConfig("eventQueueTrigger")) as EventQueueTriggerConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "httpRequestAction" ? (
                <HttpRequestNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as HttpRequestNodeConfig | undefined) ??
                      getDefaultActionConfig("httpRequestAction")) as HttpRequestNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "sqlDatabaseAction" ? (
                <SqlDatabaseNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as SqlDatabaseNodeConfig | undefined) ??
                      getDefaultActionConfig("sqlDatabaseAction")) as SqlDatabaseNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "emailSenderAction" ? (
                <EmailSenderNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as EmailSenderNodeConfig | undefined) ??
                      getDefaultActionConfig("emailSenderAction")) as EmailSenderNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "executeSubWorkflowAction" ? (
                <ExecuteSubWorkflowNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as ExecuteSubWorkflowNodeConfig | undefined) ??
                      getDefaultActionConfig("executeSubWorkflowAction")) as ExecuteSubWorkflowNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "noSqlDatabaseAction" ? (
                <NoSQLDatabaseNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as NoSQLDatabaseNodeConfig | undefined) ??
                      getDefaultActionConfig("noSqlDatabaseAction")) as NoSQLDatabaseNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "ifLogic" ? (
                <IfNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as IfNodeConfig | undefined) ??
                      getDefaultLogicConfig("ifLogic")) as IfNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "switchLogic" ? (
                <SwitchNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as SwitchNodeConfig | undefined) ??
                      getDefaultLogicConfig("switchLogic")) as SwitchNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "loopLogic" ? (
                <LoopNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as LoopNodeConfig | undefined) ??
                      getDefaultLogicConfig("loopLogic")) as LoopNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "mergeLogic" ? (
                <MergeNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as MergeNodeConfig | undefined) ??
                      getDefaultLogicConfig("mergeLogic")) as MergeNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "errorCatchLogic" ? (
                <ErrorCatchNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as ErrorCatchNodeConfig | undefined) ??
                      getDefaultLogicConfig("errorCatchLogic")) as ErrorCatchNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "waitLogic" ? (
                <WaitNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as WaitNodeConfig | undefined) ??
                      getDefaultLogicConfig("waitLogic")) as WaitNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "globalStateStorage" ? (
                <GlobalStateNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as GlobalStateNodeConfig | undefined) ??
                      getDefaultStorageConfig("globalStateStorage")) as GlobalStateNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "fileStorage" ? (
                <FileStorageNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as FileStorageNodeConfig | undefined) ??
                      getDefaultStorageConfig("fileStorage")) as FileStorageNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "mapperTransform" ? (
                <MapperNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as MapperNodeConfig | undefined) ??
                      getDefaultTransformationConfig("mapperTransform")) as MapperNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "codeTransform" ? (
                <CodeNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as CodeNodeConfig | undefined) ??
                      getDefaultTransformationConfig("codeTransform")) as CodeNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "dateTimeTransform" ? (
                <DateTimeNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as DateTimeNodeConfig | undefined) ??
                      getDefaultTransformationConfig("dateTimeTransform")) as DateTimeNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "dataConverterTransform" ? (
                <DataConverterNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as DataConverterNodeConfig | undefined) ??
                      getDefaultTransformationConfig("dataConverterTransform")) as DataConverterNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "llmAi" ? (
                <LLMNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as LLMNodeConfig | undefined) ??
                      getDefaultAIConfig("llmAi")) as LLMNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "chatMemoryAi" ? (
                <ChatMemoryNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as ChatMemoryNodeConfig | undefined) ??
                      getDefaultAIConfig("chatMemoryAi")) as ChatMemoryNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "vectorStoreAi" ? (
                <VectorStoreNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as VectorStoreNodeConfig | undefined) ??
                      getDefaultAIConfig("vectorStoreAi")) as VectorStoreNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}

              {(configNode.data as WorkflowNodeData).kind === "agentAi" ? (
                <AgentNodeConfigPanel
                  nodeData={
                    (((configNode.data as WorkflowNodeData).config as AgentNodeConfig | undefined) ??
                      getDefaultAIConfig("agentAi")) as AgentNodeConfig
                  }
                  onUpdate={(next) => updateNodeConfig(configNode.id, next)}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {paletteOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nós, integrações ou ferramentas..."
                className="h-8 flex-1 rounded-md border border-border bg-background px-2.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/20"
                autoFocus
              />
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setPaletteOpen(false)
                  setSearch("")
                  setActiveCategoryKey(palette[0]?.key ?? "triggers")
                }}
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex h-[330px] min-h-[330px]">
              <aside className="w-[180px] shrink-0 border-r border-border p-2">
                <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Categorias
                </div>
                <div className="space-y-1">
                  {filteredPalette.map((category) => {
                    const TabIcon = category.icon
                    const isActive = activeCategory?.key === category.key
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => setActiveCategoryKey(category.key)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                          isActive
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        }`}
                      >
                        <span className="inline-flex size-6 items-center justify-center">
                          <TabIcon
                            className="size-3.5"
                            style={{
                              color: isActive
                                ? category.accent
                                : `color-mix(in oklab, ${category.accent} 70%, var(--muted-foreground))`,
                            }}
                          />
                        </span>
                        <span className="text-xs font-medium">{category.shortTitle}</span>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <section className="flex-1 px-3 py-3">
                {activeCategory ? (
                  <>
                    <div className="mb-2">
                      <h3 className="text-xl font-semibold text-foreground">{activeCategory.shortTitle}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{activeCategory.helper}</p>
                    </div>
                    <div className="max-h-[255px] overflow-auto pr-1">
                      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                        {activeCategory.items.map((item) => {
                          const Icon = kindIcon[item.kind]
                          const accent = kindAccent[item.kind]
                          return (
                            <button
                              key={item.kind}
                              type="button"
                              onClick={() => addNode(item)}
                              className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-foreground/20 hover:bg-accent/40"
                            >
                              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                                <Icon className="size-4" style={{ color: accent }} />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">{item.label}</div>
                                <div className="line-clamp-2 text-xs text-muted-foreground">{item.description}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado para essa busca.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function NovoFluxoPage() {
  const { setConfig, clear } = useDashboardHeader()
  const [flowName, setFlowName] = useState("Novo fluxo")

  const handleSave = useCallback(() => {}, [])
  const handleRun = useCallback(() => {}, [])

  useEffect(() => {
    setConfig({
      breadcrumb: (
        <input
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          placeholder="Nome do fluxo"
          className="h-7 w-[240px] rounded-md border border-transparent bg-background/60 px-2 text-xs font-medium text-foreground outline-none transition-all hover:border-border focus:border-border focus:bg-background focus:ring-1 focus:ring-primary/20"
        />
      ),
      actions: [
        { key: "save", label: "Salvar fluxo", icon: Save, onClick: handleSave },
        { key: "run", label: "Executar fluxo", icon: Play, onClick: handleRun },
      ],
    })
  }, [flowName, handleSave, handleRun, setConfig])

  useEffect(() => {
    return () => clear()
  }, [clear])

  return (
    <div className="-m-4 sm:-m-6">
      <ReactFlowProvider>
        <WorkflowCanvas flowName={flowName} />
      </ReactFlowProvider>
    </div>
  )
}

