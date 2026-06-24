import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { runDiff } from '../engine/adapter'
import type { RunDiffResult, SpecGuardConfig } from '../engine/adapter'
import { SCENARIOS } from '../data/samples'
import type { TabId } from '../types'
import { load as yamlLoad } from 'js-yaml'

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
  oldContract: string
  newContract: string
  governanceConfigYaml?: string
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

const StudioContext = createContext<StudioContextValue | null>(null)

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

  // ── WebView mode: detect injection from the local server and load contracts ──
  useEffect(() => {
    if (!(window as any).__SPECGUARD_WEBVIEW__) return

    fetch('/webview-data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<WebViewData>
      })
      .then((data) => {
        let gov: SpecGuardConfig | undefined
        if (data.governanceConfigYaml) {
          try {
            gov = yamlLoad(data.governanceConfigYaml) as SpecGuardConfig
          } catch { /* governance config parse error — run without it */ }
        }
        const r = runDiff({
          oldContract: data.oldContract,
          newContract: data.newContract,
          governanceConfig: gov,
        })
        setResult(r)
        setOldContractText(data.oldContract)
        setNewContractText(data.newContract)
        setGovernanceConfig(gov)
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

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider')
  return ctx
}
