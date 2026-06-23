# Roadmap

This document outlines the planned development phases for API Contract Diff.

## Current Version: 1.1.0

---

## Phase 1 — Core Engine ✅ Complete

- [x] OpenAPI 3.0 diff engine (TypeScript, zero runtime deps)
- [x] 14 change-type rules with severity classification
- [x] YAML and JSON parsing
- [x] CLI with console, JSON, and Markdown output
- [x] React dashboard with 3 sample scenarios
- [x] Engine adapter with local/global swap architecture

## Phase 2 — Dashboard Enhancements ✅ Complete

- [x] Playground Mode (paste/upload real contracts)
- [x] Risk Scoring Engine (weighted score, NONE/LOW/MEDIUM/HIGH/CRITICAL)
- [x] Consumer Impact Reports (rule-based templates, no AI)
- [x] HTML Report Export (self-contained, downloadable)
- [x] Dark/Light theme toggle
- [x] OSS maturity: CHANGELOG, LICENSE, CONTRIBUTING, ROADMAP

## Phase 3 — GitHub Action (Planned)

- [ ] `api-contract-diff` GitHub Action
- [ ] Inputs: `old-spec`, `new-spec`, `fail-on-breaking`
- [ ] Outputs: `breaking-count`, `risk-score`, `risk-category`
- [ ] PR comment posting with diff summary
- [ ] Exit code 1 on breaking changes (configurable)
- [ ] Marketplace publishing

See [`github-action-design.md`](./github-action-design.md) for the full design document.

## Phase 4 — Advanced Analysis (Planned)

- [ ] OpenAPI 3.1 support
- [ ] `$ref` resolution across multiple files
- [ ] `allOf` / `oneOf` / `anyOf` schema merging
- [ ] Parameter diff (path, query, header, cookie)
- [ ] Authentication scheme change detection
- [ ] Deprecation tracking

## Phase 5 — Ecosystem (Planned)

- [ ] Published npm package `@api-contract-diff/engine`
- [ ] VS Code extension for inline contract diffing
- [ ] Swagger UI plugin
- [ ] CI/CD integrations: GitLab CI, Bitbucket Pipelines, CircleCI

## Phase 6 — Enterprise Features (Planned)

- [ ] API Registry: store and version contract history
- [ ] Team dashboard: track changes across multiple APIs
- [ ] Webhook notifications on breaking changes
- [ ] JIRA / Linear ticket creation on high-risk changes
