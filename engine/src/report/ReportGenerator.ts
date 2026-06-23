import type { DiffResult } from '../models/types.js'
import { calculateRiskScore } from '../rules/risk.js'
import { generateImpactReports } from '../reporters/impact.js'
import type { ContractDiffReport } from './ContractDiffReport.js'
import { REPORT_VERSION, TOOL_VERSION } from './ReportVersion.js'

/**
 * Converts a raw DiffResult into a fully-populated ContractDiffReport.
 *
 * This is the canonical entry point for the report generation pipeline:
 *
 *   Contracts → Diff Engine → generateReport() → ContractDiffReport
 *                                                       ↓
 *                                    ┌──────────────────┼──────────────────┐
 *                                 CLI renderer   HTML renderer   Dashboard renderer
 */
export function generateReport(result: DiffResult): ContractDiffReport {
  const riskScore = calculateRiskScore(result.changes)
  const impacts = generateImpactReports(result.changes)

  return {
    reportVersion: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    riskScore: riskScore.score,
    riskLevel: riskScore.category,
    riskBreakdown: riskScore.breakdown,
    summary: result.summary,
    metadata: result.metadata,
    changes: result.changes,
    impacts,
  }
}
