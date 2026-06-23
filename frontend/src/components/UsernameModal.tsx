import { useState, useRef, useEffect } from 'react'
import { updateUsername } from '../api/users'
import type { User } from '../types'

interface Props {
  user: User
  onClose: () => void
  onUpdate: (user: User) => void
}

export default function UsernameModal({ user, onClose, onUpdate }: Props) {
  const [value, setValue] = useState(user.username)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) { setError('Username cannot be empty.'); return }
    if (trimmed.length < 2) { setError('Minimum 2 characters.'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Letters, numbers, underscores, hyphens only.')
      return
    }
    if (trimmed === user.username) { onClose(); return }
    setError('')
    setLoading(true)
    try {
      const updated = await updateUsername(user.id, trimmed)
      onUpdate(updated)
    } catch (err: any) {
      setError(err?.message?.includes('taken') ? 'Username already taken.' : (err?.message || 'Update failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Change username</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update your display name</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">New username</label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError('') }}
              maxLength={32}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors ${
                error ? 'border-red-400 dark:border-red-600' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500'
              }`}
            />
            {error && <p className="text-red-600 dark:text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
