import { useState, useCallback, useEffect } from 'react'
import { SCENARIOS } from '../data/samples'
import { runDiff, generateHTMLReport, determineExitCode } from '../engine/adapter'
import { useStudio } from '../context/StudioContext'
import { ScenarioPicker } from '../components/ScenarioPicker'
import { SummaryCards } from '../components/SummaryCards'
import { ChangesList } from '../components/ChangesList'
import { ContractPreview } from '../components/ContractPreview'
import { RiskScoreCard } from '../components/RiskScoreCard'
import { ImpactPanel } from '../components/ImpactPanel'
import { GovernancePanel } from '../components/GovernancePanel'
import { PlaygroundMode } from '../components/PlaygroundMode'
import { TabBtn } from '../components/TabBtn'
import type { RunDiffResult } from '../engine/adapter'
import {
  GitCompare, Download, FlaskConical, LayoutDashboard, Copy, CheckCheck,
  FileJson, Shield, GitBranch, MessageSquare, Layers, ArrowRight,
} from 'lucide-react'

type Tab = 'sample' | 'playground'

export function ContractPlayground() {
  const studio = useStudio()
  const [tab, setTab] = useState<Tab>('sample')
  const [selectedIdx, setSelectedIdx] = useState(1)
  const [localResult, setLocalResult] = useState<RunDiffResult | null>(studio.result)
  const [isRunning, setIsRunning] = useState(false)
  const [durationMs, setDurationMs] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [playOldText, setPlayOldText] = useState('')
  const [playNewText, setPlayNewText] = useState('')
  const [copied, setCopied] = useState(false)

  const activeScenario = SCENARIOS[selectedIdx]!
  const activeResult = localResult

  const runSampleAnalysis = useCallback((idx: number) => {
    setIsRunning(true)
    setError(null)
    requestAnimationFrame(() => {
      try {
        const scenario = SCENARIOS[idx]!
        const out = runDiff({
          oldContract: scenario.oldContract,
          newContract: scenario.newContract,
          governanceConfig: scenario.governanceConfig,
        })
        setLocalResult(out)
        setDurationMs(out.durationMs)
        studio.setResult(out)
        studio.setOldContractText(scenario.oldContract)
        studio.setNewContractText(scenario.newContract)
        studio.setGovernanceConfig(scenario.governanceConfig)
      } catch (e) {
        setError((e as Error).message)
        setLocalResult(null)
      } finally {
        setIsRunning(false)
      }
    })
  }, [studio])

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx)
    runSampleAnalysis(idx)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (tab === 'sample') runSampleAnalysis(selectedIdx)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tab, selectedIdx, runSampleAnalysis])

  function handleExportHTML() {
    if (!activeResult) return
    const html = generateHTMLReport(activeResult)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `specguard-report-${new Date().toISOString().slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleCopyResults() {
    if (!activeResult) return
    const r = activeResult.report
    const text = [
      `SpecGuard Report — ${r.metadata.oldTitle}`,
      `Risk: ${r.riskLevel} (score ${r.riskScore})`,
      `Breaking: ${r.summary.breaking} | Non-breaking: ${r.summary.nonBreaking}`,
      `Generated: ${r.generatedAt}`,
      '',
      'Changes:',
      ...r.changes.map(c => `  [${c.severity}] ${c.breaking ? '⚠ BREAKING' : ''} ${c.method ? c.method.toUpperCase() + ' ' : ''}${c.path} — ${c.description}`),
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const oldContractText = tab === 'sample' ? activeScenario.oldContract : playOldText
  const newContractText = tab === 'sample' ? activeScenario.newContract : playNewText
  const oldTitle = activeResult
    ? activeResult.result.metadata.oldTitle + ' v' + activeResult.result.metadata.oldVersion
    : 'Old Contract'
  const newTitle = activeResult
    ? activeResult.result.metadata.newTitle + ' v' + activeResult.result.metadata.newVersion
    : 'New Contract'

  const breakingChanges = activeResult?.result.changes.filter(c => c.breaking) ?? []
  const nonBreakingChanges = activeResult?.result.changes.filter(c => !c.breaking) ?? []
  const exitCode = activeResult ? determineExitCode(activeResult.report, { failOnHigh: true, failOnMedium: false }) : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Contract Playground
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {tab === 'sample' ? activeScenario.description : 'Paste or upload your own OpenAPI specs to analyze'}
          </p>
        </div>

        {activeResult && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopyResults}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Results'}
            </button>
            <button
              onClick={handleExportHTML}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export HTML
            </button>
          </div>
        )}
      </div>

      {/* Landing overview strip — shown when a result is loaded */}
      {activeResult && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                activeResult.report.riskLevel === 'HIGH' || activeResult.report.riskLevel === 'CRITICAL'
                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                  : activeResult.report.riskLevel === 'MEDIUM'
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                  : activeResult.report.riskLevel === 'LOW'
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              }`}>{activeResult.report.riskLevel}</span>
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Score {activeResult.report.riskScore}</span>
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-red-500 dark:text-red-400">{activeResult.report.summary.breaking}</span> breaking ·{' '}
              <span className="font-semibold text-emerald-500 dark:text-emerald-400">{activeResult.report.summary.nonBreaking}</span> non-breaking
            </div>
            {activeResult.report.governance && (
              <>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-emerald-500 dark:text-emerald-400">{activeResult.report.governance.approved}</span> approved ·{' '}
                  <span className="font-semibold text-amber-500 dark:text-amber-400">{activeResult.report.governance.unapprovedBreaking}</span> unapproved
                </div>
              </>
            )}
            {exitCode !== null && (
              <>
                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Exit code: <span className={`font-bold font-mono ${exitCode === 0 ? 'text-emerald-500 dark:text-emerald-400' : exitCode === 1 ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`}>{exitCode}</span>
                </div>
              </>
            )}
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              v{activeResult.engineVersion} · {activeResult.durationMs}ms
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <QuickNavBtn icon={FileJson} label="Report" onClick={() => studio.navigateTo('report')} />
              <QuickNavBtn icon={Shield} label="Governance" onClick={() => studio.navigateTo('governance')} />
              <QuickNavBtn icon={Layers} label="Outputs" onClick={() => studio.navigateTo('output')} />
              <QuickNavBtn icon={GitBranch} label="CI/CD" onClick={() => studio.navigateTo('action')} />
              <QuickNavBtn icon={MessageSquare} label="PR Comment" onClick={() => studio.navigateTo('pr')} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800">
        <TabBtn active={tab === 'sample'} onClick={() => setTab('sample')}>
          <LayoutDashboard className="w-3.5 h-3.5" />
          Sample Contracts
        </TabBtn>
        <TabBtn active={tab === 'playground'} onClick={() => setTab('playground')}>
          <FlaskConical className="w-3.5 h-3.5" />
          Paste / Upload
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
            setLocalResult(result)
            setPlayOldText(oldText)
            setPlayNewText(newText)
            studio.setResult(result)
            studio.setOldContractText(oldText)
            studio.setNewContractText(newText)
            studio.setGovernanceConfig(undefined)
          }}
          onClear={() => {
            setLocalResult(null)
          }}
        />
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-5 py-4 text-sm text-red-600 dark:text-red-300">
          <strong className="font-semibold">Parse error:</strong> {error}
        </div>
      )}

      {!activeResult && !error && !isRunning && <EmptyState tab={tab} />}

      {activeResult && (
        <>
          <SummaryCards
            result={activeResult.result}
            riskLevel={activeResult.report.riskLevel}
            riskScore={activeResult.report.riskScore}
          />

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
          <GovernancePanel report={activeResult.report} />

          <ContractPreview
            oldContract={oldContractText}
            newContract={newContractText}
            oldTitle={oldTitle}
            newTitle={newTitle}
          />

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 px-5 py-4">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-3">Explore this report in other views</p>
            <div className="flex flex-wrap gap-2">
              <NavCard icon={FileJson} label="Report Explorer" desc="Inspect the raw ContractDiffReport" onClick={() => studio.navigateTo('report')} />
              <NavCard icon={Shield} label="Governance Lab" desc="Edit specguard.yml live" onClick={() => studio.navigateTo('governance')} />
              <NavCard icon={Layers} label="Output Explorer" desc="Console, JSON, Markdown, HTML" onClick={() => studio.navigateTo('output')} />
              <NavCard icon={GitBranch} label="GitHub Action" desc="Configure CI/CD exit codes" onClick={() => studio.navigateTo('action')} />
              <NavCard icon={MessageSquare} label="PR Comment" desc="Preview the generated comment" onClick={() => studio.navigateTo('pr')} />
            </div>
          </div>

          <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              Engine v{activeResult.engineVersion} · {activeResult.durationMs}ms · report v{activeResult.report.reportVersion}
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

function QuickNavBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  )
}

function NavCard({ icon: Icon, label, desc, onClick }: { icon: React.ElementType; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-left group"
    >
      <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0 transition-colors" />
      <div>
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{label}</p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 ml-auto shrink-0 transition-colors" />
    </button>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center">
        <GitCompare className="w-7 h-7 text-indigo-400 dark:text-indigo-500" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {tab === 'sample' ? 'Select a scenario and run analysis' : 'Paste your contracts above and click Analyze'}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {tab === 'sample'
            ? 'Choose from breaking removal, safe additive, or governance audit scenarios. Results populate every Studio tab.'
            : 'Paste OpenAPI YAML or JSON on both sides. Supports OpenAPI 3.x.'}
        </p>
        {tab === 'sample' && (
          <p className="text-[11px] text-zinc-300 dark:text-zinc-600 pt-1">
            Tip: Press <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700">⌘ Enter</kbd> to run
          </p>
        )}
      </div>
    </div>
  )
}
