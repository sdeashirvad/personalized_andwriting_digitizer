import { useState } from 'react'
import { useStudio } from '../context/useStudio'
import { generateJSONReport } from '../engine/adapter'
import { TabBtn } from '../components/TabBtn'
import { FileJson, Eye, Code2, BookOpen, Copy, CheckCheck, Download, FlaskConical } from 'lucide-react'

type View = 'rendered' | 'json' | 'schema'

export function ReportExplorer() {
  const { result, navigateTo } = useStudio()
  const [view, setView] = useState<View>('rendered')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(generateJSONReport(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([generateJSONReport(result)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specguard-report-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-500" />
            Report Explorer
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Inspect the <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">ContractDiffReport</code> — the versioned, machine-readable output of every SpecGuard run
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              report.json
            </button>
          </div>
        )}
      </div>

      {!result ? (
        <NoReport onNavigate={() => navigateTo('playground')} />
      ) : (
        <>
          {/* Consistency strip */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-semibold">Report</span>
            <MetaItem label="reportVersion" value={result.report.reportVersion} />
            <MetaItem label="toolVersion" value={result.report.toolVersion} />
            <MetaItem label="riskLevel" value={result.report.riskLevel} color={
              result.report.riskLevel === 'HIGH' || result.report.riskLevel === 'CRITICAL' ? 'text-red-500 dark:text-red-400' :
              result.report.riskLevel === 'MEDIUM' ? 'text-amber-500 dark:text-amber-400' :
              result.report.riskLevel === 'LOW' ? 'text-blue-500 dark:text-blue-400' :
              'text-emerald-500 dark:text-emerald-400'
            } />
            <MetaItem label="riskScore" value={String(result.report.riskScore)} />
            <MetaItem label="breaking" value={String(result.report.summary.breaking)} />
            <MetaItem label="generatedAt" value={result.report.generatedAt.slice(0, 19).replace('T', ' ') + ' UTC'} />
          </div>

          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800">
            <TabBtn active={view === 'rendered'} onClick={() => setView('rendered')}><Eye className="w-3.5 h-3.5" /> Rendered</TabBtn>
            <TabBtn active={view === 'json'} onClick={() => setView('json')}><Code2 className="w-3.5 h-3.5" /> Raw JSON</TabBtn>
            <TabBtn active={view === 'schema'} onClick={() => setView('schema')}><BookOpen className="w-3.5 h-3.5" /> Schema</TabBtn>
          </div>

          {view === 'rendered' && <RenderedView report={result.report} />}
          {view === 'json' && <JsonView jsonStr={generateJSONReport(result)} />}
          {view === 'schema' && <SchemaView />}
        </>
      )}
    </div>
  )
}

function MetaItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{label}:</span>
      <span className={`text-[10px] font-mono font-semibold ${color ?? 'text-zinc-700 dark:text-zinc-300'}`}>{value}</span>
    </div>
  )
}

