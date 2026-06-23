import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DocumentDetail from './pages/DocumentDetail'
import ReviewPage from './pages/ReviewPage'
import OnboardingModal from './components/OnboardingModal'
import { useUser } from './hooks/useUser'
import { useTheme } from './hooks/useTheme'

function App() {
  const { user, isLoading, needsOnboarding, completeOnboarding, updateUser } = useUser()
  const { isDark, toggle } = useTheme()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (needsOnboarding) {
    return <OnboardingModal onComplete={completeOnboarding} />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user!} isDark={isDark} onToggleTheme={toggle} onUpdateUser={updateUser} />}>
        <Route index element={<Dashboard userId={user!.id} />} />
        <Route path="documents/:id" element={<DocumentDetail userId={user!.id} />} />
        <Route path="documents/:id/review" element={<ReviewPage userId={user!.id} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
