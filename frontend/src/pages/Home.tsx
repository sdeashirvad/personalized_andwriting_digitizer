import { useState, useEffect, useCallback } from 'react'
import { SCENARIOS } from '../data/samples'
import { runDiff } from '../engine/adapter'
import { ScenarioPicker } from '../components/ScenarioPicker'
import { SummaryCards } from '../components/SummaryCards'
import { ChangesList } from '../components/ChangesList'
import { ContractPreview } from '../components/ContractPreview'
import type { DiffResult } from '@engine/models/types'
import { GitCompare } from 'lucide-react'

export function Home() {
  const [selectedIdx, setSelectedIdx] = useState(1)
  const [result, setResult] = useState<DiffResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [durationMs, setDurationMs] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = useCallback((idx: number) => {
    setIsRunning(true)
    setError(null)
    requestAnimationFrame(() => {
      try {
        const scenario = SCENARIOS[idx]!
        const out = runDiff({ oldContract: scenario.oldContract, newContract: scenario.newContract })
        setResult(out.result)
        setDurationMs(out.durationMs)
      } catch (e) {
        setError((e as Error).message)
        setResult(null)
      } finally {
        setIsRunning(false)
      }
    })
  }, [])

  useEffect(() => {
    runAnalysis(selectedIdx)
  }, [])

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx)
    runAnalysis(idx)
  }

  const scenario = SCENARIOS[selectedIdx]!
  const breakingChanges = result?.changes.filter(c => c.breaking) ?? []
  const nonBreakingChanges = result?.changes.filter(c => !c.breaking) ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Contract Analysis</h1>
        <p className="text-sm text-zinc-500">
          {scenario.description}
        </p>
      </div>

      <ScenarioPicker
        scenarios={SCENARIOS}
        selected={selectedIdx}
        onSelect={handleSelect}
        onRun={() => runAnalysis(selectedIdx)}
        isRunning={isRunning}
        durationMs={durationMs}
      />

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg px-5 py-4 text-sm text-red-300">
          <strong className="font-semibold">Parse error:</strong> {error}
        </div>
      )}

      {!result && !error && !isRunning && (
        <EmptyState />
      )}

      {result && (
        <>
          <SummaryCards result={result} />

          <div className="space-y-3">
            <ChangesList
              title="Breaking Changes"
              changes={breakingChanges}
              defaultOpen={true}
              accentClass="text-red-400"
              emptyMessage="No breaking changes detected — safe to ship!"
            />
            <ChangesList
              title="Non-Breaking Changes"
              changes={nonBreakingChanges}
              defaultOpen={breakingChanges.length === 0}
              accentClass="text-emerald-400"
              emptyMessage="No additive changes detected"
            />
          </div>

          <ContractPreview
            oldContract={scenario.oldContract}
            newContract={scenario.newContract}
            oldTitle={result.metadata.oldTitle + ' v' + result.metadata.oldVersion}
            newTitle={result.metadata.newTitle + ' v' + result.metadata.newVersion}
          />

          <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-800">
            <p className="text-xs text-zinc-600">
              Powered by local engine v1.0.0 · future-ready for global package swap
            </p>
            <p className="text-xs text-zinc-600">
              {result.metadata.timestamp.slice(0, 19).replace('T', ' ')} UTC
            </p>
          </footer>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <GitCompare className="w-6 h-6 text-zinc-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-400">Select a scenario and run analysis</p>
        <p className="text-xs text-zinc-600">Results will appear here</p>
      </div>
    </div>
  )
}
