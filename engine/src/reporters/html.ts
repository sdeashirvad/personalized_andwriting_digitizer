import type { DiffResult } from '../models/types.js'
import type { RiskScore } from '../rules/risk.js'
import type { ImpactReport } from './impact.js'

export function toHTML(result: DiffResult, riskScore: RiskScore, impactReports: ImpactReport[]): string {
  const riskColor: Record<string, string> = {
    NONE: '#10b981', LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed',
  }
  const sevColor: Record<string, string> = {
    HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#71717a',
  }

  const breakingChanges = result.changes.filter(c => c.breaking)
  const nonBreakingChanges = result.changes.filter(c => !c.breaking)
  const breakingImpacts = impactReports.filter(r => r.change.breaking)

  function changeRow(c: (typeof result.changes)[0]): string {
    return `
      <tr>
        <td><span class="badge" style="background:${sevColor[c.severity]}22;color:${sevColor[c.severity]};border:1px solid ${sevColor[c.severity]}44">${c.severity}</span></td>
        <td style="font-family:monospace;font-size:12px">${c.method ? `<strong>${c.method.toUpperCase()}</strong> ` : ''}${c.path}</td>
        <td style="font-size:13px;color:#a1a1aa">${c.description}</td>
        ${c.oldValue !== undefined ? `<td style="font-family:monospace;font-size:11px;color:#f87171">${String(c.oldValue)}</td>` : '<td>—</td>'}
        ${c.newValue !== undefined ? `<td style="font-family:monospace;font-size:11px;color:#34d399">${String(c.newValue)}</td>` : '<td>—</td>'}
      </tr>`
  }

  function impactBlock(r: ImpactReport): string {
    return `
      <div class="impact-block">
        <div class="impact-title">
          <span class="badge" style="background:#ef444422;color:#ef4444;border:1px solid #ef444444">${r.change.severity}</span>
          <code>${r.change.method ? r.change.method.toUpperCase() + ' ' : ''}${r.change.path}</code>
          <span style="color:#a1a1aa;font-size:13px">${r.change.description}</span>
        </div>
        <ul>${r.impacts.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Contract Diff Report — ${result.metadata.oldTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #e4e4e7; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
    header { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #27272a; }
    .logo { width: 36px; height: 36px; background: #6366f1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    h1 { font-size: 20px; font-weight: 700; color: #f4f4f5; }
    h2 { font-size: 16px; font-weight: 600; color: #f4f4f5; margin-bottom: 16px; }
    .meta { font-size: 12px; color: #71717a; margin-top: 2px; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 16px; }
    .card-label { font-size: 11px; color: #71717a; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 800; }
    .card-sub { font-size: 11px; color: #52525b; margin-top: 4px; }
    .section { background: #18181b; border: 1px solid #27272a; border-radius: 10px; margin-bottom: 24px; overflow: hidden; }
    .section-header { padding: 14px 20px; border-bottom: 1px solid #27272a; display: flex; align-items: center; gap: 8px; }
    .section-header h2 { margin: 0; }
    .count { background: #27272a; border: 1px solid #3f3f46; border-radius: 999px; padding: 2px 8px; font-size: 11px; color: #a1a1aa; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 10px 20px; font-size: 11px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #27272a; }
    td { padding: 12px 20px; border-bottom: 1px solid #18181b; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #1f1f23; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: .05em; }
    .risk-score { display: flex; align-items: baseline; gap: 12px; padding: 20px; }
    .risk-number { font-size: 48px; font-weight: 900; }
    .risk-cat { font-size: 18px; font-weight: 700; }
    .breakdown { padding: 0 20px 16px; }
    .breakdown-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #27272a; }
    .breakdown-row:last-child { border-bottom: none; }
    .bar { flex: 1; height: 4px; background: #27272a; border-radius: 2px; overflow: hidden; }
    .bar-fill { height: 100%; background: #6366f1; border-radius: 2px; }
    .impact-block { padding: 16px 20px; border-bottom: 1px solid #27272a; }
    .impact-block:last-child { border-bottom: none; }
    .impact-title { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .impact-title code { font-family: monospace; font-size: 12px; color: #a78bfa; }
    ul { padding-left: 16px; color: #a1a1aa; font-size: 13px; }
    ul li { margin-bottom: 4px; }
    footer { text-align: center; color: #52525b; font-size: 12px; padding: 32px 0 0; border-top: 1px solid #27272a; margin-top: 40px; }
    @media (max-width: 600px) { .cards { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">⚡</div>
    <div>
      <h1>API Contract Diff Report</h1>
      <div class="meta">${result.metadata.oldTitle} v${result.metadata.oldVersion} → v${result.metadata.newVersion} &middot; Generated ${result.metadata.timestamp.slice(0, 19).replace('T', ' ')} UTC</div>
    </div>
  </header>

  <div class="cards">
    <div class="card">
      <div class="card-label">Total Changes</div>
      <div class="card-value" style="color:#f4f4f5">${result.summary.total}</div>
      <div class="card-sub">${result.summary.total} detected</div>
    </div>
    <div class="card">
      <div class="card-label">Breaking</div>
      <div class="card-value" style="color:${result.summary.breaking > 0 ? '#ef4444' : '#f4f4f5'}">${result.summary.breaking}</div>
      <div class="card-sub">${result.summary.breaking > 0 ? 'Need attention' : 'All clear'}</div>
    </div>
    <div class="card">
      <div class="card-label">Non-Breaking</div>
      <div class="card-value" style="color:${result.summary.nonBreaking > 0 ? '#10b981' : '#f4f4f5'}">${result.summary.nonBreaking}</div>
      <div class="card-sub">${result.summary.nonBreaking > 0 ? 'Safe to ship' : 'None'}</div>
    </div>
    <div class="card">
      <div class="card-label">Risk Score</div>
      <div class="card-value" style="color:${riskColor[riskScore.category]}">${riskScore.score}</div>
      <div class="card-sub">${riskScore.category}</div>
    </div>
  </div>

  <div class="section" style="margin-bottom:24px">
    <div class="section-header"><h2>Risk Analysis</h2></div>
    <div class="risk-score">
      <div class="risk-number" style="color:${riskColor[riskScore.category]}">${riskScore.score}</div>
      <div>
        <div class="risk-cat" style="color:${riskColor[riskScore.category]}">${riskScore.category} RISK</div>
        <div style="font-size:12px;color:#71717a;margin-top:2px">${result.summary.bySeverity.HIGH}H · ${result.summary.bySeverity.MEDIUM}M · ${result.summary.bySeverity.LOW}L</div>
      </div>
    </div>
    ${riskScore.breakdown.length > 0 ? `
    <div class="breakdown">
      ${riskScore.breakdown.map(b => {
        const pct = Math.min(100, Math.round((b.contribution / riskScore.score) * 100))
        return `<div class="breakdown-row">
          <span style="width:180px;color:#a1a1aa">${b.label}</span>
          <span style="color:#71717a;width:60px">×${b.count} (w${b.weight})</span>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span style="color:#f4f4f5;font-weight:600;width:32px;text-align:right">${b.contribution}</span>
        </div>`
      }).join('')}
    </div>` : ''}
  </div>

  ${breakingChanges.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <h2 style="color:#ef4444">Breaking Changes</h2>
      <span class="count">${breakingChanges.length}</span>
    </div>
    <table>
      <thead><tr><th>Severity</th><th>Endpoint</th><th>Description</th><th>Old</th><th>New</th></tr></thead>
      <tbody>${breakingChanges.map(changeRow).join('')}</tbody>
    </table>
  </div>` : ''}

  ${nonBreakingChanges.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <h2 style="color:#10b981">Non-Breaking Changes</h2>
      <span class="count">${nonBreakingChanges.length}</span>
    </div>
    <table>
      <thead><tr><th>Severity</th><th>Endpoint</th><th>Description</th><th>Old</th><th>New</th></tr></thead>
      <tbody>${nonBreakingChanges.map(changeRow).join('')}</tbody>
    </table>
  </div>` : ''}

  ${breakingImpacts.length > 0 ? `
  <div class="section">
    <div class="section-header"><h2>Consumer Impact Analysis</h2><span class="count">${breakingImpacts.length} affected</span></div>
    ${breakingImpacts.map(impactBlock).join('')}
  </div>` : ''}

  <footer>
    <p>Generated by API Contract Diff Engine v1.0.0 &middot; future-ready for global package swap</p>
  </footer>
</div>
</body>
</html>`
}
