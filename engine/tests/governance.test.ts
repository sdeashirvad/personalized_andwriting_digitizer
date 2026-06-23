import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { validateConfig } from '../src/governance/SpecGuardConfig.js'
import { matchPath, isExpired, matchesApproval, findApproval } from '../src/governance/ApprovalEngine.js'
import { matchesSuppression, isSuppressed } from '../src/governance/SuppressionEngine.js'
import { applyGovernance } from '../src/governance/GovernanceEngine.js'
import { generateReport } from '../src/report/ReportGenerator.js'
import { compareContracts } from '../src/compare/contracts.js'
import type { DiffChange, OpenAPIContract } from '../src/models/types.js'
import type { ApprovedChange, SuppressionRule, SpecGuardConfig } from '../src/governance/SpecGuardConfig.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const base: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Governance Test API', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id', 'email'],
                  properties: {
                    id:    { type: 'string' },
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/legacy/orders': {
      get: { responses: { '200': { description: 'OK' } } },
    },
    '/products/{id}': {
      get: { responses: { '200': { description: 'OK' } } },
    },
  },
}

const newSpec: OpenAPIContract = {
  ...base,
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id'],
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    '/inventory': {
      get: { responses: { '200': { description: 'OK' } } },
    },
    // /legacy/orders and /products/{id} removed
  },
}

function makeChange(overrides: Partial<DiffChange>): DiffChange {
  return {
    type:        'endpoint-removed',
    severity:    'HIGH',
    breaking:    true,
    path:        '/test',
    description: 'Test change',
    ...overrides,
  }
}

// ─── Config parsing ───────────────────────────────────────────────────────────

describe('validateConfig', () => {
  test('accepts empty object', () => {
    const config = validateConfig({})
    assert.deepEqual(config, {})
  })

  test('accepts valid approvedChanges', () => {
    const config = validateConfig({
      approvedChanges: [{
        type: 'endpointRemoved',
        path: '/legacy/users',
        owner: 'platform-team',
        approvedBy: 'architecture-board',
        reason: 'Migrated',
        expires: '2027-01-01',
      }],
    })
    assert.equal(config.approvedChanges?.length, 1)
    assert.equal(config.approvedChanges![0]!.type, 'endpointRemoved')
  })

  test('accepts valid suppressions', () => {
    const config = validateConfig({
      suppressions: [{ rule: 'ENDPOINT_ADDED' }, { rule: 'FIELD_ADDED' }],
    })
    assert.equal(config.suppressions?.length, 2)
    assert.equal(config.suppressions![0]!.rule, 'ENDPOINT_ADDED')
  })

  test('throws on non-object input', () => {
    assert.throws(() => validateConfig('invalid'), /must be a YAML mapping/)
  })

  test('throws on null input', () => {
    assert.throws(() => validateConfig(null), /must be a YAML mapping/)
  })

  test('throws if approvedChanges is not an array', () => {
    assert.throws(() => validateConfig({ approvedChanges: 'bad' }), /must be an array/)
  })

  test('throws if required field missing from approved change', () => {
    assert.throws(
      () => validateConfig({ approvedChanges: [{ type: 'endpointRemoved', path: '/x' }] }),
      /owner/
    )
  })

  test('optional fields are preserved', () => {
    const config = validateConfig({
      approvedChanges: [{
        type: 'endpointRemoved', path: '/x', owner: 'a', approvedBy: 'b', reason: 'c',
        expires: '2027-01-01', createdAt: '2026-01-01', method: 'get',
      }],
    })
    const a = config.approvedChanges![0]!
    assert.equal(a.expires, '2027-01-01')
    assert.equal(a.createdAt, '2026-01-01')
    assert.equal(a.method, 'get')
  })
})

// ─── Path matching ─────────────────────────────────────────────────────────────

describe('matchPath', () => {
  test('exact match', () => assert.ok(matchPath('/users', '/users')))
  test('exact mismatch', () => assert.ok(!matchPath('/users', '/orders')))
  test('* wildcard matches any path', () => assert.ok(matchPath('*', '/anything')))
  test('** wildcard matches any path', () => assert.ok(matchPath('**', '/deep/nested/path')))
  test('/legacy/* matches /legacy/users', () => assert.ok(matchPath('/legacy/*', '/legacy/users')))
  test('/legacy/* does not match /legacy/users/sub', () => assert.ok(!matchPath('/legacy/*', '/legacy/users/sub')))
  test('/api/** matches deep paths', () => assert.ok(matchPath('/api/**', '/api/v2/users/list')))
  test('path with template params', () => assert.ok(matchPath('/users/{id}', '/users/{id}')))
  test('mismatch with template param', () => assert.ok(!matchPath('/users/{id}', '/users/{id}/profile')))
})

