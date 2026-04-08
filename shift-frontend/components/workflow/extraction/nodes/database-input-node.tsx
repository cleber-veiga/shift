import type { NodeProps } from "@xyflow/react"
import { Database } from "lucide-react"
import { ExtractionNodeShell, getNodeData } from "@/components/workflow/extraction/nodes/extraction-node-shell"

export function DatabaseInputNode(props: NodeProps) {
  const data = getNodeData(props)
  if (!data) return <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">Database Input</div>
  const { workflowNode, isSelected } = data

  return (
    <ExtractionNodeShell
      title={workflowNode.data.label}
      subtitle="Database Input"
      icon={Database}
      tintClassName="bg-sky-500/15 text-sky-500"
      validationState={workflowNode.data.validationState}
      errorMessage={workflowNode.data.errorMessage}
      selected={isSelected}
    />
  )
}
