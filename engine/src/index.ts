// ─── Core diff engine ─────────────────────────────────────────────────────────
export { compareContracts } from './compare/contracts.js'
export { parseContract } from './parsers/openapi.js'

// ─── Report pipeline (canonical) ──────────────────────────────────────────────
export { generateReport } from './report/ReportGenerator.js'
export { REPORT_VERSION, TOOL_VERSION, SUPPORTED_REPORT_VERSIONS, isVersionSupported } from './report/ReportVersion.js'
export { ExitCode, determineExitCode, EXIT_CODE_DOCS } from './report/ExitCodes.js'

// ─── Renderers (all accept ContractDiffReport) ────────────────────────────────
export { toJSONReport, toJSON } from './reporters/json.js'
export { toMarkdownReport, toMarkdown } from './reporters/markdown.js'
export { toConsoleReport, toConsole } from './reporters/console.js'
export { toHTML } from './reporters/html.js'

// ─── PR / GitHub Action ───────────────────────────────────────────────────────
export { generatePRComment, getPRCommentMarker } from './github-action/PRCommentRenderer.js'
export type { PRCommentMode } from './github-action/PRCommentRenderer.js'

// ─── Rules ────────────────────────────────────────────────────────────────────
export { RULE_MAP } from './rules/severity.js'
export { calculateRiskScore, getRiskCategory, RISK_WEIGHTS } from './rules/risk.js'

// ─── Impact analysis ──────────────────────────────────────────────────────────
export { generateImpactReports, generateImpactReport } from './reporters/impact.js'

// ─── Governance ───────────────────────────────────────────────────────────────
export { applyGovernance } from './governance/GovernanceEngine.js'
export { validateConfig } from './governance/SpecGuardConfig.js'
export { matchPath, isExpired, matchesApproval, findApproval } from './governance/ApprovalEngine.js'
export { matchesSuppression, isSuppressed, getSupportedRuleNames } from './governance/SuppressionEngine.js'

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  OpenAPIContract,
  DiffResult,
  DiffChange,
  DiffSummary,
  DiffMetadata,
  Severity,
  ChangeType,
  GovernanceStatus,
  GovernanceApprovalMetadata,
  Schema,
  PathItem,
  Operation,
} from './models/types.js'
export type { RiskScore, RiskCategory, RiskBreakdownItem } from './rules/risk.js'
export type { ImpactReport } from './reporters/impact.js'
export type { ContractDiffReport, GovernanceSummary } from './report/ContractDiffReport.js'
export type { ExitCodeValue, ExitCodeOptions } from './report/ExitCodes.js'
export type { SpecGuardConfig, ApprovedChange, SuppressionRule } from './governance/SpecGuardConfig.js'
export type { GovernanceResult } from './governance/GovernanceEngine.js'
