"use client"

import { useState } from "react"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  Check,
  Minus,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit2,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  icon?: React.ElementType
  type?: "folder" | "file"
  fileType?: "text" | "code" | "image" | "spreadsheet" | "default"
  code?: string
  value?: number
  description?: string
}

interface CheckedState {
  [key: string]: "checked" | "unchecked" | "indeterminate"
}

// ============================================
// Sample Data
// ============================================

const basicTreeData: TreeNode[] = [
  {
    id: "1",
    label: "Documents",
    children: [
      {
        id: "1.1",
        label: "Work",
        children: [
          { id: "1.1.1", label: "Reports" },
          { id: "1.1.2", label: "Presentations" },
          { id: "1.1.3", label: "Spreadsheets" },
        ],
      },
      {
        id: "1.2",
        label: "Personal",
        children: [
          { id: "1.2.1", label: "Photos" },
          { id: "1.2.2", label: "Videos" },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "Downloads",
    children: [
      { id: "2.1", label: "Software" },
      { id: "2.2", label: "Music" },
    ],
  },
  {
    id: "3",
    label: "Projects",
    children: [
      {
        id: "3.1",
        label: "Web Development",
        children: [
          { id: "3.1.1", label: "Frontend" },
          { id: "3.1.2", label: "Backend" },
          { id: "3.1.3", label: "DevOps" },
        ],
      },
    ],
  },
]

const fileTreeData: TreeNode[] = [
  {
    id: "src",
    label: "src",
    type: "folder",
    children: [
      {
        id: "app",
        label: "app",
        type: "folder",
        children: [
          { id: "page.tsx", label: "page.tsx", type: "file", fileType: "code" },
          { id: "layout.tsx", label: "layout.tsx", type: "file", fileType: "code" },
          { id: "globals.css", label: "globals.css", type: "file", fileType: "code" },
        ],
      },
      {
        id: "components",
        label: "components",
        type: "folder",
        children: [
          {
            id: "ui",
            label: "ui",
            type: "folder",
            children: [
              { id: "button.tsx", label: "button.tsx", type: "file", fileType: "code" },
              { id: "card.tsx", label: "card.tsx", type: "file", fileType: "code" },
              { id: "input.tsx", label: "input.tsx", type: "file", fileType: "code" },
            ],
          },
          { id: "header.tsx", label: "header.tsx", type: "file", fileType: "code" },
          { id: "footer.tsx", label: "footer.tsx", type: "file", fileType: "code" },
        ],
      },
      {
        id: "lib",
        label: "lib",
        type: "folder",
        children: [
          { id: "utils.ts", label: "utils.ts", type: "file", fileType: "code" },
        ],
      },
    ],
  },
  {
    id: "public",
    label: "public",
    type: "folder",
    children: [
      { id: "logo.png", label: "logo.png", type: "file", fileType: "image" },
      { id: "favicon.ico", label: "favicon.ico", type: "file", fileType: "image" },
    ],
  },
  { id: "package.json", label: "package.json", type: "file", fileType: "text" },
  { id: "tsconfig.json", label: "tsconfig.json", type: "file", fileType: "text" },
  { id: "README.md", label: "README.md", type: "file", fileType: "text" },
]

const accountPlanData: TreeNode[] = [
  {
    id: "1",
    label: "Ativo",
    code: "1",
    value: 1250000,
    children: [
      {
        id: "1.1",
        label: "Ativo Circulante",
        code: "1.1",
        value: 450000,
        children: [
          { id: "1.1.1", label: "Caixa e Equivalentes", code: "1.1.1", value: 150000 },
          { id: "1.1.2", label: "Contas a Receber", code: "1.1.2", value: 200000 },
          { id: "1.1.3", label: "Estoques", code: "1.1.3", value: 100000 },
        ],
      },
      {
        id: "1.2",
        label: "Ativo Não Circulante",
        code: "1.2",
        value: 800000,
        children: [
          { id: "1.2.1", label: "Imobilizado", code: "1.2.1", value: 600000 },
          { id: "1.2.2", label: "Intangível", code: "1.2.2", value: 200000 },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "Passivo",
    code: "2",
    value: 500000,
    children: [
      {
        id: "2.1",
        label: "Passivo Circulante",
        code: "2.1",
        value: 300000,
        children: [
          { id: "2.1.1", label: "Fornecedores", code: "2.1.1", value: 150000 },
          { id: "2.1.2", label: "Salários a Pagar", code: "2.1.2", value: 80000 },
          { id: "2.1.3", label: "Impostos a Pagar", code: "2.1.3", value: 70000 },
        ],
      },
      {
        id: "2.2",
        label: "Passivo Não Circulante",
        code: "2.2",
        value: 200000,
        children: [
          { id: "2.2.1", label: "Empréstimos LP", code: "2.2.1", value: 200000 },
        ],
      },
    ],
  },
  {
    id: "3",
    label: "Patrimônio Líquido",
    code: "3",
    value: 750000,
    children: [
      { id: "3.1", label: "Capital Social", code: "3.1", value: 500000 },
      { id: "3.2", label: "Reservas", code: "3.2", value: 150000 },
      { id: "3.3", label: "Lucros Acumulados", code: "3.3", value: 100000 },
    ],
  },
]

const organizationData: TreeNode[] = [
  {
    id: "ceo",
    label: "CEO",
    description: "Maria Silva",
    children: [
      {
        id: "cto",
        label: "CTO",
        description: "João Santos",
        children: [
          {
            id: "dev-lead",
            label: "Dev Lead",
            description: "Ana Costa",
            children: [
              { id: "dev-1", label: "Senior Dev", description: "Pedro Lima" },
              { id: "dev-2", label: "Senior Dev", description: "Lucas Rocha" },
              { id: "dev-3", label: "Junior Dev", description: "Carla Dias" },
            ],
          },
          {
            id: "infra-lead",
            label: "Infra Lead",
            description: "Bruno Alves",
            children: [
              { id: "devops-1", label: "DevOps", description: "Marcos Souza" },
            ],
          },
        ],
      },
      {
        id: "cfo",
        label: "CFO",
        description: "Paula Mendes",
        children: [
          { id: "accountant", label: "Contador", description: "Roberto Gomes" },
          { id: "analyst", label: "Analista Financeiro", description: "Fernanda Reis" },
        ],
      },
      {
        id: "cmo",
        label: "CMO",
        description: "Ricardo Nunes",
        children: [
          { id: "marketing-1", label: "Marketing", description: "Julia Ferreira" },
          { id: "design-1", label: "Designer", description: "Thiago Martins" },
        ],
      },
    ],
  },
]

// ============================================
// Helper Functions
// ============================================

function getFileIcon(fileType?: string) {
  switch (fileType) {
    case "code":
      return FileCode
    case "image":
      return FileImage
    case "spreadsheet":
      return FileSpreadsheet
    case "text":
      return FileText
    default:
      return File
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// ============================================
// Basic TreeView
// ============================================

function BasicTreeNode({
  node,
  level = 0,
  expanded,
  onToggle,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <div>
      <button
        onClick={() => hasChildren && onToggle(node.id)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          hasChildren ? "cursor-pointer" : "cursor-default"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <span className="text-foreground">{node.label}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <BasicTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BasicTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "1.1", "3", "3.1"]))

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      {data.map((node) => (
        <BasicTreeNode key={node.id} node={node} expanded={expanded} onToggle={toggleNode} />
      ))}
    </div>
  )
}

// ============================================
// File Explorer TreeView
// ============================================

function FileTreeNode({
  node,
  level = 0,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  selected: string | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}) {
  const isFolder = node.type === "folder"
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selected === node.id
  const FileIcon = isFolder ? (isExpanded ? FolderOpen : Folder) : getFileIcon(node.fileType)

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.id)
          if (isFolder) onToggle(node.id)
        }}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder ? (
          isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <FileIcon
          className={cn(
            "size-4 shrink-0",
            isFolder ? "text-amber-500" : "text-muted-foreground"
          )}
        />
        <span className="truncate text-foreground">{node.label}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileExplorerTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["src", "app", "components"]))
  const [selected, setSelected] = useState<string | null>("page.tsx")

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-6">
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6">
            <MoreHorizontal className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-1">
        {data.map((node) => (
          <FileTreeNode
            key={node.id}
            node={node}
            expanded={expanded}
            selected={selected}
            onToggle={toggleNode}
            onSelect={setSelected}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Checkbox TreeView
// ============================================

function getAllDescendantIds(node: TreeNode): string[] {
  const ids: string[] = [node.id]
  if (node.children) {
    for (const child of node.children) {
      ids.push(...getAllDescendantIds(child))
    }
  }
  return ids
}

function CheckboxTreeNode({
  node,
  level = 0,
  expanded,
  checkedState,
  onToggle,
  onCheck,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  checkedState: CheckedState
  onToggle: (id: string) => void
  onCheck: (id: string, descendants: string[]) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const state = checkedState[node.id] || "unchecked"

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => onToggle(node.id)} className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <button
          onClick={() => onCheck(node.id, getAllDescendantIds(node))}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
            state === "checked"
              ? "border-primary bg-primary text-primary-foreground"
              : state === "indeterminate"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 bg-background"
          )}
        >
          {state === "checked" && <Check className="size-3" />}
          {state === "indeterminate" && <Minus className="size-3" />}
        </button>
        <span className="text-sm text-foreground">{node.label}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <CheckboxTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              checkedState={checkedState}
              onToggle={onToggle}
              onCheck={onCheck}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CheckboxTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "1.1", "2"]))
  const [checkedState, setCheckedState] = useState<CheckedState>({
    "1.1.1": "checked",
    "1.1.2": "checked",
    "1.1": "indeterminate",
    "1": "indeterminate",
  })

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCheck = (id: string, descendants: string[]) => {
    setCheckedState((prev) => {
      const next = { ...prev }
      const currentState = prev[id] || "unchecked"
      const newState = currentState === "checked" ? "unchecked" : "checked"
      
      // Update all descendants
      for (const descId of descendants) {
        next[descId] = newState
      }
      
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      {data.map((node) => (
        <CheckboxTreeNode
          key={node.id}
          node={node}
          expanded={expanded}
          checkedState={checkedState}
          onToggle={toggleNode}
          onCheck={handleCheck}
        />
      ))}
    </div>
  )
}

// ============================================
// Account Plan TreeView
// ============================================

function AccountPlanTreeNode({
  node,
  level = 0,
  expanded,
  onToggle,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isRoot = level === 0

  return (
    <div>
      <button
        onClick={() => hasChildren && onToggle(node.id)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent/50",
          isRoot && "font-medium"
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-4 shrink-0" />
        )}
        <span
          className={cn(
            "min-w-[60px] rounded px-2 py-0.5 text-xs font-mono",
            isRoot
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {node.code}
        </span>
        <span className="flex-1 text-left text-foreground">{node.label}</span>
        {node.value !== undefined && (
          <span
            className={cn(
              "font-mono text-sm tabular-nums",
              isRoot ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {formatCurrency(node.value)}
          </span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <AccountPlanTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountPlanTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "1.1", "2", "2.1", "3"]))

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h4 className="font-semibold text-foreground">Plano de Contas</h4>
          <p className="text-xs text-muted-foreground">Exercício 2024</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">
            <Plus className="mr-1 size-3.5" />
            Nova Conta
          </Button>
        </div>
      </div>
      <div className="p-2">
        {data.map((node) => (
          <AccountPlanTreeNode key={node.id} node={node} expanded={expanded} onToggle={toggleNode} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Organization TreeView
// ============================================

function OrgTreeNode({
  node,
  level = 0,
  expanded,
  onToggle,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <div className="relative">
      {/* Connecting line */}
      {level > 0 && (
        <div
          className="absolute left-0 top-0 h-6 w-px bg-border"
          style={{ left: `${(level - 1) * 32 + 24}px` }}
        />
      )}
      
      <div
        className="relative flex items-center gap-3"
        style={{ paddingLeft: `${level * 32}px` }}
      >
        {level > 0 && (
          <div className="absolute h-px w-4 bg-border" style={{ left: `${(level - 1) * 32 + 24}px` }} />
        )}
        
        <button
          onClick={() => hasChildren && onToggle(node.id)}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm",
            hasChildren && "cursor-pointer"
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {node.label.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">{node.label}</div>
            {node.description && (
              <div className="text-xs text-muted-foreground">{node.description}</div>
            )}
          </div>
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </div>
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children!.map((child, index) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrganizationTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["ceo", "cto", "dev-lead"]))

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground">Organograma</h4>
          <p className="text-xs text-muted-foreground">Estrutura organizacional</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((node) => (
          <OrgTreeNode key={node.id} node={node} expanded={expanded} onToggle={toggleNode} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// Draggable TreeView (Visual Only)
// ============================================

function DraggableTreeNode({
  node,
  level = 0,
  expanded,
  onToggle,
}: {
  node: TreeNode
  level?: number
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-md border border-transparent px-1 py-1 transition-colors hover:border-border hover:bg-accent/30"
        style={{ paddingLeft: `${level * 16 + 4}px` }}
      >
        <GripVertical className="size-4 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        
        {hasChildren ? (
          <button onClick={() => onToggle(node.id)} className="shrink-0 p-0.5">
            {isExpanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        
        <span className="flex-1 text-sm text-foreground">{node.label}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="icon" className="size-6">
            <Edit2 className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6">
            <Copy className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive">
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <DraggableTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DraggableTreeView({ data }: { data: TreeNode[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1", "1.1", "1.2"]))

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="mb-2 flex items-center justify-between border-b border-border px-2 pb-2">
        <span className="text-xs text-muted-foreground">Arraste para reorganizar</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Plus className="mr-1 size-3" />
          Adicionar
        </Button>
      </div>
      {data.map((node) => (
        <DraggableTreeNode key={node.id} node={node} expanded={expanded} onToggle={toggleNode} />
      ))}
    </div>
  )
}

// ============================================
// Main Section Component
// ============================================

export function TreeViewSection() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">TreeView</h1>
        <p className="mt-2 text-muted-foreground">
          Componentes para visualização e interação com estruturas hierárquicas de dados.
        </p>
      </div>

      {/* Basic TreeView */}
      <Card>
        <CardHeader>
          <CardTitle>TreeView Básico</CardTitle>
          <CardDescription>
            Estrutura simples com expand/collapse para navegação hierárquica básica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <BasicTreeView data={basicTreeData} />
          </div>
        </CardContent>
      </Card>

      {/* File Explorer */}
      <Card>
        <CardHeader>
          <CardTitle>Explorador de Arquivos</CardTitle>
          <CardDescription>
            TreeView com ícones específicos para tipos de arquivo, ideal para navegação de projetos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <FileExplorerTreeView data={fileTreeData} />
          </div>
        </CardContent>
      </Card>

      {/* Checkbox TreeView */}
      <Card>
        <CardHeader>
          <CardTitle>TreeView com Seleção</CardTitle>
          <CardDescription>
            Permite seleção múltipla hierárquica com estados indeterminados para nós pai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <CheckboxTreeView data={basicTreeData} />
          </div>
        </CardContent>
      </Card>

      {/* Account Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Contas</CardTitle>
          <CardDescription>
            TreeView otimizado para estruturas contábeis com códigos e valores monetários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl">
            <AccountPlanTreeView data={accountPlanData} />
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Organograma</CardTitle>
          <CardDescription>
            Visualização de estrutura organizacional com cards e conexões visuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationTreeView data={organizationData} />
        </CardContent>
      </Card>

      {/* Draggable TreeView */}
      <Card>
        <CardHeader>
          <CardTitle>TreeView Editável</CardTitle>
          <CardDescription>
            Com opções de edição, duplicação e exclusão em cada nó. Indicador de drag para reorganização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <DraggableTreeView data={basicTreeData} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
