﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿"use client"

import {
  Bell,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  LogOut,
  PanelLeft,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react"
import { listErps, logout, type ERP } from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { useDashboardHeader } from "@/lib/context/header-context"
import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { PreferencesModal } from "@/components/dashboard/preferences-modal"
import { MorphLoader } from "@/components/ui/morph-loader"

const orgRoleLabels: Record<string, string> = {
  OWNER: "Dono",
  MANAGER: "Gerente",
  MEMBER: "Membro",
  GUEST: "Convidado",
}

interface HeaderProps {
  sidebarVisible: boolean
  setSidebarVisible: (visible: boolean) => void
}

function HeaderTooltipTrigger({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group/tooltip relative">
      {children}
      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 opacity-0 transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100">
        <div className="whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-lg">
          {text}
        </div>
        <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-border bg-card" />
      </div>
    </div>
  )
}

export function Header({ sidebarVisible, setSidebarVisible }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { config } = useDashboardHeader()
  const orgMenuRef = useRef<HTMLDivElement | null>(null)
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const [createOrgError, setCreateOrgError] = useState("")
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceErpId, setWorkspaceErpId] = useState<string>("")
  const [availableErps, setAvailableErps] = useState<ERP[]>([])
  const [isLoadingErps, setIsLoadingErps] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [createWorkspaceError, setCreateWorkspaceError] = useState("")

  const {
    selectedOrganization,
    selectedWorkspace,
    organizations,
    availableWorkspaces,
    setSelectedOrgId,
    setSelectedWorkspaceId,
    createOrganizationAndSelect,
    createWorkspaceAndSelect,
  } = useDashboard()

  const slugify = (value: string) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const getPageTitle = () => {
    if (pathname === "/home") return "Visão Geral"
    if (pathname.startsWith("/conglomerados")) return "Conglomerados"
    if (pathname.startsWith("/concorrentes")) return "Concorrentes"
    if (pathname.startsWith("/fluxos")) return "Fluxos"
    if (pathname.startsWith("/workspaces")) return "Workspaces"
    if (pathname.startsWith("/contatos")) return "Contatos"
    if (pathname.startsWith("/templates")) return "Templates"
    if (pathname.startsWith("/data-sources")) return "Fontes de Dados"
    return "Home"
  }

  const getGroupTitle = () => {
    const isMainPath =
      pathname === "/home" ||
      pathname.startsWith("/conglomerados") ||
      pathname.startsWith("/concorrentes") ||
      pathname.startsWith("/fluxos") ||
      pathname.startsWith("/workspaces") ||
      pathname.startsWith("/contatos") ||
      pathname.startsWith("/templates")
    if (isMainPath) return "Principal"
    return "Projeto"
  }

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (orgMenuRef.current && !orgMenuRef.current.contains(target)) {
        setOrgMenuOpen(false)
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setWorkspaceMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", onDocumentClick)
    return () => document.removeEventListener("mousedown", onDocumentClick)
  }, [])

  useEffect(() => {
    if (!createOrgOpen) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreatingOrg) {
        setCreateOrgOpen(false)
        setCreateOrgError("")
      }
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [createOrgOpen, isCreatingOrg])

  useEffect(() => {
    if (!createOrgOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [createOrgOpen])

  useEffect(() => {
    if (!createWorkspaceOpen) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreatingWorkspace) {
        setCreateWorkspaceOpen(false)
        setCreateWorkspaceError("")
      }
    }
    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [createWorkspaceOpen, isCreatingWorkspace])

  useEffect(() => {
    if (!createWorkspaceOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [createWorkspaceOpen])

  useEffect(() => {
    if (!createWorkspaceOpen) return
    let active = true
    setIsLoadingErps(true)
    listErps()
      .then((items) => {
        if (!active) return
        setAvailableErps(items)
      })
      .catch(() => {
        if (!active) return
        setAvailableErps([])
      })
      .finally(() => {
        if (!active) return
        setIsLoadingErps(false)
      })
    return () => {
      active = false
    }
  }, [createWorkspaceOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    router.replace("/login")
  }

  const openCreateOrg = () => {
    setOrgMenuOpen(false)
    setCreateOrgError("")
    setCreateOrgOpen(true)
  }

  const closeCreateOrg = () => {
    if (isCreatingOrg) return
    setCreateOrgError("")
    setCreateOrgOpen(false)
  }

  const openCreateWorkspace = () => {
    setWorkspaceMenuOpen(false)
    setCreateWorkspaceError("")
    setWorkspaceErpId("")
    setCreateWorkspaceOpen(true)
  }

  const closeCreateWorkspace = () => {
    if (isCreatingWorkspace) return
    setCreateWorkspaceError("")
    setCreateWorkspaceOpen(false)
  }

  const canCreateOrg = orgName.trim().length > 0 && orgSlug.trim().length >= 2

  const handleCreateOrganization = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canCreateOrg) return

    setIsCreatingOrg(true)
    setCreateOrgError("")
    try {
      await createOrganizationAndSelect({
        name: orgName.trim(),
        slug: orgSlug.trim(),
      })
      setOrgName("")
      setOrgSlug("")
      setCreateOrgOpen(false)
    } catch (err) {
      setCreateOrgError(err instanceof Error ? err.message : "Falha ao cadastrar organizacao.")
    } finally {
      setIsCreatingOrg(false)
    }
  }

  const canCreateWorkspace = workspaceName.trim().length >= 2 && !!selectedOrganization?.id

  const handleCreateWorkspace = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedOrganization?.id) {
      setCreateWorkspaceError("Selecione uma organizacao primeiro.")
      return
    }
    if (!canCreateWorkspace) return

    setIsCreatingWorkspace(true)
    setCreateWorkspaceError("")
    try {
      await createWorkspaceAndSelect({
        organization_id: selectedOrganization.id,
        name: workspaceName.trim(),
        erp_id: workspaceErpId ? workspaceErpId : null,
      })
      setWorkspaceName("")
      setCreateWorkspaceOpen(false)
    } catch (err) {
      setCreateWorkspaceError(err instanceof Error ? err.message : "Falha ao cadastrar workspace.")
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-border bg-background px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={sidebarVisible ? "Esconder sidebar" : "Mostrar sidebar"}
          >
            <PanelLeft className="size-4" />
          </button>

          <nav className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">{getGroupTitle()}</span>
            <ChevronRight className="size-4 text-muted-foreground/50" />
            <span className="font-medium text-foreground">{getPageTitle()}</span>
            {config.breadcrumb ? (
              <>
                <ChevronRight className="size-4 text-muted-foreground/50" />
                {config.breadcrumb}
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {config.actions?.length ? (
            <div className="flex items-center gap-1">
              {config.actions.map((action) => {
                const Icon = action.icon
                return (
                  <HeaderTooltipTrigger key={action.key} text={action.label}>
                    <button
                      type="button"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
                      aria-label={action.label}
                    >
                      <Icon className="size-4" />
                    </button>
                  </HeaderTooltipTrigger>
                )
              })}
            </div>
          ) : null}
          <div ref={orgMenuRef} className="relative">
            <HeaderTooltipTrigger text="Selecione a Organização">
              <button
                type="button"
                onClick={() => setOrgMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-accent/50"
                aria-label="Selecione a Organização"
              >
                <Building2 className="size-4 text-muted-foreground" />
                <div className="leading-tight">
                  <p className="max-w-[120px] truncate font-medium">{selectedOrganization?.name}</p>
                  <p className="text-muted-foreground">
                    {selectedOrganization ? orgRoleLabels[selectedOrganization.role] : ""}
                  </p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </HeaderTooltipTrigger>

            {orgMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Minhas organizacoes
                </p>
                {organizations.map((organization) => (
                  <button
                    key={organization.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrgId(organization.id)
                      setOrgMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{organization.name}</p>
                      <p className="text-xs text-muted-foreground">{orgRoleLabels[organization.role]}</p>
                    </div>
                    {selectedOrganization?.id === organization.id && (
                      <Check className="size-4 text-primary" />
                    )}
                  </button>
                ))}
                <div className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={openCreateOrg}
                    className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    Criar nova organizacao
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div ref={workspaceMenuRef} className="relative">
            <HeaderTooltipTrigger text="Selecione o Espaço de Trabalho">
              <button
                type="button"
                onClick={() => setWorkspaceMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-accent/50"
                aria-label="Selecione o Espaço de Trabalho"
              >
                <Boxes className="size-4 text-muted-foreground" />
                <p className="max-w-[120px] truncate font-medium">
                  {selectedWorkspace?.name ?? "Sem workspace"}
                </p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </HeaderTooltipTrigger>

            {workspaceMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Workspaces
                </p>
                {availableWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="group flex items-center gap-1 rounded-md hover:bg-accent">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkspaceId(workspace.id)
                        setWorkspaceMenuOpen(false)
                      }}
                      className="flex min-w-0 flex-1 items-center justify-between px-2 py-2 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground">Workspace</p>
                      </div>
                      {selectedWorkspace?.id === workspace.id && (
                        <Check className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/workspaces/${workspace.id}`)
                        setWorkspaceMenuOpen(false)
                      }}
                      className="mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      title={`Editar workspace ${workspace.name}`}
                      aria-label={`Editar workspace ${workspace.name}`}
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <div className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={openCreateWorkspace}
                    disabled={!selectedOrganization}
                    className="inline-flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    Criar novo workspace
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notificacoes"
          >
            <Bell className="size-4" />
          </button>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              className="inline-flex size-8 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold text-foreground hover:bg-foreground/20"
              aria-label="Usuario"
            >
              U
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 top-11 z-20 w-52 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                >
                  <UserRound className="size-4 text-muted-foreground" />
                  Perfil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setPreferencesOpen(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  Preferencias
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sair do sistema
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <PreferencesModal open={preferencesOpen} onOpenChange={setPreferencesOpen} />

      {createOrgOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeCreateOrg}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar organizacao"
            className="w-[min(520px,96vw)] rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-base font-semibold text-foreground">Cadastrar organizacao</p>
                <p className="text-xs text-muted-foreground">Crie uma nova organizacao para usar no sistema.</p>
              </div>
              <button
                type="button"
                onClick={closeCreateOrg}
                disabled={isCreatingOrg}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="px-5 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  Nome da organizacao
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => {
                    const nextName = event.target.value
                    setOrgName(nextName)
                    if (!orgSlug) {
                      setOrgSlug(slugify(nextName))
                    }
                  }}
                  placeholder="Ex: Minha Empresa"
                  className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  Slug
                </label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(event) => setOrgSlug(slugify(event.target.value))}
                  placeholder="minha-empresa"
                  className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  minLength={2}
                  required
                />
                <p className="mt-1 text-[9px] text-muted-foreground">Sera usado na URL: /org/seu-slug</p>
              </div>

              {createOrgError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                  {createOrgError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateOrg}
                  disabled={isCreatingOrg}
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg || !canCreateOrg}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingOrg ? <MorphLoader className="size-3" /> : <Plus className="size-3" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {createWorkspaceOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeCreateWorkspace}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar workspace"
            className="w-[min(520px,96vw)] rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-base font-semibold text-foreground">Cadastrar workspace</p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrganization?.name ? `Organizacao: ${selectedOrganization.name}` : "Selecione uma organizacao."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateWorkspace}
                disabled={isCreatingWorkspace}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="px-5 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  Nome do workspace
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="Ex: Construshow"
                  className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  minLength={2}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  ERP
                </label>
                <select
                  value={workspaceErpId}
                  onChange={(event) => setWorkspaceErpId(event.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">Nenhum</option>
                  {availableErps.map((erp) => (
                    <option key={erp.id} value={erp.id}>
                      {erp.name} ({erp.code})
                    </option>
                  ))}
                </select>
                {isLoadingErps ? (
                  <p className="mt-1 text-[9px] text-muted-foreground">Carregando ERPs...</p>
                ) : null}
              </div>

              {createWorkspaceError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                  {createWorkspaceError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCreateWorkspace}
                  disabled={isCreatingWorkspace}
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWorkspace || !canCreateWorkspace}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingWorkspace ? <MorphLoader className="size-3" /> : <Plus className="size-3" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
