"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Database, LayoutGrid, Plus, RefreshCw, Search } from "lucide-react"
import {
  createCompetitor,
  listCompetitorExtractionTemplates,
  listCompetitorSchemaCatalogs,
  listErps,
  listOrganizationCompetitors,
  updateCompetitor,
  type CompetitorExtractionTemplate,
  type DataSourceType,
  type ERP,
  type SchemaTable,
} from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { cn } from "@/lib/utils"
import { ExtractionTemplateModal } from "@/components/concorrentes/extraction-template-modal"
import { SchemaFetchModal } from "@/components/concorrentes/schema-fetch-modal"
import { SchemaTreeView } from "@/components/concorrentes/schema-tree-view"
import { MorphLoader } from "@/components/ui/morph-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PageProps {
  params: Promise<{ id: string }>
}

const DATABASE_TYPES: Array<{ value: DataSourceType; label: string }> = [
  { value: "POSTGRESQL", label: "PostgreSQL" },
  { value: "MYSQL", label: "MySQL" },
  { value: "SQLSERVER", label: "SQL Server" },
  { value: "ORACLE", label: "Oracle" },
  { value: "FIREBIRD", label: "Firebird" },
  { value: "SQLITE", label: "SQLite" },
]

type ProductConfig = {
  db_type: DataSourceType
  schema: SchemaTable[]
  catalog_id: string | null
}

