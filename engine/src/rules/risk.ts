import type { ChangeType, DiffChange } from '../models/types.js'

export const RISK_WEIGHTS: Record<ChangeType, number> = {
  'endpoint-removed':       40,
  'method-removed':         40,
  'response-field-removed': 25,
  'request-field-removed':  20,
  'field-type-changed':     15,
  'enum-value-removed':     10,
  'status-code-removed':    10,
  'field-required-changed':  8,
  'request-field-added':     1,
  'response-field-added':    1,
  'endpoint-added':          0,
  'method-added':            0,
  'enum-value-added':        0,
  'status-code-added':       0,
}

export type RiskCategory = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RiskBreakdownItem {
  changeType: ChangeType
  label: string
  count: number
  weight: number
  contribution: number
}

export interface RiskScore {
  score: number
  category: RiskCategory
  breakdown: RiskBreakdownItem[]
  topContributors: DiffChange[]
}

export function getRiskCategory(score: number): RiskCategory {
  if (score === 0)   return 'NONE'
  if (score <= 20)   return 'LOW'
  if (score <= 60)   return 'MEDIUM'
  if (score <= 120)  return 'HIGH'
  return 'CRITICAL'
}

export function calculateRiskScore(changes: DiffChange[]): RiskScore {
  const counts: Partial<Record<ChangeType, number>> = {}
  for (const c of changes) {
    counts[c.type] = (counts[c.type] ?? 0) + 1
  }

  let score = 0
  const breakdown: RiskBreakdownItem[] = []

  for (const [ct, count] of Object.entries(counts) as [ChangeType, number][]) {
    const weight = RISK_WEIGHTS[ct] ?? 0
    const contribution = weight * count
    if (contribution > 0) {
      breakdown.push({ changeType: ct, label: ct, count, weight, contribution })
      score += contribution
    }
  }

  breakdown.sort((a, b) => b.contribution - a.contribution)

  const topContributors = changes
    .filter(c => (RISK_WEIGHTS[c.type] ?? 0) > 0)
    .sort((a, b) => (RISK_WEIGHTS[b.type] ?? 0) - (RISK_WEIGHTS[a.type] ?? 0))
    .slice(0, 5)

  return {
    score,
    category: getRiskCategory(score),
    breakdown,
    topContributors,
  }
}
