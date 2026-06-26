import { Link } from 'react-router-dom'
import { Shield, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStudio } from '../context/useStudio'
import { BRAND } from '../brand/tokens'

const isWebviewOnly = import.meta.env.VITE_APP_MODE === 'webview'

export function Header() {
  const { isWebViewMode, isWebViewEnv } = useStudio()
  const reportOnlyView = isWebViewEnv || isWebViewMode
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('acd_theme') !== 'light'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#09090b'
      document.body.style.backgroundColor = '#09090b'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = '#ffffff'
      document.body.style.backgroundColor = '#ffffff'
    }
    localStorage.setItem('acd_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              SpecSentinel Studio
            </span>
            {!reportOnlyView && !isWebviewOnly && (
              <Link to="/" className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors">
                {BRAND.labs} product · Home
              </Link>
            )}
            {reportOnlyView && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                API Contract Intelligence
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!reportOnlyView && !isWebviewOnly && (
            <a
              href={BRAND.npmUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:border-red-300 transition-colors"
            >
              npm v{BRAND.npmVersion}
            </a>
          )}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            {reportOnlyView ? 'CLI report view' : 'Engine running client-side'}
          </span>
          <button
            onClick={() => setDark(d => !d)}
            className="w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  )
}
