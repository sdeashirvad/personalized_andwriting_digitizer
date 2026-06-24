import { useState, useMemo } from 'react'
import { useStudio } from '../context/useStudio'
import { determineExitCode, ExitCode, toMarkdownReport } from '../engine/adapter'
import type { ExitCodeValue, PRCommentMode } from '../engine/adapter'
import { GitBranch, AlertCircle, CheckCircle2, XCircle, Copy, CheckCheck, Download, FlaskConical } from 'lucide-react'

const EXIT_LABELS: Record<number, string> = {
  0: 'OK — No breaking changes',
  1: 'MEDIUM_BREAKING — Breaking changes with max severity MEDIUM/LOW',
  2: 'HIGH_BREAKING — Breaking changes with max severity HIGH/CRITICAL',
  3: 'INVALID_CONTRACT — One or more contracts failed to parse',
  4: 'INTERNAL_ERROR — Unexpected engine error',
}

const EXIT_COLORS: Record<number, string> = {
  0: 'text-emerald-500 dark:text-emerald-400',
  1: 'text-amber-500 dark:text-amber-400',
  2: 'text-red-500 dark:text-red-400',
  3: 'text-orange-500 dark:text-orange-400',
  4: 'text-violet-500 dark:text-violet-400',
}

export function GitHubActionPlayground() {
  const { result, navigateTo } = useStudio()
  const [failOnHigh, setFailOnHigh] = useState(true)
  const [failOnMedium, setFailOnMedium] = useState(false)
  const [commentMode, setCommentMode] = useState<PRCommentMode>('summary')
  const [configPath, setConfigPath] = useState('specguard.yml')
  const [copied, setCopied] = useState<string | null>(null)

  const exitCode: ExitCodeValue | null = useMemo(() => {
    if (!result) return null
    return determineExitCode(result.report, { failOnHigh, failOnMedium })
  }, [result, failOnHigh, failOnMedium])

  const willFail = exitCode !== null && exitCode !== ExitCode.OK

  const workflowYaml = `name: API Contract Check

on:
  pull_request:
    paths:
      - 'api/**/*.yaml'
      - 'api/**/*.json'

jobs:
  specguard:
    runs-on: ubuntu-latest
    name: SpecGuard — Contract Diff

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run SpecGuard
        uses: your-org/specguard-action@v1
        with:
          old-contract: api/v1/openapi.yaml
          new-contract: api/v2/openapi.yaml${configPath ? `\n          config-path: ${configPath}` : ''}
          comment-mode: ${commentMode}${failOnHigh ? '\n          fail-on-high: true' : ''}${failOnMedium ? '\n          fail-on-medium: true' : ''}`.trim()

  const markdownSummary = useMemo(() => {
    if (!result) return ''
    return toMarkdownReport(result.report)
  }, [result])

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function downloadWorkflow() {
    const blob = new Blob([workflowYaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'api-check.yml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadMarkdown() {
    if (!markdownSummary) return
    const blob = new Blob([markdownSummary], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'specguard-summary.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-emerald-500" />
          GitHub Action Playground
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Configure the SpecGuard GitHub Action and preview expected behavior — exit codes, PR comments, and CI outcomes
        </p>
      </div>

      {!result && <NoReport onNavigate={() => navigateTo('playground')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Action Inputs</p>
            </div>
            <div className="p-5 space-y-5">
              <Toggle
                label="fail-on-high"
                description="Exit non-zero only when HIGH/CRITICAL breaking changes are present"
                checked={failOnHigh}
                onChange={setFailOnHigh}
              />
              <Toggle
                label="fail-on-medium"
                description="Also exit non-zero when MEDIUM breaking changes are present"
                checked={failOnMedium}
                onChange={setFailOnMedium}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">comment-mode</label>
                <select
                  value={commentMode}
                  onChange={e => setCommentMode(e.target.value as PRCommentMode)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="off">off</option>
                  <option value="summary">summary</option>
                  <option value="full">full</option>
                </select>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {commentMode === 'off' && 'No PR comment will be posted'}
                  {commentMode === 'summary' && 'Post a compact summary comment to the PR'}
                  {commentMode === 'full' && 'Post a full detailed report with collapsible sections'}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">config-path</label>
                <input
                  type="text"
                  value={configPath}
                  onChange={e => setConfigPath(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="specguard.yml"
                />
              </div>
            </div>
          </div>

          {/* Expected outcome */}
          {result && exitCode !== null && (
            <div className={`rounded-xl border p-5 space-y-3 ${
              willFail
                ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
            }`}>
              <div className="flex items-center gap-2">
                {willFail
                  ? <XCircle className="w-4 h-4 text-red-500" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                }
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {willFail ? 'CI will FAIL' : 'CI will PASS'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Exit Code</p>
                <p className={`text-3xl font-black font-mono ${EXIT_COLORS[exitCode]}`}>{exitCode}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{EXIT_LABELS[exitCode]}</p>
              </div>
              <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Risk</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {result.report.riskLevel} — score {result.report.riskScore}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {result.report.summary.breaking} breaking · {result.report.summary.nonBreaking} non-breaking
                </p>
              </div>
            </div>
          )}

          {/* Action outputs table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Action Outputs</p>
            </div>
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {[
                { key: 'exit-code', value: result ? String(exitCode) : '—', desc: 'Numeric exit code (0–4)' },
                { key: 'risk-level', value: result?.report.riskLevel ?? '—', desc: 'NONE / LOW / MEDIUM / HIGH / CRITICAL' },
                { key: 'risk-score', value: result ? String(result.report.riskScore) : '—', desc: 'Numeric weighted risk score' },
                { key: 'breaking-count', value: result ? String(result.report.summary.breaking) : '—', desc: 'Number of breaking changes' },
                { key: 'total-count', value: result ? String(result.report.summary.total) : '—', desc: 'Total changes detected' },
                { key: 'report-json', value: 'report.json', desc: 'Path to the generated machine-readable report artifact' },
              ].map(row => (
                <div key={row.key} className="flex items-start gap-4 px-5 py-2.5">
                  <code className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 w-32 shrink-0">{row.key}</code>
                  <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 w-16 shrink-0">{row.value}</code>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{row.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow YAML + summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
              <span className="text-xs font-mono text-zinc-400">.github/workflows/api-check.yml</span>
              <div className="flex items-center gap-2">
                <button onClick={downloadWorkflow} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button onClick={() => copy(workflowYaml, 'workflow')} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                  {copied === 'workflow' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'workflow' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="p-5 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-96">
              {workflowYaml}
            </pre>
          </div>

          {result && markdownSummary && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                <span className="text-xs font-mono text-zinc-400">Generated Report Summary (Markdown)</span>
                <div className="flex items-center gap-2">
                  <button onClick={downloadMarkdown} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    .md
                  </button>
                  <button onClick={() => copy(markdownSummary, 'md')} className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors">
                    {copied === 'md' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'md' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <pre className="p-5 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-64">
                {markdownSummary}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-8 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} style={{ height: '18px' }}>
          <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </div>
      </div>
      <div>
        <code className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{label}</code>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>
      </div>
    </label>
  )
}

function NoReport({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center">
        <GitBranch className="w-7 h-7 text-emerald-400 dark:text-emerald-500" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No report loaded</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This tab shows the expected CI outcome for your current report — exit codes, workflow YAML, and action outputs. Run an analysis first.
        </p>
        <p className="text-[11px] text-zinc-300 dark:text-zinc-600 mt-1">
          The workflow YAML is always available below, even without a report.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Go to Contract Playground
      </button>
      <AlertCircle className="w-0 h-0 hidden" />
    </div>
  )
}
