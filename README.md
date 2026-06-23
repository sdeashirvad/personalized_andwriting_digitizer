# API Contract Diff

> Detect breaking and non-breaking changes between OpenAPI/Swagger API versions — instantly.

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
- **React demo dashboard** — load sample scenarios in under 10 seconds
- **Local engine, global-ready** — runs fully offline; structured for npm package swap later
- **JSON, Markdown, and console output** — use the format you need

## Architecture

```
/engine                    — TypeScript diff engine (zero runtime deps in compare logic)
  /src
    /models/types.ts       — shared type definitions
    /parsers/openapi.ts    — YAML / JSON spec parser (CLI use)
    /rules/severity.ts     — change type → severity + breaking mapping
    /compare/contracts.ts  — core diff algorithm
    /reporters/            — console, JSON, markdown output formatters
    index.ts               — public API exports
    cli.ts                 — CLI entry point
  /tests/compare.test.ts   — test suite (Node built-in test runner)

/frontend                  — React + Vite demo dashboard (port 5000)
  /src
    /engine/adapter.ts     — adapter layer (local engine, future global package)
    /data/samples.ts       — 3 bundled sample scenario pairs
    /components/           — Header, SummaryCards, ChangesList, ScenarioPicker, ContractPreview
    /pages/Home.tsx        — main dashboard page
```

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

# Compare two spec files
npx tsx src/cli.ts path/to/old.yaml path/to/new.yaml

# Output as JSON
npx tsx src/cli.ts old.yaml new.yaml --format json

# Output as Markdown
npx tsx src/cli.ts old.yaml new.yaml --format markdown

# Exit code: 0 = no breaking changes, 1 = breaking changes found, 2 = parse error
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
2. Install: `npm install @api-contract-diff/engine`
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

- [ ] Publish engine as `@api-contract-diff/engine` on npm
- [ ] `$ref` deep resolution across components
- [ ] `allOf` / `oneOf` / `anyOf` schema merging
- [ ] GitHub Actions integration example
- [ ] VS Code extension
- [ ] Upload custom spec files in the dashboard
- [ ] Diff history and saved comparisons
