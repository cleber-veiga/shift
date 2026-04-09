"use client"

import { useMemo, useState } from "react"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type AssignmentType = "string" | "number" | "boolean" | "object" | "array"
type CodeLanguage = "python" | "javascript"
type DateFromFormat = "auto" | "ISO8601" | "DD/MM/YYYY" | "X"
type DataFormat = "json" | "xml" | "csv" | "text" | "base64"

type KeyValueItem = {
  key: string
  value: string
}

export type MapperAssignment = {
  target_field: string
  source_value: string
  type: AssignmentType
}

export type MapperNodeConfig = {
  keep_only_set_fields: boolean
  assignments: MapperAssignment[]
}

export type CodeNodeConfig = {
  language: CodeLanguage
  code: string
  run_once_for_all: boolean
}

export type DateTimeNodeConfig = {
  property_to_format: string
  target_property: string
  from_format: DateFromFormat
  to_format: string
  from_timezone: string
  to_timezone: string
}

export type DataConverterNodeConfig = {
  input_format: DataFormat
  output_format: DataFormat
  source_property: string
  target_property: string
  options: KeyValueItem[]
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

export function MapperNodeConfigPanel({ nodeData, onUpdate }: PanelProps<MapperNodeConfig>) {
  const [form, setForm] = useState<MapperNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (form.assignments.length === 0) result.push("Adicione ao menos um mapeamento.")

    form.assignments.forEach((assignment, index) => {
      if (!assignment.target_field.trim()) result.push(`Mapeamento ${index + 1}: target_field obrigatorio.`)
      if (!assignment.source_value.trim()) result.push(`Mapeamento ${index + 1}: source_value obrigatorio.`)
    })

    return result
  }, [form.assignments])

  const preview = useMemo(() => {
    const first = form.assignments[0]
    if (!first) return "Sem mapeamentos"
    return `${first.target_field || "campo"} = ${first.source_value || "valor"}`
  }, [form.assignments])

  return (
    <PanelShell
      title="Configuração Mapper"
      description="Defina os campos de destino e as expressões de origem."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.keep_only_set_fields}
          onChange={(e) => setForm((prev) => ({ ...prev, keep_only_set_fields: e.target.checked }))}
        />
        Manter apenas campos mapeados
      </label>

      <div>
        <label className={fieldLabelClass}>Assignments</label>
        <div className="mt-2 space-y-2">
          {form.assignments.map((assignment, index) => (
            <div key={`map-${index}`} className="grid grid-cols-[1fr_1fr_110px_auto] gap-2">
              <input
                className={fieldClass}
                placeholder="cliente.nome_completo"
                value={assignment.target_field}
                onChange={(e) => {
                  const next = [...form.assignments]
                  next[index] = { ...next[index], target_field: e.target.value }
                  setForm((prev) => ({ ...prev, assignments: next }))
                }}
              />
              <input
                className={fieldClass}
                placeholder="{{nome}} {{sobrenome}}"
                value={assignment.source_value}
                onChange={(e) => {
                  const next = [...form.assignments]
                  next[index] = { ...next[index], source_value: e.target.value }
                  setForm((prev) => ({ ...prev, assignments: next }))
                }}
              />
              <select
                className={fieldClass}
                value={assignment.type}
                onChange={(e) => {
                  const next = [...form.assignments]
                  next[index] = { ...next[index], type: e.target.value as AssignmentType }
                  setForm((prev) => ({ ...prev, assignments: next }))
                }}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="object">object</option>
                <option value="array">array</option>
              </select>
              <button
                type="button"
                className="h-9 rounded-md border border-gray-300 px-3 text-xs"
                onClick={() => setForm((prev) => ({ ...prev, assignments: prev.assignments.filter((_, i) => i !== index) }))}
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
              assignments: [...prev.assignments, { target_field: "", source_value: "", type: "string" }],
            }))
          }
        >
          + Adicionar Mapeamento
        </button>
      </div>

      <div>
        <label className={fieldLabelClass}>Preview</label>
        <input className={fieldClass} value={preview} readOnly />
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

export function CodeNodeConfigPanel({ nodeData, onUpdate }: PanelProps<CodeNodeConfig>) {
  const [form, setForm] = useState<CodeNodeConfig>(nodeData)
  const [syntaxStatus, setSyntaxStatus] = useState("")

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.code.trim()) result.push("Code nao pode estar vazio.")

    return result
  }, [form.code])

  const example = useMemo(
    () =>
      form.language === "python"
        ? "def transform(payload):\n    payload['ok'] = True\n    return payload"
        : "function transform(payload) {\n  payload.ok = true\n  return payload\n}",
    [form.language]
  )

  const validateSyntax = () => {
    if (!form.code.trim()) {
      setSyntaxStatus("Informe um código para validar.")
      return
    }

    if (form.language === "javascript") {
      try {
        new Function(form.code)
        setSyntaxStatus("Sintaxe JavaScript válida.")
      } catch {
        setSyntaxStatus("Erro de sintaxe JavaScript.")
      }
      return
    }

    const hasBlock = /:\s*\n\s+/.test(form.code) || /^\s*return\s+/.test(form.code)
    setSyntaxStatus(hasBlock ? "Sintaxe Python parece válida." : "Verifique a indentação/sintaxe Python.")
  }

  return (
    <PanelShell
      title="Configuração Code"
      description="Defina linguagem e script de transformação."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Language</label>
        <select
          className={fieldClass}
          value={form.language}
          onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value as CodeLanguage }))}
        >
          <option value="python">python</option>
          <option value="javascript">javascript</option>
        </select>
      </div>

      <div>
        <label className={fieldLabelClass}>Code</label>
        <textarea
          rows={10}
          className={`${textareaClass} font-mono bg-slate-950 text-slate-100`}
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.run_once_for_all}
          onChange={(e) => setForm((prev) => ({ ...prev, run_once_for_all: e.target.checked }))}
        />
        Executar uma vez para todos os itens
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-xs font-medium"
          onClick={validateSyntax}
        >
          Validar Sintaxe
        </button>
        {syntaxStatus ? <span className="text-xs text-muted-foreground">{syntaxStatus}</span> : null}
      </div>

      <div>
        <label className={fieldLabelClass}>Exemplo</label>
        <textarea className={`${textareaClass} font-mono`} rows={4} readOnly value={example} />
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

