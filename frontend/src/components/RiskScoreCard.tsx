import type { RiskScore } from 'specsentinel'

interface Props {
  riskScore: RiskScore
}

const categoryColors = {
  NONE:     { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  LOW:      { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    bar: 'bg-blue-500' },
  MEDIUM:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'bg-amber-500' },
  HIGH:     { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     bar: 'bg-red-500' },
  CRITICAL: { text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  bar: 'bg-purple-500' },
}

export function RiskScoreCard({ riskScore }: Props) {
  const colors = categoryColors[riskScore.category]
  const maxContribution = riskScore.breakdown[0]?.contribution ?? 1

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Risk Score</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${colors.text} ${colors.bg} ${colors.border}`}>
          {riskScore.category}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-baseline gap-4 mb-5">
          <span className={`text-5xl font-black tabular-nums ${colors.text}`}>
            {riskScore.score}
          </span>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 leading-tight">
              Weighted risk score<br />based on change severity
            </p>
          </div>
        </div>

        {riskScore.breakdown.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3">Top Contributors</p>
            {riskScore.breakdown.slice(0, 6).map((item) => {
              const pct = Math.round((item.contribution / maxContribution) * 100)
              return (
                <div key={item.changeType} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-44 truncate shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 w-8 text-right tabular-nums">{item.contribution}</span>
                </div>
              )
            })}
          </div>
        )}

        {riskScore.breakdown.length === 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-600 text-center py-2">No risk-weighted changes detected</p>
        )}
      </div>
    </div>
  )
}
