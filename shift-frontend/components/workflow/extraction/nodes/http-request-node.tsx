import type { NodeProps } from "@xyflow/react"
import { Globe } from "lucide-react"
import { ExtractionNodeShell, getNodeData } from "@/components/workflow/extraction/nodes/extraction-node-shell"

export function HttpRequestNode(props: NodeProps) {
  const data = getNodeData(props)
  if (!data) return <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">HTTP Request</div>
  const { workflowNode, isSelected } = data

  return (
    <ExtractionNodeShell
      title={workflowNode.data.label}
      subtitle="HTTP Request"
      icon={Globe}
      tintClassName="bg-violet-500/15 text-violet-500"
      validationState={workflowNode.data.validationState}
      errorMessage={workflowNode.data.errorMessage}
      selected={isSelected}
    />
  )
}
