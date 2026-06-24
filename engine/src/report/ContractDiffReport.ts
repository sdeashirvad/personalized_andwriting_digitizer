import type { DiffSummary, DiffMetadata, DiffChange } from '../models/types.js'
import type { RiskCategory, RiskBreakdownItem } from '../rules/risk.js'
import type { ImpactReport } from '../reporters/impact.js'
import type { ReportVersionString } from './ReportVersion.js'

/** Governance summary appended to ContractDiffReport when a SpecGuardConfig is provided */
export interface GovernanceSummary {
  enabled: boolean
  /** Number of changes matched by a valid (non-expired) approval */
  approved: number
  /** Number of changes matched by an expired approval */
  expired: number
  /** Number of changes matched by a suppression rule */
  suppressed: number
  /** Number of breaking changes with no approval or suppression */
  unapprovedBreaking: number
  /** Path of the config file if loaded from disk */
  configPath?: string
}

/**
 * ContractDiffReport is the canonical, versioned output of a diff run.
 * It is the single source of truth for:
 *   - CLI output (console, JSON, Markdown, HTML)
 *   - Dashboard rendering
 *   - GitHub Action output
 *   - PR comment generation
 *   - Future integrations
 *
 * Schema version: 1.0
 */
export interface ContractDiffReport {
  /** Schema version for forward/backward compatibility — e.g. "1.0" */
  reportVersion: ReportVersionString

  /** ISO 8601 timestamp of when the report was generated */
  generatedAt: string

  /** Version of the api-contract-diff engine that produced this report */
  toolVersion: string

  /** Weighted numeric risk score (0 = no risk, higher = riskier) */
  riskScore: number

  /** Human-readable risk category derived from riskScore */
  riskLevel: RiskCategory

  /** Per-change-type breakdown of the risk score */
  riskBreakdown: RiskBreakdownItem[]

  /** High-level counts and severity distribution */
  summary: DiffSummary

  /** Metadata about the two specs that were compared */
  metadata: DiffMetadata

  /** Full list of detected changes (with optional governanceStatus when config is provided) */
  changes: DiffChange[]

  /** Consumer-facing impact analysis for every change */
  impacts: ImpactReport[]

  /**
   * Governance summary — present only when a SpecGuardConfig was supplied.
   * Contains counts of approved, expired, suppressed, and unapproved changes.
   */
  governance?: GovernanceSummary
}
