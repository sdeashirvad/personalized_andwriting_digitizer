---
name: SpecGuard Studio Phase 6 + Polish
description: Frontend 8-tab Studio; key API constraints, shared state architecture, and polish decisions.
---

# SpecGuard Studio Phase 6 + Polish

## Key constraint: toHTML signature
`toHTML` from the engine takes `(DiffResult, RiskScore, ImpactReport[])` — NOT `ContractDiffReport`. 
`RunDiffResult` stores `diffResult: DiffResult` so `generateHTMLReport` wrapper in adapter.ts calls `toHTML(r.diffResult, r.riskScore, r.impactReports)`.

**Why:** The engine's `toHTML` operates at the DiffResult level, before the report pipeline.

## Shared state architecture (current)
`StudioContext` provides `RunDiffResult | null`, `oldContractText`, `newContractText`, `governanceConfig`, `runAnalysis()`, `activeTab: TabId`, and `navigateTo(tab)`. Tab state LIVES IN THE CONTEXT — not in App.tsx. All 8 pages read from context; playground and governance lab write to it.

## SummaryCards consistency
`SummaryCards` takes `riskLevel: string` and `riskScore: number` as explicit props sourced from `report.riskLevel` and `report.riskScore`. Do NOT let it compute its own risk from `summary.bySeverity` (that loses CRITICAL support and diverges from engine output).

## Tab routing
No React Router — `activeTab: TabId` in `StudioContext` drives rendering in `App.tsx`. `navigateTo(tab)` from `useStudio()` works in any component.

## Dead code removed
`pages/Home.tsx`, `assets/react.svg`, `assets/vite.svg` — deleted.

## TabId type
Defined in `frontend/src/types.ts`, imported wherever needed.

## GovernanceLab global update
GovernanceLab calls `studio.setResult(r)` and `studio.setGovernanceConfig(gov)` after running — this updates all other tabs immediately (single source of truth).

## js-yaml in frontend
`js-yaml` v5.1.0 is available in frontend/node_modules (comes via the engine tarball install). GovernanceLab imports `{ load }` from `js-yaml` to parse YAML config.

## Build state
`npx tsc --noEmit` → zero errors. `npx vite build` → 107 modules, 508KB (expected — engine bundled client-side). Chunk size warning is expected and harmless.
