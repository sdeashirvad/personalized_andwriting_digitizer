import type { DiffChange, ChangeType } from '../models/types.js'
import type { ApprovedChange } from './SpecGuardConfig.js'

/**
 * Maps friendly approval type names (camelCase) to engine ChangeType values.
 * Allows specguard.yml authors to use human-friendly names.
 */
const APPROVAL_TYPE_MAP: Record<string, ChangeType[]> = {
  'endpointRemoved':      ['endpoint-removed'],
  'endpointAdded':        ['endpoint-added'],
  'methodRemoved':        ['method-removed'],
  'methodAdded':          ['method-added'],
  'fieldRemoved':         ['request-field-removed', 'response-field-removed'],
  'requestFieldRemoved':  ['request-field-removed'],
  'responseFieldRemoved': ['response-field-removed'],
  'fieldAdded':           ['request-field-added', 'response-field-added'],
  'requestFieldAdded':    ['request-field-added'],
  'responseFieldAdded':   ['response-field-added'],
  'typeChanged':          ['field-type-changed'],
  'requiredChanged':      ['field-required-changed'],
  'requiredAdded':        ['field-required-changed'],
  'enumRemoved':          ['enum-value-removed'],
  'enumAdded':            ['enum-value-added'],
  'statusCodeRemoved':    ['status-code-removed'],
  'statusCodeAdded':      ['status-code-added'],
}

export interface ApprovalMatch {
  change: DiffChange
  approval: ApprovedChange
  expired: boolean
}

/**
 * Test whether a path pattern matches a concrete path.
 * Supports:
 *   - Exact match:        /users/{id}  →  /users/{id}
 *   - Single wildcard:    /legacy/*    →  /legacy/users
 *   - Double wildcard:    /api/**      →  /api/v2/users/list
 *   - Universal:          *            →  any path
 */
export function matchPath(pattern: string, path: string): boolean {
  if (pattern === '*' || pattern === '**') return true
  if (pattern === path) return true
  // Escape regex special chars, then replace glob wildcards
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const regexStr = escaped.replace(/\*\*/g, '.+').replace(/\*/g, '[^/]+')
  return new RegExp(`^${regexStr}$`).test(path)
}

/**
 * Returns true if the approval's expiry date has passed.
 */
export function isExpired(approval: ApprovedChange): boolean {
  if (!approval.expires) return false
  const expiryDate = new Date(approval.expires)
  if (isNaN(expiryDate.getTime())) return false
  return expiryDate < new Date()
}

/**
 * Returns true if the given approved change entry matches the diff change.
 */
export function matchesApproval(change: DiffChange, approval: ApprovedChange): boolean {
  // Type match
  const allowedTypes = APPROVAL_TYPE_MAP[approval.type]
  if (!allowedTypes) return false
  if (!allowedTypes.includes(change.type)) return false

  // Path match
  if (!matchPath(approval.path, change.path)) return false

  // Method match (if specified)
  if (approval.method) {
    if (!change.method) return false
    if (approval.method.toLowerCase() !== change.method.toLowerCase()) return false
  }

  return true
}

/**
 * Finds the best matching approval for a change.
 * Returns null if no approval matches.
 * Returns { approval, expired } if found.
 */
export function findApproval(
  change: DiffChange,
  approvals: ApprovedChange[]
): ApprovalMatch | null {
  for (const approval of approvals) {
    if (matchesApproval(change, approval)) {
      return { change, approval, expired: isExpired(approval) }
    }
  }
  return null
}
