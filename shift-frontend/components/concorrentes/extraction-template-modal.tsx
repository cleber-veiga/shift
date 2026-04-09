"use client"

import { useEffect, useState } from "react"
import { Braces, Plus, X } from "lucide-react"
import { MorphLoader } from "@/components/ui/morph-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createCompetitorExtractionTemplate,
  type CompetitorExtractionTemplate,
  type ExtractionMode,
} from "@/lib/auth"

interface ExtractionTemplateModalProps {
  open: boolean
  competitorId: string
  onClose: () => void
  onCreated: (item: CompetitorExtractionTemplate) => void
}

interface ExtractionTemplateFormState {
  name: string
  extraction_mode: ExtractionMode
  default_batch_size: number
  custom_sql_query: string
}

const INITIAL_FORM_STATE: ExtractionTemplateFormState = {
  name: "",
  extraction_mode: "SCHEMA_SELECTION",
  default_batch_size: 1000,
  custom_sql_query: "",
}

export function ExtractionTemplateModal({ open, competitorId, onClose, onCreated }: ExtractionTemplateModalProps) {
  const [form, setForm] = useState<ExtractionTemplateFormState>(INITIAL_FORM_STATE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM_STATE)
      setSaving(false)
      setError("")
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const normalizedName = form.name.trim()
    if (normalizedName.length < 2) {
      setError("Nome do template deve ter pelo menos 2 caracteres.")
      return
    }

    if (!Number.isFinite(form.default_batch_size) || form.default_batch_size <= 0) {
      setError("Batch Size deve ser maior que zero.")
      return
    }

    if (form.extraction_mode === "CUSTOM_SQL" && form.custom_sql_query.trim().length === 0) {
      setError("Informe uma query SQL para o modo customizado.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const created = await createCompetitorExtractionTemplate(competitorId, {
        name: normalizedName,
        competitor_id: competitorId,
        extraction_mode: form.extraction_mode,
        default_batch_size: form.default_batch_size,
        custom_sql_query: form.extraction_mode === "CUSTOM_SQL" ? form.custom_sql_query.trim() : null,
      })

      onCreated(created)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar template.")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-xl border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">Novo Template de Extracao</h2>
              <p className="text-[10px] text-muted-foreground">Configure o modo de extracao e parametros de execucao</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form
          id="extraction-template-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome do Template</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ex.: Produtos ERP X"
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Modo de Extracao</label>
              <Select
                value={form.extraction_mode}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    extraction_mode: value as ExtractionMode,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEMA_SELECTION">Selecao de Schema</SelectItem>
                  <SelectItem value="CUSTOM_SQL">SQL Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Batch Size</label>
                <input
                  type="number"
                  min={1}
                  value={form.default_batch_size}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      default_batch_size: Number(event.target.value),
                    }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {form.extraction_mode === "CUSTOM_SQL" ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Query SQL</label>
              <textarea
                value={form.custom_sql_query}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    custom_sql_query: event.target.value,
                  }))
                }
                placeholder="SELECT * FROM tabela WHERE ..."
                className="w-full min-h-36 rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/20 font-mono"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3 flex items-start gap-2">
              <Braces className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Builder visual em construcao</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Em breve voce podera montar regras de extracao por selecao de schema.
                </p>
              </div>
            </div>
          )}

          {error ? (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-medium">
              {error}
            </div>
          ) : null}
        </form>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="h-8 px-4 rounded-md text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="extraction-template-form"
            disabled={saving}
            className="h-8 px-6 rounded-md bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <MorphLoader className="size-3" /> : null}
            {saving ? "Criando..." : "Criar Template"}
          </button>
        </div>
      </div>
    </div>
  )
}
