"use client"

import { useCallback, useState, useMemo } from "react"
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Connection,
  type Node,
  type Edge,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Webhook,
  Mail,
  MessageSquare,
  Database,
  GitBranch,
  Filter,
  Code,
  Zap,
  Clock,
  Globe,
  Plus,
  Search,
  Play,
  X,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Braces,
} from "lucide-react"

// Node colors - accent for left border
const nodeColors: Record<string, string> = {
  webhook: "#10b981",
  schedule: "#10b981", 
  http: "#f59e0b",
  email: "#3b82f6",
  slack: "#6366f1",
  database: "#8b5cf6",
  condition: "#f59e0b",
  filter: "#ec4899",
  code: "#6366f1",
  transform: "#14b8a6",
}

const nodeIcons: Record<string, React.ElementType> = {
  webhook: Webhook,
  schedule: Clock,
  http: Globe,
  email: Mail,
  slack: MessageSquare,
  database: Database,
  condition: GitBranch,
  filter: Filter,
  code: Code,
  transform: Braces,
}

// N8N Style Node - Clean card with colored left accent
function N8NNode({ data, selected }: { data: Record<string, unknown>; selected: boolean }) {
  const nodeType = data.type as string
  const color = nodeColors[nodeType] || "#6b7280"
  const Icon = nodeIcons[nodeType] || Zap
  const isTrigger = ["webhook", "schedule"].includes(nodeType)
  const isCondition = nodeType === "condition"

  return (
    <div
      className={`
        group relative min-w-[160px] max-w-[200px] rounded-lg bg-[#262626] shadow-lg transition-shadow
        ${selected ? "shadow-xl ring-1 ring-white/20" : "hover:shadow-xl"}
      `}
      style={{
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Input Handle - small dot */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!-left-[5px] !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-[#1a1a1a] !bg-neutral-400 transition-colors hover:!bg-emerald-400"
        />
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="truncate text-[13px] font-medium text-white">{data.label as string}</span>
          {data.status === "success" && (
            <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-400" />
          )}
        </div>
        {data.description && (
          <p className="mt-1.5 truncate text-[11px] text-neutral-500">{data.description as string}</p>
        )}
      </div>

      {/* Output Handles */}
      {isCondition ? (
        <>
          {/* True output */}
          <div className="absolute -right-[5px] top-[30%]">
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              className="!relative !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-[#1a1a1a] !bg-emerald-400 !transform-none transition-colors hover:!bg-emerald-300"
            />
          </div>
          <span className="absolute right-3 top-[26%] text-[9px] font-medium text-emerald-400">true</span>
          
          {/* False output */}
          <div className="absolute -right-[5px] top-[70%]">
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              className="!relative !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-[#1a1a1a] !bg-red-400 !transform-none transition-colors hover:!bg-red-300"
            />
          </div>
          <span className="absolute right-3 top-[66%] text-[9px] font-medium text-red-400">false</span>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!-right-[5px] !h-2.5 !w-2.5 !rounded-full !border-[1.5px] !border-[#1a1a1a] !bg-neutral-400 transition-colors hover:!bg-emerald-400"
        />
      )}
    </div>
  )
}

// N8N Style Edge - thin line with dot and delete on hover
function N8NEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
}: {
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  style?: React.CSSProperties
}) {
  const { setEdges } = useReactFlow()
  const [hovered, setHovered] = useState(false)
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const strokeColor = style?.stroke || "#525252"

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Invisible wider path for hover */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={24}
        stroke="transparent"
        style={{ cursor: "pointer" }}
      />
      
      {/* Visible thin line */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={hovered ? 2 : 1.5}
        stroke={hovered ? "#10b981" : strokeColor}
        style={{ transition: "stroke 0.15s, stroke-width 0.15s" }}
      />

      {/* Small dot in middle */}
      <circle
        cx={labelX}
        cy={labelY}
        r={hovered ? 5 : 3}
        fill={hovered ? "#10b981" : strokeColor}
        style={{ transition: "r 0.15s, fill 0.15s" }}
      />

      {/* Delete button on hover */}
      {hovered && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              onClick={onDelete}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 bg-[#1a1a1a] text-neutral-400 shadow-lg transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}

const nodeTypes: NodeTypes = { n8n: N8NNode }
const edgeTypes: EdgeTypes = { n8n: N8NEdge }

const nodeCategories = [
  {
    name: "Triggers",
    items: [
      { type: "webhook", label: "Webhook", description: "HTTP trigger" },
      { type: "schedule", label: "Schedule", description: "Cron trigger" },
    ],
  },
  {
    name: "Actions", 
    items: [
      { type: "http", label: "HTTP Request", description: "API calls" },
      { type: "email", label: "Send Email", description: "Email messages" },
      { type: "slack", label: "Slack", description: "Slack messages" },
      { type: "database", label: "Database", description: "DB queries" },
    ],
  },
  {
    name: "Logic",
    items: [
      { type: "condition", label: "IF", description: "Branching" },
      { type: "filter", label: "Filter", description: "Filter data" },
      { type: "code", label: "Code", description: "JavaScript" },
      { type: "transform", label: "Set", description: "Transform" },
    ],
  },
]

// Initial demo workflow
const initialNodes: Node[] = [
  {
    id: "1",
    type: "n8n",
    position: { x: 80, y: 180 },
    data: { label: "Webhook", type: "webhook", description: "POST /webhook/...", status: "success" },
  },
  {
    id: "2",
    type: "n8n",
    position: { x: 340, y: 180 },
    data: { label: "IF Condition", type: "condition", description: "If value equals...", status: "success" },
  },
  {
    id: "3",
    type: "n8n",
    position: { x: 600, y: 100 },
    data: { label: "Send Email", type: "email", description: "To: recipient@...", status: "success" },
  },
  {
    id: "4",
    type: "n8n",
    position: { x: 600, y: 280 },
    data: { label: "Slack", type: "slack", description: "#general" },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", type: "n8n", style: { stroke: "#525252" } },
  { id: "e2-3", source: "2", sourceHandle: "true", target: "3", type: "n8n", style: { stroke: "#10b981" } },
  { id: "e2-4", source: "2", sourceHandle: "false", target: "4", type: "n8n", style: { stroke: "#ef4444" } },
]

// Config Panel
function NodeConfigPanel({
  node,
  onClose,
  onUpdate,
  onDelete,
}: {
  node: Node | null
  onClose: () => void
  onUpdate: (id: string, data: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  if (!node) return null

  const nodeType = node.data.type as string
  const color = nodeColors[nodeType] || "#6b7280"
  const Icon = nodeIcons[nodeType] || Zap

  return (
    <div className="flex h-full w-[360px] flex-col border-l border-neutral-800 bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-white">{node.data.label as string}</h2>
            <p className="text-xs text-neutral-500">Configure node</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-3 mt-3 grid w-auto grid-cols-3 bg-neutral-800/50">
          <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-neutral-700">Settings</TabsTrigger>
          <TabsTrigger value="input" className="text-xs data-[state=active]:bg-neutral-700">Input</TabsTrigger>
          <TabsTrigger value="output" className="text-xs data-[state=active]:bg-neutral-700">Output</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="settings" className="m-0 space-y-4 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">Name</Label>
              <Input
                defaultValue={node.data.label as string}
                className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white"
                onChange={(e) => onUpdate(node.id, { ...node.data, label: e.target.value })}
              />
            </div>

            {nodeType === "webhook" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Method</Label>
                  <Select defaultValue="POST">
                    <SelectTrigger className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Path</Label>
                  <Input defaultValue="/webhook/abc" className="h-8 border-neutral-700 bg-neutral-800 font-mono text-sm text-white" />
                </div>
              </>
            )}

            {nodeType === "condition" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Field</Label>
                  <Input defaultValue="data.status" className="h-8 border-neutral-700 bg-neutral-800 font-mono text-sm text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Operator</Label>
                  <Select defaultValue="equals">
                    <SelectTrigger className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Value</Label>
                  <Input defaultValue="success" className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white" />
                </div>
              </>
            )}

            {nodeType === "email" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">To</Label>
                  <Input defaultValue="user@example.com" className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Subject</Label>
                  <Input defaultValue="Notification" className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white" />
                </div>
              </>
            )}

            {nodeType === "slack" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Channel</Label>
                  <Input defaultValue="#general" className="h-8 border-neutral-700 bg-neutral-800 text-sm text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-neutral-400">Message</Label>
                  <textarea
                    defaultValue="Hello from workflow"
                    className="min-h-[60px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
                  />
                </div>
              </>
            )}

            <Separator className="bg-neutral-800" />

            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-400">Notes</Label>
              <textarea
                className="min-h-[50px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
                placeholder="Add notes..."
              />
            </div>
          </TabsContent>

          <TabsContent value="input" className="m-0 p-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500">
                <ChevronRight className="h-3 w-3" />
                Input Data
              </div>
              <pre className="overflow-auto font-mono text-xs text-neutral-300">
{`{
  "body": {
    "user": "john@example.com"
  }
}`}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="output" className="m-0 p-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-neutral-500">
                <ChevronRight className="h-3 w-3" />
                Output Data
              </div>
              <pre className="overflow-auto font-mono text-xs text-neutral-300">
{`{
  "success": true
}`}
              </pre>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <div className="flex gap-2 border-t border-neutral-800 p-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-neutral-700 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => {
            onDelete(node.id)
            onClose()
          }}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-500" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}

// Main Canvas
function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [showPalette, setShowPalette] = useState(false)
  const [search, setSearch] = useState("")

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "n8n", style: { stroke: "#525252" } }, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setShowPalette(false)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const addNode = useCallback(
    (type: string, label: string, description: string) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: "n8n",
        position: { x: 250 + Math.random() * 150, y: 150 + Math.random() * 100 },
        data: { label, type, description },
      }
      setNodes((nds) => [...nds, newNode])
      setShowPalette(false)
    },
    [setNodes]
  )

  const updateNode = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)))
    },
    [setNodes]
  )

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    },
    [setNodes, setEdges]
  )

  const filteredCategories = useMemo(() => {
    if (!search) return nodeCategories
    return nodeCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) =>
          item.label.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [search])

  return (
    <div className="flex h-screen w-full bg-[#0f0f0f]">
      {/* Canvas */}
      <div className="relative flex-1">
        {/* Top Bar */}
        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">My Workflow</h1>
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
              onClick={() => setShowPalette(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Node
            </Button>
            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500">
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Execute
            </Button>
          </div>
        </div>

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: "n8n" }}
          fitView
          proOptions={{ hideAttribution: true }}
          style={{ background: "#0f0f0f" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#262626" />
          <Controls 
            className="!border-neutral-800 !bg-[#1a1a1a] [&>button]:!border-neutral-800 [&>button]:!bg-[#1a1a1a] [&>button]:!text-neutral-400 [&>button:hover]:!bg-neutral-800" 
          />
        </ReactFlow>

        {/* Node Palette Modal */}
        {showPalette && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
            <div className="w-[420px] rounded-xl border border-neutral-800 bg-[#1a1a1a] shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 p-4">
                <h2 className="text-sm font-semibold text-white">Add Node</h2>
                <button
                  onClick={() => setShowPalette(false)}
                  className="rounded-md p-1 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                  <Input
                    placeholder="Search nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 border-neutral-700 bg-neutral-800 pl-9 text-sm text-white"
                    autoFocus
                  />
                </div>
              </div>

              <ScrollArea className="h-[280px]">
                <div className="space-y-4 p-3 pt-0">
                  {filteredCategories.map((category) => (
                    <div key={category.name}>
                      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item) => {
                          const Icon = nodeIcons[item.type] || Zap
                          const color = nodeColors[item.type] || "#6b7280"
                          return (
                            <button
                              key={item.type}
                              onClick={() => addNode(item.type, item.label, item.description)}
                              className="flex items-center gap-2.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-left transition-colors hover:border-neutral-700 hover:bg-neutral-800"
                            >
                              <div
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                                style={{ backgroundColor: color }}
                              >
                                <Icon className="h-3.5 w-3.5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-medium text-white">{item.label}</div>
                                <div className="truncate text-[10px] text-neutral-500">{item.description}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={updateNode}
          onDelete={deleteNode}
        />
      )}
    </div>
  )
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  )
}
