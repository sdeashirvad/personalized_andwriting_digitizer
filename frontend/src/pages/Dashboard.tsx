import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchDocuments } from '../api/documents'
import { fetchStats } from '../api/users'
import StatusBadge from '../components/StatusBadge'
import UploadModal from '../components/UploadModal'
import { SkeletonDocCard, SkeletonStatCard } from '../components/SkeletonCard'
import type { Document, DashboardStats } from '../types'

interface Props { userId: string }

const statCards = (s: DashboardStats) => [
  {
    label: 'Documents',
    value: s.documentsUploaded,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
  },
  {
    label: 'Pages Processed',
    value: s.pagesProcessed,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950',
  },
  {
    label: 'Corrections Learned',
    value: s.correctionsLearned,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M12 21v-1M7.05 17.95l.707-.707M17.95 17.95l-.707-.707M12 8a4 4 0 110 8 4 4 0 010-8z" />
      </svg>
    ),
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  },
  {
    label: 'Exported',
    value: s.documentsExported,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  },
]

export default function Dashboard({ userId }: Props) {
  const [showUpload, setShowUpload] = useState(false)

  const { data: documents = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ['documents', userId],
    queryFn: () => fetchDocuments(userId),
    refetchInterval: 5000,
  })

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['stats', userId],
    queryFn: () => fetchStats(userId),
    refetchInterval: 10000,
  })

  const pendingReview = documents.filter((d) => d.status === 'AWAITING_REVIEW').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pendingReview > 0
              ? `${pendingReview} document${pendingReview !== 1 ? 's' : ''} waiting for review`
              : 'Upload handwritten notes to digitize them'}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Upload Notes</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || !stats
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards(stats).map((card) => (
              <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{card.label}</div>
              </div>
            ))}
      </div>

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Recent Documents
          </h2>
          {documents.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{documents.length} total</span>
          )}
        </div>

        {docsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonDocCard key={i} />)}
          </div>
        ) : documents.length === 0 ? (
          <EmptyState onUpload={() => setShowUpload(true)} />
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
          </div>
        )}
      </div>

      {showUpload && <UploadModal userId={userId} onClose={() => setShowUpload(false)} />}
    </div>
  )
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-16 text-center">
      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No documents yet</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
        Upload a handwritten image or PDF to start digitizing
      </p>
      <button
        onClick={onUpload}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload your first document
      </button>
    </div>
  )
}

function DocumentCard({ doc }: { doc: Document }) {
  const canReview = doc.status === 'AWAITING_REVIEW'
  const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADED'
  const uploadDate = new Date(doc.uploadTime).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
      <div className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.originalFilename}</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{uploadDate}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={doc.status} />

          {isProcessing && (
            <svg className="animate-spin w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/documents/${doc.id}`}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              View
            </Link>
            {canReview && (
              <Link
                to={`/documents/${doc.id}/review`}
                className="px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Review
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
