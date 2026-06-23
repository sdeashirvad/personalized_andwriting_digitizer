import type { DocumentStatus } from '../types'

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  UPLOADED: { label: 'Uploaded', className: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Processing...', className: 'bg-yellow-100 text-yellow-700 animate-pulse' },
  AWAITING_REVIEW: { label: 'Awaiting Review', className: 'bg-orange-100 text-orange-700' },
  REVIEWED: { label: 'Reviewed', className: 'bg-green-100 text-green-700' },
  EXPORTED: { label: 'Exported', className: 'bg-purple-100 text-purple-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
