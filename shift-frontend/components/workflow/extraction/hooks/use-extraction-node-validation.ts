import { useEffect, useRef } from "react"
import { validateExtractionNode } from "@/lib/workflow/extraction/validation"
import type { ExtractionWorkflowNode } from "@/lib/workflow/extraction/types"
import { useDebouncedValue } from "@/components/workflow/extraction/hooks/use-debounced-value"

interface UseExtractionNodeValidationParams {
  nodes: ExtractionWorkflowNode[]
  onValidated: (nodeId: string, errors: string[], schema: ExtractionWorkflowNode["data"]["outputSchema"]) => void
}

export function useExtractionNodeValidation({ nodes, onValidated }: UseExtractionNodeValidationParams) {
  const debouncedNodes = useDebouncedValue(nodes, 450)
  const validatedSnapshot = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    debouncedNodes.forEach((node) => {
      const currentSignature = JSON.stringify(node.data.config)
      const previousSignature = validatedSnapshot.current.get(node.id)

      if (previousSignature === currentSignature && node.data.validationState !== "validating") {
        return
      }

      const result = validateExtractionNode(node)
      validatedSnapshot.current.set(node.id, currentSignature)
      onValidated(node.id, result.errors, result.schema)
    })
  }, [debouncedNodes, onValidated])
}
