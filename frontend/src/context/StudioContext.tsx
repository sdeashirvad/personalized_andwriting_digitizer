import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { runDiff, reconstructFromReport } from '../engine/adapter'
import type { RunDiffResult, SpecGuardConfig, ContractDiffReport } from '../engine/adapter'
import { SCENARIOS } from '../data/samples'
import type { TabId } from '../types'

export interface WebViewMeta {
  oldPath: string
  newPath: string
  configPath?: string
  engineVersion: string
  reportGeneratedAt: string
  riskLevel: string
  riskScore: number
  breakingCount: number
}

interface WebViewData {
  report: ContractDiffReport
  oldContract?: string
  newContract?: string
  meta: WebViewMeta
}

interface StudioContextValue {
  result: RunDiffResult | null
  setResult: (result: RunDiffResult | null) => void
  oldContractText: string
  setOldContractText: (text: string) => void
  newContractText: string
  setNewContractText: (text: string) => void
  governanceConfig: SpecGuardConfig | undefined
  setGovernanceConfig: (cfg: SpecGuardConfig | undefined) => void
  runAnalysis: (old: string, newC: string, gov?: SpecGuardConfig) => RunDiffResult
  error: string | null
  activeTab: TabId
  navigateTo: (tab: TabId) => void
  isWebViewMode: boolean
  webViewMeta: WebViewMeta | null
}

export const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const defaultScenario = SCENARIOS[1]!
  const [result, setResult] = useState<RunDiffResult | null>(() => {
    try {
      return runDiff({
        oldContract: defaultScenario.oldContract,
        newContract: defaultScenario.newContract,
        governanceConfig: defaultScenario.governanceConfig,
      })
    } catch {
      return null
    }
  })
  const [oldContractText, setOldContractText] = useState(defaultScenario.oldContract)
  const [newContractText, setNewContractText] = useState(defaultScenario.newContract)
  const [governanceConfig, setGovernanceConfig] = useState<SpecGuardConfig | undefined>(defaultScenario.governanceConfig)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('playground')
  const [isWebViewMode, setIsWebViewMode] = useState(false)
  const [webViewMeta, setWebViewMeta] = useState<WebViewMeta | null>(null)

  const navigateTo = useCallback((tab: TabId) => {
    setActiveTab(tab)
  }, [])

  const runAnalysis = useCallback((old: string, newC: string, gov?: SpecGuardConfig): RunDiffResult => {
    setError(null)
    try {
      const r = runDiff({ oldContract: old, newContract: newC, governanceConfig: gov })
      setResult(r)
      setOldContractText(old)
      setNewContractText(newC)
      setGovernanceConfig(gov)
      return r
    } catch (e) {
      setError((e as Error).message)
      throw e
    }
  }, [])

  // ── WebView mode: receive engine-produced ContractDiffReport from the server ─
  useEffect(() => {
    if (!(window as any).__SPECGUARD_WEBVIEW__) return

    fetch('/webview-data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<WebViewData>
      })
      .then((data) => {
        // Reconstruct RunDiffResult from the engine-produced report.
        // No re-execution of the diff engine — the report IS the authoritative result.
        const r = reconstructFromReport(data.report)
        setResult(r)
        if (data.oldContract) setOldContractText(data.oldContract)
        if (data.newContract) setNewContractText(data.newContract)
        setIsWebViewMode(true)
        setWebViewMeta(data.meta)
      })
      .catch((err) => {
        console.warn('[SpecGuard WebView] Failed to load webview-data.json:', err)
      })
  }, [])

  return (
    <StudioContext.Provider value={{
      result, setResult,
      oldContractText, setOldContractText,
      newContractText, setNewContractText,
      governanceConfig, setGovernanceConfig,
      runAnalysis,
      error,
      activeTab,
      navigateTo,
      isWebViewMode,
      webViewMeta,
    }}>
      {children}
    </StudioContext.Provider>
  )
}

