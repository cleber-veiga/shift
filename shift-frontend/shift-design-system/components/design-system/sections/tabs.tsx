"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart2,
  Bell,
  CreditCard,
  FileText,
  Home,
  Lock,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Star,
  User,
  Users,
  Zap,
  TrendingUp,
  Activity,
  Globe,
  Code,
  Layers,
} from "lucide-react"

// ─── Preview wrapper ──────────────────────────────────────────────────────────
function PreviewBlock({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-h-[120px] flex-col items-start justify-start rounded-xl border border-border bg-muted/30 p-6">
        {children}
      </div>
    </div>
  )
}

// ─── 1. Default (shadcn pill) ─────────────────────────────────────────────────
function DefaultTabs() {
  return (
    <PreviewBlock
      title="Default"
      description="Estilo padrao do shadcn/ui com fundo muted e pill ativo."
    >
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </TabsContent>
        <TabsContent value="password" className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Change your password and security settings.
        </TabsContent>
        <TabsContent value="notifications" className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Configure how you receive notifications.
        </TabsContent>
      </Tabs>
    </PreviewBlock>
  )
}

// ─── 2. Underline ─────────────────────────────────────────────────────────────
function UnderlineTabs() {
  const [active, setActive] = useState("overview")
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "reports", label: "Reports" },
    { id: "exports", label: "Exports" },
  ]

  return (
    <PreviewBlock
      title="Underline"
      description="Indicador de linha inferior, limpo e minimalista. Ideal para dashboards e paineis."
    >
      <div className="w-full">
        <div className="flex gap-0 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                active === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {active === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Showing content for: <span className="font-medium text-foreground capitalize">{active}</span>
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 3. Pill / Segmented ──────────────────────────────────────────────────────
function PillTabs() {
  const [active, setActive] = useState("monthly")
  const tabs = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ]

  return (
    <PreviewBlock
      title="Pill / Segmented"
      description="Dois ou poucos estados mutuamente exclusivos. Comum em toggles de periodo."
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="inline-flex rounded-full border border-border bg-muted p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-200",
                active === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {active === "monthly" ? "Planos mensais com flexibilidade de cancelamento." : "Planos anuais com 20% de desconto."}
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 4. With Icons ────────────────────────────────────────────────────────────
function IconTabs() {
  const [active, setActive] = useState("home")
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
  ]

  return (
    <PreviewBlock
      title="Com Icones"
      description="Tabs com icones combinados ao label para melhor escaneabilidade visual."
    >
      <div className="w-full">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                active === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Secao: <span className="font-medium text-foreground capitalize">{active}</span>
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 5. With Badges ───────────────────────────────────────────────────────────
function BadgeTabs() {
  const [active, setActive] = useState("inbox")
  const tabs = [
    { id: "inbox", label: "Inbox", count: 12 },
    { id: "sent", label: "Sent", count: 0 },
    { id: "drafts", label: "Drafts", count: 3 },
    { id: "trash", label: "Trash", count: 0 },
  ]

  return (
    <PreviewBlock
      title="Com Badges / Contadores"
      description="Exibe contagem de itens em cada aba. Ideal para caixas de entrada, notificacoes e filas."
    >
      <div className="w-full">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                active === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
              {active === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {active === "inbox" ? "12 mensagens nao lidas." : `Pasta: ${active}`}
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 6. Vertical ──────────────────────────────────────────────────────────────
function VerticalTabs() {
  const [active, setActive] = useState("profile")
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "billing", label: "Billing", icon: CreditCard },
  ]
  const content: Record<string, string> = {
    profile: "Edite seu nome, avatar e informacoes publicas.",
    security: "Gerencie senhas, 2FA e sessoes ativas.",
    notifications: "Configure e-mail, push e alertas in-app.",
    integrations: "Conecte ferramentas de terceiros.",
    billing: "Visualize faturas, planos e metodos de pagamento.",
  }

  return (
    <PreviewBlock
      title="Vertical"
      description="Navegacao lateral ideal para paginas de configuracoes com varias secoes."
    >
      <div className="flex w-full gap-4">
        <div className="flex w-44 shrink-0 flex-col gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-left transition-colors",
                active === tab.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <tab.icon className="size-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {content[active]}
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 7. Card / Solid ──────────────────────────────────────────────────────────
function CardTabs() {
  const [active, setActive] = useState("performance")
  const tabs = [
    { id: "performance", label: "Performance", icon: TrendingUp },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "global", label: "Global", icon: Globe },
  ]

  return (
    <PreviewBlock
      title="Card / Solid"
      description="Tabs com estilo de cards elevados. Bom para metricas e paineis de dados."
    >
      <div className="w-full space-y-3">
        <div className="flex gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all duration-150",
                active === tab.id
                  ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
              )}
            >
              <tab.icon className="size-5" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Dados de <span className="font-medium text-foreground capitalize">{active}</span> carregados.
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── 8. Full example: Settings Page ─────────────────────────────────────────
function SettingsTabsExample() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Exemplo Completo — Pagina de Configuracoes</h3>
        <p className="text-sm text-muted-foreground">Tabs verticais com conteudo rico, ideal para paginas de settings de produto SaaS.</p>
      </div>
      <Tabs defaultValue="general" className="flex w-full flex-col gap-0 md:flex-row md:gap-8">
        <TabsList className="flex h-auto w-full flex-row gap-1 rounded-xl bg-muted p-1 md:w-52 md:flex-col md:items-start">
          {[
            { value: "general", label: "General", icon: Settings },
            { value: "team", label: "Team", icon: Users },
            { value: "plans", label: "Plans", icon: Package },
            { value: "security", label: "Security", icon: ShieldCheck },
            { value: "api", label: "API", icon: Code },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="w-full justify-start gap-2 data-[state=active]:bg-background"
            >
              <tab.icon className="size-4 shrink-0" />
              <span className="hidden md:block">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure as preferencias gerais do seu workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">Workspace Name</div>
                    <div className="text-xs text-muted-foreground">Exibido em todas as notificacoes</div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">Timezone</div>
                    <div className="text-xs text-muted-foreground">America/Sao_Paulo (UTC-3)</div>
                  </div>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Gerencie quem tem acesso ao workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Ana Lima", role: "Admin", email: "ana@example.com" },
                    { name: "Carlos Melo", role: "Editor", email: "carlos@example.com" },
                    { name: "Priya Sharma", role: "Viewer", email: "priya@example.com" },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Voce esta no plano Pro. Proximo ciclo em 15/05/2025.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { feature: "Componentes ilimitados", included: true },
                  { feature: "Exportacao de codigo", included: true },
                  { feature: "Acesso multi-usuario", included: true },
                  { feature: "Suporte prioritario", included: false },
                ].map((item) => (
                  <div key={item.feature} className="flex items-center gap-3 text-sm">
                    <Star className={cn("size-4 shrink-0", item.included ? "text-primary" : "text-muted-foreground")} />
                    <span className={item.included ? "text-foreground" : "text-muted-foreground line-through"}>
                      {item.feature}
                    </span>
                  </div>
                ))}
                <Button className="mt-2 w-full">Upgrade para Enterprise</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Controle o acesso e proteja sua conta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">Two-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground">Adicione uma camada extra de seguranca</div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">Sessoes ativas</div>
                    <div className="text-xs text-muted-foreground">3 dispositivos conectados</div>
                  </div>
                  <Button variant="outline" size="sm">Revogar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Gerencie as chaves de acesso a API.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                  sk_live_••••••••••••••••••••••••3f9a
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Copiar</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">Revogar</Button>
                </div>
                <Button size="sm" className="w-full">Gerar nova chave</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// ─── 9. Tabs with content transition ─────────────────────────────────────────
function StepTabs() {
  const [active, setActive] = useState(0)
  const steps = [
    { label: "Conta", icon: User, content: "Preencha seus dados basicos para criar a conta." },
    { label: "Plano", icon: Package, content: "Escolha o plano que melhor se adequa ao seu uso." },
    { label: "Pagamento", icon: CreditCard, content: "Adicione um metodo de pagamento seguro." },
    { label: "Revisao", icon: FileText, content: "Confirme todos os dados antes de finalizar." },
  ]

  return (
    <PreviewBlock
      title="Steps / Wizard"
      description="Tabs em formato de etapas sequenciais. Ideal para formularios multi-step e onboarding."
    >
      <div className="w-full space-y-4">
        <div className="flex items-center gap-0 w-full">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center">
              <button
                onClick={() => setActive(i)}
                className={cn(
                  "flex flex-col items-center gap-1.5 w-full group"
                )}
              >
                <div className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200",
                  i < active
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground"
                )}>
                  {i < active ? (
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <step.icon className="size-4" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  i === active ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-colors duration-300 mb-5",
                  i < active ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {steps[active].content}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" disabled={active === 0} onClick={() => setActive(a => a - 1)}>Voltar</Button>
          <Button size="sm" disabled={active === steps.length - 1} onClick={() => setActive(a => a + 1)}>
            {active === steps.length - 1 ? "Finalizar" : "Continuar"}
          </Button>
        </div>
      </div>
    </PreviewBlock>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function TabsSection() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="size-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Tabs</h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
          Componentes de navegacao por abas em diferentes estilos — do simples ao complexo.
          Escolha o modelo que melhor se encaixa ao contexto de uso: dashboards, configuracoes, onboarding ou filtros.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {["radix-ui", "shadcn/ui", "acessivel", "controlado", "nao-controlado"].map((tag) => (
            <Badge key={tag} variant="secondary" className="font-mono text-xs">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* Grid of variants */}
      <div className="space-y-10">
        <div>
          <h2 className="mb-6 text-lg font-semibold text-foreground border-b border-border pb-3">Estilos Base</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <DefaultTabs />
            <UnderlineTabs />
            <PillTabs />
            <IconTabs />
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-lg font-semibold text-foreground border-b border-border pb-3">Variantes com Dados</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <BadgeTabs />
            <CardTabs />
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-lg font-semibold text-foreground border-b border-border pb-3">Layouts Estruturais</h2>
          <div className="grid gap-8">
            <VerticalTabs />
            <StepTabs />
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-lg font-semibold text-foreground border-b border-border pb-3">Exemplo Completo</h2>
          <SettingsTabsExample />
        </div>
      </div>
    </div>
  )
}
