"use client"

import type {
  DatabaseInputConfig,
  FileInputConfig,
  HttpRequestConfig,
  ScheduleTriggerConfig,
  WebhookTriggerConfig,
  ExtractionWorkflowNode,
} from "@/lib/workflow/extraction/types"
import { DatabaseInputConfigPanel } from "@/components/workflow/extraction/config/database-input-config"
import { FileInputConfigPanel } from "@/components/workflow/extraction/config/file-input-config"
import { HttpRequestConfigPanel } from "@/components/workflow/extraction/config/http-request-config"
import { WebhookTriggerConfigPanel } from "@/components/workflow/extraction/config/webhook-trigger-config"
import { ScheduleTriggerConfigPanel } from "@/components/workflow/extraction/config/schedule-trigger-config"

interface ExtractionNodeConfigPanelProps {
  node: ExtractionWorkflowNode
  onLabelChange: (label: string) => void
  onConfigChange: (config: ExtractionWorkflowNode["data"]["config"]) => void
  onRunTest: () => void
}

export function ExtractionNodeConfigPanel({
  node,
  onLabelChange,
  onConfigChange,
  onRunTest,
}: ExtractionNodeConfigPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome do nó</label>
        <input
          value={node.data.label}
          onChange={(event) => onLabelChange(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {node.subType === "database" ? (
        <DatabaseInputConfigPanel
          node={node}
          config={node.data.config as DatabaseInputConfig}
          onChange={onConfigChange as (config: DatabaseInputConfig) => void}
          onRunTest={onRunTest}
        />
      ) : null}

      {node.subType === "file" ? (
        <FileInputConfigPanel
          node={node}
          config={node.data.config as FileInputConfig}
          onChange={onConfigChange as (config: FileInputConfig) => void}
          onRunTest={onRunTest}
        />
      ) : null}

      {node.subType === "http" ? (
        <HttpRequestConfigPanel
          node={node}
          config={node.data.config as HttpRequestConfig}
          onChange={onConfigChange as (config: HttpRequestConfig) => void}
          onRunTest={onRunTest}
        />
      ) : null}

      {node.subType === "webhook" ? (
        <WebhookTriggerConfigPanel
          node={node}
          config={node.data.config as WebhookTriggerConfig}
          onChange={onConfigChange as (config: WebhookTriggerConfig) => void}
          onRunTest={onRunTest}
        />
      ) : null}

      {node.subType === "schedule" ? (
        <ScheduleTriggerConfigPanel
          node={node}
          config={node.data.config as ScheduleTriggerConfig}
          onChange={onConfigChange as (config: ScheduleTriggerConfig) => void}
          onRunTest={onRunTest}
        />
      ) : null}

      {node.data.validationErrors.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          <p className="text-xs font-semibold text-destructive">Erros de validação</p>
          <ul className="mt-1 space-y-1 text-[11px] text-destructive">
            {node.data.validationErrors.map((error, index) => (
              <li key={`error-${index}`}>• {error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
