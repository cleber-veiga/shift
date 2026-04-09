"use client"

import { MorphLoader } from "@/components/ui/morph-loader"
import {
  createProjectExtraction,
  listProjectDataSources,
  listProjectExtractionTemplates,
  listProjectExtractions,
  startProjectExtraction,
  type CompetitorExtractionTemplate,
  type DataSource,
  type ProjectExtraction,
} from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { cn } from "@/lib/utils"
import { Database, FileText, Loader2, Play, Plus, X } from "lucide-react"
import { use, useCallback, useEffect, useMemo, useState } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

type FormState = {
  name: string
  data_source_id: string
  template_id: string
  batch_size: string
}

const EMPTY_FORM: FormState = {
  name: "",
  data_source_id: "",
  template_id: "",
  batch_size: "",
}

type ExtractionExecutionStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED"
const RUNNING_STATUSES: ReadonlySet<ExtractionExecutionStatus> = new Set<ExtractionExecutionStatus>([
  "PENDING",
  "RUNNING",
])

function getExecutionStatus(item: ProjectExtraction): ExtractionExecutionStatus | null {
  const nested = item.last_execution?.status
  if (nested) return nested
  return item.last_execution_status ?? null
}

function getTotalRowsExtracted(item: ProjectExtraction): number | null {
  if (typeof item.last_execution?.total_rows_extracted === "number") {
    return item.last_execution.total_rows_extracted
  }
  if (typeof item.total_rows_extracted === "number") {
    return item.total_rows_extracted
  }
  return null
}

function getStatusClasses(status: ExtractionExecutionStatus | null) {
  if (!status) return "border-border bg-muted/40 text-muted-foreground"

  switch (status) {
    case "PENDING":
      return "border-warning/40 bg-warning/10 text-warning"
    case "RUNNING":
      return "border-info/40 bg-info/10 text-foreground/70"
    case "COMPLETED":
      return "border-success/40 bg-success/10 text-success"
    case "FAILED":
      return "border-destructive/40 bg-destructive/10 text-destructive"
    default:
      return "border-border bg-muted/40 text-muted-foreground"
  }
}

