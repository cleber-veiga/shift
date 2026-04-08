import type { ExtractionNodeConfig, ExtractionWorkflowNode } from "@/lib/workflow/extraction/types"

export interface ExtractionConfigPanelProps<TConfig extends ExtractionNodeConfig> {
  node: ExtractionWorkflowNode
  config: TConfig
  onChange: (config: TConfig) => void
  onRunTest: () => void
}
