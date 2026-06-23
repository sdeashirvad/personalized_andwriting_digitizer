import type { ContractDiffReport } from '../report/ContractDiffReport.js'
import type { DiffResult, DiffChange } from '../models/types.js'

const RISK_EMOJI: Record<string, string> = {
  NONE: '✅', LOW: '🔵', MEDIUM: '🟡', HIGH: '🔴', CRITICAL: '🚨',
}

/**
 * Render a ContractDiffReport as a Markdown document.
 * Includes risk score and report metadata.
 */
export function toMarkdownReport(report: ContractDiffReport): string {
  const { summary, changes, metadata, riskScore, riskLevel, generatedAt, toolVersion, reportVersion } = report
  const emoji = RISK_EMOJI[riskLevel] ?? '⚠️'
  const lines: string[] = []

  lines.push(`# API Contract Diff Report`)
  lines.push(``)
  lines.push(`**${metadata.oldTitle}** \`${metadata.oldVersion}\` → \`${metadata.newVersion}\``)
  lines.push(``)
  lines.push(`| Field | Value |`)
  lines.push(`|-------|-------|`)
  lines.push(`| Generated | \`${generatedAt.slice(0, 19).replace('T', ' ')} UTC\` |`)
  lines.push(`| Tool version | \`${toolVersion}\` |`)
  lines.push(`| Report version | \`${reportVersion}\` |`)
  lines.push(``)
  lines.push(`## Summary`)
  lines.push(``)
  lines.push(`| Metric | Count |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total Changes | **${summary.total}** |`)
  lines.push(`| 🔴 Breaking | **${summary.breaking}** |`)
  lines.push(`| 🟢 Non-Breaking | **${summary.nonBreaking}** |`)
  lines.push(`| HIGH severity | ${summary.bySeverity.HIGH} |`)
  lines.push(`| MEDIUM severity | ${summary.bySeverity.MEDIUM} |`)
  lines.push(`| LOW severity | ${summary.bySeverity.LOW} |`)
  lines.push(`| INFO | ${summary.bySeverity.INFO} |`)
  lines.push(``)
  lines.push(`## ${emoji} Risk Score`)
  lines.push(``)
  lines.push(`**Score:** ${riskScore} — **${riskLevel}**`)
  lines.push(``)

  if (report.riskBreakdown.length > 0) {
    lines.push(`| Change type | Count | Weight | Contribution |`)
    lines.push(`|-------------|-------|--------|-------------|`)
    for (const b of report.riskBreakdown) {
      lines.push(`| ${b.label} | ${b.count} | ${b.weight} | **${b.contribution}** |`)
    }
    lines.push(``)
  }

  const breaking    = changes.filter(c => c.breaking)
  const nonBreaking = changes.filter(c => !c.breaking)

  if (breaking.length > 0) {
    lines.push(`## Breaking Changes`)
    lines.push(``)
    lines.push(`| Severity | Method | Path | Description |`)
    lines.push(`|----------|--------|------|-------------|`)
    for (const ch of breaking) lines.push(tableRow(ch))
    lines.push(``)
  }

  if (nonBreaking.length > 0) {
    lines.push(`## Non-Breaking Changes`)
    lines.push(``)
    lines.push(`| Severity | Method | Path | Description |`)
    lines.push(`|----------|--------|------|-------------|`)
    for (const ch of nonBreaking) lines.push(tableRow(ch))
    lines.push(``)
  }

  if (changes.length === 0) {
    lines.push(`## No Changes Detected`)
    lines.push(``)
    lines.push(`The two contracts are identical.`)
  }

  return lines.join('\n')
}

function tableRow(c: DiffChange): string {
  const method = c.method ? `\`${c.method.toUpperCase()}\`` : '—'
  return `| **${c.severity}** | ${method} | \`${c.path}\` | ${c.description} |`
}

/**
 * Legacy helper for raw DiffResult. Prefer toMarkdownReport().
 * @deprecated Use generateReport() + toMarkdownReport() instead.
 */
export function toMarkdown(result: DiffResult): string {
  const { summary, changes, metadata } = result
  const lines: string[] = []
  lines.push(`# API Contract Diff Report`)
  lines.push(``)
  lines.push(`**${metadata.oldTitle}** \`${metadata.oldVersion}\` → \`${metadata.newVersion}\``)
  lines.push(`Generated: ${metadata.timestamp}`)
  lines.push(``)
  lines.push(`## Summary`)
  lines.push(``)
  lines.push(`| Metric | Count |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total Changes | ${summary.total} |`)
  lines.push(`| 🔴 Breaking | ${summary.breaking} |`)
  lines.push(`| 🟢 Non-Breaking | ${summary.nonBreaking} |`)
  lines.push(``)
  for (const c of changes) {
    const method = c.method ? `\`${c.method.toUpperCase()}\`` : ''
    lines.push(`- **[${c.severity}]** ${method} \`${c.path}\` — ${c.description}`)
  }
  return lines.join('\n')
}
