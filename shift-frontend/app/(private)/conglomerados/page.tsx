﻿﻿﻿﻿﻿﻿﻿"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutGrid,
  Layers,
  List,
  Plus,
  Search,
  Edit2,
  Trash2,
} from "lucide-react"
import {
  deleteConglomerate,
  listConglomerateEstablishments,
  listOrganizationConglomerates,
  type Conglomerate,
} from "@/lib/auth"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/context/dashboard-context"
import { MorphLoader } from "@/components/ui/morph-loader"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type ConglomerateStatusFilter = "all" | "active" | "inactive"

export default function ConglomeradosPage() {
  const router = useRouter()
  const { selectedOrgId } = useDashboard()
  const [conglomerates, setConglomerates] = useState<Conglomerate[]>([])
  const [conglomeratesLoading, setConglomeratesLoading] = useState(false)
  const [conglomeratesError, setConglomeratesError] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [conglomerateSearch, setConglomerateSearch] = useState("")
  const [conglomerateStatusFilter, setConglomerateStatusFilter] = useState<ConglomerateStatusFilter>("all")
  const [establishmentCountByConglomerate, setEstablishmentCountByConglomerate] = useState<Record<string, number>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState<string>("")
  const [deleting, setDeleting] = useState(false)

  async function loadConglomerates(organizationId: string) {
    setConglomeratesLoading(true)
    setConglomeratesError("")

    try {
      const items = await listOrganizationConglomerates(organizationId)
      setConglomerates(items)

      const counts = await Promise.all(
        items.map(async (item) => {
          try {
            const establishments = await listConglomerateEstablishments(item.id)
            return { id: item.id, count: establishments.length }
          } catch {
            return { id: item.id, count: 0 }
          }
        })
      )

      setEstablishmentCountByConglomerate(
        counts.reduce<Record<string, number>>((acc, current) => {
          acc[current.id] = current.count
          return acc
        }, {})
      )
    } catch (err) {
      setConglomeratesError(err instanceof Error ? err.message : "Falha ao carregar conglomerados.")
    } finally {
      setConglomeratesLoading(false)
    }
  }

  useEffect(() => {
    if (selectedOrgId) {
      loadConglomerates(selectedOrgId)
    }
  }, [selectedOrgId])

  const filteredConglomerates = useMemo(() => {
    const searchTerm = conglomerateSearch.trim().toLowerCase()
    return conglomerates.filter((c) => {
      const statusMatches =
        conglomerateStatusFilter === "all" ||
        (conglomerateStatusFilter === "active" && c.is_active) ||
        (conglomerateStatusFilter === "inactive" && !c.is_active)
      if (!statusMatches) return false
      if (!searchTerm) return true
      return c.name.toLowerCase().includes(searchTerm) || c.description?.toLowerCase().includes(searchTerm)
    })
  }, [conglomerates, conglomerateSearch, conglomerateStatusFilter])

  const handleDeleteConglomerate = (conglomerate: Conglomerate) => {
    setConglomeratesError("")
    setDeleteTargetId(conglomerate.id)
    setDeleteTargetName(conglomerate.name)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteConglomerate = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    setConglomeratesError("")
    try {
      await deleteConglomerate(deleteTargetId)
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
      setDeleteTargetName("")
      if (selectedOrgId) await loadConglomerates(selectedOrgId)
    } catch (err) {
      setConglomeratesError(err instanceof Error ? err.message : "Falha ao remover conglomerado.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Nova Toolbar Compacta */}
      <div className="flex items-center justify-between gap-4 rounded-lg bg-card/50 p-1.5 border border-border">
        <div className="flex items-center gap-1 bg-background/50 p-0.5 rounded-md border border-border/50">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
              viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-3" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium transition-all",
              viewMode === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="size-3" />
            Card
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={conglomerateStatusFilter}
            onChange={(e) => setConglomerateStatusFilter(e.target.value as ConglomerateStatusFilter)}
            className="h-7 rounded-md border border-border bg-background/50 px-2 text-[11px] outline-none focus:ring-1 focus:ring-primary/20 transition-all text-muted-foreground"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={conglomerateSearch}
              onChange={(e) => setConglomerateSearch(e.target.value)}
              className="h-7 w-40 lg:w-56 rounded-md border border-border bg-background/50 pl-8 pr-3 text-[11px] outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={() => router.push("/conglomerados/novo")}
            className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md bg-foreground text-background text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3" />
            Adicionar novo
          </button>
        </div>
      </div>

      {conglomeratesError ? (
        <p className="text-sm text-destructive">{conglomeratesError}</p>
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover conglomerado"
        description={
          deleteTargetName
            ? `Tem certeza que deseja remover o conglomerado "${deleteTargetName}" e todos os seus estabelecimentos?`
            : "Tem certeza que deseja remover este conglomerado e todos os seus estabelecimentos?"
        }
        confirmText="Remover"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteConglomerate}
      />

      {conglomeratesLoading ? (
        <div className="flex items-center justify-center py-12">
          <MorphLoader className="size-6 morph-muted" />
        </div>
      ) : filteredConglomerates.length > 0 ? (
        viewMode === "list" ? (
          /* Visualização em Lista Compacta */
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_100px_80px] items-center px-4 py-2 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Nome</span>
              <span className="text-center">Status</span>
              <span className="text-center">Estabelecimentos</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border">
              {filteredConglomerates.map((c) => (
                <div key={c.id} className="grid grid-cols-[1fr_80px_100px_80px] items-center px-4 py-2 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground uppercase">
                      {c.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{c.description || "Sem descrição"}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                        c.is_active
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-zinc-500/15 text-zinc-400"
                      )}
                    >
                      {c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="text-center font-medium text-xs">
                    {establishmentCountByConglomerate[c.id] ?? 0}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => router.push(`/conglomerados/${c.id}`)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConglomerate(c)}
                      className="p-1.5 rounded-md hover:bg-muted text-destructive/50 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Visualização em Cards */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Card de Adicionar */}
            <button
              onClick={() => router.push("/conglomerados/novo")}
              className="flex flex-col items-center justify-center gap-2 h-[160px] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
            >
              <div className="size-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="size-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Adicionar</p>
                <p className="text-[10px] text-muted-foreground">Novo conglomerado</p>
              </div>
            </button>

            {filteredConglomerates.map((c) => (
              <div key={c.id} className="flex flex-col h-[160px] rounded-2xl border border-border bg-card p-4 relative group hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-[10px] text-indigo-500 uppercase">
                    {c.name.slice(0, 2)}
                  </div>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                      c.is_active
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-zinc-500/15 text-zinc-400"
                    )}
                  >
                    {c.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{establishmentCountByConglomerate[c.id] ?? 0} estabelecimentos</p>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => router.push(`/conglomerados/${c.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-semibold text-xs hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteConglomerate(c)}
                    className="p-2 rounded-xl bg-muted text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Layers className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum conglomerado</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Você ainda não criou nenhum conglomerado. Comece adicionando um novo agora.
          </p>
          <button
            onClick={() => router.push("/conglomerados/novo")}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="size-4" />
            Adicionar Primeiro
          </button>
        </div>
      )}
    </div>
  )
}

