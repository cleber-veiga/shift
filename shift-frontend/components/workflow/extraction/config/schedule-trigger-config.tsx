"use client"

import type { ScheduleTriggerConfig } from "@/lib/workflow/extraction/types"
import { TIMEZONE_OPTIONS } from "@/lib/workflow/extraction/defaults"
import { ConfigField, SchemaTable } from "@/components/workflow/extraction/config/shared"
import type { ExtractionConfigPanelProps } from "@/components/workflow/extraction/config/types"
import { computeNextScheduleRuns } from "@/lib/workflow/extraction/validation"

export function ScheduleTriggerConfigPanel({
  node,
  config,
  onChange,
  onRunTest,
}: ExtractionConfigPanelProps<ScheduleTriggerConfig>) {
  const nextRuns = config.nextRuns.length > 0 ? config.nextRuns : computeNextScheduleRuns(config)

  return (
    <div className="space-y-3">
      <ConfigField label="Frequência">
        <select
          value={config.mode}
          onChange={(event) =>
            onChange({
              ...config,
              mode: event.target.value as ScheduleTriggerConfig["mode"],
            })
          }
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="every">A cada X minutos</option>
          <option value="cron">Cron expression</option>
        </select>
      </ConfigField>

      {config.mode === "every" ? (
        <ConfigField label="Intervalo (minutos)">
          <input
            type="number"
            min={1}
            value={config.everyMinutes}
            onChange={(event) =>
              onChange({
                ...config,
                everyMinutes: Number.parseInt(event.target.value || "1", 10),
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </ConfigField>
      ) : (
        <ConfigField label="Cron expression">
          <input
            value={config.cronExpression}
            onChange={(event) => onChange({ ...config, cronExpression: event.target.value })}
            placeholder="*/15 * * * *"
            className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </ConfigField>
      )}

      <ConfigField label="Timezone">
        <select
          value={config.timezone}
          onChange={(event) => onChange({ ...config, timezone: event.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        >
          {TIMEZONE_OPTIONS.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </ConfigField>

      <button
        type="button"
        onClick={onRunTest}
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Validar schedule
      </button>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Próximas execuções</p>
        <div className="rounded-md border border-border bg-background p-2">
          {nextRuns.length > 0 ? (
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {nextRuns.slice(0, 5).map((run) => (
                <li key={run}>{new Date(run).toLocaleString()}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Não foi possível calcular as próximas execuções.</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Schema de saída</p>
        <SchemaTable schema={node.data.outputSchema} />
      </div>
    </div>
  )
}
