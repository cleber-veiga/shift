import type {
  DatabaseInputConfig,
  ExtractionNodeSubType,
  ExtractionWorkflowNode,
  FileInputConfig,
  HttpRequestConfig,
  OutputSchemaColumn,
  OutputSchemaType,
  ScheduleTriggerConfig,
  WebhookTriggerConfig,
} from "@/lib/workflow/extraction/types"

export interface ValidationResult {
  errors: string[]
  schema: OutputSchemaColumn[]
}

function inferPrimitiveType(value: unknown): OutputSchemaType {
  if (typeof value === "string") return "string"
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  if (Array.isArray(value)) return "array"
  if (value && typeof value === "object") return "object"
  return "unknown"
}

function inferSchemaFromJsonObject(input: Record<string, unknown>): OutputSchemaColumn[] {
  return Object.entries(input).map(([name, value]) => ({
    name,
    type: inferPrimitiveType(value),
    nullable: value == null,
  }))
}

function inferSchemaFromSql(query: string): OutputSchemaColumn[] {
  const selectMatch = query.match(/select\s+(.+?)\s+from/ims)
  if (!selectMatch) return []

  const columnsRaw = selectMatch[1]
  if (!columnsRaw) return []

  const columns = columnsRaw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return columns.map((column) => {
    const parts = column.split(/\s+as\s+/i)
    const alias = parts[1]?.trim()
    const name = alias ?? column.split(".").at(-1)?.trim() ?? "coluna"
    return { name, type: "string", nullable: true }
  })
}

function inferSchemaFromCsv(config: FileInputConfig): OutputSchemaColumn[] {
  if (!config.sampleContent.trim()) return []

  const rows = config.sampleContent
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .slice(config.skipRows)

  if (rows.length === 0) return []

  const first = rows[0].split(config.delimiter)
  const second = rows[1]?.split(config.delimiter)

  return first.map((name, index) => {
    const sample = second?.[index]
    const isNumber = sample != null && sample.trim().length > 0 && !Number.isNaN(Number(sample))

    return {
      name: name.trim() || `coluna_${index + 1}`,
      type: isNumber ? "number" : "string",
      nullable: true,
    }
  })
}

function inferSchemaFromFile(config: FileInputConfig): OutputSchemaColumn[] {
  if (config.fileType === "json") {
    try {
      const parsed = JSON.parse(config.sampleContent)
      if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === "object") {
        return inferSchemaFromJsonObject(parsed[0] as Record<string, unknown>)
      }
      if (parsed && typeof parsed === "object") {
        return inferSchemaFromJsonObject(parsed as Record<string, unknown>)
      }
    } catch {
      return []
    }
    return []
  }

  if (config.fileType === "csv") {
    return inferSchemaFromCsv(config)
  }

  if (config.fileType === "xlsx") {
    return [{ name: "sheet1", type: "array", nullable: false }]
  }

  if (config.fileType === "xml") {
    return [{ name: "document", type: "object", nullable: false }]
  }

  return []
}

function validateDatabaseConfig(config: DatabaseInputConfig): ValidationResult {
  const errors: string[] = []

  if (!config.connectionId.trim()) {
    errors.push("Selecione uma conexão.")
  }

  if (!config.query.trim()) {
    errors.push("Informe a query SQL.")
  } else if (!/select\s+/i.test(config.query)) {
    errors.push("A query deve iniciar com SELECT para extração.")
  }

  return {
    errors,
    schema: errors.length === 0 ? inferSchemaFromSql(config.query) : [],
  }
}

function validateFileConfig(config: FileInputConfig): ValidationResult {
  const errors: string[] = []

  if (!config.filePath.trim()) {
    errors.push("Informe o caminho do arquivo ou selecione um arquivo.")
  }

  if (config.fileType === "csv" && !config.delimiter) {
    errors.push("Informe o delimitador para CSV.")
  }

  if (config.skipRows < 0) {
    errors.push("Skip rows não pode ser negativo.")
  }

  return {
    errors,
    schema: errors.length === 0 ? inferSchemaFromFile(config) : [],
  }
}

