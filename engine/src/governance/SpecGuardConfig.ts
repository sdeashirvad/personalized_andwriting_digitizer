/**
 * SpecGuard configuration model.
 * Loaded from specguard.yml at runtime — either from disk (CLI)
 * or provided as an in-memory object (browser / programmatic API).
 */

export interface ApprovedChange {
  /** Friendly change-type name, e.g. "endpointRemoved", "fieldRemoved", "typeChanged" */
  type: string
  /** Path pattern to match — exact or glob-style (e.g. "/legacy/*", "/users/{id}") */
  path: string
  /** Optional HTTP method filter, e.g. "get", "post" */
  method?: string
  /** Team or person who owns this approval */
  owner: string
  /** Who approved the change, e.g. "architecture-board", "platform-lead" */
  approvedBy: string
  /** Human-readable reason for the approval */
  reason: string
  /** ISO 8601 date after which this approval is considered expired, e.g. "2027-01-01" */
  expires?: string
  /** ISO 8601 timestamp when the approval was created */
  createdAt?: string
}

export interface SuppressionRule {
  /**
   * Rule name to suppress. Supported values:
   *   ENDPOINT_ADDED, ENDPOINT_REMOVED
   *   METHOD_ADDED, METHOD_REMOVED
   *   FIELD_ADDED, REQUEST_FIELD_ADDED, RESPONSE_FIELD_ADDED
   *   FIELD_REMOVED, REQUEST_FIELD_REMOVED, RESPONSE_FIELD_REMOVED
   *   TYPE_CHANGED, REQUIRED_CHANGED
   *   ENUM_ADDED, ENUM_REMOVED
   *   STATUS_CODE_ADDED, STATUS_CODE_REMOVED
   *   INFO           — suppress all INFO-severity findings
   *   NON_BREAKING   — suppress all non-breaking changes
   */
  rule: string
  /** Optional path filter — only suppress changes matching this path pattern */
  path?: string
  /** Optional method filter — only suppress changes matching this HTTP method */
  method?: string
  /** Human-readable reason for this suppression */
  reason?: string
}

export interface SpecGuardConfig {
  /** List of individually approved breaking changes */
  approvedChanges?: ApprovedChange[]
  /** List of finding-type suppressions */
  suppressions?: SuppressionRule[]
}

/**
 * Validates a raw parsed config object and returns a typed SpecGuardConfig.
 * Throws if the structure is invalid.
 */
export function validateConfig(raw: unknown): SpecGuardConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('specguard.yml must be a YAML mapping object')
  }
  const obj = raw as Record<string, unknown>
  const config: SpecGuardConfig = {}

  if ('approvedChanges' in obj) {
    if (!Array.isArray(obj.approvedChanges)) {
      throw new Error('approvedChanges must be an array')
    }
    config.approvedChanges = obj.approvedChanges.map((item, i) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`approvedChanges[${i}] must be an object`)
      }
      const a = item as Record<string, unknown>
      if (typeof a.type !== 'string')      throw new Error(`approvedChanges[${i}].type is required and must be a string`)
      if (typeof a.path !== 'string')      throw new Error(`approvedChanges[${i}].path is required and must be a string`)
      if (typeof a.owner !== 'string')     throw new Error(`approvedChanges[${i}].owner is required and must be a string`)
      if (typeof a.approvedBy !== 'string') throw new Error(`approvedChanges[${i}].approvedBy is required and must be a string`)
      if (typeof a.reason !== 'string')    throw new Error(`approvedChanges[${i}].reason is required and must be a string`)
      return {
        type:       a.type,
        path:       a.path,
        method:     typeof a.method === 'string' ? a.method : undefined,
        owner:      a.owner,
        approvedBy: a.approvedBy,
        reason:     a.reason,
        expires:    typeof a.expires === 'string' ? a.expires : undefined,
        createdAt:  typeof a.createdAt === 'string' ? a.createdAt : undefined,
      } satisfies ApprovedChange
    })
  }

  if ('suppressions' in obj) {
    if (!Array.isArray(obj.suppressions)) {
      throw new Error('suppressions must be an array')
    }
    config.suppressions = obj.suppressions.map((item, i) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`suppressions[${i}] must be an object`)
      }
      const s = item as Record<string, unknown>
      if (typeof s.rule !== 'string') throw new Error(`suppressions[${i}].rule is required and must be a string`)
      return {
        rule:   s.rule,
        path:   typeof s.path === 'string' ? s.path : undefined,
        method: typeof s.method === 'string' ? s.method : undefined,
        reason: typeof s.reason === 'string' ? s.reason : undefined,
      } satisfies SuppressionRule
    })
  }

  return config
}
