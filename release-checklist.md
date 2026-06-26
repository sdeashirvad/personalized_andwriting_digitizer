# Release Checklist — SpecSentinel

Use this checklist for every release of `specsentinel`. For exhaustive pre-publish QA, see [pre-release.md](pre-release.md). For publish steps, see [npm_release.md](npm_release.md) and [github_marketplace.md](github_marketplace.md).

---

## Pre-release

### 1 — Version bump
- [ ] Decide release type: `patch` | `minor` | `major`
- [ ] Update `version` in `engine/package.json`
- [ ] Update `TOOL_VERSION` constant in `engine/src/report/ReportVersion.ts`
- [ ] If schema changed: update `reportVersion` in `ReportVersion.ts` and update `engine/docs/report-versioning.md`

### 2 — Tests
```bash
cd engine
npm install
npm run test:node
```
- [ ] All tests pass with exit 0 (unit + integration)
- [ ] No unexpected skips or flaky tests

### 3 — Release build
```bash
./scripts/build-release.sh
# Windows: build engine + frontend manually, copy frontend/dist → engine/assets/webview/
```
- [ ] `engine/dist/` populated with `.js` + `.d.ts` + `.js.map` files
- [ ] `engine/assets/webview/` populated with compiled Studio bundle
- [ ] TypeScript compiler reports zero errors

### 4 — Package validation
```bash
cd engine
npm run validate
npm pack --dry-run
```
- [ ] `files` includes `dist/**/*`, `assets/**/*`, and `README.md`
- [ ] No source `.ts` files in the tarball
- [ ] No `tests/` directory in the tarball
- [ ] Package size is reasonable (~500 KB+ unpacked with webview assets is expected)

### 5 — Generate sample report
```bash
cd engine
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml --json
```
- [ ] `reportVersion` present and correct
- [ ] `toolVersion` matches `package.json`
- [ ] `riskScore` is a number
- [ ] `riskLevel` is one of NONE|LOW|MEDIUM|HIGH|CRITICAL
- [ ] `summary.total` equals `changes.length`
- [ ] `impacts.length` equals `changes.length`
- [ ] `generatedAt` is a valid ISO 8601 timestamp

### 6 — CLI smoke test
```bash
npx tsx src/cli.ts --version
npx tsx src/cli.ts --help
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml --json
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml --webview --port 4321
```
- [ ] `--version` prints the correct version
- [ ] `--help` documents `--webview` and `--port`
- [ ] Console output is human-readable
- [ ] JSON output matches the ContractDiffReport schema
- [ ] WebView opens report-only Studio (no Playground tab)

### 7 — Exit code validation
```bash
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/old.yaml; echo "exit: $?"
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml; echo "exit: $?"
```
- [ ] Exit 0 when no breaking changes
- [ ] Exit 1 or 2 when breaking changes present
- [ ] Exit 3 for invalid contract files

### 8 — Frontend tarball
```bash
cd engine
npm pack
# Creates specsentinel-<version>.tgz

cd ../frontend
npm install ../engine/specsentinel-<version>.tgz
npm run build
```
- [ ] Tarball installs cleanly in the frontend
- [ ] Vite build passes with zero TypeScript errors

---

## Release

### 9 — Changelog
- [ ] Add entry to `CHANGELOG.md` under the new version heading

### 10 — Tag & publish
```bash
git tag v<version>
git push origin v<version>
cd engine && npm publish
```
- [ ] Git tag created and pushed
- [ ] Package published to npm registry
- [ ] `npm info specsentinel` shows new version

### 11 — Post-release
- [ ] Update frontend/action-runtime to registry version `^x.y.z`
- [ ] Close related GitHub issues / PRs

---

## Rollback procedure

```bash
npm deprecate specsentinel@<bad-version> "Contains a critical bug, use <good-version> instead"
```

Do NOT unpublish unless the release is < 24 hours old and has zero downloads.
