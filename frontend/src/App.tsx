import { useEffect } from 'react'
import { Header } from './components/Header'
import { StudioProvider } from './context/StudioContext'
import { useStudio } from './context/StudioContext'
import { ContractPlayground } from './pages/ContractPlayground'
import { ReportExplorer } from './pages/ReportExplorer'
import { GovernanceLab } from './pages/GovernanceLab'
import { GitHubActionPlayground } from './pages/GitHubActionPlayground'
import { PRCommentPreview } from './pages/PRCommentPreview'
import { CLIBuilder } from './pages/CLIBuilder'
import { OutputExplorer } from './pages/OutputExplorer'
import { ArchitectureView } from './pages/ArchitectureView'
import type { TabId } from './types'
import {
  FlaskConical, FileJson, Shield, GitBranch,
  MessageSquare, Terminal, Layers, Network,
} from 'lucide-react'

const TABS: { id: TabId; label: string; shortLabel: string; icon: React.ElementType; description: string }[] = [
  { id: 'playground', label: 'Contract Playground', shortLabel: 'Playground', icon: FlaskConical, description: 'Diff any two contracts' },
  { id: 'report', label: 'Report Explorer', shortLabel: 'Report', icon: FileJson, description: 'Inspect ContractDiffReport' },
  { id: 'governance', label: 'Governance Lab', shortLabel: 'Governance', icon: Shield, description: 'Edit specguard.yml live' },
  { id: 'action', label: 'GitHub Action', shortLabel: 'CI/CD', icon: GitBranch, description: 'CI/CD integration preview' },
  { id: 'pr', label: 'PR Comment', shortLabel: 'PR', icon: MessageSquare, description: 'Generated PR comments' },
  { id: 'cli', label: 'CLI Builder', shortLabel: 'CLI', icon: Terminal, description: 'Build CLI commands' },
  { id: 'output', label: 'Output Explorer', shortLabel: 'Output', icon: Layers, description: 'All output formats' },
  { id: 'arch', label: 'Architecture', shortLabel: 'Arch', icon: Network, description: 'System design overview' },
]

function StudioLayout() {
  const { activeTab, navigateTo } = useStudio()

  useEffect(() => {
    const theme = localStorage.getItem('acd_theme')
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = '#ffffff'
      document.body.style.backgroundColor = '#ffffff'
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#09090b'
      document.body.style.backgroundColor = '#09090b'
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col w-full transition-colors duration-200">
      <Header />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col gap-0.5 p-3 pt-4">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all w-full group ${
                    active
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-500 dark:group-hover:text-zinc-400'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{tab.label}</div>
                    {active && (
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{tab.description}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </nav>
          <div className="mt-auto p-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 leading-relaxed">
              SpecGuard Studio<br />
              Engine runs fully client-side
            </p>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 shrink-0 text-[10px] font-medium transition-colors ${
                    active
                      ? 'text-indigo-500 dark:text-indigo-400'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-16 lg:pb-0 overflow-x-hidden">
          {activeTab === 'playground' && <ContractPlayground />}
          {activeTab === 'report' && <ReportExplorer />}
          {activeTab === 'governance' && <GovernanceLab />}
          {activeTab === 'action' && <GitHubActionPlayground />}
          {activeTab === 'pr' && <PRCommentPreview />}
          {activeTab === 'cli' && <CLIBuilder />}
          {activeTab === 'output' && <OutputExplorer />}
          {activeTab === 'arch' && <ArchitectureView />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StudioProvider>
      <StudioLayout />
    </StudioProvider>
  )
}
