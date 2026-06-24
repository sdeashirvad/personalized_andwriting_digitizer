import { useState, useMemo } from 'react'
import { useStudio } from '../context/StudioContext'
import { toMarkdownReport, toConsoleReport, generateHTMLReport, generateJSONReport } from '../engine/adapter'
import { Layers, Copy, CheckCheck, Download, AlertCircle } from 'lucide-react'

type OutputFormat = 'console' | 'json' | 'markdown' | 'html'

const FORMATS: { id: OutputFormat; label: string; lang: string; color: string }[] = [
  { id: 'console', label: 'Console', lang: 'Terminal output (ANSI stripped)', color: 'text-zinc-300' },
  { id: 'json', label: 'JSON', lang: 'Machine-readable ContractDiffReport', color: 'text-amber-300' },
  { id: 'markdown', label: 'Markdown', lang: 'For docs, PRs, GitHub wikis', color: 'text-blue-300' },
  { id: 'html', label: 'HTML', lang: 'Self-contained standalone page', color: 'text-emerald-300' },
]

export function OutputExplorer() {
  const { result } = useStudio()
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

  function handleCopy() {
    if (!current) return
    navigator.clipboard.writeText(current).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!current) return
    const ext: Record<OutputFormat, string> = { console: 'txt', json: 'json', markdown: 'md', html: 'html' }
    const mime: Record<OutputFormat, string> = { console: 'text/plain', json: 'application/json', markdown: 'text/markdown', html: 'text/html' }
    const blob = new Blob([current], { type: mime[active] })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specguard-report.${ext[active]}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
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
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        )}
      </div>

      {!result && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-5 py-4 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No report loaded. Run an analysis in Contract Playground first.
        </div>
      )}

      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800">
        {FORMATS.map(f => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              active === f.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                  active === f.id
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <p className={`text-xs font-semibold ${active === f.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{f.label}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{f.lang}</p>
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
                  <span className={`text-xs font-semibold ${FORMATS.find(f => f.id === active)?.color}`}>
                    {FORMATS.find(f => f.id === active)?.label}
                  </span>
                  <span className="text-[10px] text-zinc-600">{FORMATS.find(f => f.id === active)?.lang}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{current.length.toLocaleString()} chars · {current.split('\n').length} lines</span>
              </div>
              <pre className="p-5 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-[600px] whitespace-pre">
                {current}
              </pre>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Output Size Comparison</p>
            <div className="space-y-2">
              {FORMATS.map(f => {
                const len = outputs[f.id].length
                const maxLen = Math.max(...FORMATS.map(ff => outputs[ff.id].length))
                const pct = maxLen > 0 ? Math.round((len / maxLen) * 100) : 0
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-20 shrink-0">{f.label}</span>
                    <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 w-20 text-right shrink-0">
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

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex gap-1">
          <button
            onClick={() => setView('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'preview'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setView('source')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'source'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            Source
          </button>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Download HTML
        </button>
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

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '')
}
