export const REPORT_VERSION = '1.0' as const
export type ReportVersionString = typeof REPORT_VERSION

export const TOOL_VERSION = '1.0.0' as const

/**
 * Schema compatibility table.
 * When reportVersion is bumped, update this map so consumers can
 * detect whether they understand the schema they received.
 */
export const SUPPORTED_REPORT_VERSIONS: readonly string[] = ['1.0'] as const

export function isVersionSupported(v: string): boolean {
  return (SUPPORTED_REPORT_VERSIONS as readonly string[]).includes(v)
}
