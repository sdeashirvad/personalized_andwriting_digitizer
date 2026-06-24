import { useState, useCallback } from 'react'
import { useStudio } from '../context/StudioContext'
import { runDiff } from '../engine/adapter'
import type { SpecGuardConfig, RunDiffResult } from '../engine/adapter'
import { GovernancePanel } from '../components/GovernancePanel'
import { Shield, Play, AlertCircle, BookOpen, ChevronDown } from 'lucide-react'
import { load as yamlLoad } from 'js-yaml'

const EXAMPLES: { label: string; description: string; yaml: string }[] = [
  {
    label: 'Approved Removal',
    description: 'Approve an endpoint removal with owner and expiry',
    yaml: `approvedChanges:
  - type: endpointRemoved
    path: /products/{id}
    owner: platform-team
    approvedBy: architecture-board
    reason: "Products endpoint sunset — consumers migrated to /catalog/items/{id}"
    expires: "2027-06-01"
    createdAt: "2026-01-15"`,
  },
  {
    label: 'Suppression Rule',
    description: 'Suppress a rule type globally',
    yaml: `suppressions:
  - rule: ENDPOINT_ADDED
    reason: "New endpoints are additive and never break existing consumers"`,
  },
  {
    label: 'Expired Approval',
    description: 'Show what happens when an approval expires',
    yaml: `approvedChanges:
  - type: endpointRemoved
    path: /products/{id}
    owner: platform-team
    approvedBy: architecture-board
    reason: "Products endpoint sunset"
    expires: "2023-01-01"
    createdAt: "2022-06-01"`,
  },
  {
    label: 'Full Config',
    description: 'Combined approvals, suppressions, and ownership',
    yaml: `approvedChanges:
  - type: endpointRemoved
    path: /products/{id}
    owner: platform-team
    approvedBy: architecture-board
    reason: "Products endpoint sunset — see ADR-2026-04"
    expires: "2027-06-01"
    createdAt: "2026-01-15"
  - type: requiredFieldRemoved
    path: /users
    owner: identity-team
    approvedBy: api-review-board
    reason: "Email field moved to identity service"
    expires: "2027-01-01"
    createdAt: "2026-02-01"
suppressions:
  - rule: ENDPOINT_ADDED
    reason: "Additive changes are never breaking"`,
  },
]

export function GovernanceLab() {
  const { oldContractText, newContractText, result: globalResult } = useStudio()
  const [configYaml, setConfigYaml] = useState(EXAMPLES[0]!.yaml)
  const [result, setResult] = useState<RunDiffResult | null>(globalResult)
  const [error, setError] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  function parseConfig(yaml: string): SpecGuardConfig | undefined {
    const trimmed = yaml.trim()
    if (!trimmed) return undefined
    try {
      const parsed = yamlLoad(trimmed)
      if (typeof parsed !== 'object' || parsed === null) return undefined
      return parsed as SpecGuardConfig
    } catch (e) {
      throw new Error(`Invalid YAML: ${(e as Error).message}`)
    }
  }

  const handleRun = useCallback(() => {
    if (!oldContractText || !newContractText) {
      setError('No contracts loaded. Run an analysis in Contract Playground first.')
      return
    }
    setParseError(null)
    setError(null)
    let gov: SpecGuardConfig | undefined
    try {
      gov = parseConfig(configYaml)
    } catch (e) {
      setParseError((e as Error).message)
      return
    }
    setIsRunning(true)
    requestAnimationFrame(() => {
      try {
        const r = runDiff({ oldContract: oldContractText, newContract: newContractText, governanceConfig: gov })
        setResult(r)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setIsRunning(false)
      }
    })
  }, [oldContractText, newContractText, configYaml])

  function handleLoadExample(ex: typeof EXAMPLES[0]) {
    setConfigYaml(ex.yaml)
    setParseError(null)
    setShowExamples(false)
  }

  const noContracts = !oldContractText || !newContractText

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          Governance Lab
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Edit <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">specguard.yml</code> live in the browser and see how governance rules change the report instantly
        </p>
      </div>

      {noContracts && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-5 py-4 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          No contracts loaded. Go to Contract Playground first to load a scenario.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: YAML editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">specguard.yml</p>
            <button
              onClick={() => setShowExamples(s => !s)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Examples
              <ChevronDown className={`w-3 h-3 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showExamples && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => handleLoadExample(ex)}
                  className="w-full flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ex.label}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{ex.description}</span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">YAML</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">Edit and click Run</span>
            </div>
            <textarea
              value={configYaml}
              onChange={e => {
                setConfigYaml(e.target.value)
                setParseError(null)
              }}
              rows={18}
              spellCheck={false}
              className="w-full p-4 text-xs font-mono bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-300 resize-none focus:outline-none leading-relaxed"
              placeholder="Paste your specguard.yml here or pick an example above…"
            />
          </div>

          {parseError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-xs text-red-600 dark:text-red-400 font-mono">
              {parseError}
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={isRunning || noContracts}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <><span className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> Applying…</>
            ) : (
              <><Play className="w-4 h-4" /> Apply Governance Config</>
            )}
          </button>
        </div>

        {/* Right: Governance results */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Governance Result</p>
          {result?.report.governance ? (
            <>
              <GovernancePanel report={result.report} />
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Changes with governance annotations</p>
                <div className="space-y-2">
                  {result.report.changes.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      {c.governanceStatus ? (
                        <span className={`shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          c.governanceStatus === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                          c.governanceStatus === 'EXPIRED' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                          c.governanceStatus === 'SUPPRESSED' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700' :
                          'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>{c.governanceStatus}</span>
                      ) : (
                        <span className="shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700">—</span>
                      )}
                      <div className="min-w-0">
                        <code className="font-mono text-zinc-700 dark:text-zinc-300">{c.method ? c.method.toUpperCase() + ' ' : ''}{c.path}</code>
                        <span className="text-zinc-400 dark:text-zinc-500 ml-2">{c.description}</span>
                        {c.governanceMetadata?.owner && (
                          <span className="ml-2 text-zinc-400 dark:text-zinc-600">· owner: {c.governanceMetadata.owner}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
              <Shield className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Apply a config to see governance results</p>
              <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Load an example above and click "Apply Governance Config"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
