"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Edit2, LayoutGrid, List, Plus, Search, Trash2 } from "lucide-react"
import { deleteCompetitor, listOrganizationCompetitors, type Competitor } from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { cn } from "@/lib/utils"
import { MorphLoader } from "@/components/ui/morph-loader"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function ConcorrentesPage() {
  const router = useRouter()
  const { selectedOrgId } = useDashboard()
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [competitorsLoading, setCompetitorsLoading] = useState(false)
  const [competitorsError, setCompetitorsError] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [search, setSearch] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetName, setDeleteTargetName] = useState<string>("")
  const [deleting, setDeleting] = useState(false)

  async function loadCompetitors(organizationId: string) {
    setCompetitorsLoading(true)
    setCompetitorsError("")

    try {
      const items = await listOrganizationCompetitors(organizationId)
      setCompetitors(items)
    } catch (err) {
      setCompetitorsError(err instanceof Error ? err.message : "Falha ao carregar concorrentes.")
    } finally {
      setCompetitorsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedOrgId) {
      loadCompetitors(selectedOrgId)
    }
  }, [selectedOrgId])

  const filteredCompetitors = useMemo(() => {
    const searchTerm = search.trim().toLowerCase()
    if (!searchTerm) return competitors
    return competitors.filter((item) => item.name.toLowerCase().includes(searchTerm))
  }, [competitors, search])

  const handleDeleteCompetitor = (competitor: Competitor) => {
    setCompetitorsError("")
    setDeleteTargetId(competitor.id)
    setDeleteTargetName(competitor.name)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteCompetitor = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    setCompetitorsError("")
    try {
      await deleteCompetitor(deleteTargetId)
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
      setDeleteTargetName("")
      if (selectedOrgId) await loadCompetitors(selectedOrgId)
    } catch (err) {
      setCompetitorsError(err instanceof Error ? err.message : "Falha ao remover concorrente.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-40 lg:w-56 rounded-md border border-border bg-background/50 pl-8 pr-3 text-[11px] outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={() => router.push("/concorrentes/novo")}
            className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md bg-foreground text-background text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="size-3" />
            Adicionar novo
          </button>
        </div>
      </div>

      {competitorsError ? (
        <p className="text-sm text-destructive">{competitorsError}</p>
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remover concorrente"
        description={
          deleteTargetName
            ? `Tem certeza que deseja remover o concorrente "${deleteTargetName}"?`
            : "Tem certeza que deseja remover este concorrente?"
        }
        confirmText="Remover"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={confirmDeleteCompetitor}
      />

      {competitorsLoading ? (
        <div className="flex items-center justify-center py-12">
          <MorphLoader className="size-6 morph-muted" />
        </div>
      ) : filteredCompetitors.length > 0 ? (
        viewMode === "list" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[1fr_80px] items-center px-4 py-2 border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Nome</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border">
              {filteredCompetitors.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px] items-center px-4 py-2 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground uppercase shrink-0">
                      {item.name.slice(0, 2)}
                    </div>
                    <p className="text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => router.push(`/concorrentes/${item.id}`)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompetitor(item)}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              onClick={() => router.push("/concorrentes/novo")}
              className="flex flex-col items-center justify-center gap-2 h-[160px] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
            >
              <div className="size-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="size-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Adicionar</p>
                <p className="text-[10px] text-muted-foreground">Novo concorrente</p>
              </div>
            </button>

            {filteredCompetitors.map((item) => (
              <div key={item.id} className="flex flex-col h-[160px] rounded-2xl border border-border bg-card p-4 relative group hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-[10px] text-indigo-500 uppercase">
                    {item.name.slice(0, 2)}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-3">{item.name}</h3>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => router.push(`/concorrentes/${item.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-semibold text-xs hover:bg-indigo-500/20 transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCompetitor(item)}
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
            <Building2 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum concorrente</h3>
          <p className="text-sm text-muted-foreground max-w-xs mt-1">
            Você ainda não cadastrou nenhum concorrente. Comece adicionando um novo agora.
          </p>
          <button
            onClick={() => router.push("/concorrentes/novo")}
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
