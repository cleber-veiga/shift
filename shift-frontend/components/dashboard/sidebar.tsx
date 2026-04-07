"use client"

import { MorphLoader } from "@/components/ui/morph-loader"
import {
  listOrganizationCompetitors,
  listOrganizationConglomerates,
  type Competitor,
  type Conglomerate,
} from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { cn } from "@/lib/utils"
import {
  Building2,
  Check,
  ChevronDown,
  Database,
  FolderKanban,
  Home,
  LayoutTemplate,
  Layers,
  Plus,
  Users,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type MenuItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainMenus: MenuItem[] = [
  { label: "Visão Geral", href: "/home", icon: Home },
  { label: "Conglomerados", href: "/conglomerados", icon: Layers },
  { label: "Concorrentes", href: "/concorrentes", icon: Building2 },
  { label: "Contatos", href: "/contatos", icon: Users },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
]

const projectMenus: MenuItem[] = [
  { label: "Fontes de Dados", href: "/data-sources", icon: Database },
]

const orgRoleLabels: Record<string, string> = {
  OWNER: "Dono",
  MANAGER: "Gerente",
  MEMBER: "Membro",
  GUEST: "Convidado",
}

function formatDateInput(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function Sidebar() {
  const pathname = usePathname()
  const projectMenuRef = useRef<HTMLDivElement | null>(null)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectConglomerateId, setProjectConglomerateId] = useState("")
  const [projectCompetitorId, setProjectCompetitorId] = useState("")
  const [availableConglomerates, setAvailableConglomerates] = useState<Conglomerate[]>([])
  const [availableCompetitors, setAvailableCompetitors] = useState<Competitor[]>([])
  const [isLoadingProjectDependencies, setIsLoadingProjectDependencies] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState("")
  const [projectStartDate, setProjectStartDate] = useState(() => formatDateInput(new Date()))
  const [projectEndDate, setProjectEndDate] = useState(() => {
    const next = new Date()
    next.setDate(next.getDate() + 30)
    return formatDateInput(next)
  })

  const {
    selectedProject,
    selectedOrganization,
    selectedWorkspace,
    availableProjects,
    setSelectedProjectId,
    createProjectAndSelect,
  } = useDashboard()

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setProjectMenuOpen(false)
  }

  useEffect(() => {
    if (!createProjectOpen) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreatingProject) {
        setCreateProjectOpen(false)
        setCreateProjectError("")
      }
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [createProjectOpen, isCreatingProject])

  useEffect(() => {
    if (!createProjectOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [createProjectOpen])

  useEffect(() => {
    if (!createProjectOpen || !selectedOrganization?.id) return

    let active = true
    setIsLoadingProjectDependencies(true)

    Promise.all([
      listOrganizationConglomerates(selectedOrganization.id),
      listOrganizationCompetitors(selectedOrganization.id),
    ])
      .then(([conglomerates, competitors]) => {
        if (!active) return
        setAvailableConglomerates(conglomerates)
        setAvailableCompetitors(competitors)

        setProjectConglomerateId((current) => {
          if (current && conglomerates.some((item) => item.id === current)) return current
          return conglomerates[0]?.id ?? ""
        })

        setProjectCompetitorId((current) => {
          if (current && competitors.some((item) => item.id === current)) return current
          return competitors[0]?.id ?? ""
        })
      })
      .catch(() => {
        if (!active) return
        setAvailableConglomerates([])
        setAvailableCompetitors([])
      })
      .finally(() => {
        if (!active) return
        setIsLoadingProjectDependencies(false)
      })

    return () => {
      active = false
    }
  }, [createProjectOpen, selectedOrganization?.id])

  const openCreateProject = () => {
    setProjectMenuOpen(false)
    setCreateProjectError("")
    setCreateProjectOpen(true)
  }

  const closeCreateProject = () => {
    if (isCreatingProject) return
    setCreateProjectError("")
    setCreateProjectOpen(false)
  }

  const canCreateProject =
    projectName.trim().length >= 2 &&
    !!projectConglomerateId &&
    !!projectCompetitorId &&
    !!projectStartDate &&
    !!projectEndDate &&
    !!selectedWorkspace?.id

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedWorkspace?.id) {
      setCreateProjectError("Selecione um workspace primeiro.")
      return
    }

    if (projectEndDate < projectStartDate) {
      setCreateProjectError("A data final deve ser maior ou igual a data inicial.")
      return
    }

    if (!canCreateProject) return

    setIsCreatingProject(true)
    setCreateProjectError("")

    try {
      await createProjectAndSelect({
        workspace_id: selectedWorkspace.id,
        name: projectName.trim(),
        competitor_id: projectCompetitorId,
        conglomerate_id: projectConglomerateId,
        start_date: projectStartDate,
        end_date: projectEndDate,
        description: projectDescription.trim() ? projectDescription.trim() : null,
      })
      setProjectName("")
      setProjectDescription("")
      setCreateProjectOpen(false)
    } catch (err) {
      setCreateProjectError(err instanceof Error ? err.message : "Falha ao cadastrar projeto.")
    } finally {
      setIsCreatingProject(false)
    }
  }

  const isItemActive = (href: string) => {
    if (href === "/home") return pathname === "/home"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden w-64 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="border-b border-border px-4 py-3">
        <Link href="/home" className="inline-flex items-center gap-2 rounded-md px-0.5 py-0.5">
          <div className="inline-flex size-8 items-center justify-center rounded-md bg-foreground">
            <Building2 className="size-4 text-background" />
          </div>
          <span className="text-base font-semibold">Shift</span>
        </Link>
      </div>

      <div ref={projectMenuRef} className="relative border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setProjectMenuOpen((current) => !current)}
          className="inline-flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-left text-xs hover:bg-accent"
        >
          <FolderKanban className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-medium">{selectedProject?.name ?? "Sem projeto"}</p>
            <p className="text-muted-foreground">
              {selectedOrganization ? orgRoleLabels[selectedOrganization.role] : "Membro"}
            </p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        {projectMenuOpen ? (
          <div className="absolute left-4 right-4 top-[calc(100%-2px)] z-40 mt-2 rounded-xl border border-border bg-card p-2 shadow-lg">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Projetos
            </p>
            <div className="max-h-56 space-y-1 overflow-auto">
              {availableProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project.id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrganization ? orgRoleLabels[selectedOrganization.role] : "Membro"}
                    </p>
                  </div>
                  {selectedProject?.id === project.id && <Check className="size-4 text-primary" />}
                </button>
              ))}
              {availableProjects.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">Sem projetos neste workspace.</p>
              ) : null}
            </div>
            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={openCreateProject}
                disabled={!selectedWorkspace?.id}
                className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" />
                Criar novo projeto
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Principal
          </p>
          <div className="space-y-1">
            {mainMenus.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isItemActive(item.href)
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Projeto
          </p>
          <div className="space-y-1">
            {projectMenus.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isItemActive(item.href)
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </nav>

      {createProjectOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeCreateProject}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar projeto"
            className="w-[min(560px,96vw)] rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-base font-semibold text-foreground">Cadastrar projeto</p>
                <p className="text-xs text-muted-foreground">
                  {selectedWorkspace?.name ? `Workspace: ${selectedWorkspace.name}` : "Selecione um workspace."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateProject}
                disabled={isCreatingProject}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  Nome do projeto
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Ex: Comparativo Abril 2026"
                  className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  minLength={2}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Conglomerado
                  </label>
                  <select
                    value={projectConglomerateId}
                    onChange={(event) => setProjectConglomerateId(event.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    required
                  >
                    {availableConglomerates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Concorrente
                  </label>
                  <select
                    value={projectCompetitorId}
                    onChange={(event) => setProjectCompetitorId(event.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    required
                  >
                    {availableCompetitors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={projectStartDate}
                    onChange={(event) => setProjectStartDate(event.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={projectEndDate}
                    onChange={(event) => setProjectEndDate(event.target.value)}
                    className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  Descrição (opcional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Detalhes do objetivo do projeto."
                  className="w-full rounded-xl border border-input bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {isLoadingProjectDependencies ? (
                <p className="text-xs text-muted-foreground">Carregando conglomerados e concorrentes...</p>
              ) : null}

              {!isLoadingProjectDependencies && availableConglomerates.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100">
                  Cadastre ao menos um conglomerado antes de criar projeto.
                </div>
              ) : null}

              {!isLoadingProjectDependencies && availableCompetitors.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100">
                  Cadastre ao menos um concorrente antes de criar projeto.
                </div>
              ) : null}

              {createProjectError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                  {createProjectError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateProject}
                  disabled={isCreatingProject}
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingProject ||
                    isLoadingProjectDependencies ||
                    !canCreateProject ||
                    availableConglomerates.length === 0 ||
                    availableCompetitors.length === 0
                  }
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingProject ? <MorphLoader className="size-3" /> : <Plus className="size-3" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

