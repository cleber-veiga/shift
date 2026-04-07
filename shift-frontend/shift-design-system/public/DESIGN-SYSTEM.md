# Acme Design System - Referencia Completa para LLMs

Este documento serve como referencia completa do Design System para que LLMs possam entender rapidamente toda a estrutura disponivel sem precisar explorar o codigo.

---

## Visao Geral

- **Framework**: Next.js 16 (App Router)
- **Estilizacao**: Tailwind CSS v4 + shadcn/ui
- **Temas**: Light e Dark (via next-themes)
- **Tipografia**: Geist Sans + Geist Mono
- **Icones**: Lucide React

---

## Estrutura de Pastas

```
/app
  /globals.css          # Tokens de design (cores, tipografia, radius)
  /layout.tsx           # Layout raiz com ThemeProvider
  /page.tsx             # Pagina principal do Design System
  /pages
    /login/page.tsx     # Pagina de Login standalone
    /register/page.tsx  # Pagina de Registro standalone
    /reset-password/page.tsx  # Pagina de Reset Password standalone

/components
  /ui/*                 # Componentes base shadcn/ui (button, card, input, etc.)
  /theme-provider.tsx   # Provider de tema (next-themes)
  /design-system
    /header.tsx         # Header do Design System com toggle de tema
    /sidebar.tsx        # Sidebar de navegacao do Design System
    /sections           # Todas as secoes do Design System
```

---

## Design Tokens

### Cores Semanticas

| Token | Uso | Light | Dark |
|-------|-----|-------|------|
| `background` | Fundo da pagina | oklch(0.985 0 0) | oklch(0.098 0 0) |
| `foreground` | Texto principal | oklch(0.145 0 0) | oklch(0.985 0 0) |
| `card` | Fundo de cards | oklch(1 0 0) | oklch(0.13 0 0) |
| `primary` | Acoes principais | oklch(0.145 0 0) | oklch(0.985 0 0) |
| `secondary` | Acoes secundarias | oklch(0.95 0 0) | oklch(0.2 0 0) |
| `muted` | Elementos sutis | oklch(0.96 0 0) | oklch(0.18 0 0) |
| `accent` | Destaques | oklch(0.94 0 0) | oklch(0.22 0 0) |
| `destructive` | Erros/Exclusao | oklch(0.55 0.22 27) | oklch(0.55 0.22 27) |
| `success` | Sucesso | oklch(0.55 0.2 145) | oklch(0.65 0.2 145) |
| `warning` | Alertas | oklch(0.7 0.18 80) | oklch(0.75 0.18 80) |
| `info` | Informacoes | oklch(0.55 0.18 250) | oklch(0.65 0.18 250) |
| `border` | Bordas | oklch(0.9 0 0) | oklch(0.25 0 0) |

### Cores de Graficos

| Token | Uso |
|-------|-----|
| `chart-1` | Cor primaria de graficos (roxo) |
| `chart-2` | Cor secundaria (ciano) |
| `chart-3` | Cor terciaria (amarelo) |
| `chart-4` | Cor quaternaria (vermelho) |
| `chart-5` | Cor quinaria (verde) |

### Radius

| Token | Valor |
|-------|-------|
| `radius-sm` | calc(0.5rem - 4px) |
| `radius-md` | calc(0.5rem - 2px) |
| `radius-lg` | 0.5rem |
| `radius-xl` | calc(0.5rem + 4px) |

---

## Secoes Disponiveis

### Foundations (Fundamentos)

#### 1. Introduction (`intro`)
- Visao geral do Design System
- Cards de features disponiveis
- Arquivo: `sections/intro.tsx`

#### 2. Getting Started (`getting-started`)
- Guia de instalacao (ZIP ou Git clone)
- Pre-requisitos (Node.js, pnpm)
- Comandos de desenvolvimento
- Estrutura de pastas
- Arquivo: `sections/getting-started.tsx`

#### 3. Colors (`colors`)
- Paleta de cores semanticas
- Comparacao Light vs Dark
- Cores de status (success, warning, error, info)
- Cores de graficos
- Arquivo: `sections/colors.tsx`

#### 4. Typography (`typography`)
- Escala tipografica (xs a 6xl)
- Pesos de fonte (thin a black)
- Font families (Geist Sans, Geist Mono)
- Arquivo: `sections/typography.tsx`

---

### Components (Componentes)

#### 5. Buttons (`buttons`)
**Variantes:**
- `default` - Botao primario (bg-primary)
- `secondary` - Botao secundario (bg-secondary)
- `outline` - Apenas borda
- `ghost` - Transparente com hover
- `destructive` - Acoes destrutivas (vermelho)
- `link` - Estilo de link

