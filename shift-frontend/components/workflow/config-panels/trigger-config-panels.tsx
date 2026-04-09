"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Copy, RefreshCw } from "lucide-react"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type ResponseMode = "on_received" | "on_finished"
type AuthType = "none" | "basic_auth" | "header_token"
type SubWorkflowResponseData = "all_data" | "specific_node"
type QueueProvider = "rabbitmq" | "kafka" | "aws_sqs" | "azure_servicebus"
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
type QueueOperation = "SEARCH" | "UPSERT"
type CronScheduleKind =
  | "every_5_min"
  | "every_10_min"
  | "every_15_min"
  | "every_30_min"
  | "every_2_hours"
  | "every_3_hours"
  | "specific_time"
type CronWeekday = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT"

export type CronNodeConfig = {
  expression: string
  timezone: string
  schedule_kind?: CronScheduleKind
  specific_hour?: number
  specific_minute?: number
  all_weekdays?: boolean
  weekdays?: CronWeekday[]
  all_months?: boolean
  months?: number[]
  all_month_days?: boolean
  month_days?: number[]
}

export type WebhookNodeConfig = {
  path: string
  method: HttpMethod
  response_mode: ResponseMode
  response_code: number
  auth_type: AuthType
}

export type ManualNodeConfig = {
  inject_data: boolean
  mock_payload: string
}

export type SubWorkflowTriggerConfig = {
  expected_inputs: string[]
  response_data: SubWorkflowResponseData
  node_id: string
}

export type CredentialOption = {
  id: string
  label: string
}

export type EventQueueTriggerConfig = {
  queue_provider: QueueProvider
  credential_id: string
  queue_name: string
  auto_ack: boolean
  max_retries: number
  message_property: string
  credentials?: CredentialOption[]
  operation?: QueueOperation
  index_name?: string
}

const fieldLabelClass = "text-xs font-medium text-foreground"
const fieldClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition-all focus:ring-1 focus:ring-primary/20"
const textareaClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-primary/20"
const errorClass = "mt-1 text-xs text-destructive"
const sectionClass = "space-y-3 border-t border-border pt-4"

function PanelShell({ title, description, children, onSave, saveDisabled }: {
  title: string
  description: string
  children: React.ReactNode
  onSave: () => void
  saveDisabled?: boolean
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3">{children}</div>

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled}
          className="inline-flex h-8 items-center rounded-md border border-border bg-primary px-3 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

const weekdayOptions: Array<{ value: CronWeekday; label: string }> = [
  { value: "SUN", label: "DOM" },
  { value: "MON", label: "SEG" },
  { value: "TUE", label: "TER" },
  { value: "WED", label: "QUA" },
  { value: "THU", label: "QUI" },
  { value: "FRI", label: "SEX" },
  { value: "SAT", label: "SAB" },
]

const monthOptions: Array<{ value: number; label: string }> = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
]

const dayOfMonthOptions = Array.from({ length: 31 }, (_, index) => index + 1)

function normalizeCronConfig(nodeData: CronNodeConfig): Required<CronNodeConfig> {
  return {
    expression: nodeData.expression || "*/5 * * * *",
    timezone: nodeData.timezone || "America/Sao_Paulo",
    schedule_kind: nodeData.schedule_kind ?? "every_5_min",
    specific_hour: nodeData.specific_hour ?? 8,
    specific_minute: nodeData.specific_minute ?? 0,
    all_weekdays: nodeData.all_weekdays ?? true,
    weekdays: nodeData.weekdays ?? ["MON", "TUE", "WED", "THU", "FRI"],
    all_months: nodeData.all_months ?? true,
    months: nodeData.months ?? [],
    all_month_days: nodeData.all_month_days ?? true,
    month_days: nodeData.month_days ?? [],
  }
}

