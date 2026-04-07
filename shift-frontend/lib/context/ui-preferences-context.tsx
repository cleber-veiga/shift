"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type UiScale = "small" | "medium" | "large"

interface UiPreferencesContextType {
  uiScale: UiScale
  setUiScale: (scale: UiScale) => void
}

const STORAGE_KEY = "shift-ui-preferences"
const DEFAULT_SCALE: UiScale = "medium"

const UiPreferencesContext = createContext<UiPreferencesContextType | undefined>(undefined)

export function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [uiScale, setUiScaleState] = useState<UiScale>(() => {
    if (typeof window === "undefined") return DEFAULT_SCALE

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SCALE

    try {
      const parsed = JSON.parse(stored) as { uiScale?: UiScale }
      if (parsed.uiScale === "small" || parsed.uiScale === "medium" || parsed.uiScale === "large") {
        return parsed.uiScale
      }
    } catch {
      // Ignore corrupted local preferences.
    }

    return DEFAULT_SCALE
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ uiScale }))
    document.documentElement.setAttribute("data-ui-scale", uiScale)
  }, [uiScale])

  const value = useMemo(
    () => ({
      uiScale,
      setUiScale: setUiScaleState,
    }),
    [uiScale]
  )

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext)
  if (!context) {
    throw new Error("useUiPreferences must be used within UiPreferencesProvider")
  }
  return context
}
