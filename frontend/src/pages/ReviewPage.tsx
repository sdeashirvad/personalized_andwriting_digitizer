import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { fetchDocumentReview, saveCorrections, approveDocument } from '../api/documents'
import type { WordResult } from '../types'

const USER_ID = 'user-1'

function confidenceColor(confidence: number) {
  if (confidence >= 90) return 'bg-green-100 text-green-800'
  if (confidence >= 70) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function confidenceLabel(confidence: number) {
  if (confidence >= 90) return 'High'
  if (confidence >= 70) return 'Medium'
  return 'Low'
}

interface EditingWord {
  pageIndex: number
  wordIndex: number
  value: string
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => fetchDocumentReview(id!),
  })

  const [edits, setEdits] = useState<Record<string, Record<number, string>>>({})
  const [editing, setEditing] = useState<EditingWord | null>(null)

  const saveMut = useMutation({
    mutationFn: async () => {
      const corrections: { pageId: string; wordIndex: number; correctedWord: string; originalWord: string }[] = []
      for (const [pageId, wordEdits] of Object.entries(edits)) {
        for (const [wordIndexStr, correctedWord] of Object.entries(wordEdits)) {
          const wordIndex = parseInt(wordIndexStr)
          const pageReview = review?.pages.find((p) => p.page.id === pageId)
          const originalWord = pageReview?.ocrResult.words[wordIndex]?.word || ''
          if (correctedWord !== originalWord) {
            corrections.push({ pageId, wordIndex, correctedWord, originalWord })
          }
        }
      }
      if (corrections.length > 0) {
        await saveCorrections(id!, corrections, USER_ID)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', id] })
    },
  })

  const approveMut = useMutation({
    mutationFn: () => approveDocument(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', id] })
      qc.invalidateQueries({ queryKey: ['documents'] })
      navigate(`/documents/${id}`)
    },
  })

  function getWordValue(pageId: string, wordIndex: number, word: WordResult): string {
    return edits[pageId]?.[wordIndex] ?? word.correctedWord ?? word.word
  }

  function setWordEdit(pageId: string, wordIndex: number, value: string) {
    setEdits((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], [wordIndex]: value },
    }))
  }

  function handleSaveAndApprove() {
    saveMut.mutate(undefined, {
      onSuccess: () => approveMut.mutate(),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading review data...
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 mb-4">Failed to load review data.</p>
        <Link to="/" className="text-indigo-600 hover:underline">Back to Documents</Link>
      </div>
    )
  }

  const lowConfidenceCount = review.pages.reduce((acc, p) =>
    acc + p.ocrResult.words.filter((w) => w.confidence < 90).length, 0)

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-700">Documents</Link>
        <span>/</span>
        <Link to={`/documents/${id}`} className="hover:text-slate-700 truncate max-w-xs">
          {review.document.originalFilename}
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Review</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Review & Correct</h1>
          <p className="text-sm text-slate-500 mt-1">
            {lowConfidenceCount > 0
              ? `${lowConfidenceCount} word${lowConfidenceCount !== 1 ? 's' : ''} need review (medium/low confidence)`
              : 'All words have high confidence — ready to approve!'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || Object.keys(edits).length === 0}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saveMut.isPending ? 'Saving...' : 'Save Corrections'}
          </button>
          <button
            onClick={handleSaveAndApprove}
            disabled={saveMut.isPending || approveMut.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {approveMut.isPending ? 'Approving...' : 'Approve & Finish'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {review.pages.map((pageReview, pageIndex) => (
          <div key={pageReview.page.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h2 className="font-medium text-slate-700 text-sm">
                Page {pageReview.page.pageNumber}
                <span className="ml-2 text-slate-400 font-normal">
                  Overall confidence: {pageReview.ocrResult.confidence.toFixed(1)}%
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-5 border-r border-slate-100">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Original Image</h3>
                <div className="bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center min-h-48">
                  <img
                    src={`/api/pages/${pageReview.page.id}/image`}
                    alt={`Page ${pageReview.page.pageNumber}`}
                    className="max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="text-slate-400 text-sm p-8 text-center">Image preview not available</div>'
                      }
                    }}
                  />
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  OCR Text — click words to correct
                </h3>
                <div className="flex flex-wrap gap-1.5 leading-relaxed">
                  {pageReview.ocrResult.words.map((word, wordIndex) => {
                    const currentValue = getWordValue(pageReview.page.id, wordIndex, word)
                    const isEditing = editing?.pageIndex === pageIndex && editing?.wordIndex === wordIndex
                    const isLowConf = word.confidence < 70
                    const isMedConf = word.confidence >= 70 && word.confidence < 90
                    const isEdited = edits[pageReview.page.id]?.[wordIndex] !== undefined
                    const hasSuggestion = !!word.suggestionFromProfile

                    if (isEditing) {
                      return (
                        <span key={wordIndex} className="inline-flex items-center">
                          <input
                            autoFocus
                            type="text"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onBlur={() => {
                              setWordEdit(pageReview.page.id, wordIndex, editing.value)
                              setEditing(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setWordEdit(pageReview.page.id, wordIndex, editing.value)
                                setEditing(null)
                              }
                              if (e.key === 'Escape') {
                                setEditing(null)
                              }
                            }}
                            className="border border-indigo-400 rounded px-1.5 py-0.5 text-sm min-w-[60px] outline-none ring-1 ring-indigo-300 bg-indigo-50"
                          />
                        </span>
                      )
                    }

                    return (
                      <span
                        key={wordIndex}
                        onClick={() => setEditing({ pageIndex, wordIndex, value: currentValue })}
                        className={`inline-flex items-center cursor-pointer rounded px-1.5 py-0.5 text-sm transition-all hover:opacity-80 select-none
                          ${isEdited ? 'bg-blue-100 text-blue-800 line-through decoration-current' : ''}
                          ${!isEdited && isLowConf ? 'bg-red-100 text-red-800' : ''}
                          ${!isEdited && isMedConf ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${!isEdited && word.confidence >= 90 ? 'text-slate-700 hover:bg-slate-100' : ''}
                        `}
                        title={`Confidence: ${word.confidence.toFixed(1)}% — click to edit${hasSuggestion ? ` (suggestion: ${word.suggestionFromProfile})` : ''}`}
                      >
                        {isEdited ? (
                          <span>
                            <span className="line-through text-slate-400 mr-1 text-xs">{word.word}</span>
                            <span className="text-blue-700 font-medium">{currentValue}</span>
                          </span>
                        ) : (
                          currentValue
                        )}
                        {hasSuggestion && !isEdited && (
                          <span className="ml-1 text-xs text-indigo-500">→{word.suggestionFromProfile}</span>
                        )}
                      </span>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
                    Low (&lt;70%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200 inline-block" />
                    Medium (70–89%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
                    High (≥90%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(saveMut.isError || approveMut.isError) && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          An error occurred. Please try again.
        </div>
      )}
    </div>
  )
}
