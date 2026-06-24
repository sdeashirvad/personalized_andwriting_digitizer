# SpecGuard Studio

A comprehensive interactive showcase of every SpecGuard capability — public demo site, portfolio demonstration, and internal testing surface. Transforms two OpenAPI contracts into governed, machine-readable reports across every output format.

## Architecture

- **Frontend**: React 19 + Vite 8 + TypeScript + Tailwind CSS 4 — port 5000
- **Engine**: TypeScript diff library in `/engine/src/` — bundled into the frontend, also runnable as a CLI

## Project Structure

```
/engine        — TypeScript diff engine (zero runtime deps in comparison logic)
  /src         — models, parsers, rules, compare, reporters, cli, governance, github-action
  /tests       — test suite (Node built-in test runner via tsx)

/frontend      — SpecGuard Studio (React + Vite)
  /src/context — StudioContext (shared diff result state across all 8 tabs)
  /src/engine  — adapter layer (local vs future global package)
  /src/data    — bundled sample contract pairs (3 scenarios)
  /src/components — Header, SummaryCards, ChangesList, ScenarioPicker, etc.
  /src/pages   — 8 Studio tabs (ContractPlayground, ReportExplorer, GovernanceLab,
                  GitHubActionPlayground, PRCommentPreview, CLIBuilder,
                  OutputExplorer, ArchitectureView)
```

## Running the App

One workflow runs:
1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)

## Studio Navigation (8 Tabs)

1. **Contract Playground** — Diff sample scenarios or paste/upload your own YAML/JSON
2. **Report Explorer** — Inspect ContractDiffReport in rendered, JSON, and schema views
3. **Governance Lab** — Edit specguard.yml live; see governance changes re-applied instantly
4. **GitHub Action Playground** — Configure CI/CD inputs; see expected exit codes and outputs
5. **PR Comment Preview** — Toggle off/summary/full; rendered Markdown + raw view
6. **CLI Builder** — Build npx specguard commands; flag reference + exit code table
7. **Output Explorer** — Console, JSON, Markdown, HTML — all from the same ContractDiffReport
8. **Architecture** — System design, data flow, design decisions (suitable for interviews)

## Shared State

`StudioContext` provides a globally shared `RunDiffResult` across all tabs. Contract Playground sets it; all other tabs read from it. Governance Lab can re-run the diff with a custom governance config and update the shared state.

## Engine Adapter

`frontend/src/engine/adapter.ts` abstracts the engine source:
- `ENGINE_MODE = 'local'` — uses the bundled TypeScript engine (current)
- `ENGINE_MODE = 'global'` — future: swap to a published npm package
- Exports: `runDiff`, `generateHTMLReport`, `generateJSONReport`, `toMarkdownReport`, `toConsoleReport`, `generatePRComment`, `determineExitCode`
- `RunDiffResult` includes `diffResult: DiffResult` (needed by `toHTML`)

## User Preferences

- Only one workflow needed: "Start application" on port 5000
- Frontend always on 0.0.0.0 (Replit proxy requirement)
- Dark mode by default, toggleable; stored in `localStorage.acd_theme`
- No backend server needed — the diff engine runs fully client-side
