# Report Versioning Strategy

This document describes how `ContractDiffReport` schema versions are managed
across releases of `@api-contract-diff/engine`.

---

## Version field

Every report includes a top-level `reportVersion` field:

```json
{
  "reportVersion": "1.0",
  "toolVersion": "1.1.0",
  ...
}
```

- **`reportVersion`** — the schema version (independent of the npm package version)
- **`toolVersion`** — the engine npm package version that generated the report

These two fields are intentionally separate. The schema changes infrequently;
the tool may release many patch/minor versions between schema bumps.

---

## Versioning rules

### Patch (no version bump)
Changes that **do not** require a `reportVersion` bump:
- Adding new optional fields with a backward-compatible default
- Bug fixes that correct field values without changing the shape
- Documentation / comment updates

### Minor bump (e.g. `1.0` → `1.1`)
- New required fields added to the schema
- Semantic changes to existing fields (e.g. a new `riskLevel` category added)
- New top-level sections that older consumers would ignore safely

### Major bump (e.g. `1.0` → `2.0`)
- Renaming or removing any existing field
- Changing the type of any existing field
- Restructuring nested objects in a breaking way

---

## Compatibility rules

| Report version | Tool can read? | Tool produces? |
|----------------|---------------|----------------|
| 1.0            | ✅ Yes         | ✅ Yes (current) |

Consumers MUST check `reportVersion` before processing a report.
If the version is unknown, consumers SHOULD surface a warning and attempt
best-effort parsing rather than hard-failing.

```typescript
import { isVersionSupported } from '@api-contract-diff/engine'

if (!isVersionSupported(report.reportVersion)) {
  console.warn(`Unknown report version: ${report.reportVersion}. Proceeding with best-effort.`)
}
```

---

## Migration expectations

When `reportVersion` is bumped:

1. The engine exports a migration helper:
   ```typescript
   import { migrateReport } from '@api-contract-diff/engine'
   const v2Report = migrateReport(v1Report) // upgrades schema in-place
   ```

2. A `CHANGELOG.md` entry documents every field-level change.

3. Existing JSON reports saved to disk remain readable via the migration helper
   for at least **two major versions** of the engine.

4. The `SUPPORTED_REPORT_VERSIONS` constant in `ReportVersion.ts` lists all
   versions the current engine can read.

---

## Current schema (v1.0)

```typescript
interface ContractDiffReport {
  reportVersion: "1.0"
  generatedAt: string           // ISO 8601
  toolVersion: string           // semver
  riskScore: number             // 0-∞ (weighted)
  riskLevel: RiskCategory       // NONE|LOW|MEDIUM|HIGH|CRITICAL
  riskBreakdown: RiskBreakdownItem[]
  summary: DiffSummary          // total, breaking, nonBreaking, bySeverity
  metadata: DiffMetadata        // oldTitle, newTitle, oldVersion, newVersion, timestamp
  changes: DiffChange[]         // full change list
  impacts: ImpactReport[]       // consumer impact per change
}
```

---

## Future planned additions (draft — not yet in schema)

| Field | Planned version | Purpose |
|-------|----------------|---------|
| `deprecations` | 1.1 | Track deprecated (but not removed) fields |
| `authChanges` | 1.1 | Security scheme changes |
| `endpointCount` | 1.1 | Total endpoints in old/new spec |
| `baseUrlChanged` | 1.1 | Server URL changes |
