import type { DiffChange } from '@engine/models/types'
import { RULE_MAP } from '@engine/rules/severity'
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

export function ChangesList({ changes, title, defaultOpen = true, accentClass = 'text-zinc-100', emptyMessage }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
          <span className={`text-sm font-semibold ${accentClass}`}>{title}</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
            {changes.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800">
          {changes.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-zinc-600">
              {emptyMessage ?? 'No changes in this category'}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
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
    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group hover:bg-zinc-800/30 transition-colors">
      <div className="flex items-center gap-2 shrink-0">
        <SeverityBadge severity={change.severity} size="xs" />
        <span className="text-xs text-zinc-500 border border-zinc-700 bg-zinc-800 rounded px-1.5 py-0.5 font-mono">
          {rule?.label ?? change.type}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {change.method && (
            <span className="text-xs font-mono font-bold text-indigo-400">{change.method.toUpperCase()}</span>
          )}
          <span className="text-xs font-mono text-zinc-300">{change.path}</span>
        </div>
        <span className="text-xs text-zinc-500 leading-relaxed">{change.description}</span>
      </div>
      {(change.oldValue !== undefined || change.newValue !== undefined) && (
        <div className="sm:ml-auto flex items-center gap-1 shrink-0 flex-wrap">
          {change.oldValue !== undefined && (
            <code className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">
              {String(change.oldValue)}
            </code>
          )}
          {change.oldValue !== undefined && change.newValue !== undefined && (
            <span className="text-zinc-600 text-xs">→</span>
          )}
          {change.newValue !== undefined && (
            <code className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
              {String(change.newValue)}
            </code>
          )}
        </div>
      )}
    </div>
  )
}
