"use client"

import { useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

// ─── Color palette (no CSS variables – passed directly) ────────────────────
const C = {
  primary:   "#6366f1",
  secondary: "#8b5cf6",
  tertiary:  "#06b6d4",
  success:   "#10b981",
  warning:   "#f59e0b",
  danger:    "#ef4444",
  pink:      "#ec4899",
  muted:     "#64748b",
}

const COLORS = [C.primary, C.secondary, C.tertiary, C.success, C.warning, C.danger]

// ─── Shared datasets ────────────────────────────────────────────────────────
const monthlyRevenue = [
  { month: "Jan", revenue: 42000, expenses: 28000, profit: 14000 },
  { month: "Feb", revenue: 51000, expenses: 31000, profit: 20000 },
  { month: "Mar", revenue: 47000, expenses: 29500, profit: 17500 },
  { month: "Apr", revenue: 63000, expenses: 35000, profit: 28000 },
  { month: "May", revenue: 58000, expenses: 33000, profit: 25000 },
  { month: "Jun", revenue: 71000, expenses: 38000, profit: 33000 },
  { month: "Jul", revenue: 68000, expenses: 36000, profit: 32000 },
  { month: "Aug", revenue: 79000, expenses: 41000, profit: 38000 },
  { month: "Sep", revenue: 74000, expenses: 40000, profit: 34000 },
  { month: "Oct", revenue: 88000, expenses: 45000, profit: 43000 },
  { month: "Nov", revenue: 95000, expenses: 49000, profit: 46000 },
  { month: "Dec", revenue: 112000, expenses: 55000, profit: 57000 },
]

const weeklyUsers = [
  { day: "Mon", new: 240, returning: 480, churned: 30 },
  { day: "Tue", new: 310, returning: 520, churned: 25 },
  { day: "Wed", new: 280, returning: 490, churned: 40 },
  { day: "Thu", new: 390, returning: 560, churned: 20 },
  { day: "Fri", new: 430, returning: 610, churned: 35 },
  { day: "Sat", new: 210, returning: 380, churned: 50 },
  { day: "Sun", new: 180, returning: 340, churned: 45 },
]

const marketShare = [
  { name: "Product A", value: 34.2 },
  { name: "Product B", value: 26.8 },
  { name: "Product C", value: 18.5 },
  { name: "Product D", value: 12.1 },
  { name: "Others",    value: 8.4  },
]

const radarData = [
  { skill: "Design",      team: 90, industry: 70 },
  { skill: "Frontend",    team: 85, industry: 65 },
  { skill: "Backend",     team: 78, industry: 72 },
  { skill: "DevOps",      team: 65, industry: 60 },
  { skill: "Security",    team: 72, industry: 55 },
  { skill: "Testing",     team: 80, industry: 68 },
]

const radialData = [
  { name: "Mobile",  value: 87, fill: C.primary   },
  { name: "Desktop", value: 72, fill: C.secondary },
  { name: "Tablet",  value: 58, fill: C.tertiary  },
  { name: "Other",   value: 34, fill: C.warning   },
]

const scatterData = [
  { x: 10, y: 30, z: 200 }, { x: 30, y: 20, z: 150 },
  { x: 50, y: 60, z: 300 }, { x: 40, y: 45, z: 250 },
  { x: 70, y: 80, z: 400 }, { x: 60, y: 55, z: 180 },
  { x: 80, y: 35, z: 220 }, { x: 20, y: 70, z: 350 },
  { x: 90, y: 90, z: 500 }, { x: 55, y: 25, z: 160 },
  { x: 35, y: 50, z: 280 }, { x: 75, y: 65, z: 320 },
]

const funnelData = [
  { stage: "Impressions", value: 120000 },
  { stage: "Visits",      value: 48000  },
  { stage: "Sign-ups",    value: 18000  },
  { stage: "Trials",      value: 7200   },
  { stage: "Paid",        value: 2400   },
]

const stackedBar = [
  { q: "Q1", enterprise: 24000, mid: 18000, smb: 12000 },
  { q: "Q2", enterprise: 31000, mid: 22000, smb: 14000 },
  { q: "Q3", enterprise: 28000, mid: 19000, smb: 15000 },
  { q: "Q4", enterprise: 42000, mid: 29000, smb: 18000 },
]

// ─── Tooltip custom ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = "", suffix = "" }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  prefix?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl">
      {label && <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">
            {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function ChartSection({ title, description, children }: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

// ─── Stat mini-card ──────────────────────────────────────────────────────────
function StatCard({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-500" : "text-red-500"}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {change}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function ChartsSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div className="space-y-16">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Charts</h1>
          <Badge variant="secondary">Recharts</Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          A complete collection of chart types built with Recharts and shadcn/ui tokens. All charts are
          responsive and theme-aware.
        </p>
      </div>

      {/* ── 1. Area Charts ───────────────────────────────────────────────── */}
      <ChartSection title="Area Charts" description="Ideal for showing trends and cumulative values over time.">
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Simple area */}
          <Card>
            <CardHeader>
              <CardTitle>Simple Area</CardTitle>
              <CardDescription>Monthly revenue over the year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.primary} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip prefix="$" />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.primary} strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stacked area */}
          <Card>
            <CardHeader>
              <CardTitle>Stacked Area</CardTitle>
              <CardDescription>Revenue, expenses and profit stacked</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyRevenue}>
                  <defs>
                    <linearGradient id="gradRev2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary}  stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.primary}  stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.danger}   stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.danger}   stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradPro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.success}  stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.success}  stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip prefix="$" />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue"  name="Revenue"  stroke={C.primary} fill="url(#gradRev2)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke={C.danger}  fill="url(#gradExp)"  strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="profit"   name="Profit"   stroke={C.success} fill="url(#gradPro)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ChartSection>

      {/* ── 2. Line Charts ───────────────────────────────────────────────── */}
      <ChartSection title="Line Charts" description="Best for comparing multiple series and showing precise data points.">

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue" value="$848k" change="+18.4% vs last year" up />
          <StatCard label="Total Expenses" value="$460k" change="+9.2% vs last year" up={false} />
          <StatCard label="Net Profit" value="$388k" change="+28.7% vs last year" up />
          <StatCard label="Avg. Monthly" value="$70.6k" change="+18.4% vs last year" up />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Multi-line */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Line</CardTitle>
              <CardDescription>Revenue vs expenses vs profit</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip prefix="$" />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue"  name="Revenue"  stroke={C.primary}   strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke={C.danger}     strokeWidth={2}   dot={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="profit"   name="Profit"   stroke={C.success}   strokeWidth={2}   dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stepped line */}
          <Card>
            <CardHeader>
              <CardTitle>Step Line</CardTitle>
              <CardDescription>Weekly user activity (stepped)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="stepAfter" dataKey="new"       name="New"       stroke={C.primary}   strokeWidth={2} dot={{ r: 3, fill: C.primary }}   />
                  <Line type="stepAfter" dataKey="returning" name="Returning" stroke={C.secondary} strokeWidth={2} dot={{ r: 3, fill: C.secondary }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ChartSection>

      {/* ── 3. Bar Charts ───────────────────────────────────────────────────── */}
      <ChartSection title="Bar Charts" description="Perfect for comparing values across categories and periods.">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Vertical bar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Grouped Bar</CardTitle>
              <CardDescription>New vs returning users per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyUsers} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(128,128,128,0.05)" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="new"       name="New"       fill={C.primary}   radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="returning" name="Returning" fill={C.secondary} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Horizontal bar */}
          <Card>
            <CardHeader>
              <CardTitle>Horizontal Bar</CardTitle>
              <CardDescription>Conversion funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(128,128,128,0.05)" }} />
                  <Bar dataKey="value" name="Users" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Stacked bar */}
        <Card>
          <CardHeader>
            <CardTitle>Stacked Bar</CardTitle>
            <CardDescription>Revenue breakdown by customer segment per quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stackedBar} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="q" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: "rgba(128,128,128,0.05)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="enterprise" name="Enterprise" stackId="a" fill={C.primary}   />
                <Bar dataKey="mid"        name="Mid-Market" stackId="a" fill={C.secondary} />
                <Bar dataKey="smb"        name="SMB"        stackId="a" fill={C.tertiary}  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </ChartSection>

      {/* ── 4. Pie & Donut ──────────────────────────────────────────────────── */}
      <ChartSection title="Pie & Donut Charts" description="Use for part-to-whole relationships and market share visualizations.">
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Donut */}
          <Card>
            <CardHeader>
              <CardTitle>Donut Chart</CardTitle>
              <CardDescription>Market share by product</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={marketShare}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, i) => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {marketShare.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl text-sm">
                            <span style={{ color: d.payload.fill }} className="font-semibold">{d.name}</span>
                            <span className="ml-2 text-foreground font-bold">{d.value}%</span>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="shrink-0 space-y-2">
                  {marketShare.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-semibold text-foreground ml-auto pl-4">{entry.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pie with label */}
          <Card>
            <CardHeader>
              <CardTitle>Pie Chart</CardTitle>
              <CardDescription>User traffic by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Organic",  value: 38 },
                      { name: "Direct",   value: 24 },
                      { name: "Referral", value: 18 },
                      { name: "Social",   value: 12 },
                      { name: "Email",    value: 8  },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={{ stroke: C.muted, strokeWidth: 1 }}
                  >
                    {marketShare.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ChartSection>

      {/* ── 5. Radar Chart ──────────────────────────────────────────────────── */}
      <ChartSection title="Radar Chart" description="Great for comparing multiple quantitative variables across categories.">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Skills Radar</CardTitle>
              <CardDescription>Team competency vs industry average</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(128,128,128,0.2)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: C.muted }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Our Team"    dataKey="team"     stroke={C.primary}   fill={C.primary}   fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Industry Avg" dataKey="industry" stroke={C.secondary} fill={C.secondary} fillOpacity={0.1}  strokeWidth={1.5} strokeDasharray="4 2" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance by Dimension</CardTitle>
              <CardDescription>Product metrics evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={[
                  { dim: "Speed",        v1: 88, v2: 74 },
                  { dim: "Reliability",  v1: 92, v2: 81 },
                  { dim: "Usability",    v1: 78, v2: 85 },
                  { dim: "Support",      v1: 65, v2: 70 },
                  { dim: "Price",        v1: 55, v2: 90 },
                  { dim: "Features",     v1: 95, v2: 68 },
                ]}>
                  <PolarGrid stroke="rgba(128,128,128,0.2)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12, fill: C.muted }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Product A" dataKey="v1" stroke={C.tertiary} fill={C.tertiary} fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Product B" dataKey="v2" stroke={C.warning}  fill={C.warning}  fillOpacity={0.15} strokeWidth={2} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ChartSection>

      {/* ── 6. Radial Bar ───────────────────────────────────────────────────── */}
      <ChartSection title="Radial Bar Chart" description="Circular progress indicators for showing percentage-based metrics.">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Device Usage</CardTitle>
              <CardDescription>Session distribution by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={90}
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(128,128,128,0.08)" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl text-sm">
                            <span className="text-foreground font-semibold">{payload[0].payload.name}: {payload[0].value}%</span>
                          </div>
                        )
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="shrink-0 space-y-3">
                  {radialData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="text-muted-foreground w-16">{d.name}</span>
                      <span className="font-bold text-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Single radial / gauge */}
          <Card>
            <CardHeader>
              <CardTitle>Goal Completion</CardTitle>
              <CardDescription>Monthly target progress per team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Sales",   value: 83, fill: C.primary   },
                  { name: "Support", value: 67, fill: C.success   },
                  { name: "Design",  value: 91, fill: C.tertiary  },
                  { name: "Eng",     value: 74, fill: C.warning   },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={90}>
                      <RadialBarChart
                        cx="50%" cy="100%"
                        innerRadius="60%" outerRadius="100%"
                        startAngle={180} endAngle={0}
                        data={[{ value: item.value, fill: item.fill }]}
                      >
                        <RadialBar dataKey="value" background={{ fill: "rgba(128,128,128,0.08)" }} cornerRadius={4} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.fill }}>{item.value}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ChartSection>

      {/* ── 7. Scatter Chart ─────────────────────────────────────────────────── */}
      <ChartSection title="Scatter Chart" description="For exploring correlations and distribution of two or more variables.">
        <Card>
          <CardHeader>
            <CardTitle>Engagement vs Conversion</CardTitle>
            <CardDescription>Each point represents a campaign — bubble size indicates budget</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="x" name="Engagement" type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} label={{ value: "Engagement (%)", position: "insideBottom", offset: -4, fontSize: 11, fill: C.muted }} />
                <YAxis dataKey="y" name="Conversion" type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} label={{ value: "Conversion (%)", angle: -90, position: "insideLeft", offset: 8, fontSize: 11, fill: C.muted }} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: C.muted }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl text-sm space-y-1">
                        <div className="text-muted-foreground">Engagement: <span className="font-semibold text-foreground">{payload[0]?.value}%</span></div>
                        <div className="text-muted-foreground">Conversion: <span className="font-semibold text-foreground">{payload[1]?.value}%</span></div>
                      </div>
                    )
                  }}
                />
                <Scatter name="Campaigns" data={scatterData} fill={C.primary} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </ChartSection>

      {/* ── 8. Composed Chart ─────────────────────────────────────────────────── */}
      <ChartSection title="Composed Chart" description="Combines multiple chart types in a single visualization for richer insight.">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Bars for revenue/expenses and line for profit margin</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="gradCompRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.primary} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: "rgba(128,128,128,0.05)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar    yAxisId="left"  dataKey="revenue"  name="Revenue"  fill="url(#gradCompRev)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                <Bar    yAxisId="left"  dataKey="expenses" name="Expenses" fill={C.danger}          radius={[3, 3, 0, 0]} maxBarSize={32} fillOpacity={0.7} />
                <Line   yAxisId="right" dataKey="profit"   name="Profit"   stroke={C.success}       strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                <Area  yAxisId="right" dataKey="profit"   name="Profit Area" stroke="none" fill={C.success} fillOpacity={0.05} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </ChartSection>

    </div>
  )
}
