"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  Edit2,
  GitBranch,
  LayoutGrid,
  List,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type FlowStatus = "ativo" | "rascunho" | "pausado"

type FlowItem = {
  id: string
  name: string
  description: string
  updatedAt: string
  steps: number
  status: FlowStatus
}

const MOCK_FLOWS: FlowItem[] = [
  {
    id: "flow-1",
    name: "Carga Inicial ERP -> Data Lake",
    description: "Padroniza dados de cadastro e envia lote inicial para staging.",
    updatedAt: "08/04/2026",
    steps: 12,
    status: "ativo",
  },
  {
    id: "flow-2",
    name: "Reprocessamento de Pedidos",
    description: "Reconcilia pedidos com falha de integracao e atualiza status final.",
    updatedAt: "07/04/2026",
    steps: 9,
    status: "rascunho",
  },
  {
    id: "flow-3",
    name: "Validacao Fiscal de Saida",
    description: "Aplica regras fiscais por UF antes da exportacao para o destino.",
    updatedAt: "05/04/2026",
    steps: 15,
    status: "pausado",
  },
  {
    id: "flow-4",
    name: "Atualizacao de Produtos Concorrentes",
    description: "Consolida catalogo e replica alteracoes aprovadas no workspace.",
    updatedAt: "02/04/2026",
    steps: 7,
    status: "ativo",
  },
]

function statusBadgeClass(status: FlowStatus) {
  if (status === "ativo") return "bg-emerald-500/15 text-emerald-500"
  if (status === "pausado") return "bg-amber-500/15 text-amber-500"
  return "bg-zinc-500/15 text-zinc-400"
}

export default function FluxosPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | FlowStatus>("all")

  const filteredFlows = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    return MOCK_FLOWS.filter((item) => {
      const statusMatches = statusFilter === "all" || item.status === statusFilter
      if (!statusMatches) return false
      if (!searchTerm) return true
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
    })
  }, [search, statusFilter])

  const openCreate = () => router.push("/fluxos/novo")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/50 p-1.5">
        <div className="flex items-center gap-1 rounded-md border border-border/50 bg-background/50 p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              viewMode === "list"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              viewMode === "card"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3" />
            Card
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | FlowStatus)}
            className="h-7 rounded-md border border-border bg-background/50 px-2 text-[11px] text-muted-foreground outline-none transition-all focus:ring-1 focus:ring-primary/20"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="rascunho">Rascunhos</option>
            <option value="pausado">Pausados</option>
          </select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-7 w-40 rounded-md border border-border bg-background/50 pl-8 pr-3 text-[11px] outline-none transition-all focus:ring-1 focus:ring-primary/20 lg:w-56"
            />
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2 text-[11px] font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-3" />
            Criar novo
          </button>
        </div>
      </div>

      {filteredFlows.length > 0 ? (
        viewMode === "list" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_80px_70px_100px_80px] items-center border-b border-border bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Fluxo</span>
              <span className="text-center">Status</span>
              <span className="text-center">Etapas</span>
              <span className="text-center">Atualizado</span>
              <span className="text-right">Acoes</span>
            </div>
            <div className="divide-y divide-border">
              {filteredFlows.map((item) => (
                <div
                  key={item.id}
                  className="group grid grid-cols-[1fr_80px_70px_100px_80px] items-center px-4 py-2 transition-colors hover:bg-muted/20"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <GitBranch className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                        {item.name}
                      </h3>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                        statusBadgeClass(item.status)
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span className="text-center text-xs font-medium">{item.steps}</span>
                  <span className="text-center text-[11px] text-muted-foreground">{item.updatedAt}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      <Play className="size-3.5" />
                    </button>
                    <button
                      onClick={openCreate}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button className="rounded-md p-1.5 text-destructive/50 transition-colors hover:bg-muted hover:text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              onClick={openCreate}
              className="group flex h-[170px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border transition-all hover:border-primary/50 hover:bg-muted/30"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Plus className="size-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Criar novo</p>
                <p className="text-[10px] text-muted-foreground">Novo fluxo</p>
              </div>
            </button>

            {filteredFlows.map((item) => (
              <div
                key={item.id}
                className="group relative flex h-[170px] flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <GitBranch className="size-4" />
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      statusBadgeClass(item.status)
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="line-clamp-2 text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.steps} etapas</p>
                </div>

                <div className="mb-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CalendarClock className="size-3" />
                  Atualizado em {item.updatedAt}
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 text-xs font-semibold text-indigo-500 transition-colors hover:bg-indigo-500/20">
                    <Play className="size-3.5" />
                    Executar
                  </button>
                  <button
                    onClick={openCreate}
                    className="rounded-xl bg-muted p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <GitBranch className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum fluxo encontrado</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo fluxo para comecar.
          </p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Criar primeiro fluxo
          </button>
        </div>
      )}
    </div>
  )
}
