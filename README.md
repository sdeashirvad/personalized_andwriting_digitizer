# SpecSentinel

> Detect breaking and non-breaking changes between OpenAPI/Swagger API versions — instantly.

A product of **[SdeAshirvad Labs](https://labs.sdeashirvad.com/)** · Built by [Ashirvad Kumar Pandey](https://sdeashirvad.com/)

[![npm](https://img.shields.io/npm/v/specsentinel)](https://www.npmjs.com/package/specsentinel)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-green)](https://www.openapis.org/)

## What It Does

API Contract Diff compares two OpenAPI (Swagger) specifications and tells you:

- Which changes **break existing clients** (field removals, type changes, endpoint removals)
- Which changes are **safe to ship** (new endpoints, optional fields added)
- The **severity** of each change (HIGH / MEDIUM / LOW / INFO)
- A clear summary suitable for CI gates, PR reviews, and release notes

## Why This Exists

Undetected API breaking changes are one of the most common causes of production incidents. This tool gives developers an instant, automated answer to "is this API change safe to deploy?"

## Features

- **14 diff rules** — endpoints, methods, request/response fields, types, enums, status codes
- **Severity levels** — HIGH, MEDIUM, LOW, INFO
- **Breaking / non-breaking classification** — at a glance
- **YAML and JSON input** — supports OpenAPI 3.0 specs
- **CLI** — pipe it into CI, pre-push hooks, or release scripts
- **`--webview`** — launch SpecSentinel Studio locally in the browser with one flag
- **Marketing landing page** — product overview at `/`; interactive **Studio** at `/studio`
- **Governance** — approve, suppress, and expire findings with `specguard.yml`
- **JSON, Markdown, HTML, and console output** — all from the same `ContractDiffReport`

## Architecture

```
/engine                    — TypeScript diff engine (zero runtime deps in compare logic)
  /src
    /models/types.ts       — shared type definitions
    /parsers/openapi.ts    — YAML / JSON spec parser
    /rules/severity.ts     — change type → severity + breaking mapping
    /compare/contracts.ts  — core diff algorithm
    /reporters/            — console, JSON, markdown, HTML output formatters
    /governance/           — SpecGuardConfig, ApprovalEngine, SuppressionEngine
    /webview/              — local HTTP server for --webview mode (Node.js built-ins only)
    /github-action/        — PR comment renderer, exit code docs
    index.ts               — public API exports
    cli.ts                 — CLI entry point (bin: specsentinel)
  /assets/webview/         — compiled React frontend (populated by build-release.sh)
  /tests/                  — test suite (Node built-in test runner)

/frontend                  — SpecSentinel Studio (React 19 + Vite + Tailwind CSS 4)
  /src
    /engine/adapter.ts     — adapter layer (local engine, future global package)
    /context/StudioContext — shared RunDiffResult + WebView detection across all tabs
    /data/samples.ts       — 3 bundled sample scenario pairs
    /components/           — Header, SummaryCards, WebViewBanner, etc.
    /pages/                — 8 Studio tabs

/scripts
  build-release.sh         — full release build pipeline
  validate-package.ts      — pre-publish artifact verification
```

## WebView Mode

`--webview` launches SpecSentinel Studio in your browser with a **report-only view** pre-loaded from your CLI run. No sample scenarios or playground input — only the report tabs for the specs you passed.

```bash
# Basic — analyze and open Studio in browser
npx specsentinel old.yaml new.yaml --webview

# With governance config
npx specsentinel old.yaml new.yaml --webview --config specguard.yml

# Custom port
npx specsentinel old.yaml new.yaml --webview --port 3000
```

**What happens:**
1. SpecSentinel parses and diffs both contracts
2. Prints a console summary
3. Starts a local HTTP server (default port 4321)
4. Opens your browser automatically
5. Studio opens on **Report Explorer** with report-focused tabs only

**WebView tabs (report-only):**
- Report Explorer — full `ContractDiffReport` in rendered/JSON/schema views
- Output Explorer — console, JSON, Markdown, HTML output
- Governance Lab — governance panel for the loaded report
- GitHub Action — CI/CD config preview with exit codes
- PR Comment — rendered Markdown preview

**WebView banner:** A slim banner at the top of Studio shows the source files, engine version, risk level, and timestamp. It can be dismissed.

**Fallback:** If the browser cannot be opened automatically, the server URL is printed to the terminal and Studio stays alive until Ctrl+C.

## Supported Diff Rules

| Rule | Severity | Breaking |
|------|----------|---------|
| Endpoint removed | HIGH | ✅ |
| Method removed | HIGH | ✅ |
| Response field removed | HIGH | ✅ |
| Field type changed | HIGH | ✅ |
| Field required/optional changed | HIGH | ✅ |
| Enum value removed | HIGH | ✅ |
| Status code removed | HIGH | ✅ |
| Request field removed | MEDIUM | ✅ |
| Request field added | LOW | ❌ |
| Response field added | LOW | ❌ |
| Enum value added | LOW | ❌ |
| Endpoint added | INFO | ❌ |
| Method added | INFO | ❌ |
| Status code added | INFO | ❌ |

## How the Diff Works

1. Both specs are parsed (YAML or JSON) into an `OpenAPIContract` object
2. All paths and HTTP methods are enumerated from both specs
3. Removed paths → `endpoint-removed`; added paths → `endpoint-added`
4. For each shared path, methods are compared
5. For each shared operation, request body and response schemas are recursively diffed
6. Field-level changes (type, required, enum) are detected with per-property comparison
7. Each change is tagged with a `ChangeType`, `Severity`, and `breaking` flag
8. A `DiffResult` is returned with a full summary and change list

## Run Locally

### Prerequisites

- Node.js 18+

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../engine && npm install
```

### 2. Start the demo dashboard

```bash
cd frontend && npm run dev
# Opens on http://localhost:5000
```

### 3. Run the CLI

```bash
cd engine

# Console diff (development mode — runs TypeScript directly)
npx tsx src/cli.ts old.yaml new.yaml

# WebView mode — open Studio in browser
npx tsx src/cli.ts old.yaml new.yaml --webview

# Output as JSON
npx tsx src/cli.ts old.yaml new.yaml --json

# Output as Markdown
npx tsx src/cli.ts old.yaml new.yaml --format markdown

# With governance config
npx tsx src/cli.ts old.yaml new.yaml --config specguard.yml
```

### 4. Release build (for WebView and packaging)

```bash
# Build engine + frontend + copy assets
./scripts/build-release.sh

# Also run npm pack
./scripts/build-release.sh --pack

# Validate the package is ready
npx tsx scripts/validate-package.ts
```

### 4. Run tests

```bash
cd engine
npx tsx --test tests/*.test.ts
```

## Demo Scenarios

The dashboard ships with 3 bundled scenarios — no uploads needed:

| Scenario | Description |
|----------|-------------|
| **Safe Additive** | New endpoints and optional fields added — zero breaking changes |
| **Breaking Removal** | Endpoint removed, required field removed — HIGH severity |
| **Type Change** | Field type changed, enum value removed — subtle but dangerous |

## How to Add Sample Contracts

Edit `frontend/src/data/samples.ts` and add a new entry to the `SCENARIOS` array:

```typescript
{
  id: 'my-scenario',
  label: 'My Scenario',
  description: 'What changed and why it matters',
  tag: 'Breaking',
  tagColor: 'red',          // 'red' | 'emerald'
  oldContract: `...yaml or json string...`,
  newContract: `...yaml or json string...`,
}
```

## Local Engine vs Future Global Package

The engine adapter in `frontend/src/engine/adapter.ts` uses a feature flag:

```typescript
export const ENGINE_MODE: EngineMode = 'local' // change to 'global' when ready
```

When `'local'`, the TypeScript diff engine is bundled directly into the frontend.

To switch to a future globally-published package:
1. Change `ENGINE_MODE` to `'global'`
2. Install: `npm install specsentinel`
3. Implement `globalDiff` in adapter.ts using the package

The adapter interface (`RunDiffOptions` → `RunDiffResult`) is identical for both modes.

## Folder Structure

```
.
├── engine/
│   ├── src/
│   │   ├── models/types.ts
│   │   ├── parsers/openapi.ts
│   │   ├── rules/severity.ts
│   │   ├── compare/contracts.ts
│   │   ├── reporters/{console,json,markdown}.ts
│   │   ├── index.ts
│   │   └── cli.ts
│   ├── tests/compare.test.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── engine/adapter.ts
│   │   ├── data/samples.ts
│   │   ├── components/
│   │   ├── pages/Home.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Future Roadmap

- [ ] Publish `specsentinel` on npm
- [ ] `$ref` deep resolution across components
- [ ] `allOf` / `oneOf` / `anyOf` schema merging
- [ ] GitHub Actions integration example
- [ ] VS Code extension
- [ ] Upload custom spec files in the dashboard
- [ ] Diff history and saved comparisons
