import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDocument } from '../api/documents'

interface Props {
  userId: string
  onClose: () => void
}

export default function UploadModal({ userId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: (f: File) => uploadDocument(f, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      onClose()
    },
  })

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Upload Handwritten Notes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Images will be processed with OCR</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
            {file ? (
              <div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{file.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 hover:underline"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                >
                  Change file
                </button>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Drop your file here</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">or click to browse</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-2">PNG, JPG, JPEG, or PDF · Max 50 MB</p>
              </div>
            )}
          </div>

          {mutation.isError && (
            <div className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3 border border-red-200 dark:border-red-900">
              {(mutation.error as { message: string })?.message || 'Upload failed. Please try again.'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => file && mutation.mutate(file)}
              disabled={!file || mutation.isPending}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : 'Upload & Process'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
