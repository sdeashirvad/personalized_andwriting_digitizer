# API Contract Diff

A developer tool that compares two OpenAPI/Swagger API specifications and reports breaking and non-breaking changes clearly, with severity levels.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS — port 5000
- **Engine**: TypeScript diff library in `/engine/src/` — bundled into the frontend, also runnable as a CLI

## Project Structure

```
/engine        — TypeScript diff engine (zero runtime deps in comparison logic)
  /src         — models, parsers, rules, compare, reporters, cli
  /tests       — test suite (Node built-in test runner via tsx)

/frontend      — React + Vite demo dashboard
  /src/engine  — adapter layer (local vs future global package)
  /src/data    — bundled sample contract pairs (3 scenarios)
  /src/components — Header, SummaryCards, ChangesList, ScenarioPicker, ContractPreview
  /src/pages   — Home page
```

## Running the App

One workflow runs:
1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)

The Backend API and OCR Service workflows are legacy from the previous project — they can be stopped.

## Core User Flow

1. Dashboard loads with the "Breaking Removal" scenario pre-selected
2. Diff engine runs synchronously in the browser (no server needed)
3. User sees summary cards: total, breaking, non-breaking, risk level
4. User sees detailed change cards with severity badges and descriptions
5. User can switch between 3 sample scenarios and re-run analysis
6. User can expand the Contract Preview to see the raw YAML side by side

## Engine Adapter

`frontend/src/engine/adapter.ts` abstracts the engine source:
- `ENGINE_MODE = 'local'` — uses the bundled TypeScript engine (current)
- `ENGINE_MODE = 'global'` — future: swap to a published npm package

## User Preferences

- Only one workflow needed: "Start application" on port 5000
- Frontend always on 0.0.0.0 (Replit proxy requirement)
- Dark mode by default, toggleable; stored in `localStorage.acd_theme`
- No backend server needed — the diff engine runs fully client-side
