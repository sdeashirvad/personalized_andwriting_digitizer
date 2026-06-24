---
name: SpecGuard Studio Phase 6
description: Frontend transformed into 8-tab studio; key API constraints and shared state architecture.
---

# SpecGuard Studio Phase 6

## What was built
The single-page dashboard was replaced with an 8-tab studio (SpecGuard Studio) with a sidebar nav (desktop) and bottom tab bar (mobile).

## Key constraint: toHTML signature
`toHTML` from the engine takes `(DiffResult, RiskScore, ImpactReport[])` — NOT `ContractDiffReport`. 
`RunDiffResult` was updated to store `diffResult: DiffResult` so `generateHTMLReport` wrapper in adapter.ts can call it correctly.

**Why:** The engine's `toHTML` operates at the DiffResult level, before the report pipeline. The frontend wrapper `generateHTMLReport(r: RunDiffResult)` calls `toHTML(r.diffResult, r.riskScore, r.impactReports)`.

## Shared state
`StudioContext` (`frontend/src/context/StudioContext.tsx`) provides `RunDiffResult | null` across all 8 tabs. Contract Playground sets it on every run; all other tabs read from it. Governance Lab can re-run with a custom config.

## Tab routing
No React Router is used for tab navigation — `useState<TabId>` in `App.tsx` controls the active tab. BrowserRouter is still in `main.tsx` (harmless leftover).

## File layout (new pages)
All 8 pages in `frontend/src/pages/`:
- ContractPlayground, ReportExplorer, GovernanceLab, GitHubActionPlayground, PRCommentPreview, CLIBuilder, OutputExplorer, ArchitectureView

## Build verification
`npm run build` passes cleanly: 105 modules, 0 TS errors, ~490KB bundle.
