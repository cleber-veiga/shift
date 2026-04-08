"use client"

import { useMemo, useState } from "react"
import type { HttpRequestConfig } from "@/lib/workflow/extraction/types"
import { ConfigField, KeyValueEditor, SchemaTable } from "@/components/workflow/extraction/config/shared"
import type { ExtractionConfigPanelProps } from "@/components/workflow/extraction/config/types"
import { cn } from "@/lib/utils"

type HttpTab = "headers" | "query" | "auth" | "body"

export function HttpRequestConfigPanel({
  node,
  config,
  onChange,
  onRunTest,
}: ExtractionConfigPanelProps<HttpRequestConfig>) {
  const [tab, setTab] = useState<HttpTab>("headers")

  const tabs = useMemo(
    () => [
      { id: "headers" as const, label: "Headers" },
      { id: "query" as const, label: "Query Params" },
      { id: "auth" as const, label: "Authentication" },
      { id: "body" as const, label: "Body" },
    ],
    []
  )

  return (
    <div className="space-y-3">
      <ConfigField label="URL">
        <input
          value={config.url}
          onChange={(event) => onChange({ ...config, url: event.target.value })}
          placeholder="https://api.exemplo.com/items?token={{$env.API_KEY}}"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        />
      </ConfigField>

      <ConfigField label="Método">
        <select
          value={config.method}
          onChange={(event) => onChange({ ...config, method: event.target.value as HttpRequestConfig["method"] })}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </ConfigField>

      <div className="grid grid-cols-4 gap-1 rounded-md border border-border bg-background p-1">
        {tabs.map((currentTab) => (
          <button
            key={currentTab.id}
            type="button"
            onClick={() => setTab(currentTab.id)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium",
              tab === currentTab.id ? "bg-accent text-foreground" : "text-muted-foreground"
            )}
          >
            {currentTab.label}
          </button>
        ))}
      </div>

      {tab === "headers" ? (
        <KeyValueEditor title="Headers" items={config.headers} onChange={(headers) => onChange({ ...config, headers })} />
      ) : null}
      {tab === "query" ? (
        <KeyValueEditor
          title="Query Params"
          items={config.queryParams}
          onChange={(queryParams) => onChange({ ...config, queryParams })}
        />
      ) : null}
      {tab === "auth" ? (
        <div className="space-y-2">
          <ConfigField label="Tipo de autenticação">
            <select
              value={config.authentication.type}
              onChange={(event) =>
                onChange({
                  ...config,
                  authentication: {
                    ...config.authentication,
                    type: event.target.value as HttpRequestConfig["authentication"]["type"],
                  },
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer</option>
              <option value="basic">Basic</option>
              <option value="apiKey">API Key</option>
            </select>
          </ConfigField>

          {config.authentication.type === "bearer" ? (
            <input
              value={config.authentication.token}
              onChange={(event) =>
                onChange({
                  ...config,
                  authentication: { ...config.authentication, token: event.target.value },
                })
              }
              placeholder="{{$env.API_KEY}}"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
            />
          ) : null}

          {config.authentication.type === "basic" ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={config.authentication.username}
                onChange={(event) =>
                  onChange({
                    ...config,
                    authentication: { ...config.authentication, username: event.target.value },
                  })
                }
                placeholder="Username"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
              />
              <input
                type="password"
                value={config.authentication.password}
                onChange={(event) =>
                  onChange({
                    ...config,
                    authentication: { ...config.authentication, password: event.target.value },
                  })
                }
                placeholder="Password"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          ) : null}

          {config.authentication.type === "apiKey" ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={config.authentication.apiKeyHeader}
                onChange={(event) =>
                  onChange({
                    ...config,
                    authentication: {
                      ...config.authentication,
                      apiKeyHeader: event.target.value,
                    },
                  })
                }
                placeholder="Header"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
              />
              <input
                value={config.authentication.apiKeyValue}
                onChange={(event) =>
                  onChange({
                    ...config,
                    authentication: {
                      ...config.authentication,
                      apiKeyValue: event.target.value,
                    },
                  })
                }
                placeholder="Valor"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "body" ? (
        <textarea
          value={config.body}
          onChange={(event) => onChange({ ...config, body: event.target.value })}
          placeholder='{"filtro":"ativo"}'
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-primary/20"
        />
      ) : null}

      <p className="text-[11px] text-muted-foreground">Suporte a variáveis dinâmicas: {"{{$env.API_KEY}}"}</p>

      <button
        type="button"
        onClick={onRunTest}
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Test Request
      </button>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Schema de resposta</p>
        <SchemaTable schema={node.data.outputSchema} />
      </div>
    </div>
  )
}
