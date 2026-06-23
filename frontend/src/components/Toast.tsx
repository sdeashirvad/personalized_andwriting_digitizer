import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss: () => void
}

const icons = {
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const styles = {
  success: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
}

export default function Toast({ message, type = 'info', onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-xs animate-in slide-in-from-bottom-2 ${styles[type]}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
