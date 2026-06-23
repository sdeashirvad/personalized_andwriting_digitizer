import type { ImpactReport } from '@engine/reporters/impact'
import { AlertOctagon, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  reports: ImpactReport[]
}

export function ImpactPanel({ reports }: Props) {
  const [open, setOpen] = useState(false)
  const breaking = reports.filter(r => r.change.breaking)

  if (breaking.length === 0) return null

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {open
            ? <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            : <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Consumer Impact Analysis</span>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
            {breaking.length} {breaking.length === 1 ? 'change' : 'changes'}
          </span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-600 hidden sm:block">Rule-based · no AI</span>
      </button>

      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {breaking.map((report, i) => (
            <ImpactRow key={i} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}

function ImpactRow({ report }: { report: ImpactReport }) {
  const [expanded, setExpanded] = useState(true)
  const { change, impacts } = report

  const severityStyles: Record<string, string> = {
    HIGH:   'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
    MEDIUM: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    LOW:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    INFO:   'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20',
  }

  return (
    <div className="px-5 py-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 text-left group"
      >
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wider shrink-0 ${severityStyles[change.severity]}`}>
            {change.severity}
          </span>
          {change.method && (
            <span className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 shrink-0">
              {change.method.toUpperCase()}
            </span>
          )}
          <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 shrink-0">{change.path}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{change.description}</span>
        </div>
        <div className="shrink-0 mt-0.5">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </button>

      {expanded && (
        <ul className="mt-3 space-y-1.5 pl-2">
          {impacts.map((impact, j) => (
            <li key={j} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <span className="text-amber-400 shrink-0 mt-0.5">•</span>
              {impact}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
