import type { ComponentType } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtractionReactFlowNodeData, ExtractionValidationState } from "@/lib/workflow/extraction/types"

interface ExtractionNodeShellProps {
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  tintClassName: string
  validationState: ExtractionValidationState
  errorMessage: string | null
  selected: boolean
}

function statusMeta(state: ExtractionValidationState) {
  if (state === "validating") {
    return {
      label: "Validando",
      icon: Loader2,
      className: "text-amber-500",
      animated: true,
    }
  }

  if (state === "ready") {
    return {
      label: "Pronto",
      icon: CheckCircle2,
      className: "text-emerald-500",
      animated: false,
    }
  }

  if (state === "error") {
    return {
      label: "Erro",
      icon: AlertTriangle,
      className: "text-destructive",
      animated: false,
    }
  }

  return {
    label: "Idle",
    icon: Clock3,
    className: "text-muted-foreground",
    animated: false,
  }
}

export function ExtractionNodeShell({
  title,
  subtitle,
  icon: Icon,
  tintClassName,
  validationState,
  errorMessage,
  selected,
}: ExtractionNodeShellProps) {
  const status = statusMeta(validationState)
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "w-[230px] rounded-xl border bg-card p-3 shadow-sm transition-all",
        selected ? "border-primary shadow-md" : "border-border"
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex size-8 items-center justify-center rounded-lg", tintClassName)}>
            <Icon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px]">
        <StatusIcon className={cn("size-3.5", status.className, status.animated ? "animate-spin" : "")} />
        <span className={status.className}>{status.label}</span>
      </div>

      {errorMessage ? <p className="mt-1 line-clamp-2 text-[10px] text-destructive">{errorMessage}</p> : null}

      <Handle
        id="output"
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-0 !bg-sky-500"
      />
    </div>
  )
}

export function getNodeData(props: NodeProps): ExtractionReactFlowNodeData | null {
  if (!props.data) return null
  const data = props.data as Partial<ExtractionReactFlowNodeData>
  if (!data.workflowNode) return null
  return data as ExtractionReactFlowNodeData
}
