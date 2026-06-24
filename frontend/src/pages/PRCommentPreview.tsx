import { useState, useMemo } from 'react'
import { useStudio } from '../context/useStudio'
import { generatePRComment } from '../engine/adapter'
import type { PRCommentMode } from '../engine/adapter'
import { MessageSquare, Eye, Code2, Copy, CheckCheck, Download, FlaskConical } from 'lucide-react'

export function PRCommentPreview() {
  const { result, navigateTo } = useStudio()
  const [mode, setMode] = useState<PRCommentMode>('summary')
  const [view, setView] = useState<'rendered' | 'raw'>('rendered')
  const [copied, setCopied] = useState(false)

  const comment = useMemo(() => {
    if (!result) return ''
    return generatePRComment(result.report, mode)
  }, [result, mode])

  function handleCopy() {
    if (!comment) return
    navigator.clipboard.writeText(comment).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!comment) return
    const blob = new Blob([comment], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specguard-pr-comment-${mode}.md`
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
            <MessageSquare className="w-5 h-5 text-blue-500" />
            PR Comment Preview
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Preview the Markdown comment SpecGuard posts to GitHub Pull Requests — complete with governance context
          </p>
        </div>
        {comment && mode !== 'off' && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              .md
            </button>
          </div>
        )}
      </div>

      {!result ? (
        <NoReport onNavigate={() => navigateTo('playground')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">comment-mode</p>
              </div>
              <div className="p-3 space-y-1">
                {(['off', 'summary', 'full'] as PRCommentMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      mode === m
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 ${mode === m ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300 dark:border-zinc-600'}`} />
                    <div>
                      <code className={`text-xs font-mono font-semibold ${mode === m ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{m}</code>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {m === 'off' && 'No comment posted — CI-only mode'}
                        {m === 'summary' && 'Compact header + stats table'}
                        {m === 'full' && 'Full report with collapsible sections'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Display mode</p>
              </div>
              <div className="p-3 space-y-1">
                {(['rendered', 'raw'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${
                      view === v
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    {v === 'rendered' ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
                    {v === 'rendered' ? 'Rendered Preview' : 'Raw Markdown'}
                  </button>
                ))}
              </div>
            </div>

            {comment && mode !== 'off' && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Size</p>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{comment.length.toLocaleString()} chars</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{comment.split('\n').length} lines · Markdown</p>
              </div>
            )}

            {/* Context: report values in this comment */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide font-medium">Report values in this comment</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Risk level</span><span className="font-semibold text-zinc-700 dark:text-zinc-300">{result.report.riskLevel}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Risk score</span><span className="font-semibold text-zinc-700 dark:text-zinc-300">{result.report.riskScore}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Breaking</span><span className="font-semibold text-red-500 dark:text-red-400">{result.report.summary.breaking}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Non-breaking</span><span className="font-semibold text-emerald-500 dark:text-emerald-400">{result.report.summary.nonBreaking}</span></div>
                {result.report.governance && (
                  <div className="flex justify-between"><span className="text-zinc-500 dark:text-zinc-400">Governance</span><span className="font-semibold text-violet-500 dark:text-violet-400">{result.report.governance.approved}A / {result.report.governance.unapprovedBreaking}U</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Comment preview */}
          <div className="lg:col-span-3">
            {mode === 'off' ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500">comment-mode is set to <code className="font-mono">off</code></p>
                <p className="text-xs text-zinc-300 dark:text-zinc-600">No comment will be posted to the PR. Switch to <strong className="text-zinc-400 dark:text-zinc-500">summary</strong> or <strong className="text-zinc-400 dark:text-zinc-500">full</strong> to see a preview.</p>
              </div>
            ) : view === 'raw' ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-xs font-mono text-zinc-400">PR Comment — Raw Markdown</span>
                  <span className="text-[10px] text-zinc-600">{comment.length.toLocaleString()} chars</span>
                </div>
                <pre className="p-5 text-[11px] font-mono leading-relaxed text-zinc-300 overflow-auto max-h-[600px] whitespace-pre-wrap">
                  {comment}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">github.com / pull / 42 / files</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center text-white text-xs font-bold">SG</div>
                    <div className="flex-1 min-w-0 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">specguard-bot</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">commented just now</span>
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Bot</span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <MarkdownPreview markdown={comment} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')

  return (
    <div className="text-sm text-zinc-800 dark:text-zinc-200 space-y-1.5 font-sans leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1">{line.slice(3)}</h2>
        if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-2 mb-0.5">{line.slice(4)}</h3>
        if (line.startsWith('#### ')) return <h4 key={i} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-1.5">{line.slice(5)}</h4>
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-3 text-zinc-500 dark:text-zinc-400 text-xs italic">{line.slice(2)}</blockquote>
        if (line.startsWith('| ')) return <div key={i} className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 overflow-x-auto">{line}</div>
        if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex items-start gap-1.5 text-xs"><span className="text-zinc-400 mt-1 shrink-0">•</span><span>{line.slice(2)}</span></div>
        if (line.startsWith('<details>') || line.startsWith('</details>') || line.startsWith('<summary>') || line.startsWith('</summary>')) return (
          <div key={i} className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">{line}</div>
        )
        if (line.trim() === '' || line.startsWith('---')) return <div key={i} className="h-1" />
        if (line.startsWith('```')) return <div key={i} className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{line}</div>
        return <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400">{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-zinc-800 dark:text-zinc-200">{part.slice(2, -2)}</strong>
    return part
  })
}

function NoReport({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
        <MessageSquare className="w-7 h-7 text-blue-400 dark:text-blue-500" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No report loaded</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          PR Comment Preview generates the Markdown comment that SpecGuard posts to GitHub pull requests — with risk summary, change list, and governance context. Run an analysis to generate a real comment.
        </p>
      </div>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        Go to Contract Playground
      </button>
    </div>
  )
}