function buildCronExpression(form: Required<CronNodeConfig>) {
  let minute = "*"
  let hour = "*"

  if (form.schedule_kind === "every_5_min") minute = "*/5"
  if (form.schedule_kind === "every_10_min") minute = "*/10"
  if (form.schedule_kind === "every_15_min") minute = "*/15"
  if (form.schedule_kind === "every_30_min") minute = "*/30"
  if (form.schedule_kind === "every_2_hours") {
    minute = "0"
    hour = "*/2"
  }
  if (form.schedule_kind === "every_3_hours") {
    minute = "0"
    hour = "*/3"
  }
  if (form.schedule_kind === "specific_time") {
    minute = String(form.specific_minute)
    hour = String(form.specific_hour)
  }

  const dayOfMonth = form.all_month_days ? "*" : form.month_days.slice().sort((a, b) => a - b).join(",")
  const month = form.all_months ? "*" : form.months.slice().sort((a, b) => a - b).join(",")
  const dayOfWeek = form.all_weekdays ? "*" : form.weekdays.join(",")

  return `${minute} ${hour} ${dayOfMonth || "*"} ${month || "*"} ${dayOfWeek || "*"}`
}

type CronFieldMatcher =
  | { type: "any" }
  | { type: "value"; value: number }
  | { type: "step"; step: number; base: number }
  | { type: "list"; values: Set<number> }

function parseCronField(input: string, options?: { map?: Record<string, number> }): CronFieldMatcher {
  const trimmed = input.trim()
  if (!trimmed || trimmed === "*") return { type: "any" }

  if (trimmed.startsWith("*/")) {
    const step = Number(trimmed.slice(2))
    if (!Number.isFinite(step) || step <= 0) return { type: "any" }
    return { type: "step", step, base: 0 }
  }

  if (trimmed.includes(",")) {
    const values = new Set<number>()
    for (const raw of trimmed.split(",")) {
      const token = raw.trim()
      if (!token) continue
      const mapped = options?.map?.[token]
      const value = typeof mapped === "number" ? mapped : Number(token)
      if (Number.isFinite(value)) values.add(value)
    }
    if (values.size === 0) return { type: "any" }
    return { type: "list", values }
  }

  const mapped = options?.map?.[trimmed]
  const value = typeof mapped === "number" ? mapped : Number(trimmed)
  if (!Number.isFinite(value)) return { type: "any" }
  return { type: "value", value }
}

function matchesCronField(matcher: CronFieldMatcher, value: number) {
  if (matcher.type === "any") return true
  if (matcher.type === "value") return value === matcher.value
  if (matcher.type === "step") return value % matcher.step === matcher.base
  return matcher.values.has(value)
}

export function getNextExecutionTimes(expression: string, count: number) {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const weekdayMap: Record<string, number> = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
  }

  const minuteMatcher = parseCronField(parts[0])
  const hourMatcher = parseCronField(parts[1])
  const dayOfMonthMatcher = parseCronField(parts[2])
  const monthMatcher = parseCronField(parts[3])
  const dayOfWeekMatcher = parseCronField(parts[4], { map: weekdayMap })

  const results: Date[] = []
  const cursor = new Date()
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  const maxIterations = 1_000_000
  for (let i = 0; i < maxIterations && results.length < count; i += 1) {
    const minute = cursor.getMinutes()
    const hour = cursor.getHours()
    const dayOfMonth = cursor.getDate()
    const month = cursor.getMonth() + 1
    const dayOfWeek = cursor.getDay()

    const ok =
      matchesCronField(minuteMatcher, minute) &&
      matchesCronField(hourMatcher, hour) &&
      matchesCronField(dayOfMonthMatcher, dayOfMonth) &&
      matchesCronField(monthMatcher, month) &&
      matchesCronField(dayOfWeekMatcher, dayOfWeek)

    if (ok) results.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return results
}

