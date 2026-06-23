# Release Checklist — api-contract-diff

Use this checklist for every release of `@api-contract-diff/engine`.

---

## Pre-release

### 1 — Version bump
- [ ] Decide release type: `patch` | `minor` | `major`
- [ ] Update `version` in `engine/package.json`
- [ ] Update `TOOL_VERSION` constant in `engine/src/report/ReportVersion.ts`
- [ ] If schema changed: update `reportVersion` in `ReportVersion.ts` and update `docs/report-versioning.md`

### 2 — Tests
```bash
cd engine
npm install
npm run test:node
```
- [ ] All tests pass with exit 0
- [ ] No unexpected skips or flaky tests

### 3 — Build
```bash
cd engine
npm run build
```
- [ ] `engine/dist/` populated with `.js` + `.d.ts` + `.js.map` files
- [ ] TypeScript compiler reports zero errors
- [ ] `dist/index.js` exports all public API surface (verify manually)

### 4 — Package validation
```bash
cd engine
npm pack --dry-run
```
- [ ] `files` array includes only `dist/` and `README.md`
- [ ] No source `.ts` files in the tarball
- [ ] No `tests/` directory in the tarball
- [ ] Package size is reasonable (< 100 KB unpacked)

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
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml --json --output /tmp/report.json
cat /tmp/report.json | python3 -m json.tool  # or jq .
```
- [ ] `--version` prints the correct version
- [ ] `--help` prints usage without error
- [ ] Console output is human-readable and coloured
- [ ] JSON output is valid JSON matching the ContractDiffReport schema
- [ ] `--output` writes the file and exits 0

### 7 — Exit code validation
```bash
# Should exit 0 (no breaking changes):
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/old.yaml; echo "exit: $?"

# Should exit 1 or 2 (breaking changes):
npx tsx src/cli.ts tests/fixtures/old.yaml tests/fixtures/new.yaml; echo "exit: $?"
```
- [ ] Exit 0 when no breaking changes
- [ ] Exit 1 for MEDIUM breaking changes
- [ ] Exit 2 for HIGH/CRITICAL breaking changes
- [ ] Exit 3 for invalid contract files
- [ ] Exit 4 is not triggered by normal inputs

### 8 — Frontend tarball
```bash
cd engine
npm pack
# Creates api-contract-diff-engine-<version>.tgz

cd ../frontend
npm install ../engine/api-contract-diff-engine-<version>.tgz
npm run build  # Vite build — should be error-free
```
- [ ] Tarball installs cleanly in the frontend
- [ ] Vite build passes with zero TypeScript errors
- [ ] Dashboard loads and runs diff correctly

---

## Release

### 9 — Changelog
- [ ] Add entry to `CHANGELOG.md` under the new version heading
- [ ] Document all breaking changes (if any)
- [ ] Document all new features
- [ ] Document all bug fixes

### 10 — Tag & publish
```bash
git tag v<version>
git push origin v<version>
npm publish  # from engine/ — requires npm login
```
- [ ] Git tag created and pushed
- [ ] Package published to npm registry
- [ ] `npm info @api-contract-diff/engine` shows new version

### 11 — Post-release
- [ ] Update any example usages in `README.md`
- [ ] Update the frontend to use the new tarball version (see Step 8)
- [ ] Close any related GitHub issues / PRs
- [ ] Announce release in project discussions / release notes

---

## Rollback procedure

If a bad release is published:

```bash
npm deprecate @api-contract-diff/engine@<bad-version> "Contains a critical bug, use <good-version> instead"
```

Do NOT unpublish unless the release is < 24 hours old and has zero downloads.
