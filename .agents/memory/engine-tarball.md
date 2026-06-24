---
name: Engine tarball workflow
description: How the engine is built, packed, and installed in the frontend
---

# Engine Tarball Workflow

## Rule
The engine is a local npm tarball (`api-contract-diff-engine-1.1.0.tgz`) installed in the frontend.
After any engine source change: build → pack → install → clear Vite cache → restart workflow.

**Why:** The frontend imports from `@api-contract-diff/engine` (the tarball), not from local TypeScript files. Without a rebuild+reinstall, old compiled code is served.

## How to apply
```bash
cd engine && npm run build && npm pack
cd frontend && npm install ../engine/api-contract-diff-engine-1.1.0.tgz
rm -rf frontend/node_modules/.vite
# then restart "Start application" workflow
```

## Tests
```bash
cd engine && npm run test:node   # uses tsx --test runner
```
