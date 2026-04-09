"use client"

import { Database, Search, X, Shield, Globe, Terminal, Settings2 } from "lucide-react"
import { useState, useEffect } from "react"
import { 
  listOrganizationWorkspaces, 
  listWorkspaceProjects, 
  listProjectDataSources,
  executeCompetitorSchemaCatalog,
  type DataSource,
  type Workspace,
  type Project,
  type DataSourceType,
  type DataSourceDatabaseInput,
  type ExecuteSchemaCatalogResponse
} from "@/lib/auth"
import { MorphLoader } from "@/components/ui/morph-loader"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SchemaFetchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (response: ExecuteSchemaCatalogResponse) => void
  competitorId: string
  organizationId: string
  sourceSystem: string
  targetSystem: string
  defaultDatabaseType: DataSourceType
}

export function SchemaFetchModal({
  isOpen,
  onClose,
  onSuccess,
  competitorId,
  organizationId,
  sourceSystem,
  targetSystem,
  defaultDatabaseType
}: SchemaFetchModalProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "manual">("existing")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Existing Data Source state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedDataSourceId, setSelectedDataSourceId] = useState("")

  // Manual Config state
  const [manualConfig, setManualConfig] = useState<DataSourceDatabaseInput>({})
  const [manualDatabaseType, setManualDatabaseType] = useState<DataSourceType>(defaultDatabaseType)

  useEffect(() => {
    if (isOpen && activeTab === "existing" && workspaces.length === 0) {
      loadWorkspaces()
    }
  }, [isOpen, activeTab])

  const loadWorkspaces = async () => {
    try {
      const items = await listOrganizationWorkspaces(organizationId)
      setWorkspaces(items)
    } catch (err) {
      setError("Falha ao carregar workspaces.")
    }
  }

  const loadProjects = async (workspaceId: string) => {
    try {
      const items = await listWorkspaceProjects(workspaceId)
      setProjects(items)
    } catch (err) {
      setError("Falha ao carregar projetos.")
    }
  }

  const loadDataSources = async (projectId: string) => {
    try {
      const items = await listProjectDataSources(projectId)
      setDataSources(items)
    } catch (err) {
      setError("Falha ao carregar fontes de dados.")
    }
  }

  const handleFetch = async () => {
    setLoading(true)
    setError("")
    try {
      const payload = {
        source_system: sourceSystem,
        target_system: targetSystem,
        save_result: true,
      }

      let response: ExecuteSchemaCatalogResponse
      if (activeTab === "existing") {
        if (!selectedDataSourceId) throw new Error("Selecione uma fonte de dados.")
        response = await executeCompetitorSchemaCatalog(competitorId, {
          ...payload,
          data_source_id: selectedDataSourceId,
        })
      } else {
        if (!manualConfig.host && !manualConfig.connection_url) throw new Error("Informe as configurações de conexão.")
        response = await executeCompetitorSchemaCatalog(competitorId, {
          ...payload,
          manual_config: manualConfig,
          database_type: manualDatabaseType,
        })
      }

      if (response.success) {
        onSuccess(response)
        onClose()
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao buscar schema.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">Buscar Schema</h2>
              <p className="text-[10px] text-muted-foreground">Vincule uma estrutura de banco a este produto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          <div className="flex p-1 bg-muted rounded-lg gap-1">
            <button
              onClick={() => setActiveTab("existing")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all",
                activeTab === "existing" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Database className="size-3.5" />
              Fonte de Dados Existente
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all",
                activeTab === "manual" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="size-3.5" />
              Configuração Manual
            </button>
          </div>

          {activeTab === "existing" ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Workspace</label>
                <Select
                  value={selectedWorkspaceId}
                  onValueChange={(value) => {
                    setSelectedWorkspaceId(value)
                    loadProjects(value)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Projeto</label>
                <Select
                  value={selectedProjectId}
                  onValueChange={(value) => {
                    setSelectedProjectId(value)
                    loadDataSources(value)
                  }}
                  disabled={!selectedWorkspaceId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Fonte de Dados</label>
                <Select
                  value={selectedDataSourceId}
                  onValueChange={(value) => setSelectedDataSourceId(value)}
                  disabled={!selectedProjectId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma fonte de dados" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((ds) => (
                      <SelectItem key={ds.id} value={ds.id}>{ds.name} ({ds.source_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Banco</label>
                  <Select
                    value={manualDatabaseType}
                    onValueChange={(value) => setManualDatabaseType(value as DataSourceType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POSTGRESQL">PostgreSQL</SelectItem>
                      <SelectItem value="MYSQL">MySQL</SelectItem>
                      <SelectItem value="SQLSERVER">SQL Server</SelectItem>
                      <SelectItem value="ORACLE">Oracle</SelectItem>
                      <SelectItem value="FIREBIRD">Firebird</SelectItem>
                      <SelectItem value="SQLITE">SQLite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Porta</label>
                  <input
                    type="number"
                    value={manualConfig.port || ""}
                    onChange={(e) => setManualConfig({ ...manualConfig, port: parseInt(e.target.value) })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Host</label>
                <input
                  type="text"
                  value={manualConfig.host || ""}
                  onChange={(e) => setManualConfig({ ...manualConfig, host: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Banco de Dados / Arquivo</label>
                <input
                  type="text"
                  value={manualConfig.database || manualConfig.sqlite_path || ""}
                  onChange={(e) => setManualConfig({ 
                    ...manualConfig, 
                    database: manualDatabaseType === "SQLITE" ? undefined : e.target.value,
                    sqlite_path: manualDatabaseType === "SQLITE" ? e.target.value : undefined
                  })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Usuário</label>
                  <input
                    type="text"
                    value={manualConfig.username || ""}
                    onChange={(e) => setManualConfig({ ...manualConfig, username: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Senha</label>
                  <input
                    type="password"
                    value={manualConfig.password || ""}
                    onChange={(e) => setManualConfig({ ...manualConfig, password: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-md text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleFetch}
            disabled={loading}
            className="h-8 px-6 rounded-md bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <MorphLoader className="size-3" />}
            {loading ? "Buscando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  )
}
