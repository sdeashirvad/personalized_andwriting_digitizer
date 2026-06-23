import type {
  OpenAPIContract, DiffChange, DiffResult, Schema,
  Operation, ResponseObject, HttpMethod, PathItem
} from '../models/types.js'
import { RULE_MAP } from '../rules/severity.js'

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

export function compareContracts(oldSpec: OpenAPIContract, newSpec: OpenAPIContract): DiffResult {
  const changes: DiffChange[] = []
  const oldPaths = oldSpec.paths || {}
  const newPaths = newSpec.paths || {}

  for (const path of Object.keys(oldPaths)) {
    if (!(path in newPaths)) {
      changes.push(makeChange('endpoint-removed', path, undefined, `Endpoint "${path}" was removed`))
    } else {
      comparePathMethods(path, oldPaths[path]!, newPaths[path]!, oldSpec, newSpec, changes)
    }
  }
  for (const path of Object.keys(newPaths)) {
    if (!(path in oldPaths)) {
      changes.push(makeChange('endpoint-added', path, undefined, `Endpoint "${path}" was added`))
    }
  }

  const breaking = changes.filter(c => c.breaking).length
  const nonBreaking = changes.length - breaking
  const bySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 }
  for (const c of changes) bySeverity[c.severity]++

  return {
    summary: { total: changes.length, breaking, nonBreaking, bySeverity },
    changes,
    metadata: {
      oldTitle: oldSpec.info?.title ?? 'Unknown',
      newTitle: newSpec.info?.title ?? 'Unknown',
      oldVersion: oldSpec.info?.version ?? '0.0.0',
      newVersion: newSpec.info?.version ?? '0.0.0',
      timestamp: new Date().toISOString(),
    },
  }
}

function comparePathMethods(
  path: string,
  oldItem: PathItem,
  newItem: PathItem,
  oldSpec: OpenAPIContract,
  newSpec: OpenAPIContract,
  changes: DiffChange[]
) {
  for (const method of HTTP_METHODS) {
    const oldOp = oldItem[method]
    const newOp = newItem[method]
    if (oldOp && !newOp) {
      changes.push(makeChange('method-removed', path, method, `${method.toUpperCase()} ${path} was removed`))
    } else if (!oldOp && newOp) {
      changes.push(makeChange('method-added', path, method, `${method.toUpperCase()} ${path} was added`))
    } else if (oldOp && newOp) {
      compareOperation(path, method, oldOp, newOp, oldSpec, newSpec, changes)
    }
  }
}

function compareOperation(
  path: string,
  method: string,
  oldOp: Operation,
  newOp: Operation,
  oldSpec: OpenAPIContract,
  newSpec: OpenAPIContract,
  changes: DiffChange[]
) {
  const oldReqSchema = resolveRequestSchema(oldOp, oldSpec)
  const newReqSchema = resolveRequestSchema(newOp, newSpec)
  compareSchemas(path, method, 'request', undefined, oldReqSchema, newReqSchema, oldSpec, newSpec, changes)

  const oldResponses = oldOp.responses ?? {}
  const newResponses = newOp.responses ?? {}
  for (const code of Object.keys(oldResponses)) {
    if (!(code in newResponses)) {
      changes.push(makeChange('status-code-removed', path, method,
        `Response status ${code} removed from ${method.toUpperCase()} ${path}`))
    } else {
      const oldRespSchema = resolveResponseSchema(oldResponses[code], oldSpec)
      const newRespSchema = resolveResponseSchema(newResponses[code], newSpec)
      compareSchemas(path, method, 'response', code, oldRespSchema, newRespSchema, oldSpec, newSpec, changes)
    }
  }
  for (const code of Object.keys(newResponses)) {
    if (!(code in oldResponses)) {
      changes.push(makeChange('status-code-added', path, method,
        `Response status ${code} added to ${method.toUpperCase()} ${path}`))
    }
  }
}

