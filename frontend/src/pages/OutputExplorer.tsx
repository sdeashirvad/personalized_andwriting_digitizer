import { useState, useMemo } from 'react'
import { useStudio } from '../context/useStudio'
import { toMarkdownReport, toConsoleReport, generateHTMLReport, generateJSONReport } from '../engine/adapter'
import { Layers, Copy, CheckCheck, Download, FlaskConical } from 'lucide-react'

type OutputFormat = 'console' | 'json' | 'markdown' | 'html'

const FORMATS: { id: OutputFormat; label: string; lang: string; color: string; ext: string; mime: string }[] = [
  { id: 'console', label: 'Console', lang: 'Terminal output (ANSI stripped)', color: 'text-zinc-300', ext: 'txt', mime: 'text/plain' },
  { id: 'json', label: 'JSON', lang: 'Machine-readable ContractDiffReport', color: 'text-amber-300', ext: 'json', mime: 'application/json' },
  { id: 'markdown', label: 'Markdown', lang: 'For docs, PRs, GitHub wikis', color: 'text-blue-300', ext: 'md', mime: 'text/markdown' },
  { id: 'html', label: 'HTML', lang: 'Self-contained standalone page', color: 'text-emerald-300', ext: 'html', mime: 'text/html' },
]

export function OutputExplorer() {
  const { result, navigateTo } = useStudio()
  const [active, setActive] = useState<OutputFormat>('console')
  const [copied, setCopied] = useState(false)

  const outputs = useMemo(() => {
    if (!result) return { console: '', json: '', markdown: '', html: '' }
    return {
      console: stripAnsi(toConsoleReport(result.report)),
      json: generateJSONReport(result),
      markdown: toMarkdownReport(result.report),
      html: generateHTMLReport(result),
    }
  }, [result])

  const current = outputs[active]
  const fmt = FORMATS.find(f => f.id === active)!

  function handleCopy() {
    if (!current) return
    navigator.clipboard.writeText(current).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!current) return
    const blob = new Blob([current], { type: fmt.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specguard-report.${fmt.ext}`
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
            <Layers className="w-5 h-5 text-cyan-500" />
            Output Explorer
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            All four output formats generated from the same <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">ContractDiffReport</code> — console, JSON, Markdown, and HTML
          </p>
        </div>
        {result && current && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              .{fmt.ext}
            </button>
          </div>
        )}
      </div>

      {!result ? (
        <NoReport onNavigate={() => navigateTo('playground')} />
      ) : (
        <>
          {/* Format selector cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                  active === f.id
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <p className={`text-xs font-semibold ${active === f.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{f.label}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">{f.lang}</p>
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-2 font-mono">
                  {outputs[f.id].length.toLocaleString()} chars
                </p>
              </button>
            ))}
          </div>

          {active === 'html' ? (
            <HtmlPreview html={outputs.html} />
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${fmt.color}`}>{fmt.label}</span>
                  <span className="text-[10px] text-zinc-600">{fmt.lang}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{current.length.toLocaleString()} chars · {current.split('\n').length} lines</span>
              </div>
              <pre className="p-5 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-[600px] whitespace-pre">
                {current}
              </pre>
            </div>
          )}

          {/* Size comparison */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Output Size Comparison</p>
            <div className="space-y-2">
              {FORMATS.map(f => {
                const len = outputs[f.id].length
                const maxLen = Math.max(...FORMATS.map(ff => outputs[ff.id].length))
                const pct = maxLen > 0 ? Math.round((len / maxLen) * 100) : 0
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <button
                      onClick={() => setActive(f.id)}
                      className={`text-xs font-semibold w-20 shrink-0 text-left transition-colors ${
                        active === f.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${active === f.id ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-24 text-right shrink-0">
                      {len.toLocaleString()} chars
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function HtmlPreview({ html }: { html: string }) {
  const [view, setView] = useState<'preview' | 'source'>('preview')
  const [copied, setCopied] = useState(false)

  function handleDownload() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'specguard-report.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleCopy() {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex gap-1">
          {(['preview', 'source'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === v
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Download HTML
          </button>
        </div>
      </div>
      {view === 'preview' ? (
        <iframe
          srcDoc={html}
          className="w-full border-0 bg-white"
          style={{ height: '600px' }}
          title="HTML Report Preview"
          sandbox="allow-scripts"
        />
      ) : (
        <div className="bg-zinc-950">
          <pre className="p-5 text-[10px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-[600px] whitespace-pre">
            {html}
          </pre>
        </div>
      )}
    </div>
  )
}

function NoReport({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/60 flex items-center justify-center">
        <Layers className="w-7 h-7 text-cyan-400 dark:text-cyan-500" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No report loaded</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Output Explorer shows all four output formats — Console, JSON, Markdown, and HTML — generated from the same <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">ContractDiffReport</code>. Run an analysis to compare them.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Go to Contract Playground
      </button>
    </div>
  )
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '')
}
