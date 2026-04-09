"use client"

import { useMemo, useState } from "react"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type IfCombineMode = "AND" | "OR"
type IfOperator = "==" | "!=" | ">" | "<" | "contains" | "is_empty"
type SwitchOperator = "==" | "!=" | "contains"
type MergeMode = "wait_all" | "pass_through"
type MergeDataStrategy = "merge_by_key" | "append_array" | "keep_input_1"
type WaitType = "fixed_duration" | "until_time" | "until_condition"

export type IfCondition = {
  left_operand: string
  operator: IfOperator
  right_operand: string
}

export type IfNodeConfig = {
  combine_mode: IfCombineMode
  conditions: IfCondition[]
}

export type SwitchRoute = {
  route_name: string
  operator: SwitchOperator
  compare_value: string
}

export type SwitchNodeConfig = {
  input_value: string
  routes: SwitchRoute[]
  enable_fallback: boolean
}

export type LoopNodeConfig = {
  source_array: string
  batch_size: number
  exit_on_error: boolean
}

export type MergeNodeConfig = {
  mode: MergeMode
  data_strategy: MergeDataStrategy
}

export type ErrorCatchNodeConfig = {
  catch_all: boolean
  error_types: string[]
  retry_enabled: boolean
  retry_count: number
  retry_delay_seconds: number
  error_property: string
}

export type WaitNodeConfig = {
  wait_type: WaitType
  duration_seconds: number
  target_time: string
  condition_expression: string
  condition_check_interval: number
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

function StringListEditor({
  label,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  addLabel?: string
  placeholder?: string
}) {
  const [nextItem, setNextItem] = useState("")

  return (
    <div>
      <label className={fieldLabelClass}>{label}</label>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex gap-2">
            <input className={fieldClass} readOnly value={item} />
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
      <div className="mt-2 flex gap-2">
        <input
          className={fieldClass}
          value={nextItem}
          placeholder={placeholder ?? "valor"}
          onChange={(e) => setNextItem(e.target.value)}
        />
        <button
          type="button"
          className="h-9 rounded-md border border-gray-300 px-3 text-xs"
          onClick={() => {
            const trimmed = nextItem.trim()
            if (!trimmed) return
            onChange([...items, trimmed])
            setNextItem("")
          }}
        >
          {addLabel ?? "+ Adicionar"}
        </button>
      </div>
    </div>
  )
}

export function IfNodeConfigPanel({ nodeData, onUpdate }: PanelProps<IfNodeConfig>) {
  const [form, setForm] = useState<IfNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (form.conditions.length === 0) result.push("Adicione ao menos uma condicao.")

    form.conditions.forEach((condition, index) => {
      if (!condition.left_operand.trim()) result.push(`Condicao ${index + 1}: left_operand obrigatorio.`)
      if (condition.operator !== "is_empty" && !condition.right_operand.trim()) {
        result.push(`Condicao ${index + 1}: right_operand obrigatorio.`)
      }
    })

    return result
  }, [form.conditions])

  const preview = useMemo(() => {
    if (!form.conditions.length) return ""
    return form.conditions
      .map((condition) =>
        condition.operator === "is_empty"
          ? `${condition.left_operand || "?"} is_empty`
          : `${condition.left_operand || "?"} ${condition.operator} '${condition.right_operand || "?"}'`
      )
      .join(` ${form.combine_mode} `)
  }, [form.combine_mode, form.conditions])

  return (
    <PanelShell
      title="Configuração IF"
      description="Monte regras condicionais e o modo de combinação."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Combine mode</label>
        <div className="mt-2 flex gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.combine_mode === "AND"}
              onChange={() => setForm((prev) => ({ ...prev, combine_mode: "AND" }))}
            />
            AND
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.combine_mode === "OR"}
              onChange={() => setForm((prev) => ({ ...prev, combine_mode: "OR" }))}
            />
            OR
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Conditions</label>
        <div className="mt-2 space-y-2">
          {form.conditions.map((condition, index) => (
            <div key={`cond-${index}`} className="grid grid-cols-[1fr_130px_1fr_auto] gap-2">
              <input
                className={fieldClass}
                placeholder="{{status}}"
                value={condition.left_operand}
                onChange={(e) => {
                  const next = [...form.conditions]
                  next[index] = { ...next[index], left_operand: e.target.value }
                  setForm((prev) => ({ ...prev, conditions: next }))
                }}
              />
              <select
                className={fieldClass}
                value={condition.operator}
                onChange={(e) => {
                  const next = [...form.conditions]
                  next[index] = { ...next[index], operator: e.target.value as IfOperator }
                  setForm((prev) => ({ ...prev, conditions: next }))
                }}
              >
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
                <option value="contains">contains</option>
                <option value="is_empty">is_empty</option>
              </select>
              <input
                className={fieldClass}
                placeholder="pago"
                value={condition.right_operand}
                disabled={condition.operator === "is_empty"}
                onChange={(e) => {
                  const next = [...form.conditions]
                  next[index] = { ...next[index], right_operand: e.target.value }
                  setForm((prev) => ({ ...prev, conditions: next }))
                }}
              />
              <button
                type="button"
                className="h-9 rounded-md border border-gray-300 px-3 text-xs"
                onClick={() => setForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }))}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-2 h-9 rounded-md border border-gray-300 px-3 text-xs"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              conditions: [...prev.conditions, { left_operand: "", operator: "==", right_operand: "" }],
            }))
          }
        >
          + Adicionar Condição
        </button>
      </div>

      <div>
        <label className={fieldLabelClass}>Preview</label>
        <textarea className={textareaClass} rows={2} readOnly value={preview || "Sem condicoes"} />
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