export function DateTimeNodeConfigPanel({ nodeData, onUpdate }: PanelProps<DateTimeNodeConfig>) {
  const [form, setForm] = useState<DateTimeNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (!form.property_to_format.trim()) result.push("property_to_format obrigatorio.")
    if (!form.target_property.trim()) result.push("target_property obrigatorio.")
    if (!form.to_format.trim()) result.push("to_format obrigatorio.")

    return result
  }, [form.property_to_format, form.target_property, form.to_format])

  const preview = useMemo(
    () => `Ex: ${form.property_to_format || "{{data}}"} (${form.from_format}) -> ${form.to_format || "YYYY-MM-DD"} [${form.from_timezone} -> ${form.to_timezone}]`,
    [form.from_format, form.from_timezone, form.property_to_format, form.to_format, form.to_timezone]
  )

  return (
    <PanelShell
      title="Configuração DateTime"
      description="Defina como datas serão lidas, convertidas e salvas."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Property to format</label>
          <input
            className={fieldClass}
            value={form.property_to_format}
            placeholder="{{pedido.data_criacao}}"
            onChange={(e) => setForm((prev) => ({ ...prev, property_to_format: e.target.value }))}
          />
        </div>
        <div>
          <label className={fieldLabelClass}>Target property</label>
          <input
            className={fieldClass}
            value={form.target_property}
            placeholder="data_formatada"
            onChange={(e) => setForm((prev) => ({ ...prev, target_property: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>From format</label>
          <select
            className={fieldClass}
            value={form.from_format}
            onChange={(e) => setForm((prev) => ({ ...prev, from_format: e.target.value as DateFromFormat }))}
          >
            <option value="auto">auto</option>
            <option value="ISO8601">ISO8601</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="X">X (timestamp)</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>To format</label>
          <input
            className={fieldClass}
            value={form.to_format}
            placeholder="YYYY-MM-DD HH:mm:ss"
            onChange={(e) => setForm((prev) => ({ ...prev, to_format: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>From timezone</label>
          <select
            className={fieldClass}
            value={form.from_timezone}
            onChange={(e) => setForm((prev) => ({ ...prev, from_timezone: e.target.value }))}
          >
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>To timezone</label>
          <select
            className={fieldClass}
            value={form.to_timezone}
            onChange={(e) => setForm((prev) => ({ ...prev, to_timezone: e.target.value }))}
          >
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Preview</label>
        <input className={fieldClass} readOnly value={preview} />
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

export function DataConverterNodeConfigPanel({ nodeData, onUpdate }: PanelProps<DataConverterNodeConfig>) {
  const [form, setForm] = useState<DataConverterNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []
    if (form.input_format === form.output_format) {
      result.push("input_format deve ser diferente de output_format.")
    }
    if (!form.source_property.trim()) result.push("source_property obrigatorio.")
    if (!form.target_property.trim()) result.push("target_property obrigatorio.")

    return result
  }, [form.input_format, form.output_format, form.source_property, form.target_property])

  return (
    <PanelShell
      title="Configuração Data Converter"
      description="Converta dados entre formatos e salve o resultado no payload."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Input format</label>
          <select
            className={fieldClass}
            value={form.input_format}
            onChange={(e) => setForm((prev) => ({ ...prev, input_format: e.target.value as DataFormat }))}
          >
            <option value="json">json</option>
            <option value="xml">xml</option>
            <option value="csv">csv</option>
            <option value="text">text</option>
            <option value="base64">base64</option>
          </select>
        </div>

        <div>
          <label className={fieldLabelClass}>Output format</label>
          <select
            className={fieldClass}
            value={form.output_format}
            onChange={(e) => setForm((prev) => ({ ...prev, output_format: e.target.value as DataFormat }))}
          >
            <option value="json">json</option>
            <option value="xml">xml</option>
            <option value="csv">csv</option>
            <option value="text">text</option>
            <option value="base64">base64</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={fieldLabelClass}>Source property</label>
          <input
            className={fieldClass}
            value={form.source_property}
            placeholder="data"
            onChange={(e) => setForm((prev) => ({ ...prev, source_property: e.target.value }))}
          />
        </div>
        <div>
          <label className={fieldLabelClass}>Target property</label>
          <input
            className={fieldClass}
            value={form.target_property}
            placeholder="payload.converted"
            onChange={(e) => setForm((prev) => ({ ...prev, target_property: e.target.value }))}
          />
        </div>
      </div>

      <KeyValueEditor
        label="Options"
        items={form.options}
        onChange={(options) => setForm((prev) => ({ ...prev, options }))}
        addLabel="+ Adicionar Opcao"
      />

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
