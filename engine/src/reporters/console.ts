import type { DiffResult, DiffChange, Severity } from '../models/types.js'

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
}

function color(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${COLORS.reset}`
}

function severityColor(severity: Severity): string {
  switch (severity) {
    case 'HIGH': return COLORS.red
    case 'MEDIUM': return COLORS.yellow
    case 'LOW': return COLORS.blue
    case 'INFO': return COLORS.gray
  }
}

export function toConsole(result: DiffResult): string {
  const { summary, changes, metadata } = result
  const lines: string[] = []

  lines.push('')
  lines.push(color('  API Contract Diff', COLORS.bold, COLORS.cyan))
  lines.push(color(`  ${metadata.oldTitle} v${metadata.oldVersion} → v${metadata.newVersion}`, COLORS.gray))
  lines.push('')
  lines.push(color('  Summary', COLORS.bold))
  lines.push(`  Total changes  : ${color(String(summary.total), COLORS.bold)}`)
  lines.push(`  Breaking       : ${color(String(summary.breaking), COLORS.bold, COLORS.red)}`)
  lines.push(`  Non-breaking   : ${color(String(summary.nonBreaking), COLORS.bold, COLORS.green)}`)
  lines.push(`  HIGH / MEDIUM  : ${summary.bySeverity.HIGH} / ${summary.bySeverity.MEDIUM}`)
  lines.push(`  LOW / INFO     : ${summary.bySeverity.LOW} / ${summary.bySeverity.INFO}`)
  lines.push('')

  const breaking = changes.filter(c => c.breaking)
  const nonBreaking = changes.filter(c => !c.breaking)

  if (breaking.length > 0) {
    lines.push(color('  Breaking Changes', COLORS.bold, COLORS.red))
    for (const c of breaking) lines.push(formatConsoleChange(c))
    lines.push('')
  }

  if (nonBreaking.length > 0) {
    lines.push(color('  Non-Breaking Changes', COLORS.bold, COLORS.green))
    for (const c of nonBreaking) lines.push(formatConsoleChange(c))
    lines.push('')
  }

  if (changes.length === 0) {
    lines.push(color('  No changes detected — contracts are identical', COLORS.gray))
    lines.push('')
  }

  return lines.join('\n')
}

function formatConsoleChange(c: DiffChange): string {
  const sev = color(`[${c.severity}]`, severityColor(c.severity), COLORS.bold)
  const method = c.method ? color(c.method.toUpperCase(), COLORS.bold) + ' ' : ''
  const path = color(c.path, COLORS.white)
  return `    ${sev} ${method}${path}\n    ${color(c.description, COLORS.gray)}`
}
