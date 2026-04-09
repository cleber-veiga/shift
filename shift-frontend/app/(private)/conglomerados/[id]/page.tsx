﻿﻿﻿﻿﻿﻿﻿"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Edit2,
  Plus,
  Trash2,
  X,
  LayoutGrid,
  Info,
} from "lucide-react"
import {
  createConglomerate,
  createEstablishment,
  deleteEstablishment,
  getConglomerate,
  listConglomerateEstablishments,
  lookupAddressByCep,
  lookupCompanyByCnpj,
  updateConglomerate,
  updateEstablishment,
  type CnpjLookupResult,
  type Conglomerate,
  type CreateEstablishmentPayload,
  type Establishment,
} from "@/lib/auth"
import { useDashboard } from "@/lib/context/dashboard-context"
import { cn } from "@/lib/utils"
import { MorphLoader } from "@/components/ui/morph-loader"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface PageProps {
  params: Promise<{ id: string }>
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function stateRegistrationValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item)).filter(Boolean).join(", ")
  }
  return stringValue(value)
}

export default function ConglomerateFormPage({ params }: PageProps) {
  const { id } = use(params)
  const isNew = id === "novo"
  const router = useRouter()
  const { selectedOrgId } = useDashboard()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [error, setError] = useState("")
  const [lastSavedConglomerate, setLastSavedConglomerate] = useState<{
    name: string
    description: string
    is_active: boolean
  } | null>(null)

  // Conglomerate state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Establishments state
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] = useState(false)
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null)
  const [deleteEstablishmentOpen, setDeleteEstablishmentOpen] = useState(false)
  const [deleteEstablishmentId, setDeleteEstablishmentId] = useState<string | null>(null)
  const [deletingEstablishment, setDeletingEstablishment] = useState(false)
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false)
  const [cepLookupLoading, setCepLookupLoading] = useState(false)
  const [establishmentForm, setEstablishmentForm] = useState<CreateEstablishmentPayload>({
    corporate_name: "",
    trade_name: "",
    cnpj: "",
    erp_code: null,
    cnae: "",
    state_registration: "",
    cep: "",
    city: "",
    state: "",
    notes: "",
    is_active: true,
  })

  useEffect(() => {
    if (!isNew) {
      loadData()
    }
  }, [id])

  async function loadData() {
    setLoading(true)
    setError("")
    try {
      const data = await getConglomerate(id)
      setName(data.name)
      setDescription(data.description || "")
      setIsActive(data.is_active)
      setLastSavedConglomerate({
        name: data.name.trim(),
        description: (data.description || "").trim(),
        is_active: data.is_active,
      })

      const items = await listConglomerateEstablishments(id)
      setEstablishments(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConglomerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setSaving(true)
    setError("")

    try {
      if (isNew) {
        if (!selectedOrgId) return
        const created = await createConglomerate(selectedOrgId, {
          name: name.trim(),
          description: description.trim() || null,
          is_active: isActive,
        })
        router.replace(`/conglomerados/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar informações.")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (isNew || loading || !lastSavedConglomerate) return

    const normalizedName = name.trim()
    const normalizedDescription = description.trim()
    const hasChanges =
      normalizedName !== lastSavedConglomerate.name ||
      normalizedDescription !== lastSavedConglomerate.description ||
      isActive !== lastSavedConglomerate.is_active

    if (!hasChanges || normalizedName.length < 2) return

    const timer = window.setTimeout(async () => {
      setAutoSaving(true)
      try {
        await updateConglomerate(id, {
          name: normalizedName,
          description: normalizedDescription || null,
          is_active: isActive,
        })
        setLastSavedConglomerate({
          name: normalizedName,
          description: normalizedDescription,
          is_active: isActive,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao salvar informações.")
      } finally {
        setAutoSaving(false)
      }
    }, 700)

    return () => window.clearTimeout(timer)
  }, [id, isNew, loading, name, description, isActive, lastSavedConglomerate])

  const handleOpenEstablishmentModal = (est: Establishment | null = null) => {
    if (est) {
      setEditingEstablishment(est)
      setEstablishmentForm({
        corporate_name: est.corporate_name,
        trade_name: est.trade_name || "",
        cnpj: formatCnpj(est.cnpj),
        erp_code: est.erp_code,
        cnae: est.cnae,
        state_registration: est.state_registration || "",
        cep: est.cep || "",
        city: est.city || "",
        state: est.state || "",
        notes: est.notes || "",
        is_active: est.is_active,
      })
    } else {
      setEditingEstablishment(null)
      setEstablishmentForm({
        corporate_name: "",
        trade_name: "",
        cnpj: "",
        erp_code: null,
        cnae: "",
        state_registration: "",
        cep: "",
        city: "",
        state: "",
        notes: "",
        is_active: true,
      })
    }
    setIsEstablishmentModalOpen(true)
  }

  const handleSaveEstablishment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNew) return

    setSaving(true)
    try {
      const payload = {
        ...establishmentForm,
        cnpj: onlyDigits(establishmentForm.cnpj),
        erp_code:
          establishmentForm.erp_code === null || establishmentForm.erp_code === undefined
            ? null
            : Math.trunc(establishmentForm.erp_code),
        cep: establishmentForm.cep ? onlyDigits(establishmentForm.cep) : "",
        state: (establishmentForm.state || "").toUpperCase().slice(0, 2),
      }

      if (editingEstablishment) {
        await updateEstablishment(editingEstablishment.id, payload)
      } else {
        await createEstablishment(id, payload)
      }
      setIsEstablishmentModalOpen(false)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar unidade.")
    } finally {
      setSaving(false)
    }
  }

  const handleLookupByCnpj = async () => {
    const cnpjDigits = onlyDigits(establishmentForm.cnpj)
    if (cnpjDigits.length !== 14) {
      setError("Informe um CNPJ com 14 dígitos para buscar.")
      return
    }

    setCnpjLookupLoading(true)
    setError("")
    try {
      const result = await lookupCompanyByCnpj(cnpjDigits)
      const cnpjData = result as CnpjLookupResult
      const corporateName = stringValue(cnpjData.razao_social)
      const tradeName = stringValue(cnpjData.nome_fantasia)
      const cnaeCode = stringValue(cnpjData.cnae_fiscal)
      const stateRegistration = stateRegistrationValue(cnpjData.inscricao_estadual)
      const cep = stringValue(cnpjData.cep)
      const city = stringValue(cnpjData.municipio)
      const state = stringValue(cnpjData.uf).toUpperCase().slice(0, 2)

      setEstablishmentForm((prev) => ({
        ...prev,
        corporate_name: corporateName || prev.corporate_name,
        trade_name: tradeName || prev.trade_name,
        cnpj: formatCnpj(cnpjDigits),
        cnae: cnaeCode || prev.cnae,
        state_registration: stateRegistration || prev.state_registration,
        cep: cep ? formatCep(cep) : prev.cep,
        city: city || prev.city,
        state: state || prev.state,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao buscar dados pelo CNPJ.")
    } finally {
      setCnpjLookupLoading(false)
    }
  }

  const handleLookupByCep = async () => {
    const cepDigits = onlyDigits(establishmentForm.cep || "")
    if (cepDigits.length !== 8) {
      setError("Informe um CEP com 8 dígitos para buscar.")
      return
    }

    setCepLookupLoading(true)
    setError("")
    try {
      const result = await lookupAddressByCep(cepDigits)
      setEstablishmentForm((prev) => ({
        ...prev,
        cep: formatCep(cepDigits),
        city: (result.city || "").trim() || prev.city,
        state: (result.state || "").trim().toUpperCase().slice(0, 2) || prev.state,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao buscar dados pelo CEP.")
    } finally {
      setCepLookupLoading(false)
    }
  }

  const handleDeleteEstablishment = (estId: string) => {
    setError("")
    setDeleteEstablishmentId(estId)
    setDeleteEstablishmentOpen(true)
  }

  const confirmDeleteEstablishment = async () => {
    if (!deleteEstablishmentId) return
    setDeletingEstablishment(true)
    setError("")
    try {
      await deleteEstablishment(deleteEstablishmentId)
      setDeleteEstablishmentOpen(false)
      setDeleteEstablishmentId(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover unidade.")
    } finally {
      setDeletingEstablishment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <MorphLoader className="size-6 morph-muted" />
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      <ConfirmDialog
        open={deleteEstablishmentOpen}
        onOpenChange={setDeleteEstablishmentOpen}
        title="Remover unidade"
        description="Tem certeza que deseja remover esta unidade?"
        confirmText="Remover"
        confirmVariant="destructive"
        loading={deletingEstablishment}
        onConfirm={confirmDeleteEstablishment}
      />
      {/* Header Compacto */}
      <div className="flex items-center justify-between bg-card/50 p-2 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/conglomerados")}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="size-4 text-primary" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">
              {isNew ? "Novo Conglomerado" : name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-[10px] text-destructive font-medium bg-destructive/10 px-2 py-1 rounded">
              {error}
            </span>
          )}
          {isNew ? (
            <button
              onClick={() => handleSaveConglomerate()}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving && <MorphLoader className="size-3" />}
              Criar
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground font-medium px-2 py-1">
              {autoSaving ? "Salvando..." : "Salvo automaticamente"}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {/* Top: Conglomerate Info */}
        <section className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nome do Conglomerado
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Grupo ABC"
                className="h-8 w-full rounded-md border border-input bg-background/50 px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Descrição Curta
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Resumo do grupo"
                className="h-8 w-full rounded-md border border-input bg-background/50 px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="sm:col-span-1 flex items-end pb-1.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-emerald-500/20 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 size-3 bg-muted-foreground rounded-full peer-checked:left-4 peer-checked:bg-emerald-500 transition-all"></div>
                </div>
                <span className="text-[11px] font-bold uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                  {isActive ? "Ativo" : "Inativo"}
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Separador Visual */}
        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-border/50"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Estabelecimentos
          </span>
          <div className="h-px flex-1 bg-border/50"></div>
        </div>

        {/* Bottom: Establishments Grid */}
        <section className="flex flex-col">
          {!isNew ? (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-3.5" />
                  <span className="text-[11px] font-medium">{establishments.length} Unidades vinculadas</span>
                </div>
                <button
                  onClick={() => handleOpenEstablishmentModal()}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-background border border-border text-[11px] font-bold hover:bg-accent transition-all"
                >
                  <Plus className="size-3" />
                  Nova Unidade
                </button>
              </div>

              {establishments.length > 0 ? (
                <div className="flex-1 overflow-auto rounded-lg border border-border bg-card shadow-sm">
                  <div className="grid grid-cols-[1fr_100px_120px_80px_80px] items-center px-4 py-2 border-b border-border bg-muted/20 text-[9px] font-bold uppercase tracking-wider text-muted-foreground sticky top-0 z-10">
                    <span>Razão Social / CNPJ</span>
                    <span className="text-center">Cód. ERP</span>
                    <span className="text-center">CNAE</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Ações</span>
                  </div>
                  <div className="divide-y divide-border">
                    {establishments.map((est) => (
                      <div
                        key={est.id}
                        className="grid grid-cols-[1fr_100px_120px_80px_80px] items-center px-4 py-2 hover:bg-muted/10 transition-colors group"
                      >
                        <div className="min-w-0">
                          <h3 className="text-[11px] font-semibold text-foreground truncate">
                            {est.corporate_name}
                          </h3>
                          <p className="text-[9px] text-muted-foreground font-mono">{formatCnpj(est.cnpj)}</p>
                        </div>
                        <div className="text-center text-[10px] text-muted-foreground font-medium">
                          {est.erp_code ?? "-"}
                        </div>
                        <div className="text-center text-[10px] text-muted-foreground font-medium">
                          {est.cnae}
                        </div>
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[8px] font-bold uppercase",
                              est.is_active
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-zinc-500/10 text-zinc-400"
                            )}
                          >
                            {est.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => handleOpenEstablishmentModal(est)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="size-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteEstablishment(est.id)}
                            className="p-1.5 rounded hover:bg-muted text-destructive/50 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed border-border bg-card/30">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Building2 className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Nenhuma unidade</p>
                  <p className="text-[10px] text-muted-foreground mb-4">
                    Este conglomerado ainda não possui estabelecimentos.
                  </p>
                  <button
                    onClick={() => handleOpenEstablishmentModal()}
                    className="inline-flex items-center gap-1.5 h-7 px-4 rounded-md bg-primary text-primary-foreground text-[11px] font-bold hover:opacity-90 transition-all"
                  >
                    <Plus className="size-3" />
                    Adicionar Primeira
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 rounded-lg border border-border bg-muted/5">
              <Info className="size-6 text-muted-foreground/30 mb-2" />
              <p className="text-[11px] font-medium text-muted-foreground text-center max-w-[200px]">
                Salve o conglomerado primeiro para poder gerenciar seus estabelecimentos.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Establishment Modal Compacto */}
      {isEstablishmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-muted flex items-center justify-center">
                  <Building2 className="size-3.5 text-muted-foreground" />
                </div>
                <h2 className="text-xs font-bold text-foreground uppercase tracking-tight">
                  {editingEstablishment ? "Editar Unidade" : "Nova Unidade"}
                </h2>
              </div>
              <button
                onClick={() => setIsEstablishmentModalOpen(false)}
                className="size-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <form onSubmit={handleSaveEstablishment} className="space-y-4">
              <div className="grid gap-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    value={establishmentForm.corporate_name}
                    onChange={(e) =>
                      setEstablishmentForm({ ...establishmentForm, corporate_name: e.target.value })
                    }
                    placeholder="Nome da empresa"
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={establishmentForm.trade_name || ""}
                    onChange={(e) =>
                      setEstablishmentForm({ ...establishmentForm, trade_name: e.target.value })
                    }
                    placeholder="Nome fantasia"
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      CNPJ *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={establishmentForm.cnpj}
                        onChange={(e) =>
                          setEstablishmentForm({ ...establishmentForm, cnpj: formatCnpj(e.target.value) })
                        }
                        placeholder="00.000.000/0000-00"
                        className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleLookupByCnpj}
                        disabled={cnpjLookupLoading}
                        className="h-8 shrink-0 rounded-md border border-border px-2 text-[10px] font-bold hover:bg-accent disabled:opacity-50"
                      >
                        {cnpjLookupLoading ? "..." : "Buscar"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      Código ERP
                    </label>
                    <input
                      type="number"
                      value={establishmentForm.erp_code ?? ""}
                      onChange={(e) =>
                        setEstablishmentForm({
                          ...establishmentForm,
                          erp_code: (() => {
                            if (e.target.value.trim().length === 0) return null
                            const parsed = Number.parseInt(e.target.value, 10)
                            return Number.isNaN(parsed) ? null : parsed
                          })(),
                        })
                      }
                      placeholder="Ex.: 12345"
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      min={0}
                      step={1}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      CNAE *
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.cnae}
                      onChange={(e) =>
                        setEstablishmentForm({ ...establishmentForm, cnae: e.target.value })
                      }
                      placeholder="Código"
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.state_registration || ""}
                      onChange={(e) =>
                        setEstablishmentForm({ ...establishmentForm, state_registration: e.target.value })
                      }
                      placeholder="Inscrição estadual"
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      CEP
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={establishmentForm.cep || ""}
                        onChange={(e) =>
                          setEstablishmentForm({ ...establishmentForm, cep: formatCep(e.target.value) })
                        }
                        placeholder="00000-000"
                        className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={handleLookupByCep}
                        disabled={cepLookupLoading}
                        className="h-8 shrink-0 rounded-md border border-border px-2 text-[10px] font-bold hover:bg-accent disabled:opacity-50"
                      >
                        {cepLookupLoading ? "..." : "Buscar"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.city || ""}
                      onChange={(e) =>
                        setEstablishmentForm({ ...establishmentForm, city: e.target.value })
                      }
                      placeholder="Cidade"
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                      UF
                    </label>
                    <input
                      type="text"
                      value={establishmentForm.state || ""}
                      onChange={(e) =>
                        setEstablishmentForm({
                          ...establishmentForm,
                          state: e.target.value.toUpperCase().slice(0, 2),
                        })
                      }
                      placeholder="SP"
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-1">
                    Observações
                  </label>
                  <textarea
                    value={establishmentForm.notes || ""}
                    onChange={(e) =>
                      setEstablishmentForm({ ...establishmentForm, notes: e.target.value })
                    }
                    placeholder="Observações adicionais"
                    className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/20 resize-y"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={establishmentForm.is_active}
                      onChange={(e) =>
                        setEstablishmentForm({ ...establishmentForm, is_active: e.target.checked })
                      }
                      className="size-3.5 rounded border-input text-primary focus:ring-primary/20"
                    />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Unidade Ativa</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEstablishmentModalOpen(false)}
                  className="h-8 px-4 rounded-md border border-border text-[11px] font-bold hover:bg-accent transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 h-8 px-5 rounded-md bg-foreground text-background text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving && <MorphLoader className="size-3" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}





