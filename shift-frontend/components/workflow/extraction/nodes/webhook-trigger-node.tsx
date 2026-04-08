import type { NodeProps } from "@xyflow/react"
import { Webhook } from "lucide-react"
import { ExtractionNodeShell, getNodeData } from "@/components/workflow/extraction/nodes/extraction-node-shell"

export function WebhookTriggerNode(props: NodeProps) {
  const data = getNodeData(props)
  if (!data) return <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">Webhook Trigger</div>
  const { workflowNode, isSelected } = data

  return (
    <ExtractionNodeShell
      title={workflowNode.data.label}
      subtitle="Webhook Trigger"
      icon={Webhook}
      tintClassName="bg-rose-500/15 text-rose-500"
      validationState={workflowNode.data.validationState}
      errorMessage={workflowNode.data.errorMessage}
      selected={isSelected}
    />
  )
}
