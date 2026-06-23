import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import { fetchDocumentReview, saveCorrections, approveDocument } from '../api/documents'
import Toast from '../components/Toast'
import type { WordResult } from '../types'

interface Props { userId: string }

interface EditState { pageId: string; wordIndex: number; value: string }

function WordChip({
  word,
  current,
  isEditing,
  onStartEdit,
  onEndEdit,
  editValue,
  onEditChange,
}: {
  word: WordResult
  current: string
  isEditing: boolean
  onStartEdit: () => void
  onEndEdit: (val: string) => void
  editValue: string
  onEditChange: (v: string) => void
}) {
  const isEdited = current !== word.word
  const isLow = word.confidence < 70
  const isMed = word.confidence >= 70 && word.confidence < 90
  const isHigh = word.confidence >= 90

  if (isEditing) {
    return (
      <span className="inline-flex items-center">
        <input
          autoFocus
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={() => onEndEdit(editValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); onEndEdit(editValue) }
            if (e.key === 'Escape') onEndEdit(word.word)
          }}
          className="border border-indigo-400 dark:border-indigo-500 rounded px-1.5 py-0.5 text-sm min-w-[60px] outline-none ring-2 ring-indigo-300/40 dark:ring-indigo-600/40 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-100"
          style={{ width: Math.max(60, editValue.length * 8 + 24) + 'px' }}
        />
      </span>
    )
  }

  let chipClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  if (isEdited) {
    chipClass = 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
  } else if (isLow) {
    chipClass = 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer'
  } else if (isMed) {
    chipClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer'
  }

  return (
    <span
      onClick={onStartEdit}
      title={`Confidence: ${word.confidence.toFixed(0)}%${word.suggestionFromProfile ? ` · Suggested: ${word.suggestionFromProfile}` : ''}`}
      className={`word-chip inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-sm cursor-pointer select-none ${chipClass}`}
    >
      {isEdited ? (
        <>
          <span className="line-through text-slate-400 dark:text-slate-600 text-xs">{word.word}</span>
          <span className="font-medium">{current}</span>
        </>
      ) : (
        <>
          {current}
          {word.suggestionFromProfile && !isEdited && (
            <span className="text-indigo-400 dark:text-indigo-500 text-xs font-mono">→{word.suggestionFromProfile}</span>
          )}
        </>
      )}
    </span>
  )
}

