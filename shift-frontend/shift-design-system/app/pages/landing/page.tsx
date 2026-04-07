"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  Check,
  ChevronRight,
  Code2,
  Component,
  Github,
  GitBranch,
  Layers,
  LayoutGrid,
  Monitor,
  Moon,
  Package,
  Palette,
  Sparkles,
  Star,
  Sun,
  Zap,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Data ──────────────────────────────────────────────────────────────────

const nav = ["Features", "Components", "Pricing", "Docs"]

const stats = [
  { value: "50+", label: "Components" },
  { value: "10+", label: "Page templates" },
  { value: "3", label: "Themes" },
  { value: "100%", label: "TypeScript" },
]

const features = [
  {
    icon: Component,
    title: "50+ Components",
    description:
      "Buttons, cards, tables, forms, charts, treeview and much more — all production-ready and fully accessible.",
  },
  {
    icon: Palette,
    title: "Design Tokens",
    description:
      "A robust token system covering color, radius and typography. Swap themes in one file.",
  },
  {
    icon: BarChart2,
    title: "Charts & Data Viz",
    description:
      "8 chart types powered by Recharts with a unified styling layer that matches your brand.",
  },
  {
    icon: Layers,
    title: "Layout Patterns",
    description:
      "Sidebar layouts, top-bars, auth screens and dashboard shells — ready to drop into any project.",
  },
  {
    icon: Code2,
    title: "LLM-Ready Docs",
    description:
      "A downloadable DESIGN-SYSTEM.md file so AI tools always know the full scope of the system.",
  },
  {
    icon: GitBranch,
    title: "TreeView & Hierarchy",
    description:
      "Folder explorers, account plans and org charts — multi-variant treeview components out of the box.",
  },
  {
    icon: Monitor,
    title: "Responsive by Default",
    description:
      "Every component is built mobile-first. They look great on phones, tablets and large monitors.",
  },
  {
    icon: Zap,
    title: "Next.js 15 + Tailwind 4",
    description:
      "Built on the latest stack. App Router, Server Components and Tailwind v4 CSS variables.",
  },
]

const bentoItems = [
  {
    colSpan: "col-span-2",
    rowSpan: "",
    tag: "Components",
    title: "Everything in one place",
    description: "Buttons, forms, tables, charts — all in a single design system with consistent tokens.",
    visual: "components",
  },
  {
    colSpan: "",
    rowSpan: "",
    tag: "Theming",
    title: "Dark & Light modes",
    description: "Toggle between themes instantly with semantic tokens throughout.",
    visual: "theme",
  },
  {
    colSpan: "",
    rowSpan: "row-span-2",
    tag: "Charts",
    title: "8 chart types",
    description: "Area, bar, line, pie, radar and more.",
    visual: "chart",
  },
  {
    colSpan: "",
    rowSpan: "",
    tag: "Pages",
    title: "Ready-made screens",
    description: "Login, Register, Reset Password, Landing Page.",
    visual: "pages",
  },
  {
    colSpan: "",
    rowSpan: "",
    tag: "LLM Ready",
    title: "AI-first documentation",
    description: "A single Markdown file with the full system map for AI tools.",
    visual: "llm",
  },
]

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started.",
    features: [
      "All components",
      "Dark & light theme",
      "Next.js App Router",
      "Community support",
    ],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "one-time",
    description: "For teams shipping production products.",
    features: [
      "Everything in Free",
      "All page templates",
      "Priority support",
      "LLM documentation",
      "Lifetime updates",
    ],
    cta: "Get Pro",
    featured: true,
  },
  {
    name: "Team",
    price: "$149",
    period: "one-time",
    description: "For larger teams and agencies.",
    features: [
      "Everything in Pro",
      "Unlimited projects",
      "Team license",
      "Custom token workshop",
      "Design file (Figma)",
    ],
    cta: "Contact sales",
    featured: false,
  },
]

const testimonials = [
  {
    avatar: "JR",
    name: "Julia Ramos",
    role: "Frontend Lead at Fintech Co",
    text: "Saved us weeks of work. The component quality is exceptional and the token system made our design-to-code handoff seamless.",
  },
  {
    avatar: "MC",
    name: "Marcos Costa",
    role: "Indie Developer",
    text: "The LLM documentation alone is worth it. I feed it to Claude and it builds exactly what I need without me having to explain anything.",
  },
  {
    avatar: "SL",
    name: "Sophie Laurent",
    role: "Product Designer",
    text: "Finally a design system that doesn't look like every other shadcn clone. The dark theme with the smoke effect is gorgeous.",
  },
]

// ─── Visual placeholders inside bento cards ────────────────────────────────

