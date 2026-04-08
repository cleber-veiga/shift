"use client"

import { listProjectDataSources, listProjectExtractions } from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { use, useEffect, useMemo, useState } from "react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailsPage({ params }: PageProps) {
  const { id: projectId } = use(params)
  const { selectedProject, projectsByWorkspace } = useDashboard()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dataSourcesCount, setDataSourcesCount] = useState(0)
  const [extractionsCount, setExtractionsCount] = useState(0)

  const project = useMemo(() => {
    if (selectedProject?.id === projectId) return selectedProject
    const allProjects = Object.values(projectsByWorkspace).flat()
    return allProjects.find((item) => item.id === projectId) ?? null
  }, [selectedProject, projectId, projectsByWorkspace])

  useEffect(() => {
    let active = true

    Promise.all([listProjectDataSources(projectId), listProjectExtractions(projectId)])
      .then(([dataSources, extractions]) => {
        if (!active) return
        setError("")
        setDataSourcesCount(dataSources.length)
        setExtractionsCount(extractions.length)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : "Falha ao carregar dados do projeto.")
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [projectId])

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-border bg-card p-4">
        <h1 className="text-lg font-bold tracking-tight text-foreground">{project?.name ?? "Projeto"}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {project?.description?.trim() || "Gerencie as configuracoes e recursos deste projeto."}
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : (
          <>
            <h2 className="text-sm font-bold text-foreground">Visao Geral</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Acesse as Extracoes pelo menu lateral em Projeto.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-background/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Data Sources
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {loading ? "-" : dataSourcesCount}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracoes
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {loading ? "-" : extractionsCount}
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
