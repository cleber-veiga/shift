"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type DragEvent,
} from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import {
  Clock3,
  Copy,
  Crosshair,
  Database,
  Download,
  FileInput,
  Globe,
  Plus,
  Upload,
  Webhook,
  X,
} from "lucide-react"
import { extractionNodeTypes } from "@/components/workflow/extraction/nodes"
import { useExtractionWorkflow } from "@/components/workflow/extraction/hooks/use-extraction-workflow"
import { ExtractionNodeConfigPanel } from "@/components/workflow/extraction/config/extraction-node-config-panel"
import type { ExtractionNodeSubType } from "@/lib/workflow/extraction/types"
import "@xyflow/react/dist/style.css"

const EXTRACTION_TEMPLATES: Array<{
  id: ExtractionNodeSubType
  label: string
  category: "inputs" | "triggers"
  icon: ComponentType<{ className?: string }>
}> = [
  { id: "database", label: "Database Input", category: "inputs", icon: Database },
  { id: "file", label: "File Input", category: "inputs", icon: FileInput },
  { id: "http", label: "HTTP Request", category: "inputs", icon: Globe },
  { id: "webhook", label: "Webhook Trigger", category: "triggers", icon: Webhook },
  { id: "schedule", label: "Schedule Trigger", category: "triggers", icon: Clock3 },
]

function WorkflowCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const libraryRef = useRef<HTMLElement | null>(null)
  const libraryToggleRef = useRef<HTMLButtonElement | null>(null)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const {
    workflowNodes,
    reactFlowNodes,
    workflowEdges,
    selectedNode,
    setSelectedNodeId,
    addNode,
    cloneNode,
    updateNodeConfig,
    updateNodeLabel,
    runNodeTest,
    onNodesChange,
    onEdgesChange,
    onConnect,
    exportWorkflow,
    importWorkflow,
    exportSelectedNodeConfig,
    importSelectedNodeConfig,
  } = useExtractionWorkflow()

  const reactFlowEdges = useMemo(() => workflowEdges, [workflowEdges])

  const groupedTemplates = useMemo(
    () => ({
      inputs: EXTRACTION_TEMPLATES.filter((template) => template.category === "inputs"),
      triggers: EXTRACTION_TEMPLATES.filter((template) => template.category === "triggers"),
    }),
    []
  )

  useEffect(() => {
    if (!libraryOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      if (libraryRef.current?.contains(target)) return
      if (libraryToggleRef.current?.contains(target)) return
      setLibraryOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [libraryOpen])

  useEffect(() => {
    if (workflowNodes.length === 0) return
    const frame = window.requestAnimationFrame(() => {
      fitView({ duration: 240, padding: 0.22 })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [fitView, workflowNodes.length])

  const createNodeFromPalette = (subType: ExtractionNodeSubType) => {
    const bounds = canvasRef.current?.getBoundingClientRect()
    const center = bounds
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const position = screenToFlowPosition(center)
    addNode(subType, { x: position.x - 110, y: position.y - 40 })
    setLibraryOpen(false)
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => fitView({ duration: 240, padding: 0.22 })))
  }

  const handleTemplateDragStart = (event: DragEvent<HTMLButtonElement>, subType: ExtractionNodeSubType) => {
    event.dataTransfer.setData("application/x-shift-node", subType)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleFlowDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  const handleFlowDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedSubType = event.dataTransfer.getData("application/x-shift-node") as ExtractionNodeSubType
    if (!EXTRACTION_TEMPLATES.some((template) => template.id === droppedSubType)) return

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    addNode(droppedSubType, { x: position.x - 110, y: position.y - 40 })
    setLibraryOpen(false)
    window.requestAnimationFrame(() => {
      fitView({ duration: 240, padding: 0.22 })
    })
  }

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleExportWorkflow = () => {
    downloadTextFile("workflow-extraction.json", exportWorkflow())
  }

  const handleExportNodeConfig = () => {
    const config = exportSelectedNodeConfig()
    if (!config) return
    downloadTextFile("node-config.json", config)
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()

    try {
      const parsed = JSON.parse(text) as { nodes?: unknown; edges?: unknown }
      if (parsed.nodes && parsed.edges) {
        importWorkflow(text)
      } else {
        importSelectedNodeConfig(text)
      }
    } catch {
      // arquivo inválido
    } finally {
      event.target.value = ""
    }
  }

  return (
    <section className="relative h-[calc(100vh-48px)] min-h-[680px] overflow-hidden bg-background">
      <div
        ref={canvasRef}
        className="absolute inset-0"
        onDragOver={handleFlowDragOver}
        onDrop={handleFlowDrop}
      >
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={extractionNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onNodeDoubleClick={(_, node) => {
            setSelectedNodeId(node.id)
            setConfigModalOpen(true)
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="hsl(var(--border))" />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </div>

      {workflowNodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="pointer-events-auto rounded-xl border-2 border-dashed border-border bg-card px-6 py-5 text-center transition-colors hover:border-primary/50"
          >
            <div className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Plus className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Adicionar primeiro nó</p>
          </button>
        </div>
      ) : null}

      <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => fitView({ duration: 250 })}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent"
          title="Centralizar"
        >
          <Crosshair className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleExportWorkflow}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent"
          title="Exportar workflow"
        >
          <Download className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent"
          title="Importar"
        >
          <Upload className="size-4" />
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      <div className="absolute right-3 top-3 z-20">
        <button
          ref={libraryToggleRef}
          type="button"
          onClick={() => setLibraryOpen((current) => !current)}
          className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent"
          title="Adicionar nó"
        >
          {libraryOpen ? <X className="size-4" /> : <Plus className="size-4" />}
        </button>
      </div>

      {libraryOpen ? (
        <aside
          ref={libraryRef}
          className="absolute bottom-0 right-0 top-0 z-20 w-[320px] border-l border-border bg-card p-4"
        >
          <div className="mb-3">
            <p className="text-sm font-semibold text-foreground">Biblioteca de nós</p>
            <p className="text-[11px] text-muted-foreground">Duplo clique em um nó para abrir configuração</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inputs</p>
              <div className="space-y-2">
                {groupedTemplates.inputs.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    draggable
                    onClick={() => createNodeFromPalette(template.id)}
                    onDoubleClick={() => createNodeFromPalette(template.id)}
                    onDragStart={(event) => handleTemplateDragStart(event, template.id)}
                    className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <template.icon className="size-3.5 text-sky-500" />
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Triggers</p>
              <div className="space-y-2">
                {groupedTemplates.triggers.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    draggable
                    onClick={() => createNodeFromPalette(template.id)}
                    onDoubleClick={() => createNodeFromPalette(template.id)}
                    onDragStart={(event) => handleTemplateDragStart(event, template.id)}
                    className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left text-xs hover:bg-accent"
                  >
                    <template.icon className="size-3.5 text-amber-500" />
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      {configModalOpen && selectedNode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfigModalOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Configuração do nó"
            className="max-h-[90vh] w-[min(760px,96vw)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Configuração do nó</p>
                <p className="text-[11px] text-muted-foreground">{selectedNode.data.label}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => cloneNode(selectedNode.id)}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
                  title="Clonar nó"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleExportNodeConfig}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
                  title="Exportar config do nó"
                >
                  <Download className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent"
                  title="Fechar"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-64px)] overflow-auto p-4">
              <ExtractionNodeConfigPanel
                node={selectedNode}
                onLabelChange={(label) => updateNodeLabel(selectedNode.id, label)}
                onConfigChange={(config) => updateNodeConfig(selectedNode.id, config)}
                onRunTest={() => runNodeTest(selectedNode.id)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function ExtractionWorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  )
}
