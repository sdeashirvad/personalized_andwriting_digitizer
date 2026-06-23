import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDocument, exportDocument } from '../api/documents'
import StatusBadge from '../components/StatusBadge'

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id!),
    refetchInterval: (data) =>
      data?.status === 'PROCESSING' || data?.status === 'UPLOADED' ? 3000 : false,
  })

  const exportMut = useMutation({
    mutationFn: ({ format }: { format: 'pdf' | 'txt' | 'md' }) =>
      exportDocument(id!, format),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document', id] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading document...
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 mb-4">Document not found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">Back to Documents</Link>
      </div>
    )
  }

  const canReview = doc.status === 'AWAITING_REVIEW'
  const canExport = doc.status === 'REVIEWED' || doc.status === 'EXPORTED'

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-700">Documents</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{doc.originalFilename}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{doc.originalFilename}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Uploaded {new Date(doc.uploadTime).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Document ID</p>
            <p className="text-sm text-slate-600 font-mono">{doc.id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Status</p>
            <p className="text-sm text-slate-600">{doc.status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {canReview && (
          <Link
            to={`/documents/${doc.id}/review`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Review & Correct
          </Link>
        )}

        {canExport && (
          <>
            <button
              onClick={() => exportMut.mutate({ format: 'txt' })}
              disabled={exportMut.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Export as TXT
            </button>
            <button
              onClick={() => exportMut.mutate({ format: 'md' })}
              disabled={exportMut.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Export as Markdown
            </button>
            <button
              onClick={() => exportMut.mutate({ format: 'pdf' })}
              disabled={exportMut.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Export as PDF
            </button>
          </>
        )}

        {doc.status === 'PROCESSING' && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <svg className="animate-spin w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing your document... auto-refreshing
          </div>
        )}

        {exportMut.isError && (
          <p className="text-red-600 text-sm py-2">Export failed. Please try again.</p>
        )}
      </div>
    </div>
  )
}
