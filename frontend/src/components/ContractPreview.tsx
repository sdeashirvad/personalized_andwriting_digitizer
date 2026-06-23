import { useState } from 'react'
import { Code2, ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  oldContract: string
  newContract: string
  oldTitle: string
  newTitle: string
}

export function ContractPreview({ oldContract, newContract, oldTitle, newTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
          <Code2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Contract Preview</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">Side by side</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
          <ContractPane title={oldTitle} label="OLD" content={oldContract} labelClass="text-red-500 dark:text-red-400" />
          <ContractPane title={newTitle} label="NEW" content={newContract} labelClass="text-emerald-500 dark:text-emerald-400" />
        </div>
      )}
    </div>
  )
}

function ContractPane({ title, label, content, labelClass }: {
  title: string; label: string; content: string; labelClass: string
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <span className={`text-[10px] font-bold tracking-wider ${labelClass}`}>{label}</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono truncate">{title}</span>
      </div>
      <pre className="p-4 text-xs text-zinc-600 dark:text-zinc-400 font-mono overflow-auto max-h-96 leading-relaxed">
        {content}
      </pre>
    </div>
  )
}
