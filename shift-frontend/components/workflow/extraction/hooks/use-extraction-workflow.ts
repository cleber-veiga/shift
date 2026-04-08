import { useCallback, useMemo, useState } from "react"
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react"
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react"
import { createDefaultExtractionNode, nodeTypeFromSubType } from "@/lib/workflow/extraction/defaults"
import {
  cloneExtractionNode,
  createNodeId,
  parseWorkflow,
  serializeWorkflow,
} from "@/lib/workflow/extraction/serialization"
import { computeNextScheduleRuns } from "@/lib/workflow/extraction/validation"
import { useExtractionNodeValidation } from "@/components/workflow/extraction/hooks/use-extraction-node-validation"
import type {
  ExtractionNodeConfig,
  ExtractionNodeSubType,
  ExtractionReactFlowNode,
  ExtractionWorkflowEdge,
  ExtractionWorkflowEvents,
  ExtractionWorkflowNode,
  ScheduleTriggerConfig,
} from "@/lib/workflow/extraction/types"

interface UseExtractionWorkflowParams extends ExtractionWorkflowEvents {
  initialNodes?: ExtractionWorkflowNode[]
  initialEdges?: ExtractionWorkflowEdge[]
}

export function useExtractionWorkflow(params: UseExtractionWorkflowParams = {}) {
  const [workflowNodes, setWorkflowNodes] = useState<ExtractionWorkflowNode[]>(params.initialNodes ?? [])
  const [workflowEdges, setWorkflowEdges] = useState<ExtractionWorkflowEdge[]>(params.initialEdges ?? [])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const selectedNode = useMemo(
    () => workflowNodes.find((node) => node.id === selectedNodeId) ?? null,
    [selectedNodeId, workflowNodes]
  )

  const upsertNode = useCallback((nextNode: ExtractionWorkflowNode) => {
    setWorkflowNodes((current) => {
      const hasNode = current.some((node) => node.id === nextNode.id)
      if (!hasNode) return [...current, nextNode]
      return current.map((node) => (node.id === nextNode.id ? nextNode : node))
    })
  }, [])

  const addNode = useCallback(
    (subType: ExtractionNodeSubType, position: { x: number; y: number }) => {
      const id = createNodeId(subType)
      const node = createDefaultExtractionNode(subType, id)
      node.position = position
      upsertNode(node)
      setSelectedNodeId(id)
    },
    [upsertNode]
  )

  const deleteNode = useCallback((nodeId: string) => {
    setWorkflowNodes((current) => current.filter((node) => node.id !== nodeId))
    setWorkflowEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNodeId((current) => (current === nodeId ? null : current))
  }, [])

  const cloneNode = useCallback(
    (nodeId: string) => {
      const node = workflowNodes.find((current) => current.id === nodeId)
      if (!node) return
      const clone = cloneExtractionNode(node)
      upsertNode(clone)
      setSelectedNodeId(clone.id)
    },
    [upsertNode, workflowNodes]
  )

  const updateNodeConfig = useCallback(
    (nodeId: string, config: ExtractionNodeConfig) => {
      setWorkflowNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node

          const nextNode: ExtractionWorkflowNode = {
            ...node,
            data: {
              ...node.data,
              config,
              validationState: "validating",
              validationErrors: [],
              errorMessage: null,
            },
          }

          params.onNodeConfigChange?.({
            nodeId: node.id,
            subType: node.subType,
            config,
          })

          return nextNode
        })
      )
    },
    [params]
  )

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    setWorkflowNodes((current) =>
      current.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, label } } : node))
    )
  }, [])

  const runNodeTest = useCallback((nodeId: string) => {
    setWorkflowNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status: "running", errorMessage: null } } : node
      )
    )

    window.setTimeout(() => {
      setWorkflowNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node
          const hasErrors = node.data.validationErrors.length > 0

          return {
            ...node,
            data: {
              ...node.data,
              status: hasErrors ? "error" : "success",
              errorMessage: hasErrors ? node.data.validationErrors[0] ?? "Falha na validação." : null,
            },
          }
        })
      )
    }, 700)
  }, [])

  const onNodesChange = useCallback((changes: NodeChange<ExtractionReactFlowNode>[]) => {
    setWorkflowNodes((current) => {
      const flowNodes: ExtractionReactFlowNode[] = current.map((node) => ({
        id: node.id,
        type: nodeTypeFromSubType(node.subType),
        position: node.position,
        data: {
          workflowNode: node,
          isSelected: node.id === selectedNodeId,
        },
      }))

      const next = applyNodeChanges(changes, flowNodes)

      return current.map((node) => {
        const updated = next.find((flowNode) => flowNode.id === node.id)
        if (!updated) return node

        return {
          ...node,
          position: updated.position,
        }
      })
    })
  }, [selectedNodeId])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setWorkflowEdges((current) => applyEdgeChanges(changes, current))
  }, [])

  const onConnect = useCallback((connection: Connection) => {
    setWorkflowEdges((current) => addEdge(connection, current))
  }, [])

  const exportWorkflow = useCallback(() => serializeWorkflow(workflowNodes, workflowEdges), [workflowEdges, workflowNodes])

  const importWorkflow = useCallback((serialized: string) => {
    const parsed = parseWorkflow(serialized)
    setWorkflowNodes(parsed.nodes)
    setWorkflowEdges(parsed.edges)
    setSelectedNodeId(parsed.nodes[0]?.id ?? null)
  }, [])

  const exportSelectedNodeConfig = useCallback(() => {
    if (!selectedNode) return ""
    return JSON.stringify(selectedNode.data.config, null, 2)
  }, [selectedNode])

  const importSelectedNodeConfig = useCallback(
    (serializedConfig: string) => {
      if (!selectedNode) return
      const config = JSON.parse(serializedConfig) as ExtractionNodeConfig
      updateNodeConfig(selectedNode.id, config)
    },
    [selectedNode, updateNodeConfig]
  )

  useExtractionNodeValidation({
    nodes: workflowNodes,
    onValidated: (nodeId, errors, schema) => {
      setWorkflowNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node

          const nextConfig =
            node.subType === "schedule"
              ? {
                  ...(node.data.config as ScheduleTriggerConfig),
                  nextRuns: computeNextScheduleRuns(node.data.config as ScheduleTriggerConfig),
                }
              : node.data.config

          const nextNode: ExtractionWorkflowNode = {
            ...node,
            data: {
              ...node.data,
              config: nextConfig,
              validationState: errors.length > 0 ? "error" : "ready",
              validationErrors: errors,
              outputSchema: schema,
              errorMessage: errors[0] ?? null,
            },
          }

          params.onNodeSchemaChange?.({ nodeId: node.id, schema })
          return nextNode
        })
      )
    },
  })

  const reactFlowNodes = useMemo<ExtractionReactFlowNode[]>(() => {
    return workflowNodes.map((node) => ({
      id: node.id,
      type: nodeTypeFromSubType(node.subType),
      position: node.position,
      data: {
        workflowNode: node,
        isSelected: node.id === selectedNodeId,
      },
    }))
  }, [selectedNodeId, workflowNodes])

  return {
    workflowNodes,
    workflowEdges,
    reactFlowNodes,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    addNode,
    deleteNode,
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
  }
}
