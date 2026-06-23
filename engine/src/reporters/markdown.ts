import type { DiffResult, DiffChange } from '../models/types.js'

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
  lines.push(`| HIGH severity | ${summary.bySeverity.HIGH} |`)
  lines.push(`| MEDIUM severity | ${summary.bySeverity.MEDIUM} |`)
  lines.push(`| LOW severity | ${summary.bySeverity.LOW} |`)
  lines.push(`| INFO | ${summary.bySeverity.INFO} |`)
  lines.push(``)

  const breaking = changes.filter(c => c.breaking)
  const nonBreaking = changes.filter(c => !c.breaking)

  if (breaking.length > 0) {
    lines.push(`## Breaking Changes`)
    lines.push(``)
    for (const c of breaking) {
      lines.push(formatChange(c))
    }
  }

  if (nonBreaking.length > 0) {
    lines.push(`## Non-Breaking Changes`)
    lines.push(``)
    for (const c of nonBreaking) {
      lines.push(formatChange(c))
    }
  }

  if (changes.length === 0) {
    lines.push(`## No Changes Detected`)
    lines.push(``)
    lines.push(`The two contracts are identical.`)
  }

  return lines.join('\n')
}

function formatChange(c: DiffChange): string {
  const method = c.method ? `\`${c.method.toUpperCase()}\`` : ''
  const path = `\`${c.path}\``
  const severity = `**[${c.severity}]**`
  const parts = [severity, method, path, '—', c.description].filter(Boolean)
  return `- ${parts.join(' ')}`
}
