# GitHub Action — API Contract Diff

The `api-contract-diff` GitHub Action detects breaking and non-breaking changes between two OpenAPI specs on every pull request — and evaluates governance rules from `specguard.yml`.

---

## Quick start

```yaml
# .github/workflows/api-contract-diff.yml
name: API Contract Diff

on:
  pull_request:
    paths:
      - 'openapi.yaml'

jobs:
  check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Fetch base spec
        run: git show origin/${{ github.base_ref }}:openapi.yaml > /tmp/old.yaml

      - name: Run API Contract Diff
        id: diff
        uses: your-org/api-contract-diff@v1
        with:
          old-spec: /tmp/old.yaml
          new-spec: openapi.yaml
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `old-spec` | ✅ | — | Path to the old OpenAPI spec |
| `new-spec` | ✅ | — | Path to the new OpenAPI spec |
| `config-path` | — | `specguard.yml` | Path to governance config |
| `fail-on-high` | — | `false` | Fail CI only for HIGH/CRITICAL severity breaking changes |
| `fail-on-medium` | — | `false` | Fail CI for any breaking change |
| `comment-mode` | — | `full` | PR comment: `off` \| `summary` \| `full` |
| `report-format` | — | `json` | Report format: `json` \| `markdown` \| `console` |
| `report-path` | — | `api-contract-diff-report.json` | Output file path |
| `token` | — | `${{ github.token }}` | GitHub token for PR comments |

---

## Outputs

| Output | Description |
|--------|-------------|
| `risk-score` | Weighted numeric risk score |
| `risk-level` | `NONE` \| `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `breaking-count` | Total breaking changes |
| `approved-count` | Approved breaking changes (governance) |
| `expired-count` | Expired approvals (governance) |
| `unapproved-count` | Unapproved breaking changes (governance) |
| `report-path` | Absolute path to the generated report file |

---

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | No breaking changes detected |
| 1 | Breaking changes found (max severity: MEDIUM or LOW) |
| 2 | Breaking changes found (max severity: HIGH or CRITICAL) |
| 3 | One or more spec files are invalid or unreadable |
| 4 | Unexpected internal error |

When `fail-on-high: true`, exit codes 1 → 0 (MEDIUM/LOW changes don't fail CI).
When `fail-on-medium: true`, exit codes 1 and 2 both fail CI.

---

## PR comment modes

### `comment-mode: full` (default)
Posts a detailed PR comment with:
- Risk score and level
- Summary table (total / breaking / non-breaking)
- Breaking changes (collapsible)
- Non-breaking changes (collapsible)
- Consumer impact analysis (collapsible)
- Governance summary (when specguard.yml is loaded)
- Approved changes with ownership metadata
- Unapproved changes with guidance

### `comment-mode: summary`
Posts a compact comment with only the summary table and governance counts. Useful for high-traffic repos.

### `comment-mode: off`
Disables PR comments entirely. The Action still sets outputs and writes the report file.

---

## Governance integration

Place `specguard.yml` in your repo root. The Action loads it automatically:

```yaml
approvedChanges:
  - type: endpointRemoved
    path: "/legacy/v1/users"
    owner: "platform-team"
    approvedBy: "architecture-board"
    reason: "Migrated to /v2/users. See ADR-2026-04."
    expires: "2027-01-01"

suppressions:
  - rule: ENDPOINT_ADDED
    reason: "Additive endpoints are always backward-compatible"
```

When governance is active:
- **Approved** changes pass CI even with `fail-on-high`
- **Expired** approvals are reported as violations
- **Suppressed** findings are hidden from standard output
- **Unapproved** breaking changes trigger a CI failure

See [governance.md](./governance.md) for the full governance reference.

---

## Workflow examples

Three complete workflow examples are in `.github/examples/`:

| File | Use case |
|------|----------|
| [`basic.yml`](../.github/examples/basic.yml) | Simple detection — comments on PRs, no CI gating |
| [`strict.yml`](../.github/examples/strict.yml) | Strict mode — any breaking change fails CI |
| [`governed.yml`](../.github/examples/governed.yml) | Governance mode — approved changes pass, unapproved fail |

---

## Consuming outputs

```yaml
- name: Run diff
  id: diff
  uses: your-org/api-contract-diff@v1
  with:
    old-spec: /tmp/old.yaml
    new-spec: openapi.yaml

- name: Use outputs
  run: |
    echo "Risk: ${{ steps.diff.outputs.risk-level }}"
    echo "Breaking: ${{ steps.diff.outputs.breaking-count }}"

- name: Parse JSON report in next step
  run: |
    BREAKING=$(cat "${{ steps.diff.outputs.report-path }}" | jq '.summary.breaking')
    echo "Breaking changes: $BREAKING"
```

---

## Report schema

The JSON report conforms to the schema in [`contract-diff-report.schema.json`](../../contract-diff-report.schema.json).

You can validate a report with `ajv` or any JSON Schema validator:

```bash
npx ajv validate \
  -s contract-diff-report.schema.json \
  -d api-contract-diff-report.json
```

---

## Local testing

```bash
# Install and run the CLI directly
npm install -g @api-contract-diff/engine
api-contract-diff old.yaml new.yaml --config specguard.yml

# Simulate the Action locally with act
act pull_request -W .github/examples/governed.yml

# Validate the generated report schema
npx ajv validate \
  -s contract-diff-report.schema.json \
  -d api-contract-diff-report.json
```
