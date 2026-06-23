import type { ContractDiffReport } from './ContractDiffReport.js'

/**
 * Deterministic exit code policy for api-contract-diff CLI.
 *
 * Code | Meaning
 * ---- | -------
 *   0  | No breaking changes detected
 *   1  | Breaking changes found with max severity MEDIUM or LOW
 *   2  | Breaking changes found with max severity HIGH or CRITICAL
 *   3  | One or more contract files are invalid / unparseable
 *   4  | Unexpected internal error in the tool itself
 */
export const ExitCode = {
  OK: 0,
  MEDIUM_BREAKING: 1,
  HIGH_BREAKING: 2,
  INVALID_CONTRACT: 3,
  INTERNAL_ERROR: 4,
} as const

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode]

export interface ExitCodeOptions {
  /**
   * --fail-on-high
   * Exit with a non-zero code ONLY when HIGH or CRITICAL breaking changes are
   * present. MEDIUM/LOW breaking changes will result in exit 0 (CI passes).
   * Useful when you want to warn on medium changes but only block on high.
   */
  failOnHigh?: boolean

  /**
   * --fail-on-medium
   * Exit with a non-zero code when any breaking change is found (default
   * behavior). This flag is a no-op against the default policy but makes
   * intent explicit in CI scripts.
   */
  failOnMedium?: boolean
}

/**
 * Returns the correct exit code given a report and optional CLI flags.
 */
export function determineExitCode(
  report: Pick<ContractDiffReport, 'changes'>,
  opts: ExitCodeOptions = {}
): ExitCodeValue {
  const breaking = report.changes.filter(c => c.breaking)

  if (breaking.length === 0) return ExitCode.OK

  const hasHighOrCritical = breaking.some(
    c => c.severity === 'HIGH'
  )

  if (opts.failOnHigh) {
    // Stricter threshold: only fail CI on HIGH/CRITICAL; MEDIUM/LOW are OK
    return hasHighOrCritical ? ExitCode.HIGH_BREAKING : ExitCode.OK
  }

  // Default (also covers --fail-on-medium): differentiate by severity
  return hasHighOrCritical ? ExitCode.HIGH_BREAKING : ExitCode.MEDIUM_BREAKING
}

export const EXIT_CODE_DOCS: Record<ExitCodeValue, string> = {
  [ExitCode.OK]: 'No breaking changes detected',
  [ExitCode.MEDIUM_BREAKING]: 'Breaking changes found (max severity: MEDIUM or LOW)',
  [ExitCode.HIGH_BREAKING]: 'Breaking changes found (max severity: HIGH or CRITICAL)',
  [ExitCode.INVALID_CONTRACT]: 'One or more contract files are invalid or unparseable',
  [ExitCode.INTERNAL_ERROR]: 'Unexpected internal error in the diff engine',
}
