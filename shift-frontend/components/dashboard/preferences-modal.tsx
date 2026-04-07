"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { Check, LayoutGrid, Moon, Sun, X } from "lucide-react"
import { useUiPreferences, type UiScale } from "@/lib/context/ui-preferences-context"
import { cn } from "@/lib/utils"

interface PreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SettingsTab = "layout"

type Option<T extends string> = {
  value: T
  label: string
  description: string
}

const themeOptions: Option<"light" | "dark">[] = [
  { value: "light", label: "Light", description: "Interface clara." },
  { value: "dark", label: "Dark", description: "Interface escura." },
]

const scaleOptions: Option<UiScale>[] = [
  { value: "small", label: "Pequeno", description: "Mais compacto." },
  { value: "medium", label: "Medio", description: "Padrao equilibrado." },
  { value: "large", label: "Grande", description: "Elementos maiores." },
]

export function PreferencesModal({ open, onOpenChange }: PreferencesModalProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { uiScale, setUiScale } = useUiPreferences()
  const [activeTab, setActiveTab] = useState<SettingsTab>("layout")

  useEffect(() => {
    if (!open) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", onEscape)
    return () => document.removeEventListener("keydown", onEscape)
  }, [onOpenChange, open])

  const selectedTheme = useMemo(() => {
    if (theme === "light" || theme === "dark") return theme
    return resolvedTheme === "dark" ? "dark" : "light"
  }, [resolvedTheme, theme])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preferencias"
        className="flex h-[min(640px,92vh)] w-[min(920px,96vw)] flex-col rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-semibold text-foreground">Preferencias</p>
            <p className="text-xs text-muted-foreground">Personalize a experiencia visual do sistema.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Fechar preferencias"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full border-b border-border p-2 md:w-56 md:border-b-0 md:border-r">
            <button
              type="button"
              onClick={() => setActiveTab("layout")}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                activeTab === "layout"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4 shrink-0" />
              Layout
            </button>
          </aside>

          <section className="flex-1 overflow-y-auto p-5">
            {activeTab === "layout" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Tema</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escolha entre tema claro e escuro.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {themeOptions.map((option) => {
                      const isSelected = selectedTheme === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            "flex items-start justify-between rounded-lg border p-3 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-foreground/20 hover:bg-accent/40"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          <div className="ml-3 mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                            {option.value === "light" ? (
                              <Sun className="size-4" />
                            ) : (
                              <Moon className="size-4" />
                            )}
                            {isSelected ? <Check className="size-4 text-primary" /> : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Tamanho do sistema</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ajusta escala de fonte e componentes em toda a aplicacao.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {scaleOptions.map((option) => {
                      const isSelected = uiScale === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setUiScale(option.value)}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-foreground/20 hover:bg-accent/40"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{option.label}</p>
                            {isSelected ? <Check className="size-4 text-primary" /> : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
