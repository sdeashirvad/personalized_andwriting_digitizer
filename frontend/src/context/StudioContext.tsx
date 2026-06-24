import { createContext, useContext, useState, useCallback } from 'react'
import { runDiff } from '../engine/adapter'
import type { RunDiffResult, SpecGuardConfig } from '../engine/adapter'
import { SCENARIOS } from '../data/samples'
import type { TabId } from '../types'

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
