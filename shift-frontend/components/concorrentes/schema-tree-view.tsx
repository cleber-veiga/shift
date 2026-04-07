"use client"

import { ChevronDown, ChevronRight, Columns, Table2 } from "lucide-react"
import { useState } from "react"
import type { SchemaTable } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface SchemaTreeViewProps {
  tables: SchemaTable[]
}

export function SchemaTreeView({ tables }: SchemaTreeViewProps) {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }))
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg bg-muted/10">
        <Table2 className="size-8 text-muted-foreground/30 mb-3" />
        <p className="text-xs font-medium text-muted-foreground">Nenhuma tabela encontrada no schema.</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Capture o schema para visualizar a estrutura do banco de dados.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1 border border-border rounded-lg bg-background/50 overflow-hidden">
      <div className="bg-muted/30 px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Estrutura do Banco ({tables.length} tabelas)
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-1">
        {tables.map((table) => {
          const isExpanded = expandedTables[table.table_name]
          const tableKey = table.schema_name ? `${table.schema_name}.${table.table_name}` : table.table_name

          return (
            <div key={tableKey} className="flex flex-col">
              <button
                onClick={() => toggleTable(table.table_name)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs font-medium transition-all text-left group",
                  isExpanded ? "bg-primary/5 text-primary" : "text-foreground hover:bg-muted/50"
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="size-3.5 text-primary" />
                ) : (
                  <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                )}
                <Table2 className={cn("size-3.5", isExpanded ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">
                  {table.schema_name && <span className="opacity-50">{table.schema_name}.</span>}
                  {table.table_name}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground">
                  {table.columns.length} colunas
                </span>
              </button>

              {isExpanded && (
                <div className="ml-7 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-border/60 pl-2">
                  {table.columns.map((column) => (
                    <div
                      key={column.column_name}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30 transition-colors"
                    >
                      <Columns className="size-3 text-muted-foreground/40" />
                      <span className="text-[11px] font-medium text-foreground/80">{column.column_name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto bg-muted/50 px-1.5 py-0.5 rounded">
                        {column.data_type.toLowerCase()}
                        {!column.is_nullable && <span className="text-destructive ml-1">*</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
