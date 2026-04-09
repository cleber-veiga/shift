"use client"

import { useMemo, useState } from "react"

type PanelProps<T> = {
  nodeData: T
  onUpdate: (next: T) => void
}

type GlobalStateOperation = "GET" | "SET" | "DELETE"
type GlobalStateScope = "workflow" | "global"
type FileStorageOperation = "READ" | "WRITE" | "DELETE"

export type GlobalStateNodeConfig = {
  operation: GlobalStateOperation
  scope: GlobalStateScope
  key: string
  value: string
  target_property: string
}

export type FileStorageNodeConfig = {
  operation: FileStorageOperation
  file_path: string
  source_binary_property: string
  target_binary_property: string
  fail_on_missing: boolean
}

const fieldLabelClass = "text-sm font-medium text-foreground"
const fieldClass = "h-9 w-full rounded-md border border-gray-300 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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

function isValidStateKey(value: string) {
  return /^[A-Za-z0-9_]+$/.test(value)
}

export function GlobalStateNodeConfigPanel({ nodeData, onUpdate }: PanelProps<GlobalStateNodeConfig>) {
  const [form, setForm] = useState<GlobalStateNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.key.trim()) {
      result.push("key e obrigatorio.")
    } else if (!isValidStateKey(form.key.trim())) {
      result.push("key deve conter apenas letras, numeros e underscore.")
    }

    if (form.operation === "SET" && !form.value.trim()) {
      result.push("value e obrigatorio para operacao SET.")
    }

    if (form.operation === "GET" && !form.target_property.trim()) {
      result.push("target_property e obrigatorio para operacao GET.")
    }

    return result
  }, [form.key, form.operation, form.target_property, form.value])

  return (
    <PanelShell
      title="Configuração Global State"
      description="Configure leitura e escrita de variáveis de estado."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Operation</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "GET"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "GET" }))}
            />
            GET
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "SET"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "SET" }))}
            />
            SET
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "DELETE"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "DELETE" }))}
            />
            DELETE
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Scope</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.scope === "workflow"}
              onChange={() => setForm((prev) => ({ ...prev, scope: "workflow" }))}
            />
            workflow
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.scope === "global"}
              onChange={() => setForm((prev) => ({ ...prev, scope: "global" }))}
            />
            global
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>Key</label>
        <input
          className={fieldClass}
          value={form.key}
          placeholder="ultimo_id_sincronizado"
          onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
        />
      </div>

      {form.operation === "SET" ? (
        <div>
          <label className={fieldLabelClass}>Value</label>
          <input
            className={fieldClass}
            value={form.value}
            placeholder="{{payload.id}}"
            onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
          />
        </div>
      ) : null}

      {form.operation === "GET" ? (
        <div>
          <label className={fieldLabelClass}>Target property</label>
          <input
            className={fieldClass}
            value={form.target_property}
            placeholder="payload.state.ultimo_id"
            onChange={(e) => setForm((prev) => ({ ...prev, target_property: e.target.value }))}
          />
        </div>
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

export function FileStorageNodeConfigPanel({ nodeData, onUpdate }: PanelProps<FileStorageNodeConfig>) {
  const [form, setForm] = useState<FileStorageNodeConfig>(nodeData)

  const errors = useMemo(() => {
    const result: string[] = []

    if (!form.file_path.trim()) {
      result.push("file_path e obrigatorio.")
    }

    if (form.operation === "WRITE" && !form.source_binary_property.trim()) {
      result.push("source_binary_property e obrigatorio para WRITE.")
    }

    if (form.operation === "READ" && !form.target_binary_property.trim()) {
      result.push("target_binary_property e obrigatorio para READ.")
    }

    return result
  }, [form.file_path, form.operation, form.source_binary_property, form.target_binary_property])

  return (
    <PanelShell
      title="Configuração File Storage"
      description="Configure leitura, escrita e remoção de arquivos."
      onSave={() => errors.length === 0 && onUpdate(form)}
      saveDisabled={errors.length > 0}
    >
      <div>
        <label className={fieldLabelClass}>Operation</label>
        <div className="mt-2 flex gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "READ"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "READ" }))}
            />
            READ
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "WRITE"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "WRITE" }))}
            />
            WRITE
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={form.operation === "DELETE"}
              onChange={() => setForm((prev) => ({ ...prev, operation: "DELETE" }))}
            />
            DELETE
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabelClass}>File path</label>
        <input
          className={fieldClass}
          value={form.file_path}
          placeholder="/tmp/relatorio_{{date}}.pdf"
          onChange={(e) => setForm((prev) => ({ ...prev, file_path: e.target.value }))}
        />
      </div>

      {form.operation === "WRITE" ? (
        <div>
          <label className={fieldLabelClass}>Source binary property</label>
          <input
            className={fieldClass}
            value={form.source_binary_property}
            placeholder="payload.file_binary"
            onChange={(e) => setForm((prev) => ({ ...prev, source_binary_property: e.target.value }))}
          />
        </div>
      ) : null}

      {form.operation === "READ" ? (
        <div>
          <label className={fieldLabelClass}>Target binary property</label>
          <input
            className={fieldClass}
            value={form.target_binary_property}
            placeholder="payload.file_binary"
            onChange={(e) => setForm((prev) => ({ ...prev, target_binary_property: e.target.value }))}
          />
        </div>
      ) : null}

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.fail_on_missing}
          onChange={(e) => setForm((prev) => ({ ...prev, fail_on_missing: e.target.checked }))}
        />
        Falhar se arquivo nao existe
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
