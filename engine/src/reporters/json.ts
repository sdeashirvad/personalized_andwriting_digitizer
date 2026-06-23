import type { ContractDiffReport } from '../report/ContractDiffReport.js'
import type { DiffResult } from '../models/types.js'

/**
 * Serialise a ContractDiffReport to a JSON string.
 * This is the canonical JSON output — use this for --json CLI output,
 * file export, GitHub Action output, and machine consumption.
 */
export function toJSONReport(report: ContractDiffReport, pretty = true): string {
  return JSON.stringify(report, null, pretty ? 2 : 0)
}

/**
 * Legacy helper: serialise a raw DiffResult.
 * Prefer toJSONReport() for new code.
 * @deprecated Use generateReport() + toJSONReport() instead.
 */
export function toJSON(result: DiffResult, pretty = true): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}
