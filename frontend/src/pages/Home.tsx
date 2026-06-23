import { useState, useEffect, useCallback } from 'react'
import { SCENARIOS } from '../data/samples'
import { runDiff, generateHTMLReport } from '../engine/adapter'
import type { RunDiffResult } from '../engine/adapter'
import { ScenarioPicker } from '../components/ScenarioPicker'
import { SummaryCards } from '../components/SummaryCards'
import { ChangesList } from '../components/ChangesList'
import { ContractPreview } from '../components/ContractPreview'
import { RiskScoreCard } from '../components/RiskScoreCard'
import { ImpactPanel } from '../components/ImpactPanel'
import { PlaygroundMode } from '../components/PlaygroundMode'
import { GitCompare, Download, FlaskConical, LayoutDashboard } from 'lucide-react'

type Tab = 'sample' | 'playground'

export function Home() {
  const [tab, setTab] = useState<Tab>('sample')

  const [selectedIdx, setSelectedIdx] = useState(1)
  const [sampleResult, setSampleResult] = useState<RunDiffResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [durationMs, setDurationMs] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const [playResult, setPlayResult] = useState<RunDiffResult | null>(null)
  const [playOldText, setPlayOldText] = useState('')
  const [playNewText, setPlayNewText] = useState('')

  const activeResult = tab === 'sample' ? sampleResult : playResult
  const activeScenario = SCENARIOS[selectedIdx]!

  const runSampleAnalysis = useCallback((idx: number) => {
    setIsRunning(true)
    setError(null)
    requestAnimationFrame(() => {
      try {
        const scenario = SCENARIOS[idx]!
        const out = runDiff({ oldContract: scenario.oldContract, newContract: scenario.newContract })
        setSampleResult(out)
        setDurationMs(out.durationMs)
      } catch (e) {
        setError((e as Error).message)
        setSampleResult(null)
      } finally {
        setIsRunning(false)
      }
    })
  }, [])

  useEffect(() => {
    runSampleAnalysis(selectedIdx)
  }, [])

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx)
    runSampleAnalysis(idx)
  }

  function handleExportHTML() {
    if (!activeResult) return
    const html = generateHTMLReport(activeResult)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-diff-report-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const breakingChanges = activeResult?.result.changes.filter(c => c.breaking) ?? []
  const nonBreakingChanges = activeResult?.result.changes.filter(c => !c.breaking) ?? []

  const oldContractText = tab === 'sample' ? activeScenario.oldContract : playOldText
  const newContractText = tab === 'sample' ? activeScenario.newContract : playNewText
  const oldTitle = activeResult
    ? activeResult.result.metadata.oldTitle + ' v' + activeResult.result.metadata.oldVersion
    : 'Old Contract'
  const newTitle = activeResult
    ? activeResult.result.metadata.newTitle + ' v' + activeResult.result.metadata.newVersion
    : 'New Contract'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Contract Analysis
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {tab === 'sample' ? activeScenario.description : 'Paste or upload your own OpenAPI specs to analyze'}
          </p>
        </div>

        {activeResult && (
          <button
            onClick={handleExportHTML}
            className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export HTML
          </button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800">
        <TabBtn active={tab === 'sample'} onClick={() => setTab('sample')}>
          <LayoutDashboard className="w-3.5 h-3.5" />
          Sample Contracts
        </TabBtn>
        <TabBtn active={tab === 'playground'} onClick={() => setTab('playground')}>
          <FlaskConical className="w-3.5 h-3.5" />
          Playground
        </TabBtn>
      </div>

      {tab === 'sample' && (
        <ScenarioPicker
          scenarios={SCENARIOS}
          selected={selectedIdx}
          onSelect={handleSelect}
          onRun={() => runSampleAnalysis(selectedIdx)}
          isRunning={isRunning}
          durationMs={durationMs}
        />
      )}

      {tab === 'playground' && (
        <PlaygroundMode
          onResult={(result, oldText, newText) => {
            setPlayResult(result)
            setPlayOldText(oldText)
            setPlayNewText(newText)
          }}
          onClear={() => setPlayResult(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-5 py-4 text-sm text-red-600 dark:text-red-300">
          <strong className="font-semibold">Parse error:</strong> {error}
        </div>
      )}

      {!activeResult && !error && !isRunning && (
        <EmptyState tab={tab} />
      )}

      {activeResult && (
        <>
          <SummaryCards result={activeResult.result} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              <ChangesList
                title="Breaking Changes"
                changes={breakingChanges}
                defaultOpen={true}
                accentClass="text-red-500 dark:text-red-400"
                emptyMessage="No breaking changes detected — safe to ship!"
              />
              <ChangesList
                title="Non-Breaking Changes"
                changes={nonBreakingChanges}
                defaultOpen={breakingChanges.length === 0}
                accentClass="text-emerald-500 dark:text-emerald-400"
                emptyMessage="No additive changes detected"
              />
            </div>
            <div>
              <RiskScoreCard riskScore={activeResult.riskScore} />
            </div>
          </div>

          <ImpactPanel reports={activeResult.impactReports} />

          <ContractPreview
            oldContract={oldContractText}
            newContract={newContractText}
            oldTitle={oldTitle}
            newTitle={newTitle}
          />

          <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Powered by local engine v{activeResult.engineVersion} · future-ready for global package swap
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {activeResult.result.metadata.timestamp.slice(0, 19).replace('T', ' ')} UTC
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        active
          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <GitCompare className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {tab === 'sample' ? 'Select a scenario and run analysis' : 'Paste your contracts above and click Analyze'}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Results will appear here</p>
      </div>
    </div>
  )
}
