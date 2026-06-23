import type { DocumentStatus } from '../types'

const statusConfig: Record<DocumentStatus, { label: string; dot: string; text: string }> = {
  UPLOADED:        { label: 'Uploaded',        dot: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900' },
  PROCESSING:      { label: 'Processing',      dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900' },
  AWAITING_REVIEW: { label: 'Needs Review',    dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900' },
  REVIEWED:        { label: 'Reviewed',        dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-900' },
  EXPORTED:        { label: 'Exported',        dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900' },
  FAILED:          { label: 'Failed',          dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900' },
}

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = statusConfig[status] ?? { label: status, dot: 'bg-slate-400', text: 'text-slate-600 bg-slate-50 border-slate-200' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
