# Contributing to API Contract Diff

Thank you for your interest in contributing! This document explains how to get started.

---

## Project Structure

```
/engine        — TypeScript diff engine (zero runtime deps in comparison logic)
  /src         — models, parsers, rules, compare, reporters, cli
  /tests       — test suite (Node built-in test runner via tsx)

/frontend      — React + Vite demo dashboard
  /src/engine  — adapter layer (local vs future global package)
  /src/data    — bundled sample contract pairs
  /src/components — UI components
  /src/pages   — page components
```

## Development Setup

```bash
# Install frontend deps
cd frontend && npm install

# Run the dashboard
cd frontend && npm run dev      # http://localhost:5000

# Run engine tests
cd engine && npx tsx --test tests/*.test.ts

# Run engine CLI
cd engine && npx tsx src/cli.ts path/to/old.yaml path/to/new.yaml
```

## Adding a New Change Rule

1. Add the `ChangeType` string literal to `engine/src/models/types.ts`
2. Add a `RuleDescriptor` entry in `engine/src/rules/severity.ts`
3. Add a weight in `engine/src/rules/risk.ts`
4. Add an impact template in `engine/src/reporters/impact.ts`
5. Implement detection logic in `engine/src/compare/contracts.ts`
6. Add test cases in `engine/tests/compare.test.ts`

## Adding a New Sample Scenario

Edit `frontend/src/data/samples.ts` and add an entry to the `SCENARIOS` array following the existing pattern.

## Code Style

- TypeScript strict mode throughout
- No `any` types without justification
- Engine comparison logic must have zero external runtime dependencies
- Components should support both light and dark themes via Tailwind `dark:` variants

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make changes with tests
3. Run `npm run build` in both `/engine` and `/frontend` to verify no TypeScript errors
4. Run tests: `cd engine && npx tsx --test tests/*.test.ts`
5. Submit a PR with a clear description of what was changed and why

## Reporting Issues

Please open a GitHub Issue with:
- A clear description of the bug or feature request
- Steps to reproduce (for bugs)
- Expected vs actual behaviour
- OpenAPI contract snippets if relevant (can be anonymized)
