import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import type { User } from '../types'
import UsernameModal from './UsernameModal'

interface Props {
  user: User
  isDark: boolean
  onToggleTheme: () => void
  onUpdateUser: (user: User) => void
}

export default function Layout({ user, isDark, onToggleTheme, onUpdateUser }: Props) {
  const location = useLocation()
  const [showUsernameModal, setShowUsernameModal] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
              Handwriting Digitizer
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                location.pathname === '/'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Documents
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setShowUsernameModal(true)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  {user.username[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                {user.username}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-600">
          <span>Handwriting Digitizer V1</span>
          <span>OCR + Personal Correction Memory</span>
        </div>
      </footer>

      {showUsernameModal && (
        <UsernameModal
          user={user}
          onClose={() => setShowUsernameModal(false)}
          onUpdate={(updated) => { onUpdateUser(updated); setShowUsernameModal(false) }}
        />
      )}
    </div>
  )
}
