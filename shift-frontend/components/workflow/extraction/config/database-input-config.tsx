"use client"

import type { DatabaseInputConfig } from "@/lib/workflow/extraction/types"
import { DATABASE_CONNECTIONS } from "@/lib/workflow/extraction/defaults"
import { ConfigField, SchemaTable, SqlEditor } from "@/components/workflow/extraction/config/shared"
import type { ExtractionConfigPanelProps } from "@/components/workflow/extraction/config/types"

export function DatabaseInputConfigPanel({
  node,
  config,
  onChange,
  onRunTest,
}: ExtractionConfigPanelProps<DatabaseInputConfig>) {
  return (
    <div className="space-y-3">
      <ConfigField label="Conexão salva">
        <select
          value={config.connectionId}
          onChange={(event) => onChange({ ...config, connectionId: event.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        >
          {DATABASE_CONNECTIONS.map((connection) => (
            <option key={connection.id} value={connection.id}>
              {connection.name}
            </option>
          ))}
        </select>
      </ConfigField>

      <ConfigField label="SQL">
        <SqlEditor value={config.query} onChange={(query) => onChange({ ...config, query })} />
      </ConfigField>

      <button
        type="button"
        onClick={onRunTest}
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Test Connection
      </button>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Schema de saída</p>
        <SchemaTable schema={node.data.outputSchema} />
      </div>
    </div>
  )
}
