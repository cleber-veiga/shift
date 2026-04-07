"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  GitBranch, 
  Terminal, 
  FolderOpen, 
  Play, 
  Check, 
  Copy, 
  ExternalLink,
  Package,
  Zap,
  FileCode,
  FileText,
  Folder,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Code block component with copy functionality
function CodeBlock({ 
  code, 
  language = "bash",
  filename,
}: { 
  code: string
  language?: string 
  filename?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-muted/50">
      {filename && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/80 px-4 py-2">
          <FileCode className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">{filename}</span>
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={`language-${language} text-foreground`}>{code}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4 text-emerald-500" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// Step component
function Step({ 
  number, 
  title, 
  description, 
  children,
  completed = false,
}: { 
  number: number
  title: string
  description?: string
  children: React.ReactNode
  completed?: boolean
}) {
  return (
    <div className="relative flex gap-6">
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
          completed 
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
            : "border-border bg-muted text-muted-foreground"
        )}>
          {completed ? <Check className="size-5" /> : number}
        </div>
        <div className="mt-2 h-full w-px bg-border" />
      </div>

      {/* Step content */}
      <div className="flex-1 pb-12">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

// File tree component
function FileTree() {
  const structure = [
    { name: "app", type: "folder", children: [
      { name: "globals.css", type: "file" },
      { name: "layout.tsx", type: "file" },
      { name: "page.tsx", type: "file" },
      { name: "pages", type: "folder", children: [
        { name: "login", type: "folder" },
        { name: "register", type: "folder" },
      ]},
    ]},
    { name: "components", type: "folder", children: [
      { name: "ui", type: "folder" },
      { name: "design-system", type: "folder" },
    ]},
    { name: "lib", type: "folder", children: [
      { name: "utils.ts", type: "file" },
    ]},
    { name: "public", type: "folder" },
    { name: "package.json", type: "file" },
    { name: "tailwind.config.ts", type: "file" },
    { name: "tsconfig.json", type: "file" },
  ]

  const renderItem = (item: { name: string; type: string; children?: any[] }, depth = 0) => (
    <div key={item.name} style={{ paddingLeft: `${depth * 16}px` }}>
      <div className="flex items-center gap-2 py-1 text-sm">
        {item.type === "folder" ? (
          <>
            <Folder className="size-4 text-amber-500" />
            <span className="font-medium text-foreground">{item.name}</span>
          </>
        ) : (
          <>
            <FileCode className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{item.name}</span>
          </>
        )}
      </div>
      {item.children?.map((child) => renderItem(child, depth + 1))}
    </div>
  )

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      {structure.map((item) => renderItem(item))}
    </div>
  )
}

// Requirements list
function RequirementsList() {
  const requirements = [
    { name: "Node.js", version: "18.17 ou superior", icon: "nodejs" },
    { name: "pnpm", version: "8.0 ou superior (recomendado)", icon: "pnpm" },
    { name: "npm", version: "9.0 ou superior (alternativa)", icon: "npm" },
    { name: "Git", version: "2.30 ou superior", icon: "git" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {requirements.map((req) => (
        <div 
          key={req.name}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Package className="size-5 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium text-foreground">{req.name}</div>
            <div className="text-xs text-muted-foreground">{req.version}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function GettingStartedSection() {
  const [downloadMethod, setDownloadMethod] = useState<"zip" | "git">("git")

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="secondary" className="mb-4">
          Guia de Instalacao
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Getting Started
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Aprenda como baixar, configurar e executar o Design System localmente em sua maquina.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Download className="size-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary">
                Download ZIP
              </div>
              <div className="text-xs text-muted-foreground">Baixar arquivo compactado</div>
            </div>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="size-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary">
                Clone via Git
              </div>
              <div className="text-xs text-muted-foreground">Clonar repositorio</div>
            </div>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="size-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary">
                Deploy Vercel
              </div>
              <div className="text-xs text-muted-foreground">Deploy em 1 clique</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Pre-requisitos
          </CardTitle>
          <CardDescription>
            Certifique-se de ter as seguintes ferramentas instaladas antes de comecar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequirementsList />

          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Zap className="size-5 text-amber-500" />
              </div>
              <div>
                <div className="font-medium text-foreground">Dica</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recomendamos o uso do <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">pnpm</code> como 
                  gerenciador de pacotes por ser mais rapido e eficiente em espaco de disco.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Escolha o metodo de download</CardTitle>
          <CardDescription>
            Selecione como voce prefere obter o codigo fonte do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button
              onClick={() => setDownloadMethod("git")}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                downloadMethod === "git"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <GitBranch className={cn(
                "size-6",
                downloadMethod === "git" ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="text-left">
                <div className={cn(
                  "font-semibold",
                  downloadMethod === "git" ? "text-primary" : "text-foreground"
                )}>
                  Clone via Git
                </div>
                <div className="text-xs text-muted-foreground">Recomendado para desenvolvimento</div>
              </div>
              {downloadMethod === "git" && (
                <CheckCircle2 className="ml-auto size-5 text-primary" />
              )}
            </button>

            <button
              onClick={() => setDownloadMethod("zip")}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg border-2 p-4 transition-colors",
                downloadMethod === "zip"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <Download className={cn(
                "size-6",
                downloadMethod === "zip" ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="text-left">
                <div className={cn(
                  "font-semibold",
                  downloadMethod === "zip" ? "text-primary" : "text-foreground"
                )}>
                  Download ZIP
                </div>
                <div className="text-xs text-muted-foreground">Download direto sem Git</div>
              </div>
              {downloadMethod === "zip" && (
                <CheckCircle2 className="ml-auto size-5 text-primary" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            Passo a passo da instalacao
          </CardTitle>
          <CardDescription>
            Siga os passos abaixo para configurar o projeto em sua maquina local.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {downloadMethod === "git" ? (
            <div className="space-y-2">
              <Step number={1} title="Clone o repositorio">
                <p className="mb-4 text-sm text-muted-foreground">
                  Abra o terminal e execute o comando abaixo para clonar o repositorio:
                </p>
                <CodeBlock 
                  code="git clone https://github.com/seu-usuario/acme-design-system.git"
                  language="bash"
                />
              </Step>

              <Step number={2} title="Acesse a pasta do projeto">
                <p className="mb-4 text-sm text-muted-foreground">
                  Navegue ate o diretorio do projeto clonado:
                </p>
                <CodeBlock 
                  code="cd acme-design-system"
                  language="bash"
                />
              </Step>

              <Step number={3} title="Instale as dependencias">
                <p className="mb-4 text-sm text-muted-foreground">
                  Execute o comando abaixo para instalar todas as dependencias do projeto:
                </p>
                <div className="space-y-3">
                  <CodeBlock 
                    code="# Usando pnpm (recomendado)
pnpm install

# Ou usando npm
npm install

# Ou usando yarn
yarn install"
                    language="bash"
                  />
                </div>
              </Step>

              <Step number={4} title="Inicie o servidor de desenvolvimento">
                <p className="mb-4 text-sm text-muted-foreground">
                  Execute o comando abaixo para iniciar o servidor local:
                </p>
                <CodeBlock 
                  code="pnpm dev"
                  language="bash"
                />
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />
                    <div>
                      <div className="font-medium text-foreground">Pronto!</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        O projeto estara disponivel em{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          http://localhost:3000
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </Step>
            </div>
          ) : (
            <div className="space-y-2">
              <Step number={1} title="Baixe o arquivo ZIP">
                <p className="mb-4 text-sm text-muted-foreground">
                  Clique no botao abaixo ou acesse o repositorio no GitHub e clique em 
                  <strong> Code &gt; Download ZIP</strong>.
                </p>
                <Button className="gap-2">
                  <Download className="size-4" />
                  Baixar ZIP
                  <ExternalLink className="ml-1 size-3" />
                </Button>
              </Step>

              <Step number={2} title="Extraia o arquivo">
                <p className="mb-4 text-sm text-muted-foreground">
                  Extraia o conteudo do arquivo ZIP para uma pasta de sua preferencia.
                </p>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <FolderOpen className="size-8 text-amber-500" />
                  <div>
                    <div className="font-medium text-foreground">acme-design-system-main</div>
                    <div className="text-xs text-muted-foreground">Pasta extraida</div>
                  </div>
                </div>
              </Step>

              <Step number={3} title="Abra o terminal na pasta do projeto">
                <p className="mb-4 text-sm text-muted-foreground">
                  Navegue ate a pasta extraida usando o terminal:
                </p>
                <CodeBlock 
                  code="cd ~/Downloads/acme-design-system-main"
                  language="bash"
                />
              </Step>

              <Step number={4} title="Instale as dependencias">
                <p className="mb-4 text-sm text-muted-foreground">
                  Execute o comando abaixo para instalar todas as dependencias:
                </p>
                <CodeBlock 
                  code="pnpm install"
                  language="bash"
                />
              </Step>

              <Step number={5} title="Inicie o servidor de desenvolvimento">
                <p className="mb-4 text-sm text-muted-foreground">
                  Execute o comando abaixo para iniciar o servidor local:
                </p>
                <CodeBlock 
                  code="pnpm dev"
                  language="bash"
                />
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />
                    <div>
                      <div className="font-medium text-foreground">Pronto!</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        O projeto estara disponivel em{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          http://localhost:3000
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </Step>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="size-5" />
            Estrutura do Projeto
          </CardTitle>
          <CardDescription>
            Visao geral da organizacao de arquivos e pastas do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileTree />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-amber-500" />
                <span className="font-medium text-foreground">app/</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Rotas e paginas da aplicacao usando o App Router do Next.js.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-amber-500" />
                <span className="font-medium text-foreground">components/</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Componentes reutilizaveis, incluindo UI base e design system.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-amber-500" />
                <span className="font-medium text-foreground">lib/</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Funcoes utilitarias e configuracoes compartilhadas.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Folder className="size-4 text-amber-500" />
                <span className="font-medium text-foreground">public/</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Arquivos estaticos como imagens, fontes e icones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            Comandos Uteis
          </CardTitle>
          <CardDescription>
            Referencia rapida dos principais comandos do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm dev</code>
                <p className="mt-1 text-sm text-muted-foreground">Inicia o servidor de desenvolvimento</p>
              </div>
              <Badge variant="secondary">Desenvolvimento</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm build</code>
                <p className="mt-1 text-sm text-muted-foreground">Gera a versao de producao</p>
              </div>
              <Badge variant="secondary">Build</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm start</code>
                <p className="mt-1 text-sm text-muted-foreground">Inicia o servidor de producao</p>
              </div>
              <Badge variant="secondary">Producao</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <code className="rounded bg-muted px-2 py-1 text-sm font-mono">pnpm lint</code>
                <p className="mt-1 text-sm text-muted-foreground">Executa o linter para verificar erros</p>
              </div>
              <Badge variant="secondary">Qualidade</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM Reference Download */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <CardTitle>Referencia para LLMs</CardTitle>
          </div>
          <CardDescription>
            Baixe o arquivo Markdown com a documentacao completa do Design System. 
            Ideal para fornecer contexto a LLMs sobre todos os componentes, tokens e padroes disponiveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">DESIGN-SYSTEM.md</div>
              <div className="text-xs text-muted-foreground">
                Documentacao completa: tokens, componentes, patterns, exemplos de uso
              </div>
            </div>
            <a 
              href="/DESIGN-SYSTEM.md" 
              download="DESIGN-SYSTEM.md"
              className="inline-flex"
            >
              <Button className="gap-2">
                <Download className="size-4" />
                Download Markdown
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Proximos passos</CardTitle>
          <CardDescription>
            Agora que o projeto esta configurado, explore os recursos disponiveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-primary/5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FileCode className="size-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground group-hover:text-primary">
                  Explorar Components
                </div>
                <div className="text-sm text-muted-foreground">
                  Conheca todos os componentes disponiveis
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary" />
            </div>

            <div className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-primary/5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Zap className="size-5 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground group-hover:text-primary">
                  Ver Patterns
                </div>
                <div className="text-sm text-muted-foreground">
                  Layouts e padroes prontos para uso
                </div>
              </div>
              <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
