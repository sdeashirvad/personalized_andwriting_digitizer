export { compareContracts } from './compare/contracts.js'
export { parseContract } from './parsers/openapi.js'
export { toJSON } from './reporters/json.js'
export { toMarkdown } from './reporters/markdown.js'
export { toConsole } from './reporters/console.js'
export { RULE_MAP } from './rules/severity.js'
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
