import { load as yamlLoad } from 'js-yaml'
import {
  compareContracts,
  generateReport,
  toJSONReport,
  determineExitCode,
} from '@api-contract-diff/engine'
import type {
  OpenAPIContract,
  ContractDiffReport,
  RiskScore,
  ImpactReport,
  RiskBreakdownItem,
  SpecGuardConfig,
} from '@api-contract-diff/engine'
import { TOOL_VERSION } from '@api-contract-diff/engine'

export type { ContractDiffReport, RiskScore, ImpactReport, RiskBreakdownItem, SpecGuardConfig }

export type EngineMode = 'local' | 'global'
export const ENGINE_MODE: EngineMode = 'local'
export const ENGINE_VERSION = TOOL_VERSION

export interface RunDiffOptions {
  oldContract: string
  newContract: string
  /** Optional in-memory governance config (browser equivalent of specguard.yml) */
  governanceConfig?: SpecGuardConfig
}

export interface RunDiffResult {
  report: ContractDiffReport
  /** Convenience aliases retained for existing component compatibility */
  result: { summary: ContractDiffReport['summary']; changes: ContractDiffReport['changes']; metadata: ContractDiffReport['metadata'] }
  riskScore: RiskScore
  impactReports: ImpactReport[]
  engineMode: EngineMode
  engineVersion: string
  durationMs: number
}