// ─── Approval matching ────────────────────────────────────────────────────────

describe('matchesApproval', () => {
  const approval: ApprovedChange = {
    type: 'endpointRemoved',
    path: '/legacy/orders',
    owner: 'platform-team',
    approvedBy: 'architecture-board',
    reason: 'Migration',
  }

  test('matches exact type and path', () => {
    const change = makeChange({ type: 'endpoint-removed', path: '/legacy/orders' })
    assert.ok(matchesApproval(change, approval))
  })

  test('rejects wrong change type', () => {
    const change = makeChange({ type: 'response-field-removed', path: '/legacy/orders' })
    assert.ok(!matchesApproval(change, approval))
  })

  test('rejects wrong path', () => {
    const change = makeChange({ type: 'endpoint-removed', path: '/users' })
    assert.ok(!matchesApproval(change, approval))
  })

  test('unknown approval type returns false', () => {
    const unknown: ApprovedChange = { ...approval, type: 'unknownType' }
    const change = makeChange({ type: 'endpoint-removed', path: '/legacy/orders' })
    assert.ok(!matchesApproval(change, unknown))
  })

  test('method filter: matches when method matches', () => {
    const methodApproval: ApprovedChange = { ...approval, type: 'fieldRemoved', path: '/users', method: 'post' }
    const change = makeChange({ type: 'request-field-removed', path: '/users', method: 'post' })
    assert.ok(matchesApproval(change, methodApproval))
  })

  test('method filter: rejects when method differs', () => {
    const methodApproval: ApprovedChange = { ...approval, type: 'fieldRemoved', path: '/users', method: 'post' }
    const change = makeChange({ type: 'request-field-removed', path: '/users', method: 'get' })
    assert.ok(!matchesApproval(change, methodApproval))
  })

  test('fieldRemoved approval matches both request and response field removals', () => {
    const fieldApproval: ApprovedChange = { ...approval, type: 'fieldRemoved', path: '/users' }
    const req = makeChange({ type: 'request-field-removed', path: '/users' })
    const res = makeChange({ type: 'response-field-removed', path: '/users' })
    assert.ok(matchesApproval(req, fieldApproval))
    assert.ok(matchesApproval(res, fieldApproval))
  })
})

// ─── Expiration ───────────────────────────────────────────────────────────────

describe('isExpired', () => {
  test('no expires → not expired', () => {
    const a: ApprovedChange = { type: 'endpointRemoved', path: '/x', owner: 'a', approvedBy: 'b', reason: 'c' }
    assert.equal(isExpired(a), false)
  })

  test('future expires → not expired', () => {
    const a: ApprovedChange = { type: 'endpointRemoved', path: '/x', owner: 'a', approvedBy: 'b', reason: 'c', expires: '2099-01-01' }
    assert.equal(isExpired(a), false)
  })

  test('past expires → expired', () => {
    const a: ApprovedChange = { type: 'endpointRemoved', path: '/x', owner: 'a', approvedBy: 'b', reason: 'c', expires: '2020-01-01' }
    assert.equal(isExpired(a), true)
  })

  test('invalid date string → not expired (safe default)', () => {
    const a: ApprovedChange = { type: 'endpointRemoved', path: '/x', owner: 'a', approvedBy: 'b', reason: 'c', expires: 'not-a-date' }
    assert.equal(isExpired(a), false)
  })
})

// ─── Suppression rules ────────────────────────────────────────────────────────

