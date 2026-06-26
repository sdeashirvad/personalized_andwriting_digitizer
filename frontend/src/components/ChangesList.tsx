import type { DiffChange } from 'specsentinel'
import { RULE_MAP } from 'specsentinel'
import { SeverityBadge } from './SeverityBadge'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  changes: DiffChange[]
  title: string
  defaultOpen?: boolean
  accentClass?: string
  emptyMessage?: string
}

export function ChangesList({ changes, title, defaultOpen = true, accentClass = 'text-zinc-900 dark:text-zinc-100', emptyMessage }: Props) {
  const [open, setOpen] = useState(defaultOpen)

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
          <span className={`text-sm font-semibold ${accentClass}`}>{title}</span>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
            {changes.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {changes.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-zinc-400 dark:text-zinc-600">
              {emptyMessage ?? 'No changes in this category'}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {changes.map((c, i) => (
                <ChangeRow key={i} change={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChangeRow({ change }: { change: DiffChange }) {
  const rule = RULE_MAP[change.type]
  return (
    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center gap-2 shrink-0">
        <SeverityBadge severity={change.severity} size="xs" />
        <span className="text-xs text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded px-1.5 py-0.5 font-mono">
          {rule?.label ?? change.type}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {change.method && (
            <span className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400">{change.method.toUpperCase()}</span>
          )}
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{change.path}</span>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">{change.description}</span>
      </div>
      {(change.oldValue !== undefined || change.newValue !== undefined) && (
        <div className="sm:ml-auto flex items-center gap-1 shrink-0 flex-wrap">
          {change.oldValue !== undefined && (
            <code className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded px-1.5 py-0.5">
              {String(change.oldValue)}
            </code>
          )}
          {change.oldValue !== undefined && change.newValue !== undefined && (
            <span className="text-zinc-400 text-xs">→</span>
          )}
          {change.newValue !== undefined && (
            <code className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded px-1.5 py-0.5">
              {String(change.newValue)}
            </code>
          )}
        </div>
      )}
    </div>
  )
}
