import type { NodeProps } from "@xyflow/react"
import { FileInput } from "lucide-react"
import { ExtractionNodeShell, getNodeData } from "@/components/workflow/extraction/nodes/extraction-node-shell"

export function FileInputNode(props: NodeProps) {
  const data = getNodeData(props)
  if (!data) return <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">File Input</div>
  const { workflowNode, isSelected } = data

  return (
    <ExtractionNodeShell
      title={workflowNode.data.label}
      subtitle="File Input"
      icon={FileInput}
      tintClassName="bg-indigo-500/15 text-indigo-500"
      validationState={workflowNode.data.validationState}
      errorMessage={workflowNode.data.errorMessage}
      selected={isSelected}
    />
  )
}
