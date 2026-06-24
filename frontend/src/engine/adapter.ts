import { load as yamlLoad } from 'js-yaml'
import {
  compareContracts,
  generateReport,
  toJSONReport,
  toMarkdownReport,
  toConsoleReport,
  toHTML,
  generatePRComment,
  determineExitCode,
  ExitCode,
} from '@api-contract-diff/engine'
import type {
  OpenAPIContract,
  ContractDiffReport,
  DiffResult,
  RiskScore,
  ImpactReport,
  RiskBreakdownItem,
  SpecGuardConfig,
  PRCommentMode,
  ExitCodeValue,
} from '@api-contract-diff/engine'
import { TOOL_VERSION } from '@api-contract-diff/engine'

export type { ContractDiffReport, RiskScore, ImpactReport, RiskBreakdownItem, SpecGuardConfig, PRCommentMode, ExitCodeValue }
export { toMarkdownReport, toConsoleReport, generatePRComment, determineExitCode, ExitCode }

export type EngineMode = 'local' | 'global'
export const ENGINE_MODE: EngineMode = 'local'
export const ENGINE_VERSION = TOOL_VERSION

export interface RunDiffOptions {
  oldContract: string
  newContract: string
  governanceConfig?: SpecGuardConfig
}

export interface RunDiffResult {
  report: ContractDiffReport
  diffResult: DiffResult
  result: { summary: ContractDiffReport['summary']; changes: ContractDiffReport['changes']; metadata: ContractDiffReport['metadata'] }
  riskScore: RiskScore
  impactReports: ImpactReport[]
  engineMode: EngineMode
  engineVersion: string
  durationMs: number
}

export function parseContractText(input: string): OpenAPIContract {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as OpenAPIContract
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`)
    }
  }
  try {
    const parsed = yamlLoad(trimmed)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('YAML did not parse to an object — check your formatting')
    }
    return parsed as OpenAPIContract
  } catch (e) {
    throw new Error(`Invalid YAML: ${(e as Error).message}`)
  }
}

export function runDiff(options: RunDiffOptions): RunDiffResult {
  if (ENGINE_MODE === 'global') {
    throw new Error('Global engine not yet configured.')
  }
  const t0 = performance.now()

  const oldSpec = parseContractText(options.oldContract)
  const newSpec = parseContractText(options.newContract)

  const diffResult = compareContracts(oldSpec, newSpec)
  const report = generateReport(diffResult, options.governanceConfig)

  const riskScore: RiskScore = {
    score: report.riskScore,
    category: report.riskLevel,
    breakdown: report.riskBreakdown,
    topContributors: report.changes.filter(c => c.breaking).slice(0, 5),
  }

  return {
    report,
    diffResult,
    result: {
      summary: report.summary,
      changes: report.changes,
      metadata: report.metadata,
    },
    riskScore,
    impactReports: report.impacts,
    engineMode: ENGINE_MODE,
    engineVersion: ENGINE_VERSION,
    durationMs: Math.round(performance.now() - t0),
  }
}

export function generateHTMLReport(r: RunDiffResult): string {
  return toHTML(r.diffResult, r.riskScore, r.impactReports)
}

export function generateJSONReport(diffResult: RunDiffResult): string {
  return toJSONReport(diffResult.report)
}
