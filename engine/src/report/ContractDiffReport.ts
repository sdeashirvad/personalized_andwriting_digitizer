import type { DiffSummary, DiffMetadata, DiffChange } from '../models/types.js'
import type { RiskCategory, RiskBreakdownItem } from '../rules/risk.js'
import type { ImpactReport } from '../reporters/impact.js'
import type { ReportVersionString } from './ReportVersion.js'

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

  /** Full list of detected changes */
  changes: DiffChange[]

  /** Consumer-facing impact analysis for every change */
  impacts: ImpactReport[]
}
