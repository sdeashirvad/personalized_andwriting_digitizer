---
name: SpecGuard WebView Phase 7
description: --webview mode architecture, release build pipeline, and key constraints.
---

# SpecGuard WebView Phase 7

## How --webview works (end-to-end)

1. CLI parses contracts, generates ContractDiffReport, prints console summary
2. CLI reads raw governance YAML from disk (if any)
3. CLI dynamically imports `dist/webview/WebViewServer.js` (lazy — avoids server deps on normal runs)
4. Server finds an available port starting at 4321 (configurable via `--port`)
5. Server reads `engine/assets/webview/index.html` and injects `<script>window.__SPECGUARD_WEBVIEW__=true;</script>` before `</head>` at request time
6. Server serves `/webview-data.json` with `{ oldContract, newContract, governanceConfigYaml?, meta }`
7. Browser loads Studio; `StudioContext` useEffect detects `window.__SPECGUARD_WEBVIEW__`, fetches `/webview-data.json`, re-runs `runDiff()` client-side, sets all context state

**Why re-run in browser?** The full RunDiffResult (with DiffResult, impactReports, riskScore object) cannot be reconstructed from ContractDiffReport alone. Re-running is the cleanest approach and means all 8 tabs + HTML output work normally.

## Asset path resolution in compiled output

`WebViewServer.ts` resolves assets via:
```
fileURLToPath(new URL('.', import.meta.url))  →  dist/webview/
join(selfDir, '../../assets/webview')          →  engine/assets/webview/
```
`assets/webview/` is populated only by the release build. Development uses the Vite dev server directly.

## Release build pipeline

`scripts/build-release.sh`:
1. `cd engine && npm run build` (tsc → dist/)
2. `cd frontend && npm run build` (vite → dist/)
3. `cp -r frontend/dist/. engine/assets/webview/`

engine/package.json `"files"` must include both `"dist/**/*"` AND `"assets/**/*"`.

## Package configuration

- `"bin": { "specguard": "./dist/cli.js" }` — enables `npx specguard`
- CLI has `#!/usr/bin/env node` shebang as line 0 (tsc preserves it)
- `"assets/**/*"` in files — WebView assets included in npm pack

## Validation

`scripts/validate-package.ts` — 19 checks: dist artifacts, webview assets, package.json bin/files, shebang, index.html sanity. Run with `npx tsx scripts/validate-package.ts`. Pass: 19/19.

## WebView banner

`frontend/src/components/WebViewBanner.tsx` — slim indigo banner above Header. Shows file paths, governance config (if any), engine version, risk level (color-coded), breaking count, timestamp. Dismissable with X.

## Fast Refresh HMR warning

`StudioContext.tsx` exports both `StudioProvider` (component) and `useStudio` (hook) from same file. Vite React Fast Refresh warns "export is incompatible" and falls back to full page reload for that module. This is a known limitation — acceptable, app works correctly.

## Development vs release

| Mode | URL | WebView data source |
|------|-----|---------------------|
| Dev (Vite) | localhost:5000 | N/A — no `__SPECGUARD_WEBVIEW__` injected |
| WebView | localhost:4321 | `/webview-data.json` from WebViewServer |

Detection is purely based on `window.__SPECGUARD_WEBVIEW__` (injected at server request time, not baked into build). No false positives in dev mode.
