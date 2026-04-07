"use client"

import { useDashboard } from "@/lib/context/dashboard-context"
import { Search } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { selectedOrganization, selectedWorkspace, selectedProject } = useDashboard()

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Organizacao:{" "}
          <span className="font-medium text-foreground">{selectedOrganization?.name}</span>{" "}
          | Workspace:{" "}
          <span className="font-medium text-foreground">{selectedWorkspace?.name}</span>{" "}
          | Projeto:{" "}
          <span className="font-medium text-foreground">
            {selectedProject?.name ?? "-"}
          </span>
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Visao geral</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sidebar simplificada no formato do design-system e seletor de
            projetos no topo do menu lateral.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Acoes rapidas</h2>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <Search className="size-4" />
              Buscar no workspace
            </button>
            <Link
              href="/dashboard"
              className="rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-accent"
            >
              Trocar organizacao
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}
