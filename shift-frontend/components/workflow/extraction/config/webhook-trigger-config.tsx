"use client"

import { Copy, RefreshCw } from "lucide-react"
import type { WebhookTriggerConfig } from "@/lib/workflow/extraction/types"
import { ConfigField, SchemaTable } from "@/components/workflow/extraction/config/shared"
import type { ExtractionConfigPanelProps } from "@/components/workflow/extraction/config/types"

export function WebhookTriggerConfigPanel({
  node,
  config,
  onChange,
  onRunTest,
}: ExtractionConfigPanelProps<WebhookTriggerConfig>) {
  const copyWebhookUrl = async () => {
    if (!config.url) return
    await navigator.clipboard.writeText(config.url)
  }

  const addMockPayload = () => {
    const payload = {
      event: "record.created",
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
    }

    onChange({
      ...config,
      payloadHistory: [
        {
          id: `payload-${crypto.randomUUID()}`,
          payload: JSON.stringify(payload, null, 2),
          receivedAt: new Date().toISOString(),
        },
        ...config.payloadHistory,
      ].slice(0, 10),
    })
  }

  return (
    <div className="space-y-3">
      <ConfigField label="URL do webhook">
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={config.url}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => void copyWebhookUrl()}
            className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card hover:bg-accent"
            title="Copiar URL"
          >
            <Copy className="size-4" />
          </button>
        </div>
      </ConfigField>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={addMockPayload}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="size-3.5" />
          Simular payload
        </button>

        <button
          type="button"
          onClick={onRunTest}
          className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Validar schema
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Últimos payloads</p>
        <div className="max-h-40 space-y-1 overflow-auto rounded-md border border-border p-2">
          {config.payloadHistory.length > 0 ? (
            config.payloadHistory.map((entry) => (
              <div key={entry.id} className="rounded-md border border-border bg-background px-2 py-1.5">
                <p className="text-[10px] text-muted-foreground">{new Date(entry.receivedAt).toLocaleString()}</p>
                <pre className="mt-1 overflow-auto text-[10px] text-foreground">{entry.payload}</pre>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum payload recebido ainda.</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Schema esperado/inferido</p>
        <SchemaTable schema={node.data.outputSchema} />
      </div>
    </div>
  )
}
