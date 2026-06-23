/**
 * GitHub Action Integration Design
 * ─────────────────────────────────
 * This file defines the complete integration contract for the
 * api-contract-diff GitHub Action. It is an implementation-ready
 * design — all types, inputs, outputs, and failure conditions are
 * specified and ready to be wired into action.yml + src/index.ts.
 *
 * The Action consumes ContractDiffReport as its sole integration format.
 * It does NOT re-run the diff itself; it calls the engine and wraps output.
 */

import type { ContractDiffReport } from '../report/ContractDiffReport.js'
import type { ExitCodeValue } from '../report/ExitCodes.js'

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface ActionInputs {
  /**
   * action.yml: old-spec
   * Path (relative to repo root) or URL to the old OpenAPI/Swagger spec.
   * Supports .yaml, .yml, .json.
   * Required.
   */
  oldSpec: string

  /**
   * action.yml: new-spec
   * Path (relative to repo root) or URL to the new OpenAPI/Swagger spec.
   * Required.
   */
  newSpec: string

  /**
   * action.yml: fail-on-high  (default: true)
   * When true: fail the Action (non-zero exit) only if HIGH/CRITICAL breaking
   * changes are found. MEDIUM/LOW breaking changes are reported but not blocking.
   */
  failOnHigh: boolean

  /**
   * action.yml: fail-on-medium  (default: false)
   * When true: fail the Action if any breaking change is found (MEDIUM+).
   * Overrides fail-on-high if both are set.
   */
  failOnMedium: boolean

  /**
   * action.yml: post-comment  (default: true)
   * Whether to post (or update) a PR comment with the diff report.
   * Only applies when triggered by a pull_request event.
   */
  postComment: boolean

  /**
   * action.yml: output-file  (default: "")
   * Optional path to write the JSON report to disk, e.g. "report.json".
   * Empty string means no file output.
   */
  outputFile?: string

  /**
   * action.yml: token  (default: ${{ github.token }})
   * GitHub token used to post PR comments. Must have `pull-requests: write`.
   */
  token: string
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

export interface ActionOutputs {
  /**
   * outputs.risk-level
   * The risk category: NONE | LOW | MEDIUM | HIGH | CRITICAL
   */
  riskLevel: string

  /**
   * outputs.risk-score
   * The numeric weighted risk score (stringified integer).
   */
  riskScore: string

  /**
   * outputs.breaking-count
   * Number of breaking changes detected (stringified integer).
   */
  breakingCount: string

  /**
   * outputs.non-breaking-count
   * Number of non-breaking changes detected (stringified integer).
   */
  nonBreakingCount: string

  /**
   * outputs.report-json
   * Full ContractDiffReport serialised as a JSON string.
   * Downstream steps can parse this with fromJSON().
   */
  reportJson: string

  /**
   * outputs.exit-code
   * The exit code that would be used by the CLI (0–4).
   */
  exitCode: string
}

// ─── Failure conditions ────────────────────────────────────────────────────────

export interface FailureConditions {
  /**
   * Default (fail-on-high=true, fail-on-medium=false):
   * Action fails when HIGH or CRITICAL breaking changes are found.
   * exit code 2.
   */
  default: 'HIGH or CRITICAL breaking changes (exit 2)'

  /**
   * With fail-on-medium=true:
   * Action fails on any breaking change.
   * exit code 1 for MEDIUM/LOW, exit code 2 for HIGH/CRITICAL.
   */
  withFailOnMedium: 'Any breaking change (MEDIUM+ severity)'

  /**
   * Invalid contract (exit 3): spec cannot be parsed.
   */
  invalidContract: 'Contract parse or validation error (exit 3)'

  /**
   * Internal error (exit 4): unexpected engine failure.
   */
  internalError: 'Unexpected internal error (exit 4)'
}

// ─── PR Comment strategy ──────────────────────────────────────────────────────

export interface PRCommentStrategy {
  /**
   * The HTML comment marker injected into every comment body.
   * Used to find and update existing comments rather than creating duplicates.
   */
  marker: '<!-- api-contract-diff-report -->'

  /**
   * When an existing comment with the marker is found on the PR:
   * update it in place instead of posting a new one.
   */
  updateExisting: true

  /**
   * Sections included in the PR comment, in order.
   */
  sections: [
    'header',           // Title, versions, risk badge
    'summary-table',    // Total / Breaking / Non-Breaking / Risk Level
    'breaking-changes', // Collapsible list of breaking changes with severity
    'non-breaking-changes', // Collapsible list
    'impact-analysis',  // Consumer impact bullets
    'footer',           // Generated-by line + report timestamp
  ]

  /**
   * The GitHub event that triggers comment posting.
   */
  trigger: 'pull_request' | 'pull_request_target'
}

// ─── Report consumption ───────────────────────────────────────────────────────

/**
 * The Action always builds a ContractDiffReport first, then derives all
 * outputs from it. No output is generated independently of the report.
 *
 * Pipeline:
 *   parseFiles() → compareContracts() → generateReport() → ContractDiffReport
 *                                                                    ↓
 *                                              ┌────────────────────┼───────────────────┐
 *                                       setOutputs()        postPRComment()     writeFile()
 *                                       (ActionOutputs)     (Markdown)          (JSON)
 */
export type ReportConsumer = (report: ContractDiffReport) => void | Promise<void>

export interface ActionExitResult {
  report: ContractDiffReport
  exitCode: ExitCodeValue
  outputs: ActionOutputs
}