export default function ProjectExtractionsPage({ params }: PageProps) {
  const { id: projectId } = use(params)
  const { selectedProject, projectsByWorkspace } = useDashboard()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [items, setItems] = useState<ProjectExtraction[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [templates, setTemplates] = useState<CompetitorExtractionTemplate[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [startingExtractionId, setStartingExtractionId] = useState<string | null>(null)

  const project = useMemo(() => {
    if (selectedProject?.id === projectId) return selectedProject
    const allProjects = Object.values(projectsByWorkspace).flat()
    return allProjects.find((item) => item.id === projectId) ?? null
  }, [selectedProject, projectId, projectsByWorkspace])

  const templatesById = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]))
  }, [templates])

  const dataSourcesById = useMemo(() => {
    return new Map(dataSources.map((source) => [source.id, source]))
  }, [dataSources])

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) setLoading(true)
    setError("")
    try {
      const [extractions, projectDataSources, projectTemplates] = await Promise.all([
        listProjectExtractions(projectId),
        listProjectDataSources(projectId),
        listProjectExtractionTemplates(projectId),
      ])

      setItems(extractions)
      setDataSources(projectDataSources)
      setTemplates(projectTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar extracoes do projeto.")
      setItems([])
      setDataSources([])
      setTemplates([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const hasPendingOrRunning = useMemo(() => {
    return items.some((item) => {
      const status = getExecutionStatus(item)
      return status ? RUNNING_STATUSES.has(status) : false
    })
  }, [items])

  useEffect(() => {
    if (!hasPendingOrRunning) return
    const timer = window.setInterval(() => {
      void loadData({ silent: true })
    }, 3000)
    return () => window.clearInterval(timer)
  }, [hasPendingOrRunning, loadData])

  function openModal() {
    const firstDataSourceId = dataSources[0]?.id ?? ""
    const firstTemplate = templates[0] ?? null

    setForm({
      name: "",
      data_source_id: firstDataSourceId,
      template_id: firstTemplate?.id ?? "",
      batch_size: firstTemplate ? String(firstTemplate.default_batch_size) : "",
    })
    setSaveError("")
    setIsModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setIsModalOpen(false)
    setSaveError("")
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = form.name.trim()
    const batchSize = Number.parseInt(form.batch_size, 10)

    if (normalizedName.length < 2) {
      setSaveError("Nome da extracao deve ter pelo menos 2 caracteres.")
      return
    }
    if (!form.data_source_id) {
      setSaveError("Selecione um Data Source.")
      return
    }
    if (!form.template_id) {
      setSaveError("Selecione um Extraction Template.")
      return
    }
    if (!Number.isFinite(batchSize) || batchSize <= 0) {
      setSaveError("Batch Size deve ser maior que zero.")
      return
    }

    setSaving(true)
    setSaveError("")
    try {
      const created = await createProjectExtraction(projectId, {
        name: normalizedName,
        data_source_id: form.data_source_id,
        template_id: form.template_id,
        batch_size: batchSize,
      })
      setItems((current) => [created, ...current])
      closeModal()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao criar extracao.")
    } finally {
      setSaving(false)
    }
  }

  async function handleStartExtraction(extractionId: string) {
    setStartingExtractionId(extractionId)
    setError("")
    try {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== extractionId) return item
          return {
            ...item,
            last_execution: item.last_execution
              ? { ...item.last_execution, status: "PENDING" }
              : { status: "PENDING", total_rows_extracted: item.total_rows_extracted ?? null },
            last_execution_status: "PENDING",
          }
        })
      )
      await startProjectExtraction(extractionId)
      await loadData({ silent: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar extracao.")
    } finally {
      setStartingExtractionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-border bg-card p-4">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {project?.name ?? "Projeto"} - Extracoes
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Listagem de extracoes configuradas e controle de execucao.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Extracoes Configuradas</h2>
            <p className="text-[11px] text-muted-foreground">
              Configure qual fonte de dados usa cada template de extracao.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            disabled={loading || dataSources.length === 0 || templates.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[11px] font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Adicionar Extracao
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <MorphLoader className="size-6 morph-muted" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/10 px-3 py-8 text-center text-xs text-muted-foreground">
            Nenhuma extracao configurada para este projeto.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <div className="grid grid-cols-[1.8fr_1.8fr_1.8fr_90px_1.4fr_150px] items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Nome</span>
              <span>Data Source</span>
              <span>Template</span>
              <span className="text-right">Batch</span>
              <span>Ultima Execucao</span>
              <span className="text-right">Acoes</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => {
                const status = getExecutionStatus(item)
                const totalRowsExtracted = getTotalRowsExtracted(item)
                const isRunning = status === "RUNNING" || status === "PENDING"
                const isStarting = startingExtractionId === item.id
                const disableStart = isStarting || isRunning

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.8fr_1.8fr_1.8fr_90px_1.4fr_150px] items-center gap-2 px-3 py-2.5 text-xs"
                  >
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                    <span className="truncate text-muted-foreground">
                      {dataSourcesById.get(item.data_source_id)?.name ?? item.data_source_id}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {templatesById.get(item.template_id)?.name ?? item.template_id}
                    </span>
                    <span className="text-right font-medium text-foreground tabular-nums">{item.batch_size}</span>
                    <span className="space-y-1">
                      <span
                        className={cn(
                          "inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold",
                          getStatusClasses(status)
                        )}
                      >
                        {status ?? "SEM EXECUCAO"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {isRunning ? <Loader2 className="size-3 animate-spin text-foreground/70" /> : null}
                        <span className="tabular-nums">
                          Linhas: {typeof totalRowsExtracted === "number" ? totalRowsExtracted : "-"}
                        </span>
                      </span>
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleStartExtraction(item.id)}
                        disabled={disableStart}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isStarting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                        Iniciar Extracao
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && (dataSources.length === 0 || templates.length === 0) ? (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            {dataSources.length === 0
              ? "Cadastre ao menos um Data Source no projeto para criar extracoes."
              : "Cadastre templates no concorrente vinculado ao projeto para criar extracoes."}
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onClick={closeModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adicionar extracao"
            className="w-[min(560px,96vw)] rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Adicionar Extracao</h3>
                <p className="text-[11px] text-muted-foreground">Configure os parametros da extracao do projeto.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome da Extracao
                </span>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ex.: Extracao Precos Abril"
                    minLength={2}
                    required
                    className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Source
                  </span>
                  <div className="relative">
                    <Database className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <select
                      value={form.data_source_id}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, data_source_id: event.target.value }))
                      }
                      required
                      className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="">Selecione</option>
                      {dataSources.map((source) => (
                        <option key={source.id} value={source.id}>
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Extraction Template
                  </span>
                  <select
                    value={form.template_id}
                    onChange={(event) => {
                      const templateId = event.target.value
                      const template = templatesById.get(templateId)
                      setForm((current) => ({
                        ...current,
                        template_id: templateId,
                        batch_size: template ? String(template.default_batch_size) : current.batch_size,
                      }))
                    }}
                    required
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="">Selecione</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Batch Size
                </span>
                <input
                  type="number"
                  min={1}
                  value={form.batch_size}
                  onChange={(event) => setForm((current) => ({ ...current, batch_size: event.target.value }))}
                  required
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                />
              </label>

              {saveError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[11px] text-destructive">
                  {saveError}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-card px-3 text-[11px] font-medium hover:bg-accent disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-foreground px-3 text-[11px] font-semibold text-background hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <MorphLoader className="size-3" /> : <Plus className="size-3.5" />}
                  {saving ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
