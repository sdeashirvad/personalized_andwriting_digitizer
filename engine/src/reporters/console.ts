import type { ContractDiffReport } from '../report/ContractDiffReport.js'
import type { DiffResult, DiffChange, Severity } from '../models/types.js'

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  white:  '\x1b[97m',
}

function c(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${C.reset}`
}

function sevColor(severity: Severity): string {
  switch (severity) {
    case 'HIGH':   return C.red
    case 'MEDIUM': return C.yellow
    case 'LOW':    return C.blue
    case 'INFO':   return C.gray
  }
}

function riskColor(level: string): string {
  switch (level) {
    case 'CRITICAL': return C.magenta
    case 'HIGH':     return C.red
    case 'MEDIUM':   return C.yellow
    case 'LOW':      return C.blue
    default:         return C.green
  }
}

/**
 * Render a ContractDiffReport as a human-friendly terminal string.
 * Includes risk score section in addition to the change list.
 */
export function toConsoleReport(report: ContractDiffReport): string {
  const { summary, changes, metadata, riskScore, riskLevel, riskBreakdown } = report
  const lines: string[] = []

  lines.push('')
  lines.push(c('  API Contract Diff', C.bold, C.cyan))
  lines.push(c(`  ${metadata.oldTitle} v${metadata.oldVersion} → v${metadata.newVersion}`, C.gray))
  lines.push(c(`  Generated: ${report.generatedAt.slice(0, 19).replace('T', ' ')} UTC`, C.gray))
  lines.push('')

  // Summary table
  lines.push(c('  Summary', C.bold))
  lines.push(`  Total changes  : ${c(String(summary.total), C.bold)}`)
  lines.push(`  Breaking       : ${c(String(summary.breaking), C.bold, C.red)}`)
  lines.push(`  Non-breaking   : ${c(String(summary.nonBreaking), C.bold, C.green)}`)
  lines.push(`  HIGH / MEDIUM  : ${summary.bySeverity.HIGH} / ${summary.bySeverity.MEDIUM}`)
  lines.push(`  LOW / INFO     : ${summary.bySeverity.LOW} / ${summary.bySeverity.INFO}`)
  lines.push('')

  // Risk score
  lines.push(c('  Risk Score', C.bold))
  lines.push(`  Score    : ${c(String(riskScore), C.bold, riskColor(riskLevel))}`)
  lines.push(`  Level    : ${c(riskLevel, C.bold, riskColor(riskLevel))}`)
  if (riskBreakdown.length > 0) {
    lines.push(`  Top factors:`)
    for (const b of riskBreakdown.slice(0, 4)) {
      lines.push(`    ${c(b.label.padEnd(28), C.gray)} ×${b.count} (w${b.weight}) = ${c(String(b.contribution), riskColor(riskLevel))}`)
    }
  }
  lines.push('')

  const breaking    = changes.filter(c => c.breaking)
  const nonBreaking = changes.filter(c => !c.breaking)

  if (breaking.length > 0) {
    lines.push(c('  Breaking Changes', C.bold, C.red))
    for (const ch of breaking) lines.push(formatChange(ch))
    lines.push('')
  }

  if (nonBreaking.length > 0) {
    lines.push(c('  Non-Breaking Changes', C.bold, C.green))
    for (const ch of nonBreaking) lines.push(formatChange(ch))
    lines.push('')
  }

  if (changes.length === 0) {
    lines.push(c('  No changes detected — contracts are identical', C.gray))
    lines.push('')
  }

  // Governance summary (only when config was applied)
  const g = report.governance
  if (g) {
    lines.push(c('  Governance Summary', C.bold, C.cyan))
    lines.push(`  Approved Changes    : ${c(String(g.approved),          C.bold, C.green)}`)
    lines.push(`  Expired Approvals   : ${c(String(g.expired),           C.bold, C.yellow)}`)
    lines.push(`  Suppressed Findings : ${c(String(g.suppressed),        C.bold, C.gray)}`)
    lines.push(`  Unapproved Breaking : ${c(String(g.unapprovedBreaking),C.bold, g.unapprovedBreaking > 0 ? C.red : C.green)}`)
    if (g.configPath) lines.push(`  Config              : ${c(g.configPath, C.gray)}`)
    lines.push('')

    // List APPROVED changes with ownership metadata
    const approved = changes.filter(ch => ch.governanceStatus === 'APPROVED')
    if (approved.length > 0) {
      lines.push(c('  Approved Changes', C.bold, C.green))
      for (const ch of approved) {
        const m = ch.method ? c(ch.method.toUpperCase(), C.bold) + ' ' : ''
        lines.push(`    ${c('[APPROVED]', C.green, C.bold)} ${m}${c(ch.path, C.white)}`)
        if (ch.governanceMetadata) {
          const gm = ch.governanceMetadata
          lines.push(`    ${c('  Owner:', C.gray)} ${gm.owner}  ${c('Approved by:', C.gray)} ${gm.approvedBy}`)
          lines.push(`    ${c('  Reason:', C.gray)} ${gm.reason}`)
          if (gm.expires) lines.push(`    ${c('  Expires:', C.gray)} ${gm.expires}`)
        }
      }
      lines.push('')
    }

    // List EXPIRED approvals
    const expired = changes.filter(ch => ch.governanceStatus === 'EXPIRED')
    if (expired.length > 0) {
      lines.push(c('  Expired Approvals ⚠', C.bold, C.yellow))
      for (const ch of expired) {
        const m = ch.method ? c(ch.method.toUpperCase(), C.bold) + ' ' : ''
        lines.push(`    ${c('[EXPIRED]', C.yellow, C.bold)} ${m}${c(ch.path, C.white)}`)
        if (ch.governanceMetadata?.expires) {
          lines.push(`    ${c('  Expired:', C.yellow)} ${ch.governanceMetadata.expires}`)
        }
      }
      lines.push('')
    }

    // List UNAPPROVED breaking changes
    if (g.unapprovedBreaking > 0) {
      lines.push(c('  Unapproved Breaking Changes', C.bold, C.red))
      for (const ch of changes.filter(ch => ch.governanceStatus === 'UNAPPROVED')) {
        const m = ch.method ? c(ch.method.toUpperCase(), C.bold) + ' ' : ''
        lines.push(`    ${c('[UNAPPROVED]', C.red, C.bold)} ${m}${c(ch.path, C.white)}`)
        lines.push(`    ${c('  Add an approvedChanges entry to specguard.yml to govern this change.', C.gray)}`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function formatChange(ch: DiffChange): string {
  const sev    = c(`[${ch.severity}]`, sevColor(ch.severity), C.bold)
  const method = ch.method ? c(ch.method.toUpperCase(), C.bold) + ' ' : ''
  const path   = c(ch.path, C.white)
  const values = ch.oldValue !== undefined && ch.newValue !== undefined
    ? c(` (${ch.oldValue} → ${ch.newValue})`, C.gray) : ''
  return `    ${sev} ${method}${path}${values}\n    ${c(ch.description, C.gray)}`
}

/**
 * Legacy helper for raw DiffResult. Prefer toConsoleReport().
 * @deprecated Use generateReport() + toConsoleReport() instead.
 */
export function toConsole(result: DiffResult): string {
  const { summary, changes, metadata } = result
  const lines: string[] = []
  lines.push('')
  lines.push(c('  API Contract Diff', C.bold, C.cyan))
  lines.push(c(`  ${metadata.oldTitle} v${metadata.oldVersion} → v${metadata.newVersion}`, C.gray))
  lines.push('')
  lines.push(c('  Summary', C.bold))
  lines.push(`  Total    : ${c(String(summary.total), C.bold)}`)
  lines.push(`  Breaking : ${c(String(summary.breaking), C.bold, C.red)}`)
  lines.push('')
  for (const ch of changes) lines.push(formatChange(ch))
  lines.push('')
  return lines.join('\n')
}
