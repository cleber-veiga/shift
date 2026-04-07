"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Plus,
  Command,
  MessageSquare,
  Zap,
  CreditCard,
  Moon,
  Globe,
  Building2,
  ChevronRight,
  X,
} from "lucide-react"
import { Kbd } from "@/components/ui/kbd"

export function TopbarsSection() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Top Bars</h1>
        <p className="mt-2 text-muted-foreground">
          Header and navigation bar patterns for SaaS applications.
        </p>
      </div>

      {/* Simple Topbar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Simple Top Bar</h2>
          <p className="text-sm text-muted-foreground">Basic navigation header with logo and menu</p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <span className="text-sm font-bold text-background">A</span>
                  </div>
                  <span className="font-semibold">Acme</span>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                  {["Dashboard", "Projects", "Team", "Reports"].map((item, i) => (
                    <Button
                      key={item}
                      variant="ghost"
                      size="sm"
                      className={i === 0 ? "text-foreground" : "text-muted-foreground"}
                    >
                      {item}
                    </Button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm">
                  <Bell className="size-4" />
                </Button>
                <Avatar className="size-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Topbar with Search */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">With Search Bar</h2>
          <p className="text-sm text-muted-foreground">Navigation with integrated search functionality</p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon-sm" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <Zap className="size-4 text-background" />
                  </div>
                  <span className="font-semibold hidden sm:inline">FlowApp</span>
                </div>
              </div>

              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-12 bg-muted/50 border-transparent focus:bg-background focus:border-input"
                    placeholder="Search anything..."
                  />
                  <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 gap-0.5">
                    <Command className="size-3" />K
                  </Kbd>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" className="relative">
                  <Bell className="size-4" />
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
                </Button>
                <Button variant="ghost" size="icon-sm">
                  <MessageSquare className="size-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="size-6">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline">John</span>
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 size-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Topbar with Workspace Switcher */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Workspace Switcher</h2>
          <p className="text-sm text-muted-foreground">Multi-tenant navigation with workspace selector</p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-foreground">
                        <Building2 className="size-3.5 text-background" />
                      </div>
                      <span className="font-medium">Acme Corp</span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-foreground">
                        <Building2 className="size-3.5 text-background" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Acme Corp</p>
                        <p className="text-xs text-muted-foreground">12 members</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Pro</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <div className="flex size-6 items-center justify-center rounded bg-muted">
                        <span className="text-xs font-medium">P</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Personal</p>
                        <p className="text-xs text-muted-foreground">1 member</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Plus className="mr-2 size-4" />
                      Create workspace
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <nav className="hidden lg:flex items-center border-l border-border pl-4 gap-1">
                  {[
                    { label: "Overview", active: true },
                    { label: "Projects" },
                    { label: "Members" },
                    { label: "Settings" },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      size="sm"
                      className={item.active ? "text-foreground" : "text-muted-foreground"}
                    >
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm">
                  <Plus className="size-4 mr-1" />
                  New Project
                </Button>
                <Button variant="ghost" size="icon-sm">
                  <Bell className="size-4" />
                </Button>
                <Avatar className="size-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Topbar with Breadcrumbs */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">With Breadcrumbs</h2>
          <p className="text-sm text-muted-foreground">Navigation header with contextual breadcrumb trail</p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon-sm" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <span className="text-sm font-bold text-background">A</span>
                  </div>
                </div>

                <nav className="hidden md:flex items-center text-sm">
                  <button className="text-muted-foreground hover:text-foreground">Projects</button>
                  <ChevronRight className="size-4 mx-1 text-muted-foreground" />
                  <button className="text-muted-foreground hover:text-foreground">Marketing</button>
                  <ChevronRight className="size-4 mx-1 text-muted-foreground" />
                  <span className="font-medium">Campaign Dashboard</span>
                </nav>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Settings className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Full-Featured Topbar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Full-Featured Header</h2>
          <p className="text-sm text-muted-foreground">Complete navigation with all common elements</p>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-foreground">
                    <span className="text-lg font-bold text-background">A</span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold">Acme Platform</p>
                    <p className="text-xs text-muted-foreground">Enterprise</p>
                  </div>
                </div>

                <nav className="hidden lg:flex items-center gap-1">
                  {[
                    { label: "Dashboard", active: true },
                    { label: "Analytics" },
                    { label: "Customers" },
                    { label: "Products" },
                    { label: "Settings" },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant={item.active ? "secondary" : "ghost"}
                      size="sm"
                    >
                      {item.label}
                    </Button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                    <Search className="size-4" />
                    <span>Search</span>
                    <Kbd className="gap-0.5 ml-2">
                      <Command className="size-3" />K
                    </Kbd>
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm">
                    <Globe className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Moon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="relative">
                    <Bell className="size-4" />
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <HelpCircle className="size-4" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 ml-2">
                      <Avatar className="size-7">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">John Doe</p>
                      </div>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">john@example.com</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 size-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 size-4" />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 size-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <LogOut className="mr-2 size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Banner Topbar */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">With Announcement Banner</h2>
          <p className="text-sm text-muted-foreground">Header with promotional or system announcement banner</p>
        </div>

        <Card className="overflow-hidden">
          {/* Banner */}
          <div className="bg-foreground px-4 py-2 text-center text-sm text-background">
            <div className="flex items-center justify-center gap-2">
              <Zap className="size-4" />
              <span>
                <strong>New Feature:</strong> AI-powered analytics is now available.{" "}
                <button className="underline hover:no-underline">Learn more</button>
              </span>
              <button className="ml-4 hover:opacity-70">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <span className="text-sm font-bold text-background">A</span>
                  </div>
                  <span className="font-semibold">Acme</span>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                  {["Home", "Products", "Resources", "Pricing"].map((item) => (
                    <Button key={item} variant="ghost" size="sm" className="text-muted-foreground">
                      {item}
                    </Button>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">Sign in</Button>
                <Button size="sm">Get Started</Button>
              </div>
            </div>
          </div>
          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>

      {/* Sticky Sub-Navigation */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">With Sub-Navigation</h2>
          <p className="text-sm text-muted-foreground">Primary header with secondary navigation tabs</p>
        </div>

        <Card className="overflow-hidden">
          {/* Primary Header */}
          <div className="border-b border-border bg-background">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-md bg-foreground">
                    <span className="text-sm font-bold text-background">A</span>
                  </div>
                  <span className="font-semibold">Acme</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <span>Project Alpha</span>
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Project Alpha</DropdownMenuItem>
                    <DropdownMenuItem>Project Beta</DropdownMenuItem>
                    <DropdownMenuItem>Project Gamma</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm">
                  <Bell className="size-4" />
                </Button>
                <Avatar className="size-8">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="border-b border-border bg-background px-4">
            <nav className="flex gap-4 -mb-px">
              {[
                { label: "Overview", active: true },
                { label: "Tasks" },
                { label: "Files" },
                { label: "Team" },
                { label: "Activity" },
                { label: "Settings" },
              ].map((item) => (
                <button
                  key={item.label}
                  className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    item.active
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8 bg-muted/30">
            <div className="h-32 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
              Page Content
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
