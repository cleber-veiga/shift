import { createDefaultExtractionNode } from "@/lib/workflow/extraction/defaults"
import type {
  ExtractionNodeSubType,
  ExtractionWorkflowNode,
  ExtractionWorkflowEdge,
} from "@/lib/workflow/extraction/types"

export interface ExtractionWorkflowPayload {
  version: 1
  nodes: ExtractionWorkflowNode[]
  edges: ExtractionWorkflowEdge[]
}

export function createNodeId(subType: ExtractionNodeSubType) {
  return `${subType}-${crypto.randomUUID()}`
}

export function cloneExtractionNode(node: ExtractionWorkflowNode): ExtractionWorkflowNode {
  const clone = structuredClone(node)
  clone.id = createNodeId(node.subType)
  clone.position = {
    x: node.position.x + 40,
    y: node.position.y + 40,
  }
  return clone
}

export function serializeWorkflow(nodes: ExtractionWorkflowNode[], edges: ExtractionWorkflowEdge[]) {
  const payload: ExtractionWorkflowPayload = {
    version: 1,
    nodes,
    edges,
  }

  return JSON.stringify(payload, null, 2)
}

export function parseWorkflow(serialized: string): ExtractionWorkflowPayload {
  const parsed = JSON.parse(serialized) as ExtractionWorkflowPayload

  if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("Formato de importação inválido.")
  }

  return parsed
}

export function createNodeForImport(subType: ExtractionNodeSubType, patch: Partial<ExtractionWorkflowNode>) {
  const base = createDefaultExtractionNode(subType, createNodeId(subType))
  return {
    ...base,
    ...patch,
    data: {
      ...base.data,
      ...patch.data,
    },
  }
}
