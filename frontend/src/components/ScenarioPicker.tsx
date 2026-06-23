import type { SampleScenario } from '../data/samples'

interface Props {
  scenarios: SampleScenario[]
  selected: number
  onSelect: (index: number) => void
  onRun: () => void
  isRunning: boolean
  durationMs?: number
}

const tagStyles: Record<string, string> = {
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  red:     'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
}

export function ScenarioPicker({ scenarios, selected, onSelect, onRun, isRunning, durationMs }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="flex gap-2 flex-wrap">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all
              ${selected === i
                ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'}
            `}
          >
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${tagStyles[s.tagColor]}`}>
              {s.tag}
            </span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="sm:ml-auto flex items-center gap-3 shrink-0">
        {durationMs !== undefined && (
          <span className="text-xs text-zinc-400 dark:text-zinc-600">{durationMs}ms</span>
        )}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              Running…
            </>
          ) : (
            'Run Analysis'
          )}
        </button>
      </div>
    </div>
  )
}