export default function CompetitorFormPage({ params }: PageProps) {
  const { id } = use(params)
  const isNew = id === "novo"
  const router = useRouter()
  const { selectedOrgId } = useDashboard()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [lastSavedName, setLastSavedName] = useState<string | null>(null)

  const [detailsTab, setDetailsTab] = useState<"products" | "extraction_templates">("products")

  const [erps, setErps] = useState<ERP[]>([])
  const [erpsLoading, setErpsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("")
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductConfig>>({})

  const [extractionTemplates, setExtractionTemplates] = useState<CompetitorExtractionTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState("")

  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  const loadExtractionTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError("")
    try {
      const items = await listCompetitorExtractionTemplates(id)
      setExtractionTemplates(items)
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : "Falha ao carregar templates de extracao.")
    } finally {
      setTemplatesLoading(false)
    }
  }, [id])

  useEffect(() => {
    let active = true
    setErpsLoading(true)

    listErps()
      .then((items) => {
        if (!active) return
        setErps(items)
      })
      .catch((err) => {
        if (!active) return
        setErps([])
        setError(err instanceof Error ? err.message : "Falha ao carregar ERPs.")
      })
      .finally(() => {
        if (!active) return
        setErpsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const products = erps.map((erp) => erp.name)
    if (products.length === 0) {
      setActiveTab("")
      return
    }

    setActiveTab((current) => (current && products.includes(current) ? current : products[0]))
    setProductConfigs((prev) => {
      const next: Record<string, ProductConfig> = {}
      for (const productName of products) {
        next[productName] = prev[productName] ?? { db_type: "POSTGRESQL", schema: [], catalog_id: null }
      }
      return next
    })
  }, [erps])

  const loadData = useCallback(
    async (organizationId: string) => {
      setLoading(true)
      setError("")

      try {
        const items = await listOrganizationCompetitors(organizationId)
        const competitor = items.find((item) => item.id === id)
        if (!competitor) {
          setError("Concorrente nao encontrado.")
          return
        }

        setName(competitor.name)
        setLastSavedName(competitor.name.trim())

        const catalogs = await listCompetitorSchemaCatalogs(id)

        setProductConfigs((prev) => {
          const newConfigs = { ...prev }

          competitor.products.forEach((p) => {
            newConfigs[p.product_name] = {
              ...(newConfigs[p.product_name] ?? { db_type: "POSTGRESQL", schema: [], catalog_id: null }),
              db_type: p.database_type,
            }
          })

          catalogs.forEach((catalog) => {
            newConfigs[catalog.target_system] = {
              ...(newConfigs[catalog.target_system] ?? { db_type: "POSTGRESQL", schema: [], catalog_id: null }),
              schema: catalog.schema_definition,
              catalog_id: catalog.id,
            }
          })

          return newConfigs
        })

        await loadExtractionTemplates()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar concorrente.")
      } finally {
        setLoading(false)
      }
    },
    [id, loadExtractionTemplates]
  )

  useEffect(() => {
    if (!isNew && selectedOrgId) {
      void loadData(selectedOrgId)
    }
  }, [isNew, selectedOrgId, loadData])

  const handleCreate = async () => {
    if (!selectedOrgId) return

    const normalizedName = name.trim()
    if (normalizedName.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const created = await createCompetitor(selectedOrgId, {
        name: normalizedName,
        products: erps.map((erp) => ({
          product_name: erp.name,
          database_type: productConfigs[erp.name]?.db_type ?? "POSTGRESQL",
        })),
      })
      router.replace(`/concorrentes/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar concorrente.")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (isNew || loading || lastSavedName === null) return

    const normalizedName = name.trim()
    const hasNameChanges = normalizedName !== lastSavedName
    if (!hasNameChanges || normalizedName.length < 2) return

    const timer = window.setTimeout(async () => {
      setAutoSaving(true)
      try {
        await updateCompetitor(id, {
          name: normalizedName,
          products: erps.map((erp) => ({
            product_name: erp.name,
            database_type: productConfigs[erp.name]?.db_type ?? "POSTGRESQL",
          })),
        })
        setLastSavedName(normalizedName)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar concorrente.")
      } finally {
        setAutoSaving(false)
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [id, isNew, loading, name, lastSavedName, productConfigs, erps])

  useEffect(() => {
    if (isNew || loading || lastSavedName === null) return

    const timer = window.setTimeout(async () => {
      setAutoSaving(true)
      try {
        await updateCompetitor(id, {
          products: erps.map((erp) => ({
            product_name: erp.name,
            database_type: productConfigs[erp.name]?.db_type ?? "POSTGRESQL",
          })),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar configuracoes de produto.")
      } finally {
        setAutoSaving(false)
      }
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [productConfigs, id, isNew, loading, lastSavedName, erps])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <MorphLoader className="size-6 morph-muted" />
      </div>
    )
  }

  const extractionModeLabel = (mode: CompetitorExtractionTemplate["extraction_mode"]) => {
    if (mode === "CUSTOM_SQL") return "SQL Customizado"
    return "Selecao de Schema"
  }

  return (
    <div className="flex flex-col space-y-4 pb-12">
      <div className="flex items-center justify-between bg-card/50 p-2 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/concorrentes")}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="size-4 text-primary" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">{isNew ? "Novo Concorrente" : "Editar Concorrente"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">{error}</span>
          ) : null}
          {isNew ? (
            <button
              onClick={handleCreate}
              disabled={saving || name.trim().length < 2}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <MorphLoader className="size-3" /> : null}
              Criar
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium px-2 py-1">
              {autoSaving ? "Salvando..." : "Salvo automaticamente"}
            </span>
          )}
        </div>
      </div>

      <section className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Coca-Cola, Pepsi, etc."
          className="h-9 w-full rounded-md border border-input bg-background/50 px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </section>

      <section className="bg-card rounded-lg border border-border p-2 shadow-sm">
        <div className="flex items-center gap-1 bg-background/50 p-0.5 rounded-md border border-border/50 w-fit">
          <button
            onClick={() => setDetailsTab("products")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              detailsTab === "products" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Produtos
          </button>
          <button
            onClick={() => setDetailsTab("extraction_templates")}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
              detailsTab === "extraction_templates"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Templates de Extracao
          </button>
        </div>
      </section>

      {detailsTab === "products" ? (
        <section className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border min-h-[450px]">
            <div className="w-full md:w-48 bg-muted/20 flex flex-col p-2 gap-1">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Produtos</p>
              {erpsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <MorphLoader className="size-5 morph-muted" />
                </div>
              ) : erps.length === 0 ? (
                <div className="px-3 py-3 text-[10px] text-muted-foreground">Nenhum ERP cadastrado.</div>
              ) : (
                erps.map((erp) => {
                  const tab = erp.name
                  return (
                    <button
                      key={erp.id}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all text-left",
                        activeTab === tab
                          ? "bg-background text-primary shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn("size-1.5 rounded-full", activeTab === tab ? "bg-primary" : "bg-transparent")}
                      />
                      <span className="truncate">{erp.name}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex-1 p-6">
              <div className="max-w-2xl space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Database className="size-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Configuracao do {activeTab}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        Configure o ambiente de banco de dados deste produto
                      </p>
                    </div>
                  </div>

                  {!isNew && activeTab ? (
                    <button
                      onClick={() => setIsFetchModalOpen(true)}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-md bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-all"
                    >
                      <RefreshCw className="size-3.5" />
                      {productConfigs[activeTab]?.catalog_id ? "Recapturar Schema" : "Buscar Schema"}
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tipo de Banco de Dados
                    </label>
                    {activeTab ? (
                      <Select
                        value={productConfigs[activeTab]?.db_type ?? "POSTGRESQL"}
                        onValueChange={(value) => {
                          const newType = value as DataSourceType
                          setProductConfigs((prev) => ({
                            ...prev,
                            [activeTab]: {
                              ...(prev[activeTab] ?? { db_type: "POSTGRESQL", schema: [], catalog_id: null }),
                              db_type: newType,
                            },
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATABASE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-9 w-full rounded-md border border-border bg-muted/20 px-3 text-xs flex items-center text-muted-foreground">
                        Cadastre ERPs para configurar produtos.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Schema do Banco de Dados
                    </label>

                    {isNew ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                        <Search className="size-6 text-muted-foreground/30 mb-2" />
                        <p className="text-[10px] text-muted-foreground">Crie o concorrente primeiro para buscar o schema.</p>
                      </div>
                    ) : activeTab ? (
                      <SchemaTreeView tables={productConfigs[activeTab]?.schema ?? []} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border rounded-lg bg-muted/5">
                        <p className="text-[10px] text-muted-foreground">
                          Cadastre ERPs para visualizar produtos e schemas.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Templates de Extracao</h3>
              <p className="text-[11px] text-muted-foreground">
                Gerencie templates reutilizaveis para extracao de dados.
              </p>
            </div>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              disabled={isNew}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Novo Template
            </button>
          </div>

          {isNew ? (
            <div className="p-6 text-xs text-muted-foreground">Salve o concorrente para criar e listar templates de extracao.</div>
          ) : templatesLoading ? (
            <div className="flex items-center justify-center py-10">
              <MorphLoader className="size-5 morph-muted" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[1.2fr_1fr_120px] items-center px-4 py-2 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Nome</span>
                <span>Modo de Extracao</span>
                <span className="text-right">Batch Size</span>
              </div>
              {extractionTemplates.length > 0 ? (
                extractionTemplates.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.2fr_1fr_120px] items-center px-4 py-2 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <span className="font-medium text-foreground truncate pr-3">{item.name}</span>
                    <span className="text-muted-foreground">{extractionModeLabel(item.extraction_mode)}</span>
                    <span className="text-right text-foreground tabular-nums">{item.default_batch_size}</span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-xs text-muted-foreground">Nenhum template cadastrado para este concorrente.</div>
              )}
            </div>
          )}

          {templatesError ? (
            <div className="p-4 text-xs text-destructive border-t border-destructive/20 bg-destructive/5">{templatesError}</div>
          ) : null}
        </section>
      )}

      {!isNew && selectedOrgId && activeTab ? (
        <SchemaFetchModal
          isOpen={isFetchModalOpen}
          onClose={() => setIsFetchModalOpen(false)}
          onSuccess={(response) => {
            setProductConfigs((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                schema: response.tables,
                catalog_id: response.saved_catalog_id,
                db_type: response.database_type || prev[activeTab].db_type,
              },
            }))
          }}
          competitorId={id}
          organizationId={selectedOrgId}
          sourceSystem={activeTab}
          targetSystem={activeTab}
          defaultDatabaseType={productConfigs[activeTab]?.db_type ?? "POSTGRESQL"}
        />
      ) : null}

      {!isNew ? (
        <ExtractionTemplateModal
          open={isTemplateModalOpen}
          competitorId={id}
          onClose={() => setIsTemplateModalOpen(false)}
          onCreated={(item) => {
            setExtractionTemplates((current) => [item, ...current])
            void loadExtractionTemplates()
          }}
        />
      ) : null}
    </div>
  )
}
