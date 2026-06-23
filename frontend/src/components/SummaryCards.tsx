import type { DiffResult } from '@engine/models/types'
import { AlertTriangle, CheckCircle2, Layers, ShieldAlert } from 'lucide-react'

interface Props {
  result: DiffResult
}

export function SummaryCards({ result }: Props) {
  const { summary } = result
  const riskLevel =
    summary.bySeverity.HIGH > 0 ? 'HIGH'
    : summary.bySeverity.MEDIUM > 0 ? 'MEDIUM'
    : summary.bySeverity.LOW > 0 ? 'LOW'
    : 'NONE'

  const riskColor =
    riskLevel === 'HIGH' ? 'text-red-500 dark:text-red-400'
    : riskLevel === 'MEDIUM' ? 'text-amber-500 dark:text-amber-400'
    : riskLevel === 'LOW' ? 'text-blue-500 dark:text-blue-400'
    : 'text-emerald-500 dark:text-emerald-400'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card
        icon={<Layers className="w-4 h-4 text-zinc-400" />}
        label="Total Changes"
        value={summary.total}
        sub={summary.total === 0 ? 'No changes' : `${summary.total} detected`}
        valueClass="text-zinc-800 dark:text-zinc-100"
      />
      <Card
        icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
        label="Breaking"
        value={summary.breaking}
        sub={summary.breaking === 0 ? 'All clear' : 'Need attention'}
        valueClass={summary.breaking > 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-100'}
      />
      <Card
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        label="Non-Breaking"
        value={summary.nonBreaking}
        sub={summary.nonBreaking === 0 ? 'None' : 'Safe to ship'}
        valueClass={summary.nonBreaking > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-100'}
      />
      <Card
        icon={<ShieldAlert className="w-4 h-4" />}
        label="Severity Mix"
        value={riskLevel}
        sub={`${summary.bySeverity.HIGH}H · ${summary.bySeverity.MEDIUM}M · ${summary.bySeverity.LOW}L`}
        valueClass={riskColor}
      />
    </div>
  )
}

interface CardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  valueClass: string
}

function Card({ icon, label, value, sub, valueClass }: CardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${valueClass}`}>{value}</div>
      <div className="text-xs text-zinc-400 dark:text-zinc-600">{sub}</div>
    </div>
  )
}
