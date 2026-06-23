import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDocument, exportDocument } from '../api/documents'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'

interface Props { userId: string }

export default function DocumentDetail({ userId: _ }: Props) {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    refetchInterval: (data) =>
      data?.status === 'PROCESSING' || data?.status === 'UPLOADED' ? 3000 : false,
  })

  const exportMut = useMutation({
    mutationFn: ({ format }: { format: 'pdf' | 'txt' | 'md' }) => exportDocument(id!, format),
    onSuccess: (_, { format }) => {
      qc.invalidateQueries({ queryKey: ['document', id] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      setToast({ msg: `Exported as ${format.toUpperCase()} successfully`, type: 'success' })
    },
    onError: () => setToast({ msg: 'Export failed. Please try again.', type: 'error' }),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 skeleton rounded w-48" />
        <div className="h-32 skeleton rounded-xl" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Document not found.</p>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">← Back to Dashboard</Link>
      </div>
    )
  }

  const canReview = doc.status === 'AWAITING_REVIEW'
  const canExport = doc.status === 'REVIEWED' || doc.status === 'EXPORTED'
  const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADED'

  const exportFormats: { format: 'txt' | 'md' | 'pdf'; label: string; desc: string }[] = [
    { format: 'txt', label: 'Plain Text', desc: '.txt' },
    { format: 'md', label: 'Markdown', desc: '.md' },
    { format: 'pdf', label: 'PDF', desc: '.pdf' },
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Dashboard</Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">{doc.originalFilename}</span>
      </nav>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{doc.originalFilename}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Uploaded {new Date(doc.uploadTime).toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-slate-100 dark:border-slate-800 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Document ID</p>
            <p className="text-slate-600 dark:text-slate-400 font-mono text-xs truncate">{doc.id}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Status</p>
            <p className="text-slate-600 dark:text-slate-400 capitalize">{doc.status.replace('_', ' ').toLowerCase()}</p>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-4 py-3">
            <svg className="animate-spin w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              OCR processing in progress — auto-refreshing…
            </p>
          </div>
        )}
      </div>

      {canReview && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm">Ready for review</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              OCR complete. Review and correct low-confidence words.
            </p>
          </div>
          <Link
            to={`/documents/${doc.id}/review`}
            className="flex-shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Review Now
          </Link>
        </div>
      )}

      {canExport && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 text-sm">Export Document</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Download your digitized content</p>
          <div className="grid grid-cols-3 gap-3">
            {exportFormats.map(({ format, label, desc }) => (
              <button
                key={format}
                onClick={() => exportMut.mutate({ format })}
                disabled={exportMut.isPending}
                className="flex flex-col items-center gap-2 p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all disabled:opacity-50 group"
              >
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{label}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{desc}</div>
                </div>
              </button>
            ))}
          </div>
          {exportMut.isPending && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating export…
            </p>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
