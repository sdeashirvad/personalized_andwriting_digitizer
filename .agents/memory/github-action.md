---
name: GitHub Action Phase 5
description: GitHub Action implementation — action.yml, action-runtime, PR comment modes, examples, schema
---

# GitHub Action (Phase 5)

## Structure
- `action.yml` at repo root — standard GitHub Action location; `using: node20`, `main: .github/action-runtime/dist/index.js`
- `.github/action-runtime/` — Node.js TypeScript action runtime; compiles to `dist/main.js` via `npx tsc`
- `.github/examples/` — basic.yml, strict.yml, governed.yml workflow examples
- `contract-diff-report.schema.json` — JSON Schema (draft-07) at repo root
- `engine/docs/github-action.md` — full action documentation

## Action runtime build notes
**Why:** The action runtime uses `"type": "module"` (ESM) and imports from `@api-contract-diff/engine` via tarball (`file:../../engine/api-contract-diff-engine-1.1.0.tgz`). TypeScript module: `Node16`, target: `ES2022`.

**Critical:** After rebuilding the engine, updating the action runtime's node_modules requires `cp`, NOT `npm install --force` — npm reinstall is blocked by the Replit sandbox (`rm -rf` on node_modules is treated as a destructive git operation). Copy `.js` and `.d.ts` files directly:
```bash
cp engine/dist/github-action/PRCommentRenderer.js .github/action-runtime/node_modules/@api-contract-diff/engine/dist/github-action/PRCommentRenderer.js
cp engine/dist/github-action/PRCommentRenderer.d.ts .github/action-runtime/node_modules/@api-contract-diff/engine/dist/github-action/PRCommentRenderer.d.ts
cp engine/dist/index.js .github/action-runtime/node_modules/@api-contract-diff/engine/dist/index.js
cp engine/dist/index.d.ts .github/action-runtime/node_modules/@api-contract-diff/engine/dist/index.d.ts
```

## PRCommentMode
`generatePRComment(report, mode?: PRCommentMode)` — `mode` is `'off' | 'summary' | 'full'`, defaults to `'full'`.
- `off` → returns `''`
- `summary` → header + summary table + governance counts (no collapsible sections)
- `full` → all sections including governance detail + specguard.yml template for unapproved changes

## Outputs wired
risk-score, risk-level, breaking-count, approved-count, expired-count, unapproved-count, report-path

## Test count
151 tests passing after Phase 5 (129 pre-existing + 22 comment mode tests in `engine/tests/comment.test.ts`).