**Tamanhos:** `sm`, `default`, `lg`, `icon`

**Estados:** loading (com Spinner), disabled, com icones

**Arquivo:** `sections/buttons.tsx`

#### 6. Cards (`cards`)
**Tipos:**
- Card basico (CardHeader, CardContent, CardFooter)
- Card com acoes
- Stats Card (metricas com variacao)
- Feature Card (icone + titulo + descricao)
- User Card (avatar + info)

**Arquivo:** `sections/cards.tsx`

#### 7. Grids (`grids`)
**Layouts:**
- Grid basico (1-6 colunas)
- Grid responsivo (md:grid-cols-2, lg:grid-cols-3)
- Auto-fit grid
- Bento grid (spans assimetricos)
- Gap scales (gap-1 a gap-8)

**Arquivo:** `sections/grids.tsx`

#### 8. Forms (`forms`)
**Elementos:**
- Input (text, email, password, search)
- InputGroup (com icones/addons)
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Slider
- Field + FieldLabel (layout de formulario)

**Arquivo:** `sections/forms.tsx`

#### 9. Badges & Tags (`badges`)
**Variantes:**
- `default`, `secondary`, `outline`, `destructive`
- Status badges (success, warning, error)
- Com icones
- Pills (rounded-full)

**Arquivo:** `sections/badges.tsx`

#### 10. Tables (`tables`)
**Tipos:**
- Tabela basica
- Com selecao (checkboxes)
- Sortable (cabecalho clicavel)
- Empty state

**Arquivo:** `sections/tables.tsx`

#### 11. Data Tables (`datatables`)
**Features:**
- Busca/filtro
- Ordenacao por coluna
- Paginacao
- Selecao em massa
- Acoes por linha
- Export

**Arquivo:** `sections/datatables.tsx`

#### 12. Charts (`charts`)
**Tipos (usando Recharts):**
- Area Chart (simples e stacked)
- Line Chart (multi-series, stepped)
- Bar Chart (vertical, horizontal, stacked, grouped)
- Pie Chart e Donut
- Radar Chart
- Radial Bar (gauge)
- Scatter Plot
- Composed Chart

**Importante:** Nao usar CSS variables para cores em Recharts. Passar cores como valores JavaScript.

**Arquivo:** `sections/charts.tsx`

#### 13. TreeView (`treeview`)
**Tipos:**
- Basico (expand/collapse)
- File Explorer (com icones de tipo de arquivo)
- Com Checkboxes (selecao hierarquica)
- Plano de Contas (codigos numericos + valores)
- Organograma (estrutura organizacional)
- Editavel (com acoes drag/edit/delete)

**Arquivo:** `sections/treeview.tsx`

#### 14. Navigation (`navigation`)
**Elementos:**
- Tabs (default, pills, underline)
- Breadcrumbs
- Pagination
- Dropdown Menu

**Arquivo:** `sections/navigation.tsx`

#### 15. Feedback (`feedback`)
**Tipos:**
- Alerts (info, success, warning, error)
- Progress bars
- Spinners
- Skeletons
- Empty States
- Toasts

**Arquivo:** `sections/feedback.tsx`

---

### Patterns (Padroes)

#### 16. Authentication (`authentication`)
**Formularios:**
- Login simples
- Login com social (Google, GitHub, Apple)
- Registro com validacao de senha
- Forgot Password
- Reset Password (com OTP)
- Two-Factor Authentication
- Magic Link

**Arquivo:** `sections/authentication.tsx`

#### 17. Sidebars (`sidebars`)
**Modelos:**
- Simples (icone + label)
- Com badges/contadores
- Com grupos colapsaveis
- Com perfil de usuario
- Compacta (apenas icones)
- Double sidebar (icones + contextual)

**Arquivo:** `sections/sidebars.tsx`

#### 18. Top Bars (`topbars`)
**Variacoes:**
- Header simples
- Com busca integrada
- Com workspace switcher
- Com breadcrumbs
- Header completo
- Com banner de anuncio
- Com sub-navegacao

**Arquivo:** `sections/topbars.tsx`

#### 19. Layouts (`layouts`)
**Destaque: Dashboard Layout**
- Sidebar integrada ao fundo
- Area de conteudo flutuante com efeito de fumaca/gradiente
- TopBar com toggle de sidebar e menu de usuario
- Cards com gradiente sutil e box-shadow
- Tema dark otimizado

