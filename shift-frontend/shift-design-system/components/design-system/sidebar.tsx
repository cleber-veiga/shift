"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Palette,
  Type,
  RectangleHorizontal,
  CreditCard,
  LayoutGrid,
  FormInput,
  Tag,
  Table,
  Navigation,
  Bell,
  BookOpen,
  Lock,
  PanelLeft,
  PanelTop,
  Layers,
  TableProperties,
  GitBranch,
  FileStack,
  LogIn,
  ChevronRight,
  ExternalLink,
  BarChart2,
  Rocket,
  Globe,
  Workflow,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const foundations = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "getting-started", label: "Getting Started", icon: Rocket },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "typography", label: "Typography", icon: Type },
]

const components = [
  { id: "buttons",    label: "Buttons",      icon: RectangleHorizontal },
  { id: "cards",      label: "Cards",        icon: CreditCard          },
  { id: "grids",      label: "Grids",        icon: LayoutGrid          },
  { id: "forms",      label: "Forms",        icon: FormInput           },
  { id: "badges",     label: "Badges & Tags",icon: Tag                 },
  { id: "tabs",       label: "Tabs",         icon: Layers              },
  { id: "tables",     label: "Tables",       icon: Table               },
  { id: "datatables", label: "Data Tables",  icon: TableProperties     },
  { id: "charts",     label: "Charts",       icon: BarChart2           },
  { id: "treeview",   label: "TreeView",     icon: GitBranch           },
  { id: "navigation", label: "Navigation",   icon: Navigation          },
  { id: "feedback",   label: "Feedback",     icon: Bell                },
]

const patterns = [
  { id: "authentication", label: "Authentication", icon: Lock },
  { id: "sidebars", label: "Sidebars", icon: PanelLeft },
  { id: "topbars", label: "Top Bars", icon: PanelTop },
  { id: "layouts", label: "Layouts", icon: Layers },
]

const pages = [
  {
    id: "auth-pages",
    label: "Auth",
    icon: LogIn,
    children: [
      { id: "page-login",          label: "Login",          href: "/pages/login"          },
      { id: "page-register",       label: "Register",       href: "/pages/register"       },
      { id: "page-reset-password", label: "Reset Password", href: "/pages/reset-password" },
    ],
  },
  {
    id: "marketing-pages",
    label: "Marketing",
    icon: Globe,
    children: [
      { id: "page-landing", label: "Landing Page", href: "/pages/landing" },
    ],
  },
  {
    id: "tools-pages",
    label: "Tools",
    icon: Workflow,
    children: [
      { id: "page-workflow", label: "Workflow Builder", href: "/pages/workflow" },
    ],
  },
]

function NavItem({
  item,
  activeSection,
  onSectionChange,
}: {
  item: { id: string; label: string; icon: React.ElementType }
  activeSection: string
  onSectionChange: (id: string) => void
}) {
  return (
    <li>
      <button
        onClick={() => onSectionChange(item.id)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          activeSection === item.id
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {item.label}
      </button>
    </li>
  )
}

function PagesGroup({
  group,
  activeSection,
}: {
  group: { id: string; label: string; icon: React.ElementType; children: { id: string; label: string; href: string }[] }
  activeSection: string
}) {
  const [open, setOpen] = useState(true)
  const isActive = group.children.some((c) => activeSection === c.id)

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
      >
        <group.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </button>

      {open && (
        <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-border pl-3">
          {group.children.map((child) => (
            <li key={child.id}>
              <Link
                href={child.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                  "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {child.label}
                <ExternalLink className="size-3 shrink-0 opacity-50" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function DesignSystemSidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r border-border bg-sidebar lg:block">
      <nav className="p-4">

        {/* Foundations */}
        <div className="mb-6">
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Foundations
          </h3>
          <ul className="space-y-1">
            {foundations.map((item) => (
              <NavItem key={item.id} item={item} activeSection={activeSection} onSectionChange={onSectionChange} />
            ))}
          </ul>
        </div>

        {/* Components */}
        <div className="mb-6">
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Components
          </h3>
          <ul className="space-y-1">
            {components.map((item) => (
              <NavItem key={item.id} item={item} activeSection={activeSection} onSectionChange={onSectionChange} />
            ))}
          </ul>
        </div>

        {/* Patterns */}
        <div className="mb-6">
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patterns
          </h3>
          <ul className="space-y-1">
            {patterns.map((item) => (
              <NavItem key={item.id} item={item} activeSection={activeSection} onSectionChange={onSectionChange} />
            ))}
          </ul>
        </div>

        {/* Pages */}
        <div>
          <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pages
          </h3>
          <ul className="space-y-1">
            {pages.map((group) => (
              <PagesGroup key={group.id} group={group} activeSection={activeSection} />
            ))}
          </ul>
        </div>

      </nav>
    </aside>
  )
}
