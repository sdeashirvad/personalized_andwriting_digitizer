export type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'

export type ChangeType =
  | 'endpoint-removed'
  | 'endpoint-added'
  | 'method-removed'
  | 'method-added'
  | 'request-field-removed'
  | 'request-field-added'
  | 'response-field-removed'
  | 'response-field-added'
  | 'field-type-changed'
  | 'field-required-changed'
  | 'enum-value-removed'
  | 'enum-value-added'
  | 'status-code-removed'
  | 'status-code-added'

export interface DiffChange {
  type: ChangeType
  severity: Severity
  breaking: boolean
  path: string
  method?: string
  description: string
  oldValue?: unknown
  newValue?: unknown
}

export interface DiffSummary {
  total: number
  breaking: number
  nonBreaking: number
  bySeverity: { HIGH: number; MEDIUM: number; LOW: number; INFO: number }
}

export interface DiffMetadata {
  oldTitle: string
  newTitle: string
  oldVersion: string
  newVersion: string
  timestamp: string
}

export interface DiffResult {
  summary: DiffSummary
  changes: DiffChange[]
  metadata: DiffMetadata
}

export interface OpenAPIContract {
  openapi?: string
  swagger?: string
  info?: { title: string; version: string; description?: string }
  paths?: Record<string, PathItem>
  components?: { schemas?: Record<string, Schema> }
}

export type PathItem = Partial<Record<HttpMethod, Operation>> & {
  summary?: string
  description?: string
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace'

export interface Operation {
  operationId?: string
  summary?: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Record<string, ResponseObject>
}

export interface RequestBody {
  required?: boolean
  content?: Record<string, MediaType>
}

export interface ResponseObject {
  description?: string
  content?: Record<string, MediaType>
}

export interface MediaType {
  schema?: Schema
}

export interface Parameter {
  name: string
  in: string
  required?: boolean
  schema?: Schema
}

export interface Schema {
  type?: string
  format?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  enum?: unknown[]
  nullable?: boolean
  $ref?: string
  allOf?: Schema[]
  oneOf?: Schema[]
  anyOf?: Schema[]
  description?: string
}