describe('matchesSuppression', () => {
  test('ENDPOINT_ADDED suppresses endpoint-added', () => {
    const rule: SuppressionRule = { rule: 'ENDPOINT_ADDED' }
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(change, rule))
  })

  test('ENDPOINT_ADDED does not suppress endpoint-removed', () => {
    const rule: SuppressionRule = { rule: 'ENDPOINT_ADDED' }
    const change = makeChange({ type: 'endpoint-removed' })
    assert.ok(!matchesSuppression(change, rule))
  })

  test('FIELD_ADDED suppresses request-field-added', () => {
    const rule: SuppressionRule = { rule: 'FIELD_ADDED' }
    const change = makeChange({ type: 'request-field-added', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(change, rule))
  })

  test('FIELD_ADDED suppresses response-field-added', () => {
    const rule: SuppressionRule = { rule: 'FIELD_ADDED' }
    const change = makeChange({ type: 'response-field-added', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(change, rule))
  })

  test('INFO suppresses INFO-severity changes', () => {
    const rule: SuppressionRule = { rule: 'INFO' }
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(change, rule))
  })

  test('INFO does not suppress HIGH-severity changes', () => {
    const rule: SuppressionRule = { rule: 'INFO' }
    const change = makeChange({ type: 'endpoint-removed', severity: 'HIGH' })
    assert.ok(!matchesSuppression(change, rule))
  })

  test('NON_BREAKING suppresses non-breaking changes', () => {
    const rule: SuppressionRule = { rule: 'NON_BREAKING' }
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(change, rule))
  })

  test('NON_BREAKING does not suppress breaking changes', () => {
    const rule: SuppressionRule = { rule: 'NON_BREAKING' }
    const change = makeChange({ type: 'endpoint-removed', breaking: true })
    assert.ok(!matchesSuppression(change, rule))
  })

  test('unknown rule → no suppression', () => {
    const rule: SuppressionRule = { rule: 'UNKNOWN_RULE' }
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    assert.ok(!matchesSuppression(change, rule))
  })

  test('path filter: suppresses only matching path', () => {
    const rule: SuppressionRule = { rule: 'ENDPOINT_ADDED', path: '/inventory' }
    const match   = makeChange({ type: 'endpoint-added', path: '/inventory', breaking: false, severity: 'INFO' })
    const noMatch = makeChange({ type: 'endpoint-added', path: '/other', breaking: false, severity: 'INFO' })
    assert.ok(matchesSuppression(match, rule))
    assert.ok(!matchesSuppression(noMatch, rule))
  })
})

describe('isSuppressed', () => {
  test('returns true if any rule matches', () => {
    const rules: SuppressionRule[] = [{ rule: 'ENDPOINT_ADDED' }, { rule: 'FIELD_ADDED' }]
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    assert.ok(isSuppressed(change, rules))
  })

  test('returns false if no rule matches', () => {
    const rules: SuppressionRule[] = [{ rule: 'FIELD_ADDED' }]
    const change = makeChange({ type: 'endpoint-removed' })
    assert.ok(!isSuppressed(change, rules))
  })
})

// ─── Governance engine ────────────────────────────────────────────────────────

describe('applyGovernance — approval flow', () => {
  test('approved change gets APPROVED status and metadata', () => {
    const change = makeChange({ type: 'endpoint-removed', path: '/legacy/orders' })
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/legacy/orders',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Migration',
        expires: '2099-01-01',
      }],
    }
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, 'APPROVED')
    assert.equal(result.changes[0]!.governanceMetadata?.owner, 'platform-team')
    assert.equal(result.changes[0]!.governanceMetadata?.approvedBy, 'arch-board')
    assert.equal(result.changes[0]!.governanceMetadata?.reason, 'Migration')
    assert.equal(result.summary.approved, 1)
    assert.equal(result.summary.unapprovedBreaking, 0)
  })

  test('expired approval gets EXPIRED status', () => {
    const change = makeChange({ type: 'endpoint-removed', path: '/legacy/orders' })
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/legacy/orders',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Migration',
        expires: '2020-01-01', // expired!
      }],
    }
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, 'EXPIRED')
    assert.equal(result.summary.expired, 1)
    assert.equal(result.summary.approved, 0)
    assert.equal(result.summary.unapprovedBreaking, 0)
  })

  test('breaking change with no approval gets UNAPPROVED status', () => {
    const change = makeChange({ type: 'endpoint-removed', path: '/products/{id}', breaking: true })
    const config: SpecGuardConfig = { approvedChanges: [] }
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, 'UNAPPROVED')
    assert.equal(result.summary.unapprovedBreaking, 1)
  })

  test('non-breaking change with no match has no governanceStatus', () => {
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    const config: SpecGuardConfig = {}
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, undefined)
  })
})

