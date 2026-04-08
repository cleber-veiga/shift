"use client"

import type { ChangeEvent } from "react"
import type { FileInputConfig } from "@/lib/workflow/extraction/types"
import { ConfigField, SchemaTable } from "@/components/workflow/extraction/config/shared"
import type { ExtractionConfigPanelProps } from "@/components/workflow/extraction/config/types"

function parsePreviewRows(config: FileInputConfig, sampleContent: string): string[][] {
  if (!sampleContent.trim()) return []

  if (config.fileType === "json") {
    try {
      const parsed = JSON.parse(sampleContent)
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5).map((entry) => [JSON.stringify(entry)])
      }
      return [[JSON.stringify(parsed)]]
    } catch {
      return [["JSON inválido"]]
    }
  }

  if (config.fileType === "csv") {
    return sampleContent
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .slice(config.skipRows, config.skipRows + 6)
      .map((line) => line.split(config.delimiter))
  }

  return sampleContent
    .split(/\r?\n/)
    .slice(0, 6)
    .map((line) => [line])
}

export function FileInputConfigPanel({
  node,
  config,
  onChange,
  onRunTest,
}: ExtractionConfigPanelProps<FileInputConfig>) {
  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const nextConfig: FileInputConfig = {
      ...config,
      filePath: file.name,
      sampleContent: text,
    }

    onChange({
      ...nextConfig,
      previewRows: parsePreviewRows(nextConfig, text),
    })
  }

  return (
    <div className="space-y-3">
      <ConfigField label="Arquivo">
        <div className="space-y-2">
          <input
            type="file"
            onChange={handleFileSelected}
            className="block w-full text-xs file:mr-2 file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1.5"
          />
          <input
            value={config.filePath}
            onChange={(event) => onChange({ ...config, filePath: event.target.value })}
            placeholder="Caminho do arquivo"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </ConfigField>

      <div className="grid grid-cols-2 gap-2">
        <ConfigField label="Tipo">
          <select
            value={config.fileType}
            onChange={(event) => onChange({ ...config, fileType: event.target.value as FileInputConfig["fileType"] })}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">XLSX</option>
            <option value="xml">XML</option>
          </select>
        </ConfigField>

        <ConfigField label="Encoding">
          <input
            value={config.encoding}
            onChange={(event) => onChange({ ...config, encoding: event.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </ConfigField>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ConfigField label="Delimitador">
          <input
            value={config.delimiter}
            onChange={(event) => onChange({ ...config, delimiter: event.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </ConfigField>

        <ConfigField label="Skip rows">
          <input
            type="number"
            min={0}
            value={config.skipRows}
            onChange={(event) => onChange({ ...config, skipRows: Number.parseInt(event.target.value || "0", 10) })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
          />
        </ConfigField>
      </div>

      <button
        type="button"
        onClick={onRunTest}
        className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Detectar schema
      </button>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Preview</p>
        <div className="max-h-28 overflow-auto rounded-md border border-border">
          {config.previewRows.length > 0 ? (
            config.previewRows.slice(0, 5).map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid grid-flow-col auto-cols-fr border-b border-border px-2 py-1 text-[11px]">
                {row.map((cell, cellIndex) => (
                  <span key={`cell-${rowIndex}-${cellIndex}`} className="truncate text-muted-foreground">
                    {cell}
                  </span>
                ))}
              </div>
            ))
          ) : (
            <div className="px-2 py-3 text-xs text-muted-foreground">Sem preview disponível.</div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-foreground">Schema detectado</p>
        <SchemaTable schema={node.data.outputSchema} />
      </div>
    </div>
  )
}