function validateHttpConfig(config: HttpRequestConfig): ValidationResult {
  const errors: string[] = []

  if (!config.url.trim()) {
    errors.push("Informe a URL da requisição.")
  } else {
    try {
      new URL(config.url)
    } catch {
      errors.push("URL inválida.")
    }
  }

  const invalidHeader = config.headers.find(
    (header) => header.enabled && header.key.trim() && !header.value.trim()
  )
  if (invalidHeader) {
    errors.push("Headers ativos devem ter chave e valor.")
  }

  if (config.authentication.type === "bearer" && !config.authentication.token.trim()) {
    errors.push("Token Bearer obrigatório.")
  }

  if (config.authentication.type === "apiKey" && !config.authentication.apiKeyValue.trim()) {
    errors.push("Valor de API Key obrigatório.")
  }

  return {
    errors,
    schema:
      errors.length === 0
        ? [
            { name: "status", type: "number", nullable: false },
            { name: "data", type: "object", nullable: true },
          ]
        : [],
  }
}

function validateWebhookConfig(config: WebhookTriggerConfig): ValidationResult {
  const errors: string[] = []
  if (!config.url.trim()) {
    errors.push("URL do webhook não foi gerada.")
  }

  const latestPayload = config.payloadHistory[0]
  if (latestPayload) {
    try {
      const parsed = JSON.parse(latestPayload.payload)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          errors,
          schema: inferSchemaFromJsonObject(parsed as Record<string, unknown>),
        }
      }
    } catch {
      errors.push("Payload recebido não é JSON válido.")
    }
  }

  return {
    errors,
    schema: config.expectedSchema,
  }
}

function nextRunFromEvery(config: ScheduleTriggerConfig): string[] {
  const now = new Date()
  const runs: string[] = []

  for (let index = 1; index <= 5; index += 1) {
    const run = new Date(now.getTime() + index * config.everyMinutes * 60_000)
    runs.push(run.toISOString())
  }

  return runs
}

function nextRunFromCron(expression: string): string[] {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return []

  const [minuteRaw, hourRaw] = parts
  if (!/^\*|\*\/\d+|\d+$/.test(minuteRaw) || !/^\*|\d+$/.test(hourRaw)) {
    return []
  }

  const now = new Date()
  const runs: string[] = []
  let cursor = new Date(now)

  for (let index = 0; index < 5; index += 1) {
    cursor = new Date(cursor.getTime() + 60_000)

    while (runs.length <= index) {
      const minuteMatch =
        minuteRaw === "*"
          ? true
          : minuteRaw.startsWith("*/")
            ? cursor.getMinutes() % Number(minuteRaw.slice(2)) === 0
            : cursor.getMinutes() === Number(minuteRaw)

      const hourMatch = hourRaw === "*" ? true : cursor.getHours() === Number(hourRaw)

      if (minuteMatch && hourMatch) {
        runs.push(cursor.toISOString())
      }

      cursor = new Date(cursor.getTime() + 60_000)
    }
  }

  return runs
}

function validateScheduleConfig(config: ScheduleTriggerConfig): ValidationResult {
  const errors: string[] = []

  if (!config.timezone.trim()) {
    errors.push("Selecione um timezone.")
  }

  if (config.mode === "every") {
    if (!Number.isFinite(config.everyMinutes) || config.everyMinutes <= 0) {
      errors.push("Intervalo deve ser maior que zero.")
    }

    return {
      errors,
      schema: [{ name: "triggeredAt", type: "date", nullable: false }],
    }
  }

  if (config.cronExpression.trim().split(/\s+/).length !== 5) {
    errors.push("Cron deve ter 5 campos (minuto hora dia mês dia-da-semana).")
  }

  return {
    errors,
    schema: [{ name: "triggeredAt", type: "date", nullable: false }],
  }
}

export function validateExtractionNode(node: ExtractionWorkflowNode): ValidationResult {
  const subType: ExtractionNodeSubType = node.subType

  if (subType === "database") {
    return validateDatabaseConfig(node.data.config as DatabaseInputConfig)
  }

  if (subType === "file") {
    return validateFileConfig(node.data.config as FileInputConfig)
  }

  if (subType === "http") {
    return validateHttpConfig(node.data.config as HttpRequestConfig)
  }

  if (subType === "webhook") {
    return validateWebhookConfig(node.data.config as WebhookTriggerConfig)
  }

  return validateScheduleConfig(node.data.config as ScheduleTriggerConfig)
}

export function computeNextScheduleRuns(config: ScheduleTriggerConfig): string[] {
  if (config.mode === "every") {
    return nextRunFromEvery(config)
  }

  return nextRunFromCron(config.cronExpression)
}
