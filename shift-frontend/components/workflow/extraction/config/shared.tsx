"use client"

import type { ReactNode } from "react"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KeyValueItem, OutputSchemaColumn } from "@/lib/workflow/extraction/types"

interface FieldProps {
  label: string
  children: ReactNode
}

export function ConfigField({ label, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

interface SchemaTableProps {
  schema: OutputSchemaColumn[]
}

export function SchemaTable({ schema }: SchemaTableProps) {
  if (schema.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-xs text-muted-foreground">
        Schema ainda não inferido.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="grid grid-cols-3 border-b border-border bg-muted/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <span>Coluna</span>
        <span>Tipo</span>
        <span>Nulo</span>
      </div>
      <div className="divide-y divide-border">
        {schema.map((column) => (
          <div key={column.name} className="grid grid-cols-3 px-2 py-1.5 text-xs">
            <span className="text-foreground">{column.name}</span>
            <span className="text-muted-foreground">{column.type}</span>
            <span className={cn(column.nullable ? "text-muted-foreground" : "text-foreground")}>
              {column.nullable ? "sim" : "não"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface KeyValueEditorProps {
  title: string
  items: KeyValueItem[]
  onChange: (items: KeyValueItem[]) => void
}

export function KeyValueEditor({ title, items, onChange }: KeyValueEditorProps) {
  const addItem = () => {
    onChange([...items, { id: `kv-${crypto.randomUUID()}`, key: "", value: "", enabled: true }])
  }

  const removeItem = (id: string) => onChange(items.filter((item) => item.id !== id))

  const updateItem = (id: string, patch: Partial<KeyValueItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] text-foreground hover:bg-accent"
        >
          <Plus className="size-3" />
          Adicionar
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[22px_1fr_1fr_26px] items-center gap-1.5">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(event) => updateItem(item.id, { enabled: event.target.checked })}
              className="size-3.5 rounded border-border"
            />
            <input
              value={item.key}
              onChange={(event) => updateItem(item.id, { key: event.target.value })}
              placeholder="Key"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
            />
            <input
              value={item.value}
              onChange={(event) => updateItem(item.id, { value: event.target.value })}
              placeholder="Value"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
}

const SQL_KEYWORDS = ["SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "GROUP", "BY", "ORDER", "LIMIT", "AS"]

function renderHighlightedSql(sql: string) {
  if (!sql) return ""

  const escaped = sql.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return escaped.replace(
    new RegExp(`\\b(${SQL_KEYWORDS.join("|")})\\b`, "gi"),
    "<span class='text-sky-400 font-semibold'>$1</span>"
  )
}

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  return (
    <div className="relative overflow-hidden rounded-md border border-input bg-background font-mono text-xs">
      <pre
        className="pointer-events-none min-h-[120px] whitespace-pre-wrap px-3 py-2 text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: renderHighlightedSql(value) || " " }}
      />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        className="absolute inset-0 min-h-[120px] resize-y bg-transparent px-3 py-2 text-transparent caret-foreground outline-none"
      />
    </div>
  )
}