export function SwitchNodeConfigPanel({ nodeData, onUpdate }: PanelProps<SwitchNodeConfig>) {
  const [form, setForm] = useState<SwitchNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.input_value.trim()) result.push("input_value obrigatorio.")
    if (form.routes.length === 0) result.push("Adicione ao menos uma rota.")

    form.routes.forEach((route, index) => {
      if (!route.route_name.trim()) result.push(`Rota ${index + 1}: route_name obrigatorio.`)
      if (!route.compare_value.trim()) result.push(`Rota ${index + 1}: compare_value obrigatorio.`)
    })

    return result
  }, [form.input_value, form.routes])

  const preview = useMemo(
    () =>
      form.routes
        .map((route) => `Se ${form.input_value || "valor"} ${route.operator} '${route.compare_value || "?"}' -> ${route.route_name || "?"}`)
        .join("\n"),
    [form.input_value, form.routes]
  )

  return (
    <PanelShell
      title="Configuração Switch"
      description="Defina a variável de entrada e regras de roteamento."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Input value</label>
        <input
          className={fieldClass}
          value={form.input_value}
          placeholder="{{pagamento.metodo}}"
          onChange={(e) => setForm((prev) => ({ ...prev, input_value: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Routes</label>
        <div className="mt-2 space-y-2">
          {form.routes.map((route, index) => (
            <div key={`route-${index}`} className="grid grid-cols-[1fr_120px_1fr_auto] gap-2">
              <input
                className={fieldClass}
                placeholder="Cartao"
                value={route.route_name}
                onChange={(e) => {
                  const next = [...form.routes]
                  next[index] = { ...next[index], route_name: e.target.value }
                  setForm((prev) => ({ ...prev, routes: next }))
                }}
              />
              <select
                className={fieldClass}
                value={route.operator}
                onChange={(e) => {
                  const next = [...form.routes]
                  next[index] = { ...next[index], operator: e.target.value as SwitchOperator }
                  setForm((prev) => ({ ...prev, routes: next }))
                }}
              >
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value="contains">contains</option>
              </select>
              <input
                className={fieldClass}
                placeholder="credit_card"
                value={route.compare_value}
                onChange={(e) => {
                  const next = [...form.routes]
                  next[index] = { ...next[index], compare_value: e.target.value }
                  setForm((prev) => ({ ...prev, routes: next }))
                }}
              />
              <button
                type="button"
                className="h-9 rounded-md border border-gray-300 px-3 text-xs"
                onClick={() => setForm((prev) => ({ ...prev, routes: prev.routes.filter((_, i) => i !== index) }))}
              >
                X
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-2 h-9 rounded-md border border-gray-300 px-3 text-xs"
          onClick={() =>
            setForm((prev) => ({
              ...prev,
              routes: [...prev.routes, { route_name: "", operator: "==", compare_value: "" }],
            }))
          }
        >
          + Adicionar Rota
        </button>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enable_fallback}
          onChange={(e) => setForm((prev) => ({ ...prev, enable_fallback: e.target.checked }))}
        />
        Criar porta &quot;Default&quot;
      </label>

      <div>
        <label className={fieldLabelClass}>Preview</label>
        <textarea className={textareaClass} rows={Math.max(2, form.routes.length)} readOnly value={preview || "Sem rotas"} />
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

export function LoopNodeConfigPanel({ nodeData, onUpdate }: PanelProps<LoopNodeConfig>) {
  const [form, setForm] = useState<LoopNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (!/\{\{.+\}\}/.test(form.source_array)) result.push("source_array deve conter {{...}}.")
    if (form.batch_size < 1) result.push("batch_size deve ser >= 1.")

    return result
  }, [form.batch_size, form.source_array])

  return (
    <PanelShell
      title="Configuração Loop"
      description="Defina a origem dos itens e estratégia de execução."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Source array</label>
        <input
          className={fieldClass}
          placeholder="{{response.data.clientes}}"
          value={form.source_array}
          onChange={(e) => setForm((prev) => ({ ...prev, source_array: e.target.value }))}
        />
      </div>

      <div>
        <label className={fieldLabelClass}>Batch size</label>
        <input
          type="number"
          min={1}
          className={fieldClass}
          value={form.batch_size}
          onChange={(e) => setForm((prev) => ({ ...prev, batch_size: Number(e.target.value) }))}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.exit_on_error}
          onChange={(e) => setForm((prev) => ({ ...prev, exit_on_error: e.target.checked }))}
        />
        Parar no primeiro erro
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

const mergeStrategyDescription: Record<MergeDataStrategy, string> = {
  merge_by_key: "Combina objetos usando chaves equivalentes.",
  append_array: "Concatena entradas em um array unico.",
  keep_input_1: "Mantem apenas os dados da entrada 1.",
}

export function MergeNodeConfigPanel({ nodeData, onUpdate }: PanelProps<MergeNodeConfig>) {
  const [form, setForm] = useState<MergeNodeConfig>(nodeData)

  return (
    <PanelShell
      title="Configuração Merge"
      description="Defina sincronização e estratégia de junção de dados."
      onSave={() => onUpdate(form)}
    >
      <div>
        <label className={fieldLabelClass}>Mode</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.mode === "wait_all"}
              onChange={() => setForm((prev) => ({ ...prev, mode: "wait_all" }))}
            />
            wait_all
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.mode === "pass_through"}
              onChange={() => setForm((prev) => ({ ...prev, mode: "pass_through" }))}
            />
            pass_through
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Data strategy</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.data_strategy === "merge_by_key"}
              onChange={() => setForm((prev) => ({ ...prev, data_strategy: "merge_by_key" }))}
            />
            merge_by_key
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.data_strategy === "append_array"}
              onChange={() => setForm((prev) => ({ ...prev, data_strategy: "append_array" }))}
            />
            append_array
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.data_strategy === "keep_input_1"}
              onChange={() => setForm((prev) => ({ ...prev, data_strategy: "keep_input_1" }))}
            />
            keep_input_1
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{mergeStrategyDescription[form.data_strategy]}</p>
      </div>
    </PanelShell>
  )
}

export function ErrorCatchNodeConfigPanel({ nodeData, onUpdate }: PanelProps<ErrorCatchNodeConfig>) {
  const [form, setForm] = useState<ErrorCatchNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.catch_all && form.error_types.length === 0) result.push("Adicione ao menos um tipo de erro.")
    if (form.retry_enabled && form.retry_count < 1) result.push("retry_count deve ser >= 1.")
    if (form.retry_enabled && form.retry_delay_seconds < 0) result.push("retry_delay_seconds deve ser >= 0.")
    if (!form.error_property.trim()) result.push("error_property obrigatorio.")

    return result
  }, [form.catch_all, form.error_property, form.error_types.length, form.retry_count, form.retry_delay_seconds, form.retry_enabled])

  return (
    <PanelShell
      title="Configuração Error Catch"
      description="Defina captura de erro, tentativas e payload de erro."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.catch_all}
          onChange={(e) => setForm((prev) => ({ ...prev, catch_all: e.target.checked }))}
        />
        Capturar todos os erros
      </label>

      {!form.catch_all ? (
        <StringListEditor
          label="Tipos de erro"
          items={form.error_types}
          onChange={(error_types) => setForm((prev) => ({ ...prev, error_types }))}
          addLabel="+ Adicionar Tipo de Erro"
          placeholder="ValidationError"
        />
      ) : null}

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.retry_enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, retry_enabled: e.target.checked }))}
        />
        Ativar retry
      </label>

      {form.retry_enabled ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={fieldLabelClass}>Retry count</label>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={form.retry_count}
              onChange={(e) => setForm((prev) => ({ ...prev, retry_count: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>Retry delay (s)</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.retry_delay_seconds}
              onChange={(e) => setForm((prev) => ({ ...prev, retry_delay_seconds: Number(e.target.value) }))}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className={fieldLabelClass}>Error property</label>
        <input
          className={fieldClass}
          placeholder="payload.error"
          value={form.error_property}
          onChange={(e) => setForm((prev) => ({ ...prev, error_property: e.target.value }))}
        />
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

export function WaitNodeConfigPanel({ nodeData, onUpdate }: PanelProps<WaitNodeConfig>) {
  const [form, setForm] = useState<WaitNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []

    if (form.wait_type === "fixed_duration" && form.duration_seconds < 1) {
      result.push("duration_seconds deve ser >= 1.")
    }

    if (form.wait_type === "until_time" && !form.target_time) {
      result.push("target_time obrigatorio.")
    }

    if (form.wait_type === "until_condition" && !form.condition_expression.trim()) {
      result.push("condition_expression obrigatoria.")
    }

    if (form.wait_type === "until_condition" && form.condition_check_interval < 1) {
      result.push("condition_check_interval deve ser >= 1.")
    }

    return result
  }, [form.condition_check_interval, form.condition_expression, form.duration_seconds, form.target_time, form.wait_type])

  return (
    <PanelShell
      title="Configuração Wait"
      description="Defina como e quando o fluxo deve aguardar."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Wait type</label>
        <div className="mt-2 flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.wait_type === "fixed_duration"}
              onChange={() => setForm((prev) => ({ ...prev, wait_type: "fixed_duration" }))}
            />
            fixed_duration
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.wait_type === "until_time"}
              onChange={() => setForm((prev) => ({ ...prev, wait_type: "until_time" }))}
            />
            until_time
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.wait_type === "until_condition"}
              onChange={() => setForm((prev) => ({ ...prev, wait_type: "until_condition" }))}
            />
            until_condition
          </label>
        </div>
      </div>

      {form.wait_type === "fixed_duration" ? (
        <div>
          <label className={fieldLabelClass}>Duration seconds</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={form.duration_seconds}
            onChange={(e) => setForm((prev) => ({ ...prev, duration_seconds: Number(e.target.value) }))}
          />
        </div>
      ) : null}

      {form.wait_type === "until_time" ? (
        <div>
          <label className={fieldLabelClass}>Target time</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={form.target_time}
            onChange={(e) => setForm((prev) => ({ ...prev, target_time: e.target.value }))}
          />
        </div>
      ) : null}

      {form.wait_type === "until_condition" ? (
        <>
          <div>
            <label className={fieldLabelClass}>Condition expression</label>
            <input
              className={fieldClass}
              placeholder="{{status}} == 'aprovado'"
              value={form.condition_expression}
              onChange={(e) => setForm((prev) => ({ ...prev, condition_expression: e.target.value }))}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>Condition check interval (s)</label>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={form.condition_check_interval}
              onChange={(e) => setForm((prev) => ({ ...prev, condition_check_interval: Number(e.target.value) }))}
            />
          </div>
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