function RenderedView({ report }: { report: import('../engine/adapter').ContractDiffReport }) {
  const riskColors: Record<string, string> = {
    NONE: 'text-emerald-500 dark:text-emerald-400',
    LOW: 'text-blue-500 dark:text-blue-400',
    MEDIUM: 'text-amber-500 dark:text-amber-400',
    HIGH: 'text-red-500 dark:text-red-400',
    CRITICAL: 'text-violet-500 dark:text-violet-400',
  }
  const sevColors: Record<string, string> = {
    HIGH: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    MEDIUM: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    LOW: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    INFO: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  }
  const govColors: Record<string, string> = {
    APPROVED: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    EXPIRED: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    SUPPRESSED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
    UNAPPROVED: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="reportVersion" value={report.reportVersion} mono />
          <Field label="toolVersion" value={report.toolVersion} mono />
          <Field label="generatedAt" value={report.generatedAt.slice(0, 19).replace('T', ' ') + ' UTC'} mono />
          <Field label="riskLevel" value={report.riskLevel} className={riskColors[report.riskLevel]} />
        </div>
      </div>

      <Section title="summary" keyPath="report.summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Field label="total" value={String(report.summary.total)} />
          <Field label="breaking" value={String(report.summary.breaking)} className={report.summary.breaking > 0 ? 'text-red-500 dark:text-red-400' : ''} />
          <Field label="nonBreaking" value={String(report.summary.nonBreaking)} className={report.summary.nonBreaking > 0 ? 'text-emerald-500 dark:text-emerald-400' : ''} />
          <Field label="riskScore" value={String(report.riskScore)} />
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium mb-2">bySeverity</p>
          <div className="flex gap-3 flex-wrap text-sm">
            {Object.entries(report.summary.bySeverity).map(([k, v]) => (
              <span key={k} className={`text-xs font-semibold px-2 py-1 rounded border ${sevColors[k] ?? sevColors.INFO}`}>{k}: {v as number}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section title={`changes [${report.changes.length}]`} keyPath="report.changes">
        <div className="space-y-2">
          {report.changes.map((c, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${sevColors[c.severity] ?? sevColors.INFO}`}>{c.severity}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.breaking && <span className="text-[10px] font-bold text-red-500 dark:text-red-400">BREAKING</span>}
                  <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">{c.method ? c.method.toUpperCase() + ' ' : ''}{c.path}</code>
                  {c.governanceStatus && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${govColors[c.governanceStatus] ?? govColors.UNAPPROVED}`}>{c.governanceStatus}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {report.impacts.length > 0 && (
        <Section title={`impacts [${report.impacts.length}]`} keyPath="report.impacts">
          <div className="space-y-3">
            {report.impacts.map((imp, i) => (
              <div key={i} className="text-sm">
                <code className="text-xs font-mono text-violet-600 dark:text-violet-400 break-all">
                  {imp.change.method ? imp.change.method.toUpperCase() + ' ' : ''}{imp.change.path}
                </code>
                <ul className="mt-1 space-y-0.5">
                  {imp.impacts.map((item, j) => (
                    <li key={j} className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
                      <span className="text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {report.governance && (
        <Section title="governance" keyPath="report.governance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Field label="approved" value={String(report.governance.approved)} className={report.governance.approved > 0 ? 'text-emerald-500 dark:text-emerald-400' : ''} />
            <Field label="expired" value={String(report.governance.expired)} className={report.governance.expired > 0 ? 'text-amber-500 dark:text-amber-400' : ''} />
            <Field label="suppressed" value={String(report.governance.suppressed)} />
            <Field label="unapprovedBreaking" value={String(report.governance.unapprovedBreaking)} className={report.governance.unapprovedBreaking > 0 ? 'text-red-500 dark:text-red-400' : ''} />
          </div>
        </Section>
      )}
    </div>
  )
}

function JsonView({ jsonStr }: { jsonStr: string }) {
  const lines = jsonStr.split('\n')

  function colorize(line: string): React.ReactNode {
    const keyMatch = line.match(/^(\s*)("[\w]+"):(.*)$/)
    if (keyMatch) {
      const [, indent, key, rest] = keyMatch
      const valTrimmed = rest!.trim()
      let valColor = 'text-zinc-300 dark:text-zinc-400'
      if (valTrimmed.startsWith('"')) valColor = 'text-amber-400 dark:text-amber-300'
      else if (valTrimmed === 'true' || valTrimmed === 'false') valColor = 'text-blue-400 dark:text-blue-300'
      else if (!isNaN(Number(valTrimmed.replace(',', '')))) valColor = 'text-emerald-400 dark:text-emerald-300'
      return (
        <span>
          <span>{indent}</span>
          <span className="text-indigo-400 dark:text-indigo-300">{key}</span>
          <span className={valColor}>{rest}</span>
        </span>
      )
    }
    return <span className="text-zinc-400 dark:text-zinc-500">{line}</span>
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
        <span className="text-xs font-mono text-zinc-400">report.json</span>
        <span className="text-[10px] text-zinc-600">{jsonStr.length.toLocaleString()} bytes · {lines.length} lines</span>
      </div>
      <pre className="p-5 overflow-auto text-[11px] font-mono leading-relaxed max-h-[600px]">
        {lines.map((line, i) => (
          <div key={i}>{colorize(line)}</div>
        ))}
      </pre>
    </div>
  )
}

function SchemaView() {
  const fields: { key: string; type: string; desc: string; required?: boolean }[] = [
    { key: 'reportVersion', type: 'string', desc: 'Semantic version of the report schema (e.g. "1.0.0")', required: true },
    { key: 'toolVersion', type: 'string', desc: 'Version of the SpecGuard engine that generated this report', required: true },
    { key: 'generatedAt', type: 'string (ISO 8601)', desc: 'UTC timestamp of when the report was generated', required: true },
    { key: 'riskScore', type: 'number', desc: 'Computed risk score — weighted sum of breaking change severities', required: true },
    { key: 'riskLevel', type: '"NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"', desc: 'Human-readable risk category derived from riskScore', required: true },
    { key: 'riskBreakdown', type: 'RiskBreakdownItem[]', desc: 'Per-rule contributions to the total risk score', required: true },
    { key: 'summary', type: 'DiffSummary', desc: 'Counts: total, breaking, nonBreaking, bySeverity', required: true },
    { key: 'metadata', type: 'DiffMetadata', desc: 'API titles, versions, timestamps from both contracts', required: true },
    { key: 'changes', type: 'DiffChange[]', desc: 'Array of detected changes — each with path, method, severity, breaking, description, and optional governanceStatus', required: true },
    { key: 'impacts', type: 'ImpactReport[]', desc: 'Human-readable consumer impact descriptions for breaking changes', required: true },
    { key: 'governance', type: 'GovernanceSummary | undefined', desc: 'Governance audit: approved / expired / suppressed / unapproved counts; present only when specguard.yml is used', required: false },
  ]

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">ContractDiffReport — TypeScript interface</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Stable, versioned — safe to store, cache, and deserialize programmatically</p>
      </div>
      <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
        {fields.map(f => (
          <div key={f.key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-5 py-3">
            <div className="flex items-center gap-2 sm:w-48 shrink-0">
              <code className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{f.key}</code>
              {!f.required && <span className="text-[9px] text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">optional</span>}
            </div>
            <div className="flex-1 min-w-0">
              <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 break-words">{f.type}</code>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, keyPath, children }: { title: string; keyPath: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
        <code className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{title}</code>
        <code className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{keyPath}</code>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''} ${className ?? 'text-zinc-800 dark:text-zinc-200'}`}>{value}</p>
    </div>
  )
}

function NoReport({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center">
        <FileJson className="w-7 h-7 text-indigo-400 dark:text-indigo-500" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No report generated yet</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This tab shows the full <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">ContractDiffReport</code> — the versioned, machine-readable output from every SpecGuard run. Run an analysis first to populate it.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Go to Contract Playground
      </button>
    </div>
  )
}
