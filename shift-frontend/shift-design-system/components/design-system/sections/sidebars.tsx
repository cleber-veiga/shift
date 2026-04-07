"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  CreditCard,
  BarChart3,
  FileText,
  Mail,
  Calendar,
  Star,
  Plus,
  Inbox,
  Send,
  Archive,
  Trash2,
  Tag,
  Building2,
  Zap,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function SidebarsSection() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sidebars</h1>
        <p className="mt-2 text-muted-foreground">
          Navigation sidebar patterns for SaaS dashboards and applications.
        </p>
      </div>

      {/* Simple Sidebar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Simple Sidebar</h2>
          <p className="text-sm text-muted-foreground">Basic navigation sidebar with icons</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-border bg-sidebar p-4">
              <div className="flex items-center gap-2 px-2 mb-6">
                <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                  <span className="text-sm font-bold text-background">A</span>
                </div>
                <span className="font-semibold">Acme Inc</span>
              </div>

              <nav className="space-y-1">
                {[
                  { icon: Home, label: "Home", active: true },
                  { icon: LayoutDashboard, label: "Dashboard" },
                  { icon: Users, label: "Team" },
                  { icon: FolderOpen, label: "Projects" },
                  { icon: BarChart3, label: "Analytics" },
                  { icon: FileText, label: "Documents" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      item.active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </button>
                ))}
              </nav>

              <Separator className="my-4" />

              <nav className="space-y-1">
                {[
                  { icon: Settings, label: "Settings" },
                  { icon: HelpCircle, label: "Help" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Page Content
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Sidebar with Badges */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Sidebar with Badges</h2>
          <p className="text-sm text-muted-foreground">Navigation with notification badges and counters</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-border bg-sidebar p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <Mail className="size-4 text-background" />
                  </div>
                  <span className="font-semibold">Mailbox</span>
                </div>
                <Button size="icon-sm" variant="ghost">
                  <Bell className="size-4" />
                </Button>
              </div>

              <Button className="w-full mb-4">
                <Plus className="size-4 mr-2" />
                Compose
              </Button>

              <nav className="space-y-1">
                {[
                  { icon: Inbox, label: "Inbox", badge: "128", active: true },
                  { icon: Star, label: "Starred", badge: "24" },
                  { icon: Send, label: "Sent" },
                  { icon: FileText, label: "Drafts", badge: "3" },
                  { icon: Archive, label: "Archive" },
                  { icon: Trash2, label: "Trash" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      item.active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="size-4" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                ))}
              </nav>

              <Separator className="my-4" />

              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Labels
                </p>
                <nav className="space-y-1">
                  {[
                    { label: "Work", color: "bg-blue-500" },
                    { label: "Personal", color: "bg-green-500" },
                    { label: "Important", color: "bg-red-500" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                    >
                      <div className={cn("size-2 rounded-full", item.color)} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-64 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Email List
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Collapsible Sidebar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Collapsible Groups</h2>
          <p className="text-sm text-muted-foreground">Sidebar with expandable navigation groups</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-border bg-sidebar p-4">
              <div className="flex items-center gap-2 px-2 mb-6">
                <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                  <Building2 className="size-4 text-background" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Acme Corp</p>
                  <p className="text-xs text-muted-foreground">Enterprise</p>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <nav className="space-y-2">
                {/* Overview Group */}
                <div>
                  <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <span>Overview</span>
                    <ChevronDown className="size-4" />
                  </button>
                  <div className="ml-4 space-y-1">
                    {[
                      { icon: Home, label: "Home", active: true },
                      { icon: LayoutDashboard, label: "Dashboard" },
                      { icon: BarChart3, label: "Analytics" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          item.active
                            ? "bg-accent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workspace Group */}
                <div>
                  <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <span>Workspace</span>
                    <ChevronRight className="size-4" />
                  </button>
                </div>

                {/* Settings Group */}
                <div>
                  <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    <span>Settings</span>
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </nav>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Page Content
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Sidebar with User Profile */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">With User Profile</h2>
          <p className="text-sm text-muted-foreground">Sidebar with integrated user account section</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-64 border-r border-border bg-sidebar flex flex-col">
              <div className="p-4">
                <div className="flex items-center gap-2 px-2 mb-6">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <Zap className="size-4 text-background" />
                  </div>
                  <span className="font-semibold">FlowApp</span>
                </div>

                <nav className="space-y-1">
                  {[
                    { icon: Home, label: "Home", active: true },
                    { icon: FolderOpen, label: "Projects" },
                    { icon: Users, label: "Team" },
                    { icon: Calendar, label: "Calendar" },
                    { icon: FileText, label: "Documents" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        item.active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-4 border-t border-border">
                {/* Upgrade Card */}
                <div className="rounded-lg bg-accent p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="size-4 text-foreground" />
                    <span className="text-sm font-medium">Upgrade to Pro</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get unlimited projects and advanced features
                  </p>
                  <Button size="sm" className="w-full">
                    Upgrade now
                  </Button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">John Doe</p>
                    <p className="text-xs text-muted-foreground truncate">john@example.com</p>
                  </div>
                  <Button size="icon-sm" variant="ghost">
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-64 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Page Content
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Compact Icon Sidebar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Compact Icon Sidebar</h2>
          <p className="text-sm text-muted-foreground">Minimalist icon-only sidebar for space efficiency</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            <div className="w-16 border-r border-border bg-sidebar flex flex-col items-center py-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-foreground mb-6">
                <span className="text-sm font-bold text-background">A</span>
              </div>

              <nav className="flex flex-col items-center gap-2">
                {[
                  { icon: Home, active: true },
                  { icon: LayoutDashboard },
                  { icon: Users },
                  { icon: FolderOpen },
                  { icon: BarChart3 },
                  { icon: FileText },
                ].map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md transition-colors",
                      item.active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                  </button>
                ))}
              </nav>

              <div className="mt-auto flex flex-col items-center gap-2">
                <button className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                  <Settings className="size-5" />
                </button>
                <Avatar className="size-9">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Page Content
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Double Sidebar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Double Sidebar</h2>
          <p className="text-sm text-muted-foreground">Primary navigation with secondary contextual sidebar</p>
        </div>

        <Card className="overflow-hidden">
          <div className="flex">
            {/* Primary Icon Bar */}
            <div className="w-16 border-r border-border bg-sidebar flex flex-col items-center py-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-foreground mb-6">
                <span className="text-sm font-bold text-background">A</span>
              </div>

              <nav className="flex flex-col items-center gap-2">
                {[
                  { icon: Home },
                  { icon: Mail, active: true },
                  { icon: Calendar },
                  { icon: FolderOpen },
                  { icon: CreditCard },
                ].map((item, index) => (
                  <button
                    key={index}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md transition-colors",
                      item.active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                  </button>
                ))}
              </nav>

              <div className="mt-auto">
                <Avatar className="size-9">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Secondary Sidebar */}
            <div className="w-56 border-r border-border bg-sidebar p-4">
              <h3 className="font-semibold mb-4">Inbox</h3>
              <nav className="space-y-1">
                {[
                  { label: "All Mail", badge: "128", active: true },
                  { label: "Unread", badge: "12" },
                  { label: "Starred", badge: "8" },
                  { label: "Important" },
                  { label: "Drafts", badge: "3" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      item.active
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-xs text-muted-foreground">{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>

              <Separator className="my-4" />

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                Labels
              </p>
              <nav className="space-y-1">
                {[
                  { label: "Work", color: "bg-blue-500" },
                  { label: "Personal", color: "bg-green-500" },
                  { label: "Shopping", color: "bg-purple-500" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <div className={cn("size-2 rounded-full", item.color)} />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-8 bg-background">
              <div className="h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                Email Content
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
