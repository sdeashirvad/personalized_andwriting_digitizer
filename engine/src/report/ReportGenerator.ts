import type { DiffResult } from '../models/types.js'
import { calculateRiskScore } from '../rules/risk.js'
import { generateImpactReports } from '../reporters/impact.js'
import type { ContractDiffReport } from './ContractDiffReport.js'
import { REPORT_VERSION, TOOL_VERSION } from './ReportVersion.js'
import type { SpecGuardConfig } from '../governance/SpecGuardConfig.js'
import { applyGovernance } from '../governance/GovernanceEngine.js'

/**
 * Converts a raw DiffResult into a fully-populated ContractDiffReport.
 *
 * Optionally accepts a SpecGuardConfig to apply governance rules:
 *   - Approved changes → governanceStatus: 'APPROVED'
 *   - Expired approvals → governanceStatus: 'EXPIRED'
 *   - Suppressed findings → governanceStatus: 'SUPPRESSED'
 *   - Unapproved breaking → governanceStatus: 'UNAPPROVED'
 *
 *   Contracts → Diff Engine → generateReport(result, config?) → ContractDiffReport
 *                                                                       ↓
 *                                              ┌──────────────────────┼────────────────────┐
 *                                           CLI renderer      HTML renderer      Dashboard renderer
 */
export function generateReport(result: DiffResult, config?: SpecGuardConfig, configPath?: string): ContractDiffReport {
  const riskScore = calculateRiskScore(result.changes)
  const impacts = generateImpactReports(result.changes)

  if (config) {
    const govResult = applyGovernance(result.changes, config, configPath)
    return {
      reportVersion: REPORT_VERSION,
      generatedAt:   new Date().toISOString(),
      toolVersion:   TOOL_VERSION,
      riskScore:     riskScore.score,
      riskLevel:     riskScore.category,
      riskBreakdown: riskScore.breakdown,
      summary:       result.summary,
      metadata:      result.metadata,
      changes:       govResult.changes,
      impacts,
      governance:    govResult.summary,
    }
  }

  return {
    reportVersion: REPORT_VERSION,
    generatedAt:   new Date().toISOString(),
    toolVersion:   TOOL_VERSION,
    riskScore:     riskScore.score,
    riskLevel:     riskScore.category,
    riskBreakdown: riskScore.breakdown,
    summary:       result.summary,
    metadata:      result.metadata,
    changes:       result.changes,
    impacts,
  }
}
