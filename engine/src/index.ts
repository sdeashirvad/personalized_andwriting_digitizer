export { compareContracts } from './compare/contracts.js'
export { parseContract } from './parsers/openapi.js'
export { toJSON } from './reporters/json.js'
export { toMarkdown } from './reporters/markdown.js'
export { toConsole } from './reporters/console.js'
export { toHTML } from './reporters/html.js'
export { RULE_MAP } from './rules/severity.js'
export { calculateRiskScore, getRiskCategory, RISK_WEIGHTS } from './rules/risk.js'
export { generateImpactReports, generateImpactReport } from './reporters/impact.js'
export type {
  OpenAPIContract,
  DiffResult,
  DiffChange,
  DiffSummary,
  DiffMetadata,
  Severity,
  ChangeType,
  Schema,
  PathItem,
  Operation,
} from './models/types.js'
export type { RiskScore, RiskCategory, RiskBreakdownItem } from './rules/risk.js'
export type { ImpactReport } from './reporters/impact.js'
