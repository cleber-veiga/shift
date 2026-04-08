import type { NodeProps } from "@xyflow/react"
import { Clock3 } from "lucide-react"
import { ExtractionNodeShell, getNodeData } from "@/components/workflow/extraction/nodes/extraction-node-shell"

export function ScheduleTriggerNode(props: NodeProps) {
  const data = getNodeData(props)
  if (!data) return <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">Schedule Trigger</div>
  const { workflowNode, isSelected } = data

  return (
    <ExtractionNodeShell
      title={workflowNode.data.label}
      subtitle="Schedule Trigger"
      icon={Clock3}
      tintClassName="bg-amber-500/15 text-amber-500"
      validationState={workflowNode.data.validationState}
      errorMessage={workflowNode.data.errorMessage}
      selected={isSelected}
    />
  )
}
