# Changelog

All notable changes to API Contract Diff are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-06-23

### Added
- **Playground Mode** — paste or upload your own YAML/JSON OpenAPI specs for live analysis
- **Risk Scoring Engine** — weighted risk score per change type (NONE / LOW / MEDIUM / HIGH / CRITICAL)
- **Consumer Impact Reports** — rule-based impact templates for every change type (no AI)
- **HTML Report Export** — one-click download of a self-contained, styled HTML diff report
- **Dark / Light theme toggle** — persisted to `localStorage.acd_theme`
- `RiskScoreCard` component with contributor breakdown bar chart
- `ImpactPanel` component with collapsible per-change impact bullets
- `PlaygroundMode` component with drag-and-drop file upload support
- New engine exports: `calculateRiskScore`, `generateImpactReports`, `generateImpactReport`, `toHTML`
- Test coverage for risk scoring and consumer impact generation

### Changed
- Home page redesigned with tabbed navigation (Sample Contracts / Playground)
- `SummaryCards`, `ChangesList`, `ContractPreview`, `ScenarioPicker` updated for light/dark theming
- `adapter.ts` now returns `riskScore` and `impactReports` alongside diff result
- Tailwind v4 class-based dark mode enabled via `@custom-variant dark`

### Fixed
- Light/Dark theme toggle now correctly applies `dark` class to root element
- Tailwind v4 content detection fixed with explicit `@source "./"` directive
- `html`, `body`, `#root` now fill full viewport width and height
- Page title corrected from "Handwriting Digitizer" to "API Contract Diff"

---

## [1.0.0] — 2026-06-22

### Added
- Initial release of API Contract Diff engine
- Diff engine with 14 change-type rules (endpoint, method, field, type, enum, status-code)
- Three built-in sample scenarios: Safe Additive, Breaking Removal, Type Change
- React + Vite dashboard with dark mode default
- `SummaryCards`, `ChangesList`, `ScenarioPicker`, `ContractPreview` components
- CLI tool (`engine/src/cli.ts`) with console, JSON, and Markdown output formats
- YAML and JSON contract parsing via `js-yaml`
- Engine adapter with `local` / `global` swap architecture
- Full test suite for compare logic and parser
