import type { ChangeType, DiffChange } from '../models/types.js'

export interface ImpactReport {
  change: DiffChange
  impacts: string[]
}

type ImpactTemplate = (change: DiffChange) => string[]

function fieldName(desc: string): string {
  const m = desc.match(/"([^"]+)"/)
  return m ? m[1] : 'this field'
}

const TEMPLATES: Record<ChangeType, ImpactTemplate> = {
  'endpoint-removed': (c) => [
    `All clients calling ${c.method ? c.method.toUpperCase() + ' ' : ''}${c.path} will receive 404 errors.`,
    'Any SDK methods targeting this endpoint must be removed or stubbed before deploying.',
    'Integration tests and health checks covering this endpoint will fail.',
    'Downstream services that depend on this route must be updated.',
  ],
  'endpoint-added': () => [
    'No existing consumers are affected — this is a purely additive change.',
    'New clients can begin using this endpoint immediately after deployment.',
  ],
  'method-removed': (c) => [
    `Clients using ${c.method ? c.method.toUpperCase() : 'this HTTP method'} on ${c.path} will receive 405 Method Not Allowed errors.`,
    'Any client code invoking this method will break at runtime.',
    'SDK wrappers must remove or deprecate this method.',
  ],
  'method-added': () => [
    'No existing consumers are affected.',
    'Clients may optionally adopt the new HTTP method.',
  ],
  'request-field-removed': (c) => {
    const name = fieldName(c.description)
    return [
      `Clients sending "${name}" in the request body will have that field silently ignored or may receive validation errors.`,
      `SDK models and request builders that include "${name}" must be updated.`,
      'Generated client libraries will need regeneration.',
    ]
  },
  'request-field-added': (c) => {
    const name = fieldName(c.description)
    return [
      `The new field "${name}" is optional and does not break existing clients.`,
      'Clients may choose to include this field to access new functionality.',
    ]
  },
  'response-field-removed': (c) => {
    const name = fieldName(c.description)
    return [
      `Frontend clients that read "${name}" from the response will encounter undefined/null values and may crash.`,
      `Any UI components, reports, or logic depending on "${name}" must be audited.`,
      'SDKs and generated types must be regenerated to remove this field.',
      'Consumer services that map this field to their own data models require updates.',
    ]
  },
  'response-field-added': (c) => {
    const name = fieldName(c.description)
    return [
      `The new field "${name}" is additive and existing consumers can safely ignore it.`,
      'Clients may optionally read this field to access new data.',
    ]
  },
  'field-type-changed': (c) => {
    const name = fieldName(c.description)
    return [
      `The type of "${name}" changed from ${c.oldValue} to ${c.newValue} — clients expecting ${c.oldValue} will encounter type errors or parse failures.`,
      'Runtime deserialization errors are likely for strictly-typed clients (TypeScript, Java, Go, etc.).',
      'Database mappings and ORM models that store this field may need migration.',
      'All consumers must update their type definitions and validation logic.',
    ]
  },
  'field-required-changed': (c) => {
    const name = fieldName(c.description)
    const becameRequired = c.newValue === true
    if (becameRequired) {
      return [
        `"${name}" is now required — existing clients that omit this field will receive validation errors.`,
        'All request builders and form submissions must include this field.',
        'Client-side validation and SDK models must be updated to reflect the new requirement.',
      ]
    }
    return [
      `"${name}" is now optional — existing clients that always send it are not broken.`,
      'Clients may conditionally omit this field if desired.',
    ]
  },
  'enum-value-removed': (c) => {
    const val = c.oldValue as string
    return [
      `The enum value "${val}" has been removed — clients sending or expecting this value will encounter errors.`,
      'Switch statements and if-else chains that handle this value must be updated.',
      'Any stored data containing "${val}" may fail future validation.',
      'Generated code and SDK enums must be regenerated.',
    ]
  },
  'enum-value-added': (c) => {
    const val = c.newValue as string
    return [
      `The new enum value "${val}" is additive — existing clients that don't handle it will simply ignore it.`,
      'Clients using exhaustive switch statements (TypeScript never-checks) may encounter a compile error until updated.',
    ]
  },
  'status-code-removed': (c) => [
    `Response status ${c.description.match(/\d{3}/)?.[0] ?? 'code'} is no longer returned from ${c.path}.`,
    'Clients that branch on this status code must update their error handling logic.',
    'Monitoring and alerting rules that track this status code should be reviewed.',
  ],
  'status-code-added': () => [
    'A new status code has been added — existing clients that ignore unrecognised codes are unaffected.',
    'Clients may optionally handle this new status code for improved error handling.',
  ],
}

export function generateImpactReports(changes: DiffChange[]): ImpactReport[] {
  return changes.map(change => ({
    change,
    impacts: TEMPLATES[change.type]?.(change) ?? ['Review this change manually — no template available.'],
  }))
}

export function generateImpactReport(change: DiffChange): ImpactReport {
  return {
    change,
    impacts: TEMPLATES[change.type]?.(change) ?? ['Review this change manually — no template available.'],
  }
}