describe('applyGovernance — suppression flow', () => {
  test('suppressed change gets SUPPRESSED status', () => {
    const change = makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' })
    const config: SpecGuardConfig = { suppressions: [{ rule: 'ENDPOINT_ADDED' }] }
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, 'SUPPRESSED')
    assert.equal(result.summary.suppressed, 1)
  })

  test('suppression takes priority over approval', () => {
    const change = makeChange({ type: 'endpoint-added', breaking: false, path: '/new', severity: 'INFO' })
    const config: SpecGuardConfig = {
      approvedChanges: [{ type: 'endpointAdded', path: '/new', owner: 'a', approvedBy: 'b', reason: 'c' }],
      suppressions:    [{ rule: 'ENDPOINT_ADDED' }],
    }
    const result = applyGovernance([change], config)
    assert.equal(result.changes[0]!.governanceStatus, 'SUPPRESSED')
    assert.equal(result.summary.suppressed, 1)
    assert.equal(result.summary.approved, 0)
  })
})

describe('applyGovernance — governance summary', () => {
  test('summary enabled flag is true', () => {
    const config: SpecGuardConfig = {}
    const result = applyGovernance([], config)
    assert.equal(result.summary.enabled, true)
  })

  test('configPath is reflected in summary', () => {
    const config: SpecGuardConfig = {}
    const result = applyGovernance([], config, './specguard.yml')
    assert.equal(result.summary.configPath, './specguard.yml')
  })

  test('mixed scenario: approved + suppressed + unapproved', () => {
    const changes: DiffChange[] = [
      makeChange({ type: 'endpoint-removed', path: '/legacy/orders', breaking: true }),     // will be approved
      makeChange({ type: 'endpoint-added',   path: '/inventory',    breaking: false, severity: 'INFO' }), // will be suppressed
      makeChange({ type: 'response-field-removed', path: '/users',  breaking: true }),      // unapproved
    ]
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/legacy/orders',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Migration',
      }],
      suppressions: [{ rule: 'ENDPOINT_ADDED' }],
    }
    const result = applyGovernance(changes, config)
    assert.equal(result.summary.approved, 1)
    assert.equal(result.summary.suppressed, 1)
    assert.equal(result.summary.unapprovedBreaking, 1)
    assert.equal(result.summary.expired, 0)
  })
})

// ─── Governance in report pipeline ───────────────────────────────────────────

describe('generateReport — with governance', () => {
  test('governance section present when config provided', () => {
    const diffResult = compareContracts(base, newSpec)
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/products/{id}',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Migration',
        expires: '2099-01-01',
      }],
      suppressions: [{ rule: 'ENDPOINT_ADDED' }],
    }
    const report = generateReport(diffResult, config)
    assert.ok(report.governance, 'governance section should be present')
    assert.equal(report.governance!.enabled, true)
    assert.ok(report.governance!.approved >= 1, 'should have at least 1 approved change')
  })

  test('governance section absent when no config provided', () => {
    const diffResult = compareContracts(base, newSpec)
    const report = generateReport(diffResult)
    assert.equal(report.governance, undefined)
  })

  test('changes have governanceStatus when config provided', () => {
    const diffResult = compareContracts(base, newSpec)
    const config: SpecGuardConfig = {
      suppressions: [{ rule: 'ENDPOINT_ADDED' }],
    }
    const report = generateReport(diffResult, config)
    const suppressed = report.changes.filter(c => c.governanceStatus === 'SUPPRESSED')
    assert.ok(suppressed.length > 0, 'should have suppressed changes')
  })

  test('governance summary counts are consistent', () => {
    const diffResult = compareContracts(base, newSpec)
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/legacy/orders',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Shutdown',
      }],
    }
    const report = generateReport(diffResult, config)
    const g = report.governance!
    const approvedInChanges  = report.changes.filter(c => c.governanceStatus === 'APPROVED').length
    const suppressedInChanges = report.changes.filter(c => c.governanceStatus === 'SUPPRESSED').length
    assert.equal(g.approved,   approvedInChanges)
    assert.equal(g.suppressed, suppressedInChanges)
  })

  test('ownership metadata present on approved change', () => {
    const diffResult = compareContracts(base, newSpec)
    const config: SpecGuardConfig = {
      approvedChanges: [{
        type: 'endpointRemoved', path: '/products/{id}',
        owner: 'platform-team', approvedBy: 'arch-board', reason: 'Catalog migration',
        expires: '2099-01-01',
      }],
    }
    const report = generateReport(diffResult, config)
    const approved = report.changes.find(c => c.governanceStatus === 'APPROVED')
    assert.ok(approved, 'expected at least one APPROVED change')
    assert.equal(approved!.governanceMetadata?.owner, 'platform-team')
    assert.equal(approved!.governanceMetadata?.approvedBy, 'arch-board')
    assert.equal(approved!.governanceMetadata?.reason, 'Catalog migration')
  })
})