**Efeito de fumaca (dark theme):**
```css
background: linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(20,20,20,1) 50%, rgba(15,15,15,1) 100%);
/* Overlay de fumaca */
background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(60,60,60,0.3) 0%, transparent 60%);
```

**Arquivo:** `sections/layouts.tsx`

---

### Pages (Paginas Standalone)

#### Login (`/pages/login`)
- Formulario de email/senha
- Social login (Google, GitHub)
- Link para recuperacao de senha
- Link para registro
- **Arquivo:** `app/pages/login/page.tsx`

#### Register (`/pages/register`)
- Campos: nome, email, senha, confirmar senha
- Indicador de forca da senha
- Checklist de requisitos
- Social signup
- **Arquivo:** `app/pages/register/page.tsx`

#### Reset Password (`/pages/reset-password`)
- Fluxo de 4 etapas:
  1. Inserir email
  2. Verificar codigo OTP
  3. Definir nova senha
  4. Confirmacao de sucesso
- **Arquivo:** `app/pages/reset-password/page.tsx`

---

## Componentes UI Base (shadcn/ui)

Localizados em `/components/ui/`:

| Componente | Uso |
|------------|-----|
| `Button` | Botoes com variantes |
| `Card` | Container com header/content/footer |
| `Input` | Campos de texto |
| `Label` | Labels de formulario |
| `Badge` | Tags e status |
| `Avatar` | Imagens de perfil |
| `Checkbox` | Selecao multipla |
| `Radio` | Selecao unica |
| `Switch` | Toggle on/off |
| `Select` | Dropdown de selecao |
| `Tabs` | Navegacao em abas |
| `Table` | Tabelas de dados |
| `Progress` | Barras de progresso |
| `Slider` | Controle deslizante |
| `Alert` | Mensagens de alerta |
| `Spinner` | Indicador de loading |
| `Skeleton` | Placeholder de loading |
| `Empty` | Estados vazios |
| `Field` | Layout de campo de formulario |
| `InputGroup` | Input com icones/addons |
| `Kbd` | Teclas de atalho |
| `DropdownMenu` | Menus contextuais |

---

## Padroes de Uso

### Importar componente UI
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

### Usar design tokens
```tsx
// Tailwind classes que usam tokens
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
<div className="text-muted-foreground" />
<Button variant="destructive" />
```

### Toggle de tema
```tsx
import { useTheme } from "next-themes"

const { theme, setTheme } = useTheme()
setTheme("light") // ou "dark" ou "system"
```

### Layout com sidebar flutuante (dark)
```tsx
<div className="flex min-h-screen bg-background">
  <aside className="w-64 bg-transparent">
    {/* Sidebar content */}
  </aside>
  <main 
    className="flex-1 mt-2 rounded-tl-3xl"
    style={{
      background: "linear-gradient(135deg, rgba(30,30,30,1) 0%, rgba(15,15,15,1) 100%)",
      boxShadow: "-20px 0 60px rgba(0,0,0,0.5)"
    }}
  >
    {/* Main content */}
  </main>
</div>
```

### Badge com glow (neon effect)
```tsx
<span className="flex items-center gap-1">
  <span
    className="size-[7px] rounded-full bg-emerald-400"
    style={{ boxShadow: "0 0 6px 2px rgba(52,211,153,0.7)" }}
  />
  <span
    className="text-xs font-semibold text-emerald-400"
    style={{ textShadow: "0 0 8px rgba(52,211,153,0.8)" }}
  >
    3
  </span>
</span>
```

---

## Comandos

```bash
pnpm install     # Instalar dependencias
pnpm dev         # Servidor de desenvolvimento
pnpm build       # Build de producao
pnpm start       # Iniciar build de producao
pnpm lint        # Verificar codigo
```

---

## Notas para LLMs

1. **Sempre usar tokens semanticos** (`bg-background`, `text-foreground`, etc.) em vez de cores hardcoded
2. **Charts**: Passar cores como valores JavaScript, nao CSS variables
3. **Dark theme**: Usar `dark:` prefix ou verificar tema via `useTheme()`
4. **Formularios**: Usar `Field` + `FieldLabel` para layout, `InputGroup` para inputs com icones
5. **Estados vazios**: Usar componente `Empty` com `EmptyMedia`, `EmptyTitle`, `EmptyDescription`
6. **Loading**: Usar `Spinner` para botoes, `Skeleton` para conteudo

---

*Documento atualizado para servir como referencia rapida. Para detalhes de implementacao, consulte os arquivos de secao correspondentes.*
