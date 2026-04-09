"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeftRight,
  CalendarClock,
  GitBranch,
  LayoutGrid,
  List,
  Plus,
  Play,
  Search,
  Trash2,
  WandSparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deleteWorkflow, listWorkflows, type WorkflowListItem } from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"

type StatusFilter = "all" | "draft" | "active" | "paused"

function statusLabel(status: string) {
  if (status === "active") return "Ativo"
  if (status === "paused") return "Pausado"
  return "Rascunho"
}

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-emerald-500/15 text-emerald-500"
  if (status === "paused") return "bg-amber-500/15 text-amber-500"
  return "bg-zinc-500/15 text-zinc-400"
}

function typeIcon(type: string) {
  if (type === "migration") return { Icon: ArrowLeftRight, bg: "bg-blue-500/10", text: "text-blue-500" }
  if (type === "config") return { Icon: WandSparkles, bg: "bg-violet-500/10", text: "text-violet-500" }
  return { Icon: GitBranch, bg: "bg-muted", text: "text-muted-foreground" }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

export default function FluxosPage() {
  const router = useRouter()
  const { selectedWorkspace } = useDashboard()
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedWorkspace?.id) {
      setWorkflows([])
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    listWorkflows(selectedWorkspace.id)
      .then((items) => { if (active) setWorkflows(items) })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Erro ao carregar workflows.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedWorkspace?.id])

  const filteredWorkflows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return workflows.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!term) return true
      return item.name.toLowerCase().includes(term)
    })
  }, [workflows, search, statusFilter])

  async function handleDelete(id: string) {
    if (!selectedWorkspace?.id) return
    setWorkflows((prev) => prev.filter((w) => w.id !== id))
    try {
      await deleteWorkflow(selectedWorkspace.id, id)
    } catch {
      listWorkflows(selectedWorkspace.id).then(setWorkflows).catch(() => {})
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/50 p-1.5">
        <div className="flex items-center gap-1 rounded-md border border-border/50 bg-background/50 p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              viewMode === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3" />
            Card
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40 text-[11px] data-[size=default]:h-7">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-40 rounded-md border border-border bg-background/50 pl-8 pr-3 text-[11px] outline-none transition-all focus:ring-1 focus:ring-primary/20 lg:w-56"
            />
          </div>

          <button
            onClick={() => router.push("/fluxos/novo")}
            className="inline-flex h-7 items-center gap-2 rounded-md bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            Novo fluxo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
          Carregando workflows...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-sm text-destructive">
          {error}
        </div>
      ) : !selectedWorkspace ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <GitBranch className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum workspace selecionado</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Selecione um workspace para ver os workflows disponíveis.
          </p>
        </div>
      ) : filteredWorkflows.length > 0 ? (
        viewMode === "list" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_90px_100px_80px] items-center border-b border-border bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Fluxo</span>
              <span className="text-center">Status</span>
              <span className="text-center">Atualizado</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border">
              {filteredWorkflows.map((item) => {
                const { Icon, bg, text } = typeIcon(item.type)
                return (
                  <div
                    key={item.id}
                    className="group grid grid-cols-[1fr_90px_100px_80px] items-center px-4 py-2 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", bg, text)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">{item.type === "migration" ? "Migração" : item.type === "config" ? "Configuração" : "Workflow"}</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase", statusBadgeClass(item.status))}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <span className="text-center text-[11px] text-muted-foreground">{formatDate(item.created_at)}</span>
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <Play className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-md p-1.5 text-destructive/50 transition-colors hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              onClick={() => router.push("/fluxos/novo")}
              className="flex h-[170px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border transition-all hover:border-primary/50 hover:bg-muted/30 group"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Plus className="size-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Adicionar</p>
                <p className="text-[10px] text-muted-foreground">Novo fluxo</p>
              </div>
            </button>

            {filteredWorkflows.map((item) => {
              const { Icon, bg, text } = typeIcon(item.type)
              return (
                <div
                  key={item.id}
                  className="group relative flex h-[170px] flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className={cn("flex size-8 items-center justify-center rounded-lg", bg, text)}>
                      <Icon className="size-4" />
                    </div>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase", statusBadgeClass(item.status))}>
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground">{item.name}</h3>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{item.type === "migration" ? "Migração" : item.type === "config" ? "Configuração" : "Workflow"}</p>
                  </div>

                  <div className="mb-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CalendarClock className="size-3" />
                    {formatDate(item.created_at)}
                  </div>

                  <div className="mt-auto flex items-center gap-2">
                    <button className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                      <Play className="size-3.5" />
                      Executar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex size-8 items-center justify-center rounded-xl text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <GitBranch className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum fluxo encontrado</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {workflows.length === 0
              ? "Crie seu primeiro workflow para começar."
              : "Ajuste os filtros para visualizar os workflows cadastrados."}
          </p>
          <button
            onClick={() => router.push("/fluxos/novo")}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {workflows.length === 0 ? "Criar Primeiro Workflow" : "Adicionar Novo"}
          </button>
        </div>
      )}
    </div>
  )
}
