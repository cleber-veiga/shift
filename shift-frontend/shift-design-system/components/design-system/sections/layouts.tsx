"use client"

import { useState } from "react"
import {
  Search,
  Home,
  LayoutDashboard,
  Database,
  FileText,
  Send,
  Users,
  Settings,
  User,
  ChevronRight,
  Plus,
  Maximize2,
  MoreVertical,
  Calendar,
  TrendingUp,
  TrendingDown,
  Bell,
  PanelLeftClose,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

// Mini sparkline component
function Sparkline({ data, color = "stroke-emerald-500" }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg viewBox="0 0 100 100" className="h-12 w-20" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        className={cn("stroke-2", color)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Area chart component
function AreaChart() {
  const data = [20, 35, 25, 45, 30, 55, 40, 60, 50, 70, 55, 75, 65, 80]
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 80
      return `${x},${y}`
    })
    .join(" ")

  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="relative h-48 w-full">
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#areaGradient)" />
        <polyline
          points={points}
          fill="none"
          stroke="rgb(16, 185, 129)"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Highlighted point */}
        <circle cx="85" cy="25" r="1.5" fill="rgb(16, 185, 129)" />
      </svg>
      {/* Tooltip */}
      <div className="absolute right-[12%] top-[15%] rounded bg-card/90 px-2 py-1 text-xs backdrop-blur-sm">
        $3,928.00
      </div>
    </div>
  )
}

// Crypto asset item
function AssetItem({ 
  name, 
  icon, 
  color,
  trend 
}: { 
  name: string
  icon: string
  color: string
  trend: number[]
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-8 items-center justify-center rounded-full text-sm font-bold", color)}>
          {icon}
        </div>
        <span className="text-sm font-medium">{name}</span>
      </div>
      <Sparkline data={trend} color="stroke-emerald-500" />
    </div>
  )
}

