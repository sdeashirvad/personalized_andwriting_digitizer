import type { Severity } from '@engine/models/types'

interface Props {
  severity: Severity
  size?: 'sm' | 'xs'
}

const styles: Record<Severity, string> = {
  HIGH:   'bg-red-500/10 text-red-400 border-red-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LOW:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  INFO:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export function SeverityBadge({ severity, size = 'sm' }: Props) {
  const base = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 font-semibold tracking-wider'
    : 'text-xs px-2 py-0.5 font-semibold tracking-wider'
  return (
    <span className={`inline-flex items-center rounded border ${base} ${styles[severity]}`}>
      {severity}
    </span>
  )
}
