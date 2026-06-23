import { useState, useRef, useEffect } from 'react'

interface Props {
  onComplete: (username: string) => Promise<void>
}

export default function OnboardingModal({ onComplete }: Props) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) { setError('Please enter a username.'); return }
    if (trimmed.length < 2) { setError('Username must be at least 2 characters.'); return }
    if (trimmed.length > 32) { setError('Username must be 32 characters or fewer.'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError('Only letters, numbers, underscores, and hyphens are allowed.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onComplete(trimmed)
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.'
      setError(msg.includes('already') ? 'That username is taken — try another.' : msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Handwriting Digitizer</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            OCR-powered digitization with personal correction memory
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Welcome — choose a username</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              This identifies your documents and builds your personal correction profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username
              </label>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="e.g. alex_smith"
                maxLength={32}
                className={`w-full px-4 py-2.5 rounded-lg border text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  error
                    ? 'border-red-400 dark:border-red-500 focus:border-red-400'
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500'
                }`}
              />
              {error && (
                <p className="text-red-600 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" />
                  </svg>
                  {error}
                </p>
              )}
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5">
                Letters, numbers, underscores, hyphens. 2–32 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up your workspace...
                </>
              ) : (
                <>
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          No authentication required. Your data is identified by username only.
        </p>
      </div>
    </div>
  )
}
