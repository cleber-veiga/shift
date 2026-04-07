"use client"

import { DashboardProvider } from "@/lib/context/dashboard-context"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { useState } from "react"
import { useDashboard } from "@/lib/context/dashboard-context"
import { MorphLoader } from "@/components/ui/morph-loader"

function PrivateLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const { isLoading, error } = useDashboard()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <MorphLoader className="size-14 morph-shift" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {sidebarVisible && <Sidebar />}
        <div className="flex flex-1 flex-col">
          <Header
            sidebarVisible={sidebarVisible}
            setSidebarVisible={setSidebarVisible}
          />
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <PrivateLayoutContent>{children}</PrivateLayoutContent>
    </DashboardProvider>
  )
}
