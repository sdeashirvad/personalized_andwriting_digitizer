import type { DiffChange, ChangeType } from '../models/types.js'
import type { SuppressionRule } from './SpecGuardConfig.js'
import { matchPath } from './ApprovalEngine.js'

type SuppressionTarget = ChangeType[] | 'INFO_SEVERITY' | 'ALL_NON_BREAKING'

/**
 * Maps rule names (SCREAMING_SNAKE_CASE) to the set of change types they suppress.
 * Special sentinel values handle severity-based or breaking-status-based suppression.
 */
const SUPPRESSION_RULE_MAP: Record<string, SuppressionTarget> = {
  'ENDPOINT_ADDED':       ['endpoint-added'],
  'ENDPOINT_REMOVED':     ['endpoint-removed'],
  'METHOD_ADDED':         ['method-added'],
  'METHOD_REMOVED':       ['method-removed'],
  'FIELD_ADDED':          ['request-field-added', 'response-field-added'],
  'REQUEST_FIELD_ADDED':  ['request-field-added'],
  'RESPONSE_FIELD_ADDED': ['response-field-added'],
  'FIELD_REMOVED':        ['request-field-removed', 'response-field-removed'],
  'REQUEST_FIELD_REMOVED':['request-field-removed'],
  'RESPONSE_FIELD_REMOVED':['response-field-removed'],
  'TYPE_CHANGED':         ['field-type-changed'],
  'REQUIRED_CHANGED':     ['field-required-changed'],
  'ENUM_ADDED':           ['enum-value-added'],
  'ENUM_REMOVED':         ['enum-value-removed'],
  'STATUS_CODE_ADDED':    ['status-code-added'],
  'STATUS_CODE_REMOVED':  ['status-code-removed'],
  'INFO':                 'INFO_SEVERITY',
  'NON_BREAKING':         'ALL_NON_BREAKING',
}

/**
 * Returns true if the given suppression rule matches the diff change.
 */
export function matchesSuppression(change: DiffChange, rule: SuppressionRule): boolean {
  const target = SUPPRESSION_RULE_MAP[rule.rule]
  if (target === undefined) return false

  // Check type / severity match
  let typeMatch = false
  if (target === 'INFO_SEVERITY') {
    typeMatch = change.severity === 'INFO'
  } else if (target === 'ALL_NON_BREAKING') {
    typeMatch = !change.breaking
  } else {
    typeMatch = (target as ChangeType[]).includes(change.type)
  }
  if (!typeMatch) return false

  // Optional path filter
  if (rule.path && !matchPath(rule.path, change.path)) return false

  // Optional method filter
  if (rule.method) {
    if (!change.method) return false
    if (rule.method.toLowerCase() !== change.method.toLowerCase()) return false
  }

  return true
}

/**
 * Returns true if any suppression rule matches the given change.
 */
export function isSuppressed(change: DiffChange, rules: SuppressionRule[]): boolean {
  return rules.some(rule => matchesSuppression(change, rule))
}

/**
 * Returns the list of suppression rules that match a given change.
 */
export function findMatchingSuppressions(
  change: DiffChange,
  rules: SuppressionRule[]
): SuppressionRule[] {
  return rules.filter(rule => matchesSuppression(change, rule))
}

/**
 * Returns all supported rule names for documentation / help output.
 */
export function getSupportedRuleNames(): string[] {
  return Object.keys(SUPPRESSION_RULE_MAP)
}
