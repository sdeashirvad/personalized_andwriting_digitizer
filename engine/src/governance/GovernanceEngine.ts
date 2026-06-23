import type { DiffChange, GovernanceStatus, GovernanceApprovalMetadata } from '../models/types.js'
import type { SpecGuardConfig } from './SpecGuardConfig.js'
import { findApproval } from './ApprovalEngine.js'
import { isSuppressed } from './SuppressionEngine.js'

export interface GovernanceSummary {
  /** Whether governance was configured for this run */
  enabled: boolean
  /** Number of changes matched by a valid (non-expired) approval */
  approved: number
  /** Number of changes matched by an expired approval */
  expired: number
  /** Number of changes matched by a suppression rule */
  suppressed: number
  /** Number of breaking changes with no matching approval or suppression */
  unapprovedBreaking: number
  /** Path to the config file, if loaded from disk */
  configPath?: string
}

export interface GovernanceResult {
  /** Annotated changes — each has an optional governanceStatus and governanceMetadata */
  changes: DiffChange[]
  summary: GovernanceSummary
}

/**
 * Applies governance rules to a list of diff changes.
 *
 * Processing order:
 *   1. Suppressions — if any suppression rule matches, mark SUPPRESSED
 *   2. Approvals — if an approval matches AND is not expired, mark APPROVED
 *   3. Expired — if an approval matches AND is expired, mark EXPIRED
 *   4. Unapproved — breaking change with no governance match → UNAPPROVED
 *   5. (non-breaking, unmatched) → no status set (governance doesn't apply)
 */
export function applyGovernance(
  changes: DiffChange[],
  config: SpecGuardConfig,
  configPath?: string
): GovernanceResult {
  const approvals   = config.approvedChanges  ?? []
  const suppressions = config.suppressions ?? []

  let approved          = 0
  let expired           = 0
  let suppressed        = 0
  let unapprovedBreaking = 0

  const annotated: DiffChange[] = changes.map(change => {
    // ── Step 1: Suppression ───────────────────────────────────────
    if (isSuppressed(change, suppressions)) {
      suppressed++
      return { ...change, governanceStatus: 'SUPPRESSED' as GovernanceStatus }
    }

    // ── Step 2 & 3: Approval (with expiry check) ──────────────────
    const match = findApproval(change, approvals)
    if (match) {
      const metadata: GovernanceApprovalMetadata = {
        owner:      match.approval.owner,
        approvedBy: match.approval.approvedBy,
        reason:     match.approval.reason,
        expires:    match.approval.expires,
        createdAt:  match.approval.createdAt,
      }
      if (match.expired) {
        expired++
        return { ...change, governanceStatus: 'EXPIRED' as GovernanceStatus, governanceMetadata: metadata }
      } else {
        approved++
        return { ...change, governanceStatus: 'APPROVED' as GovernanceStatus, governanceMetadata: metadata }
      }
    }

    // ── Step 4: Unapproved breaking ───────────────────────────────
    if (change.breaking) {
      unapprovedBreaking++
      return { ...change, governanceStatus: 'UNAPPROVED' as GovernanceStatus }
    }

    // ── Step 5: Non-breaking, no governance needed ────────────────
    return change
  })

  return {
    changes: annotated,
    summary: {
      enabled: true,
      approved,
      expired,
      suppressed,
      unapprovedBreaking,
      configPath,
    },
  }
}