// Full dashboard layout preview
function DashboardLayoutPreview() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navItems = [
    { icon: Home, label: "Home Page", active: false },
    { icon: LayoutDashboard, label: "Dashboard", active: true, badge: 3 },
    { icon: Database, label: "Database", active: false },
  ]

  const files = [
    "pricing_2024.pdf",
    "publish.docx",
    "summary.pdf",
    "whop.pdf",
  ]

  const accountItems = [
    { icon: Send, label: "Messages" },
    { icon: Users, label: "Groups" },
    { icon: Settings, label: "Settings" },
    { icon: User, label: "My Account" },
  ]

  const stats = [
    {
      title: "Gross Revenue",
      description: "Your revenue from last month",
      value: "$171,610.25",
      change: "+5.29%",
      positive: true,
      data: [30, 40, 35, 50, 45, 60, 55, 70],
      color: "stroke-emerald-500",
    },
    {
      title: "Auto Trades",
      description: "Amount of bot-trades",
      value: "3612",
      change: "+1259",
      positive: true,
      data: [20, 35, 25, 45, 30, 55, 40, 60],
      color: "stroke-amber-500",
    },
    {
      title: "New Assets",
      description: "New Assets in your portfolio",
      value: "53",
      change: "+21",
      positive: true,
      data: [40, 45, 35, 50, 45, 55, 50, 60],
      color: "stroke-emerald-500",
    },
  ]

  const assets = [
    { name: "Bitcoin", icon: "B", color: "bg-amber-500 text-white", trend: [40, 45, 42, 50, 48, 55, 52, 58] },
    { name: "Ethereum", icon: "E", color: "bg-blue-500 text-white", trend: [30, 35, 32, 40, 38, 45, 42, 48] },
    { name: "Serum", icon: "S", color: "bg-cyan-400 text-black", trend: [25, 30, 28, 35, 32, 40, 38, 42] },
    { name: "Kadena", icon: "K", color: "bg-purple-500 text-white", trend: [35, 40, 38, 45, 42, 50, 48, 52] },
    { name: "Bnb", icon: "B", color: "bg-yellow-500 text-black", trend: [20, 25, 22, 30, 28, 35, 32, 38] },
  ]

  return (
    <div className="flex min-h-[700px] overflow-hidden rounded-xl bg-background">
      {/* Sidebar — part of the background, never overlaps */}
      <aside
        className={cn(
          "relative flex shrink-0 flex-col bg-transparent transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {/* Inner content hidden when collapsed */}
        <div
          className={cn(
            "flex h-full w-64 flex-col overflow-hidden transition-opacity duration-200",
            sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <div className="p-6">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-foreground">
                17
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">SevenTeen®</div>
                <div className="truncate text-xs text-muted-foreground">Finance Panel</div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                <Search className="size-4 shrink-0" />
                <span className="text-sm">Search</span>
              </div>
            </div>

            {/* General nav */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                General
              </h3>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-150",
                      item.active
                        ? "bg-white/[0.08] text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4 shrink-0" />
                      <span className={cn(item.active && "font-medium")}>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="flex items-center gap-1">
                        <span
                          className="size-[7px] rounded-full bg-emerald-400"
                          style={{ boxShadow: "0 0 6px 2px rgba(52,211,153,0.7)" }}
                        />
                        <span
                          className="text-xs font-semibold tabular-nums text-emerald-400"
                          style={{ textShadow: "0 0 8px rgba(52,211,153,0.8)" }}
                        >
                          {item.badge}
                        </span>
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Files */}
            <div className="mb-6">
              <button className="mb-2 flex w-full items-center gap-2 px-3 text-sm text-muted-foreground">
                <FileText className="size-4 shrink-0" />
                <span>Files</span>
                <ChevronRight className="ml-auto size-4" />
              </button>
              <div className="ml-6 space-y-1 border-l border-border pl-4">
                {files.map((file) => (
                  <button
                    key={file}
                    className="block w-full truncate py-1 text-left text-sm text-muted-foreground hover:text-foreground"
                  >
                    {file}
                  </button>
                ))}
              </div>
            </div>

            {/* Account */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </h3>
              <nav className="space-y-1">
                {accountItems.map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Usage indicator */}
          <div className="mt-auto px-6 pb-6">
            <div className="rounded-xl bg-primary/10 p-4">
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">480</span>
                <span className="text-muted-foreground">/ 500</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">20 Auto Trades Left - Be Pro!</p>
              <Progress value={96} className="h-1.5 [&>div]:bg-primary" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content — floating card with small top offset */}
      <main
        className="relative mt-2 flex min-w-0 flex-1 flex-col rounded-tl-3xl"
        style={{ 
          boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
          background: "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(20,20,20,1) 50%, rgba(15,15,15,1) 100%)",
        }}
      >
        {/* Smoke/fog effect overlay */}
        <div 
          className="pointer-events-none absolute inset-0 rounded-tl-3xl opacity-60 dark:opacity-40"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(60,60,60,0.3) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(50,50,50,0.2) 0%, transparent 50%)",
          }}
        />
        {/* Subtle border glow */}
        <div className="pointer-events-none absolute inset-0 rounded-tl-3xl border border-white/[0.06]" />

        {/* Top bar */}
        <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          {/* Left: toggle button + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <PanelLeftClose className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <LayoutDashboard className="size-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Dashboard</span>
              <span className="flex items-center gap-1">
                <span
                  className="size-[6px] rounded-full bg-emerald-400"
                  style={{ boxShadow: "0 0 5px 2px rgba(52,211,153,0.7)" }}
                />
                <span
                  className="text-[11px] font-semibold tabular-nums text-emerald-400"
                  style={{ textShadow: "0 0 6px rgba(52,211,153,0.8)" }}
                >
                  3
                </span>
              </span>
            </div>
          </div>

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Bell className="size-5" />
              <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  JD
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-xs font-medium text-foreground">John Doe</div>
                  <div className="text-[10px] text-muted-foreground">Pro Plan</div>
                </div>
                <ChevronRight
                  className={cn(
                    "hidden size-3.5 text-muted-foreground transition-transform duration-200 sm:block",
                    userMenuOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <div className="text-sm font-medium text-foreground">John Doe</div>
                    <div className="text-xs text-muted-foreground">john@example.com</div>
                  </div>
                  <div className="p-1">
                    {[
                      { icon: User, label: "Profile" },
                      { icon: Settings, label: "Settings" },
                      { icon: Bell, label: "Notifications" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border p-1">
                    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10">
                      <X className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="relative overflow-y-auto p-6 lg:p-8">
          {/* Overview heading */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-foreground">Overview</h2>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                7 days
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Maximize2 className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="size-4" />
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-white/[0.08] p-5"
                style={{
                  background: "linear-gradient(145deg, rgba(35,35,35,0.9) 0%, rgba(25,25,25,0.95) 100%)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{stat.title}</h3>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <Sparkline data={stat.data} color={stat.color} />
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className={cn("text-sm font-medium", stat.positive ? "text-primary" : "text-destructive")}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground">From last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div 
              className="rounded-xl border border-white/[0.08] p-5 lg:col-span-2"
              style={{
                background: "linear-gradient(145deg, rgba(35,35,35,0.9) 0%, rgba(25,25,25,0.95) 100%)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Auto Trades Chart</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Chart of your auto-bot trades in last</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      14 days
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Plus className="size-4" />
                </Button>
              </div>
              <AreaChart />
              <div className="mt-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">AVG</span>
                  <span className="ml-2 text-lg font-bold text-primary">+5.29%</span>
                </div>
                <div className="text-muted-foreground">
                  <span>Date</span>
                  <span className="ml-2">07.01.2024 - 21.01.2024</span>
                </div>
              </div>
            </div>

            <div 
              className="rounded-xl border border-white/[0.08] p-5"
              style={{
                background: "linear-gradient(145deg, rgba(35,35,35,0.9) 0%, rgba(25,25,25,0.95) 100%)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
            >
              <div className="mb-4">
                <h3 className="font-medium text-foreground">Assets</h3>
                <p className="text-xs text-muted-foreground">Best assets from your portfolio</p>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {assets.map((asset) => (
                  <AssetItem key={asset.name} {...asset} />
                ))}
              </div>
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">AVG</span>
                  <span className="text-lg font-bold text-primary">+5.29%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function LayoutsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-3xl font-bold tracking-tight">Layouts</h2>
        <p className="text-muted-foreground">
          Complete page layouts with integrated sidebar and floating content patterns.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Layout</CardTitle>
          <CardDescription>
            Modern dashboard with sidebar integrated into background and floating content area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardLayoutPreview />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout Features</CardTitle>
          <CardDescription>Key characteristics of this layout pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Integrated Sidebar</h4>
              <p className="text-sm text-muted-foreground">
                Sidebar blends seamlessly with the dark background, creating visual depth
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Floating Content</h4>
              <p className="text-sm text-muted-foreground">
                Main content area appears elevated with subtle shadows and rounded corners
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                Adapts to all screen sizes with collapsible sidebar on mobile
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Subtle Borders</h4>
              <p className="text-sm text-muted-foreground">
                Low-opacity borders create depth without harsh visual separation
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Dark Theme Optimized</h4>
              <p className="text-sm text-muted-foreground">
                Carefully crafted color palette for comfortable viewing in dark mode
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="mb-2 font-semibold">Visual Hierarchy</h4>
              <p className="text-sm text-muted-foreground">
                Clear hierarchy using color, size, and spacing for easy navigation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
          <CardDescription>Technical details for implementing this pattern</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <pre className="overflow-x-auto text-foreground">
{`// Key CSS for the floating content effect
<main className="rounded-tl-3xl bg-card"
  style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.5)" }}>
  
  {/* Subtle border glow */}
  <div className="absolute inset-0 rounded-tl-3xl 
    border border-border" />
  
  {/* Content */}
</main>

// Sidebar extends as part of background
<aside className="bg-transparent">
  {/* Navigation items */}
</aside>`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
