# API Contract Governance with SpecGuard

`api-contract-diff` supports a governance layer through a `specguard.yml` configuration file.
This allows teams to move beyond simple detection and into a full approval/suppression/tracking workflow.

---

## Why governance?

Detecting a breaking change is the first step. Governance answers:

- **Was it intentional?** (Approved changes)
- **Who approved it?** (Ownership metadata)
- **Why?** (Reason + context)
- **Is the approval still valid?** (Expiration)
- **Should this category even be reported?** (Suppressions)

---

## specguard.yml format

Place `specguard.yml` in your project root (or pass `--config path/to/specguard.yml` to the CLI).

```yaml
# specguard.yml

approvedChanges:
  - type: endpointRemoved
    path: "/legacy/users"
    owner: "platform-team"
    approvedBy: "architecture-board"
    reason: "Migrated to v2 API. See ADR-2024-07."
    expires: "2027-01-01"
    createdAt: "2024-07-15"

  - type: fieldRemoved
    path: "/users"
    method: "post"
    owner: "auth-team"
    approvedBy: "backend-lead"
    reason: "email field moved to profile service"
    expires: "2026-12-31"

suppressions:
  - rule: ENDPOINT_ADDED
    reason: "New endpoints are always safe — suppress from reports"

  - rule: FIELD_ADDED
    reason: "Additive changes are non-breaking — no review needed"

  - rule: INFO
    reason: "INFO-level findings are for development only"
```

---

## Approval workflow

### Supported `type` values

| specguard.yml `type` | Matching change type(s) |
|----------------------|------------------------|
| `endpointRemoved`    | `endpoint-removed` |
| `endpointAdded`      | `endpoint-added` |
| `methodRemoved`      | `method-removed` |
| `methodAdded`        | `method-added` |
| `fieldRemoved`       | `request-field-removed`, `response-field-removed` |
| `requestFieldRemoved`| `request-field-removed` |
| `responseFieldRemoved`| `response-field-removed` |
| `fieldAdded`         | `request-field-added`, `response-field-added` |
| `typeChanged`        | `field-type-changed` |
| `requiredChanged` / `requiredAdded` | `field-required-changed` |
| `enumRemoved`        | `enum-value-removed` |
| `enumAdded`          | `enum-value-added` |
| `statusCodeRemoved`  | `status-code-removed` |
| `statusCodeAdded`    | `status-code-added` |

### Path patterns

Paths support glob-style patterns:

```yaml
path: "/users/{id}"    # exact match
path: "/legacy/*"      # matches /legacy/users, /legacy/orders
path: "/api/**"        # matches /api/v2/users/list
path: "*"              # matches any path
```

### Method filter

Optionally restrict an approval to a specific HTTP method:

```yaml
- type: fieldRemoved
  path: "/users"
  method: "post"   # only applies to POST /users, not GET /users
```

### Governance status in reports

After applying governance, every change in a `ContractDiffReport` can carry a `governanceStatus`:

| Status | Meaning |
|--------|---------|
| `APPROVED` | Matched a valid, non-expired approval |
| `EXPIRED` | Matched an approval, but the `expires` date has passed |
| `SUPPRESSED` | Matched a suppression rule |
| `UNAPPROVED` | Breaking change with no approval or suppression |
| _(none)_ | Non-breaking change with no governance rule — no review needed |

---

## Suppression workflow

Suppressions hide categories of findings from standard diff output.
Suppressed findings are still counted internally and visible in the governance section.

### Supported rule names

| Rule | Suppresses |
|------|-----------|
| `ENDPOINT_ADDED` | `endpoint-added` |
| `ENDPOINT_REMOVED` | `endpoint-removed` |
| `METHOD_ADDED` | `method-added` |
| `METHOD_REMOVED` | `method-removed` |
| `FIELD_ADDED` | `request-field-added`, `response-field-added` |
| `REQUEST_FIELD_ADDED` | `request-field-added` only |
| `RESPONSE_FIELD_ADDED` | `response-field-added` only |
| `FIELD_REMOVED` | `request-field-removed`, `response-field-removed` |
| `TYPE_CHANGED` | `field-type-changed` |
| `REQUIRED_CHANGED` | `field-required-changed` |
| `ENUM_ADDED` | `enum-value-added` |
| `ENUM_REMOVED` | `enum-value-removed` |
| `STATUS_CODE_ADDED` | `status-code-added` |
| `STATUS_CODE_REMOVED` | `status-code-removed` |
| `INFO` | All `INFO`-severity findings |
| `NON_BREAKING` | All non-breaking changes |

---

## Expiration strategy

Every approval should include an `expires` date. This ensures that:

1. Temporary approvals (migration windows) don't become permanent.
2. Engineers are forced to re-evaluate old approvals.
3. Expired approvals are reported as `EXPIRED` — a visible governance violation.

**Recommended expiration windows:**

| Scenario | Suggested expiry |
|----------|-----------------|
| Active migration (v1 → v2) | +6 months from deprecation notice |
| Sunset endpoint | +3 months from removal date |
| Emergency hotfix bypass | +2 weeks |
| Permanent suppression | No `expires` (no expiry date) |

---

## CLI usage

```bash
# Use default specguard.yml (if it exists)
api-contract-diff old.yaml new.yaml

# Use a custom config file
api-contract-diff old.yaml new.yaml --config ./governance/specguard.yml

# JSON output includes governance section
api-contract-diff old.yaml new.yaml --json

# Force failure on unapproved breaking changes only
api-contract-diff old.yaml new.yaml --fail-on-high
```

---

## Governance report section

When governance is enabled, `ContractDiffReport` includes a `governance` field:

```json
{
  "governance": {
    "enabled": true,
    "configPath": "./specguard.yml",
    "approved": 1,
    "expired": 0,
    "suppressed": 1,
    "unapprovedBreaking": 2
  }
}
```

Each change includes its `governanceStatus` and `governanceMetadata`:

```json
{
  "type": "endpoint-removed",
  "path": "/legacy/users",
  "severity": "HIGH",
  "breaking": true,
  "governanceStatus": "APPROVED",
  "governanceMetadata": {
    "owner": "platform-team",
    "approvedBy": "architecture-board",
    "reason": "Migrated to v2 API. See ADR-2024-07.",
    "expires": "2027-01-01"
  }
}
```

---

## Recommended enterprise usage

### Monorepo

```
/
├── services/
│   ├── users-api/
│   │   ├── openapi.yaml
│   │   └── specguard.yml        ← service-level governance
│   └── payments-api/
│       ├── openapi.yaml
│       └── specguard.yml
└── specguard.yml                 ← global defaults (suppressions only)
```

### CI integration

```yaml
# .github/workflows/api-contract-diff.yml
- name: Check API contract
  run: |
    api-contract-diff \
      specs/old.yaml \
      specs/new.yaml \
      --config specguard.yml \
      --fail-on-high
```

Breaking changes with valid approvals → exit 0 (CI passes)
Unapproved breaking changes → exit 2 (CI fails)

### Approval review process

1. Engineer opens a PR with a breaking API change.
2. CI reports the change as `UNAPPROVED` (exit 2).
3. Engineer adds an entry to `specguard.yml` with a justification.
4. Reviewer approves the PR — the `approvedBy` field documents who signed off.
5. Merge happens. CI now reports the change as `APPROVED` (exit 0).
6. On `expires` date, CI begins reporting `EXPIRED` — forcing a re-review.