function BentoVisual({ type }: { type: string }) {
  if (type === "components") {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {["Button", "Card", "Badge", "Input", "Table", "Chart", "TreeView", "Form"].map((c) => (
          <span
            key={c}
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-neutral-400"
          >
            {c}
          </span>
        ))}
      </div>
    )
  }
  if (type === "theme") {
    return (
      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#0a0a0a] ring-1 ring-white/20">
          <Moon className="size-4 text-white" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
        <div className="flex size-8 items-center justify-center rounded-lg bg-white ring-1 ring-black/10">
          <Sun className="size-4 text-neutral-900" />
        </div>
      </div>
    )
  }
  if (type === "chart") {
    const bars = [40, 65, 50, 80, 60, 90, 70]
    return (
      <div className="mt-4 flex h-16 items-end gap-1">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-emerald-500/70"
            style={{ height: `${h}%`, opacity: 0.4 + i * 0.08 }}
          />
        ))}
      </div>
    )
  }
  if (type === "pages") {
    return (
      <div className="mt-4 space-y-1.5">
        {["Login", "Register", "Reset Password", "Landing Page"].map((p) => (
          <div key={p} className="flex items-center gap-2 text-xs text-neutral-500">
            <ChevronRight className="size-3 text-emerald-500" />
            {p}
          </div>
        ))}
      </div>
    )
  }
  if (type === "llm") {
    return (
      <div className="mt-4 rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[10px] text-neutral-500">
        <span className="text-emerald-400"># DESIGN-SYSTEM.md</span>
        <br />
        Components: 50+
        <br />
        Tokens: color, radius, type
        <br />
        Pages: auth, landing...
      </div>
    )
  }
  return null
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080808] font-sans text-white">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-black text-black">
              DS
            </div>
            <span className="text-sm font-semibold tracking-tight">DesignSystem</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => (
              <Link
                key={item}
                href="#"
                className="text-sm text-neutral-400 transition-colors hover:text-white"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="https://github.com"
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
            >
              <Github className="size-4" />
              GitHub
            </Link>
            <Link
              href="/pages/login"
              className="rounded-lg bg-white px-3.5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="text-neutral-400 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-[#080808] px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-2">
              {nav.map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="py-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <Link
              href="/pages/login"
              className="mt-3 block rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-black"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
        {/* Glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse at center top, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
        />
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs text-neutral-400">
            <Sparkles className="size-3 text-emerald-400" />
            Built with Next.js 15 + Tailwind CSS v4
          </div>

          <h1 className="text-balance text-5xl font-black leading-[1.06] tracking-tight text-white md:text-7xl">
            Ship faster with a
            <br />
            <span className="text-neutral-400">complete UI system</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-neutral-500 md:text-lg">
            50+ components, 10+ page templates, dark & light themes — all in one
            production-ready design system built for modern React apps.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pages/login"
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Github className="size-4" />
              View on GitHub
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#080808] px-6 py-5 text-center">
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-neutral-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Grid ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <div className="mb-12 text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            What&apos;s included
          </div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Everything you need, nothing you&apos;don&apos;t
          </h2>
        </div>

        <div className="grid auto-rows-[160px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bentoItems.map((item, i) => (
            <div
              key={i}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] p-5 transition-colors hover:border-white/[0.14]",
                item.colSpan,
                item.rowSpan,
                "bg-[#101010]"
              )}
              style={{
                background: "linear-gradient(145deg, #111111 0%, #0d0d0d 100%)",
              }}
            >
              <div>
                <span className="mb-2 inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                  {item.tag}
                </span>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{item.description}</p>
              </div>
              <BentoVisual type={item.visual} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-14 max-w-xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Features
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Built for developers who care about quality
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-white/[0.07] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.02]"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <f.icon className="size-4 text-neutral-300" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white">{f.title}</h3>
                <p className="text-xs leading-relaxed text-neutral-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Pricing
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Simple, one-time pricing
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              No subscriptions. Pay once, own it forever.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6",
                  plan.featured
                    ? "border-white/20 bg-white text-black"
                    : "border-white/[0.07] bg-[#101010]"
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Star className="size-2.5" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div
                    className={cn(
                      "text-xs font-semibold uppercase tracking-widest",
                      plan.featured ? "text-black/50" : "text-neutral-500"
                    )}
                  >
                    {plan.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span
                      className={cn(
                        "text-xs",
                        plan.featured ? "text-black/50" : "text-neutral-500"
                      )}
                    >
                      / {plan.period}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1.5 text-xs",
                      plan.featured ? "text-black/60" : "text-neutral-500"
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <Check
                        className={cn(
                          "size-3.5 shrink-0",
                          plan.featured ? "text-black" : "text-emerald-500"
                        )}
                      />
                      <span className={plan.featured ? "text-black/80" : "text-neutral-300"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pages/login"
                  className={cn(
                    "block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                    plan.featured
                      ? "bg-black text-white hover:bg-neutral-900"
                      : "border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Testimonials
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Loved by builders
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/[0.07] bg-[#101010] p-5"
              >
                <p className="mb-4 text-sm leading-relaxed text-neutral-400">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-neutral-300">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.name}</div>
                    <div className="text-[10px] text-neutral-600">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/[0.07] px-8 py-16"
            style={{
              background: "linear-gradient(145deg, #141414 0%, #0e0e0e 100%)",
            }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: "500px",
                height: "200px",
                background: "radial-gradient(ellipse at center top, rgba(255,255,255,0.05) 0%, transparent 70%)",
              }}
            />

            <div className="relative">
              <Package className="mx-auto mb-4 size-8 text-neutral-500" />
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                Start building today
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-neutral-500">
                Download the ZIP, clone from GitHub or just explore the docs. It&apos;s free to get started.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/pages/login"
                  className="flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
                >
                  Get started for free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="https://github.com"
                  target="_blank"
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Github className="size-4" />
                  Star on GitHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-neutral-600 sm:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-white text-[9px] font-black text-black">
              DS
            </div>
            <span>DesignSystem — built with Next.js & Tailwind CSS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="#" className="transition-colors hover:text-neutral-400">Docs</Link>
            <Link href="#" className="transition-colors hover:text-neutral-400">GitHub</Link>
            <Link href="#" className="transition-colors hover:text-neutral-400">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