type ComboboxOption<TValue extends string> = {
  value: TValue
  label: string
  helper?: string
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (next: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="relative">
      <select
        className={`${fieldClass} appearance-none pr-9`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

function SimpleCombobox<TValue extends string>({
  value,
  onChange,
  options,
}: {
  value: TValue
  onChange: (next: TValue) => void
  options: Array<ComboboxOption<TValue>>
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const current = options.find((opt) => opt.value === value) ?? options[0]
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(term) || opt.helper?.toLowerCase().includes(term))
  }, [options, query])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent/40"
      >
        <div className="min-w-0 text-left">
          <div className="truncate font-medium">{current?.label}</div>
          {current?.helper ? <div className="truncate text-[11px] text-muted-foreground">{current.helper}</div> : null}
        </div>
        <ChevronDown className="ml-3 size-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-10 z-20 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="border-b border-border p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setQuery("")
                }}
                className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <div className="text-sm font-medium text-foreground">{opt.label}</div>
                {opt.helper ? <div className="text-[11px] text-muted-foreground">{opt.helper}</div> : null}
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum resultado</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function CronNodeConfigPanel({
  nodeData,
  onUpdate,
  accentColor,
}: PanelProps<CronNodeConfig> & { accentColor?: string }) {
  const [form, setForm] = useState<Required<CronNodeConfig>>(normalizeCronConfig(nodeData))
  const [tab, setTab] = useState<"parameters" | "executions">("parameters")
  const onUpdateRef = useRef(onUpdate)

  const errors = useMemo(() => {
    const result: string[] = []

    if (form.schedule_kind === "specific_time") {
      if (form.specific_hour < 0 || form.specific_hour > 23 || Number.isNaN(form.specific_hour)) {
        result.push("Hora especifica deve estar entre 0 e 23.")
      }
      if (form.specific_minute < 0 || form.specific_minute > 59 || Number.isNaN(form.specific_minute)) {
        result.push("Minuto especifico deve estar entre 0 e 59.")
      }
    }

    if (!form.all_weekdays && form.weekdays.length === 0) {
      result.push("Selecione ao menos um dia da semana.")
    }

    if (!form.all_months && form.months.length === 0) {
      result.push("Selecione ao menos um mes.")
    }

    if (!form.all_month_days && form.month_days.length === 0) {
      result.push("Selecione ao menos um dia do mes.")
    }

    return result
  }, [form])

  const generatedExpression = useMemo(() => buildCronExpression(form), [form])
  const nextExecutions = useMemo(() => getNextExecutionTimes(generatedExpression, 5), [generatedExpression])

  const scheduleOptions: Array<ComboboxOption<CronScheduleKind>> = useMemo(() => {
    return [
      { value: "every_5_min", label: "A cada 5 min" },
      { value: "every_10_min", label: "A cada 10 min" },
      { value: "every_15_min", label: "A cada 15 min" },
      { value: "every_30_min", label: "A cada 30 min" },
      { value: "every_2_hours", label: "A cada 2 horas" },
      { value: "every_3_hours", label: "A cada 3 horas" },
      { value: "specific_time", label: "Horário específico", helper: "Defina um horário fixo" },
    ]
  }, [])

  const timeValue = useMemo(() => {
    const hh = String(form.specific_hour).padStart(2, "0")
    const mm = String(form.specific_minute).padStart(2, "0")
    return `${hh}:${mm}`
  }, [form.specific_hour, form.specific_minute])

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (errors.length > 0) return
    onUpdateRef.current({ ...form, expression: generatedExpression })
  }, [errors.length, form, generatedExpression])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("parameters")}
          className={`-mb-px px-1 pb-2 text-xs font-semibold transition-colors ${
            tab === "parameters"
              ? "border-b-2 text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={tab === "parameters" && accentColor ? { borderBottomColor: accentColor } : undefined}
        >
          Parâmetros
        </button>
        <button
          type="button"
          onClick={() => setTab("executions")}
          className={`-mb-px px-1 pb-2 text-xs font-semibold transition-colors ${
            tab === "executions"
              ? "border-b-2 text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={tab === "executions" && accentColor ? { borderBottomColor: accentColor } : undefined}
        >
          Próximas execuções
        </button>
      </div>

      {tab === "parameters" ? (
        <div className="space-y-4">
          <div>
            <label className={fieldLabelClass}>Frequência</label>
            <div className="mt-1.5">
              <SimpleCombobox<CronScheduleKind>
                value={form.schedule_kind}
                onChange={(next) => setForm((prev) => ({ ...prev, schedule_kind: next }))}
                options={scheduleOptions}
              />
            </div>
          </div>

          {form.schedule_kind === "specific_time" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fieldLabelClass}>Horário</label>
                <input
                  type="time"
                  className={`${fieldClass} mt-1.5`}
                  value={timeValue}
                  onChange={(e) => {
                    const [hh, mm] = e.target.value.split(":").map((v) => Number(v))
                    setForm((prev) => ({
                      ...prev,
                      specific_hour: Number.isFinite(hh) ? hh : prev.specific_hour,
                      specific_minute: Number.isFinite(mm) ? mm : prev.specific_minute,
                    }))
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Dias da semana</div>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.all_weekdays}
                  onChange={(e) => setForm((prev) => ({ ...prev, all_weekdays: e.target.checked }))}
                />
                Toda a semana
              </label>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {weekdayOptions.map((day) => {
                const selected = form.weekdays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={form.all_weekdays}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        weekdays: selected
                          ? prev.weekdays.filter((value) => value !== day.value)
                          : [...prev.weekdays, day.value],
                      }))
                    }
                    className={`h-8 rounded-md border px-1 text-[11px] font-semibold transition-colors ${
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent/40"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Meses</div>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.all_months}
                  onChange={(e) => setForm((prev) => ({ ...prev, all_months: e.target.checked }))}
                />
                Todos os meses
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {monthOptions.map((month) => {
                const selected = form.months.includes(month.value)
                return (
                  <button
                    key={month.value}
                    type="button"
                    disabled={form.all_months}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        months: selected ? prev.months.filter((item) => item !== month.value) : [...prev.months, month.value],
                      }))
                    }
                    className={`h-9 rounded-md border px-2 text-left text-xs font-semibold transition-colors ${
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent/40"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {month.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Dias do mês</div>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.all_month_days}
                  onChange={(e) => setForm((prev) => ({ ...prev, all_month_days: e.target.checked }))}
                />
                Todos os dias
              </label>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {dayOfMonthOptions.map((day) => {
                const selected = form.month_days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={form.all_month_days}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        month_days: selected ? prev.month_days.filter((value) => value !== day) : [...prev.month_days, day],
                      }))
                    }
                    className={`h-8 rounded-md border px-1 text-[11px] font-semibold transition-colors ${
                      selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:bg-accent/40"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Próximas 5 execuções</div>
          <div className="rounded-xl border border-border bg-background p-3">
            {nextExecutions.length ? (
              <ol className="space-y-1">
                {nextExecutions.map((date, index) => (
                  <li key={date.toISOString()} className="flex items-center gap-3 font-mono text-xs text-foreground">
                    <span className="w-6 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                    <span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short" }).format(date)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-muted-foreground">Sem previsões com os parâmetros atuais.</div>
            )}
          </div>
        </div>
      )}

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>
              {error}
            </p>
          ))}
        </div>
      ) : null}

    </div>
  )
}

export function WebhookNodeConfigPanel({ nodeData, onUpdate }: PanelProps<WebhookNodeConfig>) {
  const [activeUrl, setActiveUrl] = useState<"test" | "production">("test")
  const [form, setForm] = useState<WebhookNodeConfig>(nodeData)
  const onUpdateRef = useRef(onUpdate)
  const [copiedKey, setCopiedKey] = useState<"test" | "production" | null>(null)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  const normalizedPath = useMemo(() => {
    const raw = form.path.trim()
    const stripped = raw.replace(/^\/+/, "").replace(/\s+/g, "-")
    return stripped
  }, [form.path])

  useEffect(() => {
    if (normalizedPath && normalizedPath !== "api/pagamentos") return
    const generate = () => {
      const uuid = globalThis.crypto?.randomUUID?.()
      if (uuid) return uuid
      const buf = new Uint8Array(16)
      globalThis.crypto?.getRandomValues?.(buf)
      const hex = Array.from(buf)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    }
    setForm((prev) => ({ ...prev, path: generate() }))
  }, [normalizedPath])

  const pathError = useMemo(() => {
    if (!normalizedPath) return "Path não pode estar vazio."
    if (!/^[a-zA-Z0-9._~/-]+$/.test(normalizedPath))
      return "Use apenas letras, números e os caracteres . _ ~ / -"
    return ""
  }, [normalizedPath])

  const responseCodeError = useMemo(() => {
    if (Number.isNaN(form.response_code)) return "Status code inválido."
    if (form.response_code < 100 || form.response_code > 599) return "Status code deve estar entre 100 e 599."
    return ""
  }, [form.response_code])

  const errors = useMemo(() => {
    return [pathError, responseCodeError].filter(Boolean)
  }, [pathError, responseCodeError])

  const baseOrigin = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL
    if (fromEnv) {
      try {
        return new URL(fromEnv).origin
      } catch {
        return ""
      }
    }
    if (typeof window !== "undefined") return window.location.origin
    return ""
  }, [])

  const testUrl = useMemo(() => {
    if (!baseOrigin || !normalizedPath) return ""
    return `${baseOrigin}/webhook-test/${normalizedPath}`
  }, [baseOrigin, normalizedPath])

  const productionUrl = useMemo(() => {
    if (!baseOrigin || !normalizedPath) return ""
    return `${baseOrigin}/webhook/${normalizedPath}`
  }, [baseOrigin, normalizedPath])

  const copyToClipboard = async (key: "test" | "production") => {
    const value = key === "test" ? testUrl : productionUrl
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey(null), 1200)
    } catch {
      setCopiedKey(null)
    }
  }

  useEffect(() => {
    if (errors.length > 0) return
    onUpdateRef.current({
      ...form,
      path: normalizedPath,
    })
  }, [errors.length, form, normalizedPath])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveUrl("test")}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeUrl === "test" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            URL de Teste
          </button>
          <button
            type="button"
            onClick={() => setActiveUrl("production")}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              activeUrl === "production" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            URL de Produção
          </button>
        </div>

        <div className="rounded-xl border border-border bg-background px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-6 items-center rounded-md bg-muted px-2 text-[11px] font-semibold text-foreground">
              {form.method}
            </span>
            <div className="min-w-0 flex-1">
              <div className="break-all text-sm text-foreground">
                {activeUrl === "test" ? testUrl || "—" : productionUrl || "—"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(activeUrl)}
              className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Copiar URL"
              disabled={!(activeUrl === "test" ? testUrl : productionUrl)}
            >
              {copiedKey === activeUrl ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>HTTP Method</label>
          <SelectField
            value={form.method}
            onChange={(next) => setForm((prev) => ({ ...prev, method: next as HttpMethod }))}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
              { value: "PUT", label: "PUT" },
              { value: "DELETE", label: "DELETE" },
              { value: "PATCH", label: "PATCH" },
            ]}
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Responder</label>
          <SelectField
            value={form.response_mode}
            onChange={(next) => setForm((prev) => ({ ...prev, response_mode: next as ResponseMode }))}
            options={[
              { value: "on_received", label: "Imediatamente" },
              { value: "on_finished", label: "Quando o fluxo terminar" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Path</label>
          <div className="flex items-center gap-2">
            <input
              className={fieldClass}
              value={form.path}
              onChange={(e) => setForm((prev) => ({ ...prev, path: e.target.value }))}
              placeholder="d52db521-037c-44da-94c9-07bcc5833f7d"
            />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => {
                const uuid = globalThis.crypto?.randomUUID?.()
                if (uuid) {
                  setForm((prev) => ({ ...prev, path: uuid }))
                  return
                }
                const buf = new Uint8Array(16)
                globalThis.crypto?.getRandomValues?.(buf)
                const hex = Array.from(buf)
                  .map((b) => b.toString(16).padStart(2, "0"))
                  .join("")
                setForm((prev) => ({
                  ...prev,
                  path: `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`,
                }))
              }}
              aria-label="Gerar novo path"
              title="Gerar novo path"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
          {pathError ? <p className={errorClass}>{pathError}</p> : null}
        </div>

        <div>
          <label className={fieldLabelClass}>Autenticação</label>
          <SelectField
            value={form.auth_type}
            onChange={(next) => setForm((prev) => ({ ...prev, auth_type: next as AuthType }))}
            options={[
              { value: "none", label: "Nenhuma" },
              { value: "basic_auth", label: "Basic Auth" },
              { value: "header_token", label: "Token no Header" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Status code</label>
          <input
            type="number"
            className={fieldClass}
            value={form.response_code}
            onChange={(e) => setForm((prev) => ({ ...prev, response_code: Number(e.target.value) }))}
          />
          {responseCodeError ? <p className={errorClass}>{responseCodeError}</p> : null}
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="space-y-1">
          {errors.map((error) => (
            <p className={errorClass} key={error}>
              {error}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ManualNodeConfigPanel({ nodeData, onUpdate }: PanelProps<ManualNodeConfig>) {
  const [form, setForm] = useState<ManualNodeConfig>(nodeData)
  const [jsonValidationMessage, setJsonValidationMessage] = useState("")

  const jsonError = useMemo(() => {
    if (!form.inject_data) return ""
    if (!form.mock_payload.trim()) return "Mock payload e obrigatorio quando a injecao esta ativa."
    try {
      JSON.parse(form.mock_payload)
      return ""
    } catch {
      return "Mock payload deve ser um JSON valido."
    }
  }, [form.inject_data, form.mock_payload])

  const validateJson = () => {
    if (!form.mock_payload.trim()) {
      setJsonValidationMessage("Informe um JSON para validar.")
      return
    }

    try {
      JSON.parse(form.mock_payload)
      setJsonValidationMessage("JSON valido.")
    } catch {
      setJsonValidationMessage("JSON invalido.")
    }
  }

  return (
    <PanelShell
      title="Configuracao Manual"
      description="Use payload ficticio para testes manuais."
      onSave={() => !jsonError && onUpdate(form)}
      saveDisabled={Boolean(jsonError)}
    >
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.inject_data}
          onChange={(e) => setForm((prev) => ({ ...prev, inject_data: e.target.checked }))}
        />
        Ativar injecao de dados
      </label>

      {form.inject_data ? (
        <div>
          <label className={fieldLabelClass}>Mock payload (JSON)</label>
          <textarea
            className={textareaClass}
            rows={6}
            value={form.mock_payload}
            onChange={(e) => setForm((prev) => ({ ...prev, mock_payload: e.target.value }))}
            placeholder='{"pedido_id": 123, "status": "pago"}'
          />
          {jsonError ? <p className={errorClass}>{jsonError}</p> : null}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={validateJson}
              className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-xs font-medium"
            >
              Validar JSON
            </button>
            {jsonValidationMessage ? (
              <span className={`text-xs ${jsonValidationMessage === "JSON valido." ? "text-green-600" : "text-red-500"}`}>
                {jsonValidationMessage}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </PanelShell>
  )
}

export function SubWorkflowTriggerConfigPanel({ nodeData, onUpdate }: PanelProps<SubWorkflowTriggerConfig>) {
  const [form, setForm] = useState<SubWorkflowTriggerConfig>(nodeData)
  const [nextInput, setNextInput] = useState("")

  const errors = useMemo(() => {
    const result: string[] = []

    if (form.expected_inputs.some((item) => !item.trim())) {
      result.push("Todos os expected_inputs devem ter valor.")
    }

    if (form.response_data === "specific_node" && !form.node_id.trim()) {
      result.push("node_id e obrigatorio quando response_data = specific_node.")
    }

    return result
  }, [form.expected_inputs, form.node_id, form.response_data])

  const addInput = () => {
    if (!nextInput.trim()) return
    setForm((prev) => ({ ...prev, expected_inputs: [...prev.expected_inputs, nextInput.trim()] }))
    setNextInput("")
  }

  return (
    <PanelShell
      title="Configuracao Subworkflow Trigger"
      description="Defina entradas obrigatorias e retorno do fluxo pai."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Expected inputs</label>

        <div className="mt-2 space-y-2">
          {form.expected_inputs.map((input, index) => (
            <div key={`${input}-${index}`} className="flex gap-2">
              <input
                className={fieldClass}
                value={input}
                onChange={(e) => {
                  const next = [...form.expected_inputs]
                  next[index] = e.target.value
                  setForm((prev) => ({ ...prev, expected_inputs: next }))
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    expected_inputs: prev.expected_inputs.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }}
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
            value={nextInput}
            onChange={(e) => setNextInput(e.target.value)}
            placeholder="nova_chave"
          />
          <button type="button" onClick={addInput} className="h-9 rounded-md border border-gray-300 px-3 text-xs">
            + Adicionar Input
          </button>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Response data</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.response_data === "all_data"}
              onChange={() => setForm((prev) => ({ ...prev, response_data: "all_data" }))}
            />
            all_data
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.response_data === "specific_node"}
              onChange={() => setForm((prev) => ({ ...prev, response_data: "specific_node" }))}
            />
            specific_node
          </label>
        </div>
      </div>

      {form.response_data === "specific_node" ? (
        <div>
          <label className={fieldLabelClass}>Node ID</label>
          <input
            className={fieldClass}
            value={form.node_id}
            onChange={(e) => setForm((prev) => ({ ...prev, node_id: e.target.value }))}
            placeholder="node-123"
          />
        </div>
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

const defaultCredentialOptions: CredentialOption[] = [
  { id: "cred-rabbitmq-main", label: "RabbitMQ - Principal" },
  { id: "cred-kafka-cluster", label: "Kafka - Cluster" },
  { id: "cred-aws-sqs", label: "AWS SQS - Produção" },
]

export function EventQueueTriggerConfigPanel({ nodeData, onUpdate }: PanelProps<EventQueueTriggerConfig>) {
  const [form, setForm] = useState<EventQueueTriggerConfig>(nodeData)

  const credentialOptions = form.credentials?.length ? form.credentials : defaultCredentialOptions

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.credential_id.trim()) result.push("Selecione uma credencial.")
    if (!form.queue_name.trim()) result.push("queue_name e obrigatorio.")
    if (!form.message_property.trim()) result.push("message_property e obrigatorio.")
    if (Number.isNaN(form.max_retries) || form.max_retries < 0) result.push("max_retries deve ser >= 0.")

    return result
  }, [form.credential_id, form.max_retries, form.message_property, form.queue_name])

  return (
    <PanelShell
      title="Configuracao Event Queue Trigger"
      description="Conecte fila/topico e parametros de consumo."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Queue provider</label>
          <select
            className={fieldClass}
            value={form.queue_provider}
            onChange={(e) => setForm((prev) => ({ ...prev, queue_provider: e.target.value as QueueProvider }))}
          >
            <option value="rabbitmq">rabbitmq</option>
            <option value="kafka">kafka</option>
            <option value="aws_sqs">aws_sqs</option>
            <option value="azure_servicebus">azure_servicebus</option>
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
            {credentialOptions.map((credential) => (
              <option key={credential.id} value={credential.id}>{credential.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Queue name</label>
          <input
            className={fieldClass}
            value={form.queue_name}
            onChange={(e) => setForm((prev) => ({ ...prev, queue_name: e.target.value }))}
            placeholder="pedidos_novos"
          />
        </div>

        <div>
          <label className={fieldLabelClass}>Max retries</label>
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={form.max_retries}
            onChange={(e) => setForm((prev) => ({ ...prev, max_retries: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Message property</label>
        <input
          className={fieldClass}
          value={form.message_property}
          onChange={(e) => setForm((prev) => ({ ...prev, message_property: e.target.value }))}
          placeholder="payload.message"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.auto_ack}
          onChange={(e) => setForm((prev) => ({ ...prev, auto_ack: e.target.checked }))}
        />
        Auto-acknowledge
      </label>

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
