---
name: Governance engine
description: Phase 4 governance implementation — specguard.yml, approval/suppression/expiry, GovernancePanel dashboard
---

# Governance Engine

## Rule
`generateReport(result, config?, configPath?)` accepts an optional `SpecGuardConfig`.
When provided, the governance engine annotates each `DiffChange` with `governanceStatus` and `governanceMetadata`, and adds a `governance: GovernanceSummary` to the report.

**Why:** The diff report model is the single source of truth — governance is additive metadata on top, never a separate data structure.

## How to apply
- CLI: `loadConfig(configArg?)` from `engine/src/governance/ConfigLoader.ts` — returns `null` silently if `./specguard.yml` absent.
- Browser/adapter: pass `governanceConfig` in `RunDiffOptions`; sample scenarios embed config in `samples.ts`.
- Processing order: Suppression → Approval → Expired → Unapproved (for breaking). Non-breaking unmatched = no status.

## Key types
- `GovernanceStatus` = `'APPROVED' | 'SUPPRESSED' | 'EXPIRED' | 'UNAPPROVED'` (in `models/types.ts`)
- `GovernanceSummary` (in `report/ContractDiffReport.ts`)
- `SpecGuardConfig`, `ApprovedChange`, `SuppressionRule` (in `governance/SpecGuardConfig.ts`)

## Approval type mapping
Friendly names like `endpointRemoved` → `['endpoint-removed']` (see `ApprovalEngine.ts`).
Suppression rules like `ENDPOINT_ADDED` → `['endpoint-added']` (see `SuppressionEngine.ts`).
Special sentinels: `INFO` → suppress by severity, `NON_BREAKING` → suppress by breaking flag.

## Test count
129 tests passing after Phase 4 (75 pre-existing + 54 governance).
