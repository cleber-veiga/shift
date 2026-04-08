import { DatabaseInputNode } from "@/components/workflow/extraction/nodes/database-input-node"
import { FileInputNode } from "@/components/workflow/extraction/nodes/file-input-node"
import { HttpRequestNode } from "@/components/workflow/extraction/nodes/http-request-node"
import { ScheduleTriggerNode } from "@/components/workflow/extraction/nodes/schedule-trigger-node"
import { WebhookTriggerNode } from "@/components/workflow/extraction/nodes/webhook-trigger-node"

export const extractionNodeTypes = {
  databaseInput: DatabaseInputNode,
  fileInput: FileInputNode,
  httpRequest: HttpRequestNode,
  webhookTrigger: WebhookTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
}