function compareSchemas(
  path: string,
  method: string,
  location: 'request' | 'response',
  statusCode: string | undefined,
  oldSchema: Schema | null,
  newSchema: Schema | null,
  oldSpec: OpenAPIContract,
  newSpec: OpenAPIContract,
  changes: DiffChange[]
) {
  const oldR = oldSchema ? resolveRef(oldSchema, oldSpec) : null
  const newR = newSchema ? resolveRef(newSchema, newSpec) : null
  if (!oldR && !newR) return

  const oldProps = oldR?.properties ?? {}
  const newProps = newR?.properties ?? {}
  const oldRequired = new Set(oldR?.required ?? [])
  const newRequired = new Set(newR?.required ?? [])
  const loc = location === 'request' ? 'request body' : `response ${statusCode}`

  for (const [name, oldProp] of Object.entries(oldProps)) {
    if (!(name in newProps)) {
      const ct = location === 'request' ? 'request-field-removed' : 'response-field-removed'
      changes.push(makeChange(ct, path, method, `Field "${name}" removed from ${loc}`, oldProp.type, undefined))
    } else {
      const newProp = newProps[name]!
      const oldPropR = resolveRef(oldProp, oldSpec)
      const newPropR = resolveRef(newProp, newSpec)

      if (oldPropR.type && newPropR.type && oldPropR.type !== newPropR.type) {
        changes.push(makeChange('field-type-changed', path, method,
          `Field "${name}" type changed: "${oldPropR.type}" → "${newPropR.type}" in ${loc}`,
          oldPropR.type, newPropR.type))
      }

      const wasReq = oldRequired.has(name)
      const nowReq = newRequired.has(name)
      if (wasReq !== nowReq) {
        changes.push(makeChange('field-required-changed', path, method,
          `Field "${name}" changed from ${wasReq ? 'required' : 'optional'} to ${nowReq ? 'required' : 'optional'} in ${loc}`,
          wasReq, nowReq))
      }

      compareEnums(path, method, name, loc, oldProp, newProp, changes)
    }
  }

  for (const [name, newProp] of Object.entries(newProps)) {
    if (!(name in oldProps)) {
      const ct = location === 'request' ? 'request-field-added' : 'response-field-added'
      changes.push(makeChange(ct, path, method, `Field "${name}" added to ${loc}`, undefined, newProp.type))
    }
  }
}

function compareEnums(
  path: string,
  method: string,
  fieldName: string,
  loc: string,
  oldSchema: Schema,
  newSchema: Schema,
  changes: DiffChange[]
) {
  if (!oldSchema.enum && !newSchema.enum) return
  const oldVals = new Set((oldSchema.enum ?? []).map(String))
  const newVals = new Set((newSchema.enum ?? []).map(String))
  for (const v of oldVals) {
    if (!newVals.has(v)) {
      changes.push(makeChange('enum-value-removed', path, method,
        `Enum value "${v}" removed from field "${fieldName}" in ${loc}`, v, undefined))
    }
  }
  for (const v of newVals) {
    if (!oldVals.has(v)) {
      changes.push(makeChange('enum-value-added', path, method,
        `Enum value "${v}" added to field "${fieldName}" in ${loc}`, undefined, v))
    }
  }
}

function makeChange(
  type: string,
  path: string,
  method: string | undefined,
  description: string,
  oldValue?: unknown,
  newValue?: unknown
): DiffChange {
  const rule = RULE_MAP[type as DiffChange['type']] ?? { severity: 'INFO' as const, breaking: false }
  return {
    type: type as DiffChange['type'],
    severity: rule.severity,
    breaking: rule.breaking,
    path,
    method,
    description,
    oldValue,
    newValue,
  }
}

function resolveRef(schema: Schema, spec: OpenAPIContract): Schema {
  if (!schema.$ref) return schema
  const parts = schema.$ref.replace(/^#\//, '').split('/')
  let node: unknown = spec
  for (const part of parts) {
    node = (node as Record<string, unknown>)[part]
    if (!node) return schema
  }
  return node as Schema
}

function resolveRequestSchema(op: Operation, spec: OpenAPIContract): Schema | null {
  const content = op.requestBody?.content
  if (!content) return null
  const mt = content['application/json'] ?? Object.values(content)[0]
  if (!mt?.schema) return null
  return resolveRef(mt.schema, spec)
}

function resolveResponseSchema(resp: ResponseObject | undefined, spec: OpenAPIContract): Schema | null {
  if (!resp?.content) return null
  const mt = resp.content['application/json'] ?? Object.values(resp.content)[0]
  if (!mt?.schema) return null
  return resolveRef(mt.schema, spec)
}