export default function ReviewPage({ userId }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const { data: review, isLoading } = useQuery({
    queryKey: ['review', id],
    queryFn: () => fetchDocumentReview(id!),
  })

  const [edits, setEdits] = useState<Record<string, Record<number, string>>>({})
  const [editing, setEditing] = useState<EditState | null>(null)

  const getWord = useCallback(
    (pageId: string, idx: number, word: WordResult) =>
      edits[pageId]?.[idx] ?? word.correctedWord ?? word.word,
    [edits]
  )

  function setWordEdit(pageId: string, idx: number, value: string) {
    setEdits((prev) => ({ ...prev, [pageId]: { ...prev[pageId], [idx]: value } }))
    setEditing(null)
  }

  const totalWords = review?.pages.reduce((a, p) => a + p.ocrResult.words.length, 0) ?? 0
  const needsReview = review?.pages.reduce(
    (a, p) => a + p.ocrResult.words.filter((w) => w.confidence < 90).length, 0
  ) ?? 0
  const editCount = Object.values(edits).reduce((a, page) => a + Object.keys(page).length, 0)

  const buildCorrections = () => {
    const corrections: { pageId: string; wordIndex: number; correctedWord: string; originalWord: string }[] = []
    for (const [pageId, wordEdits] of Object.entries(edits)) {
      for (const [widxStr, correctedWord] of Object.entries(wordEdits)) {
        const widx = parseInt(widxStr)
        const pr = review?.pages.find((p) => p.page.id === pageId)
        const original = pr?.ocrResult.words[widx]?.word || ''
        if (correctedWord !== original) corrections.push({ pageId, wordIndex: widx, correctedWord, originalWord: original })
      }
    }
    return corrections
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const corrections = buildCorrections()
      if (corrections.length === 0) return Promise.resolve({ count: 0 })
      return saveCorrections(id!, corrections, userId)
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['review', id] })
      setToast({ msg: `${(data as any)?.count ?? 0} correction${(data as any)?.count !== 1 ? 's' : ''} saved`, type: 'success' })
    },
    onError: () => setToast({ msg: 'Failed to save corrections', type: 'error' }),
  })

  const approveMut = useMutation({
    mutationFn: () => approveDocument(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', id] })
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      navigate(`/documents/${id}`)
    },
    onError: () => setToast({ msg: 'Failed to approve document', type: 'error' }),
  })

  function handleApprove() {
    saveMut.mutate(undefined, { onSuccess: () => approveMut.mutate() })
  }

  if (isLoading || !review) {
    return (
      <div className="space-y-4">
        <div className="h-4 skeleton rounded w-56" />
        <div className="h-96 skeleton rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-2 text-sm mb-4">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Dashboard</Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link to={`/documents/${id}`} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors truncate max-w-xs">
            {review.document.originalFilename}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Review</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Review & Correct</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Click any word to edit it — changes feed your personal correction profile
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || editCount === 0}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors font-medium"
            >
              {saveMut.isPending ? 'Saving…' : `Save (${editCount})`}
            </button>
            <button
              onClick={handleApprove}
              disabled={saveMut.isPending || approveMut.isPending}
              className="px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
            >
              {approveMut.isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Approving…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">Review Progress</span>
          <span>{editCount} of {needsReview} addressed</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: needsReview > 0 ? `${Math.min(100, (editCount / needsReview) * 100)}%` : '100%' }}
          />
        </div>
        <div className="flex items-center gap-5 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-slate-500 dark:text-slate-400">Low &lt;70%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-500 dark:text-slate-400">Medium 70–89%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-slate-500 dark:text-slate-400">High ≥90%</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-500 dark:text-slate-400">Edited</span>
          </span>
        </div>
      </div>

      {/* Pages */}
      {review.pages.map((pr) => (
        <div key={pr.page.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Page {pr.page.pageNumber}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Avg confidence: {pr.ocrResult.confidence.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="p-5 lg:border-r border-b lg:border-b-0 border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Original Image</p>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden min-h-40 flex items-center justify-center">
                <img
                  src={`/api/pages/${pr.page.id}/image`}
                  alt={`Page ${pr.page.pageNumber}`}
                  className="max-w-full object-contain rounded-xl"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                    const p = t.parentElement
                    if (p) p.innerHTML = '<div class="text-slate-400 dark:text-slate-600 text-xs p-10 text-center">Image preview not available</div>'
                  }}
                />
              </div>
            </div>

            {/* Editor */}
            <div className="p-5">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                OCR Text — click to correct
              </p>
              <div className="flex flex-wrap gap-1 leading-relaxed min-h-40">
                {pr.ocrResult.words.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-sm italic">No text extracted from this page.</p>
                ) : (
                  pr.ocrResult.words.map((word, idx) => {
                    const current = getWord(pr.page.id, idx, word)
                    const isThisEditing = editing?.pageId === pr.page.id && editing?.wordIndex === idx
                    return (
                      <WordChip
                        key={idx}
                        word={word}
                        current={current}
                        isEditing={isThisEditing}
                        editValue={isThisEditing ? editing.value : current}
                        onEditChange={(v) => setEditing((prev) => prev ? { ...prev, value: v } : null)}
                        onStartEdit={() => setEditing({ pageId: pr.page.id, wordIndex: idx, value: current })}
                        onEndEdit={(val) => {
                          setWordEdit(pr.page.id, idx, val)
                        }}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {toast && <Toast message={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