export function parseContractText(input: string): OpenAPIContract {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as OpenAPIContract
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`)
    }
  }
  try {
    const parsed = yamlLoad(trimmed)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('YAML did not parse to an object — check your formatting')
    }
    return parsed as OpenAPIContract
  } catch (e) {
    throw new Error(`Invalid YAML: ${(e as Error).message}`)
  }
}

export function runDiff(options: RunDiffOptions): RunDiffResult {
  if (ENGINE_MODE === 'global') {
    throw new Error('Global engine not yet configured.')
  }
  const t0 = performance.now()

  const oldSpec = parseContractText(options.oldContract)
  const newSpec = parseContractText(options.newContract)

  const diffResult = compareContracts(oldSpec, newSpec)

  // generateReport is now the canonical pipeline step — governance config optional
  const report = generateReport(diffResult, options.governanceConfig)

  // Compatibility shims for existing components
  const riskScore: RiskScore = {
    score: report.riskScore,
    category: report.riskLevel,
    breakdown: report.riskBreakdown,
    topContributors: report.changes
      .filter(c => c.breaking)
      .slice(0, 5),
  }

  return {
    report,
    result: {
      summary: report.summary,
      changes: report.changes,
      metadata: report.metadata,
    },
    riskScore,
    impactReports: report.impacts,
    engineMode: ENGINE_MODE,
    engineVersion: ENGINE_VERSION,
    durationMs: Math.round(performance.now() - t0),
  }
}

export function generateHTMLReport(diffResult: RunDiffResult): string {
  const { report } = diffResult
  const exitCode = determineExitCode(report)

  const riskColor: Record<string, string> = {
    NONE: '#10b981', LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed',
  }
  const sevColor: Record<string, string> = {
    HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#71717a',
  }

  const breakingChanges  = report.changes.filter(c => c.breaking)
  const nonBreakingChanges = report.changes.filter(c => !c.breaking)
  const breakingImpacts  = report.impacts.filter(r => r.change.breaking)

  function changeRow(c: (typeof report.changes)[0]): string {
    return `<tr>
      <td><span style="display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:${sevColor[c.severity]}22;color:${sevColor[c.severity]};border:1px solid ${sevColor[c.severity]}44">${c.severity}</span></td>
      <td style="font-family:monospace;font-size:12px">${c.method ? `<strong>${c.method.toUpperCase()}</strong> ` : ''}${c.path}</td>
      <td style="font-size:13px;color:#a1a1aa">${c.description}</td>
      <td style="font-family:monospace;font-size:11px;color:#f87171">${c.oldValue !== undefined ? String(c.oldValue) : '—'}</td>
      <td style="font-family:monospace;font-size:11px;color:#34d399">${c.newValue !== undefined ? String(c.newValue) : '—'}</td>
    </tr>`
  }

  function impactBlock(r: ImpactReport): string {
    return `<div style="padding:16px 20px;border-bottom:1px solid #27272a">
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <span style="display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:#ef444422;color:#ef4444;border:1px solid #ef444444">${r.change.severity}</span>
        <code style="font-family:monospace;font-size:12px;color:#a78bfa">${r.change.method ? r.change.method.toUpperCase() + ' ' : ''}${r.change.path}</code>
        <span style="color:#a1a1aa;font-size:13px">${r.change.description}</span>
      </div>
      <ul style="padding-left:16px;color:#a1a1aa;font-size:13px">${r.impacts.map((i: string) => `<li style="margin-bottom:4px">${i}</li>`).join('')}</ul>
    </div>`
  }

  const exitLabel = ['OK', 'MEDIUM BREAKING', 'HIGH BREAKING', 'INVALID CONTRACT', 'INTERNAL ERROR']

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>API Contract Diff Report — ${report.metadata.oldTitle}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090b;color:#e4e4e7;line-height:1.6}
.wrap{max-width:960px;margin:0 auto;padding:40px 24px}
header{display:flex;align-items:center;gap:12px;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #27272a}
.logo{width:36px;height:36px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px}
h1{font-size:20px;font-weight:700;color:#f4f4f5}
h2{font-size:15px;font-weight:600;color:#f4f4f5;margin:0}
.meta{font-size:12px;color:#71717a;margin-top:2px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
.card{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px}
.card-label{font-size:11px;color:#71717a;font-weight:500;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.card-value{font-size:28px;font-weight:800}
.card-sub{font-size:11px;color:#52525b;margin-top:4px}
.section{background:#18181b;border:1px solid #27272a;border-radius:10px;margin-bottom:24px;overflow:hidden}
.sec-hdr{padding:14px 20px;border-bottom:1px solid #27272a;display:flex;align-items:center;gap:8px}
.count{background:#27272a;border:1px solid #3f3f46;border-radius:999px;padding:2px 8px;font-size:11px;color:#a1a1aa}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 20px;font-size:11px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #27272a}
td{padding:12px 20px;border-bottom:1px solid #18181b;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#1f1f23}
.risk-score{display:flex;align-items:baseline;gap:12px;padding:20px}
.risk-num{font-size:48px;font-weight:900}
.bdwn{padding:0 20px 16px}
.bdwn-row{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #27272a}
.bdwn-row:last-child{border-bottom:none}
.bar{flex:1;height:4px;background:#27272a;border-radius:2px;overflow:hidden}
.bar-fill{height:100%;background:#6366f1;border-radius:2px}
.exit-badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;background:#27272a;color:#a1a1aa;border:1px solid #3f3f46;font-family:monospace}
footer{text-align:center;color:#52525b;font-size:12px;padding:32px 0 0;border-top:1px solid #27272a;margin-top:40px}
@media(max-width:600px){.cards{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body><div class="wrap">
<header>
  <div class="logo">⚡</div>
  <div>
    <h1>API Contract Diff Report</h1>
    <div class="meta">${report.metadata.oldTitle} v${report.metadata.oldVersion} → v${report.metadata.newVersion} · ${report.generatedAt.slice(0,19).replace('T',' ')} UTC · Schema v${report.reportVersion}</div>
  </div>
</header>
<div class="cards">
  <div class="card"><div class="card-label">Total Changes</div><div class="card-value" style="color:#f4f4f5">${report.summary.total}</div><div class="card-sub">${report.summary.total} detected</div></div>
  <div class="card"><div class="card-label">Breaking</div><div class="card-value" style="color:${report.summary.breaking>0?'#ef4444':'#f4f4f5'}">${report.summary.breaking}</div><div class="card-sub">${report.summary.breaking>0?'Need attention':'All clear'}</div></div>
  <div class="card"><div class="card-label">Non-Breaking</div><div class="card-value" style="color:${report.summary.nonBreaking>0?'#10b981':'#f4f4f5'}">${report.summary.nonBreaking}</div><div class="card-sub">${report.summary.nonBreaking>0?'Safe to ship':'None'}</div></div>
  <div class="card"><div class="card-label">Risk Score</div><div class="card-value" style="color:${riskColor[report.riskLevel]}">${report.riskScore}</div><div class="card-sub">${report.riskLevel}</div></div>
</div>
<div class="section" style="margin-bottom:24px">
  <div class="sec-hdr"><h2>Risk Analysis</h2><span class="exit-badge">exit ${exitCode} — ${exitLabel[exitCode]}</span></div>
  <div class="risk-score">
    <div class="risk-num" style="color:${riskColor[report.riskLevel]}">${report.riskScore}</div>
    <div>
      <div style="font-size:18px;font-weight:700;color:${riskColor[report.riskLevel]}">${report.riskLevel} RISK</div>
      <div style="font-size:12px;color:#71717a;margin-top:2px">${report.summary.bySeverity.HIGH}H · ${report.summary.bySeverity.MEDIUM}M · ${report.summary.bySeverity.LOW}L</div>
    </div>
  </div>
  ${report.riskBreakdown.length > 0 ? `<div class="bdwn">${report.riskBreakdown.map((b: RiskBreakdownItem) => {
    const pct = Math.min(100, Math.round((b.contribution / report.riskScore) * 100))
    return `<div class="bdwn-row"><span style="width:200px;color:#a1a1aa">${b.label}</span><span style="color:#71717a;width:70px">×${b.count} (w${b.weight})</span><div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div><span style="color:#f4f4f5;font-weight:600;width:32px;text-align:right">${b.contribution}</span></div>`
  }).join('')}</div>` : ''}
</div>
${breakingChanges.length > 0 ? `<div class="section"><div class="sec-hdr"><h2 style="color:#ef4444">Breaking Changes</h2><span class="count">${breakingChanges.length}</span></div><table><thead><tr><th>Severity</th><th>Endpoint</th><th>Description</th><th>Old</th><th>New</th></tr></thead><tbody>${breakingChanges.map(changeRow).join('')}</tbody></table></div>` : ''}
${nonBreakingChanges.length > 0 ? `<div class="section"><div class="sec-hdr"><h2 style="color:#10b981">Non-Breaking Changes</h2><span class="count">${nonBreakingChanges.length}</span></div><table><thead><tr><th>Severity</th><th>Endpoint</th><th>Description</th><th>Old</th><th>New</th></tr></thead><tbody>${nonBreakingChanges.map(changeRow).join('')}</tbody></table></div>` : ''}
${breakingImpacts.length > 0 ? `<div class="section"><div class="sec-hdr"><h2>Consumer Impact Analysis</h2><span class="count">${breakingImpacts.length} affected</span></div>${breakingImpacts.map(impactBlock).join('')}</div>` : ''}
<div class="section"><div class="sec-hdr"><h2>Machine-Readable Report</h2></div><div style="padding:16px 20px"><p style="font-size:12px;color:#71717a;margin-bottom:12px">ContractDiffReport schema v${report.reportVersion} — stable, versioned, machine-readable JSON.</p><pre style="font-size:10px;color:#a1a1aa;background:#09090b;padding:16px;border-radius:6px;overflow:auto;max-height:200px">${JSON.stringify({reportVersion:report.reportVersion,toolVersion:report.toolVersion,generatedAt:report.generatedAt,riskScore:report.riskScore,riskLevel:report.riskLevel,summary:report.summary}, null, 2)}</pre></div></div>
<footer><p>Generated by API Contract Diff Engine v${report.toolVersion} · Report schema v${report.reportVersion} · <a href="https://github.com/your-org/api-contract-diff" style="color:#6366f1">github.com/your-org/api-contract-diff</a></p></footer>
</div></body></html>`
}

export function generateJSONReport(diffResult: RunDiffResult): string {
  return toJSONReport(diffResult.report)
}
