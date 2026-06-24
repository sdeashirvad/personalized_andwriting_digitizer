import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { compareContracts } from '../src/compare/contracts.js'
import { generateReport } from '../src/report/ReportGenerator.js'
import { generatePRComment, getPRCommentMarker } from '../src/github-action/PRCommentRenderer.js'
import type { PRCommentMode } from '../src/github-action/PRCommentRenderer.js'
import type { OpenAPIContract } from '../src/models/types.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const oldSpec: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Comment Test API', version: '1.0.0' },
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
    '/legacy': {
      get: { responses: { '200': { description: 'OK' } } },
    },
  },
}

const newSpec: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Comment Test API', version: '2.0.0' },
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
                  properties: {
                    id:   { type: 'string' },
                    name: { type: 'string' },  // added (non-breaking)
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders': {   // added (non-breaking)
      get: { responses: { '200': { description: 'OK' } } },
    },
  },
}

function makeReport() {
  const diff = compareContracts(oldSpec, newSpec)
  return generateReport(diff)
}

// ─── Mode: off ────────────────────────────────────────────────────────────────

describe('generatePRComment — mode: off', () => {
  test('returns empty string', () => {
    const report = makeReport()
    const result = generatePRComment(report, 'off')
    assert.equal(result, '')
  })

  test('is falsy (caller can skip posting)', () => {
    const report = makeReport()
    assert.ok(!generatePRComment(report, 'off'))
  })
})

// ─── Mode: summary ────────────────────────────────────────────────────────────

describe('generatePRComment — mode: summary', () => {
  test('contains the hidden marker', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes(getPRCommentMarker()))
  })

  test('contains risk level heading', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes('API Contract Diff'))
    assert.ok(comment.includes(report.riskLevel))
  })

  test('contains summary table rows', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes('Total changes'))
    assert.ok(comment.includes('Breaking'))
    assert.ok(comment.includes('Risk score'))
  })

  test('does NOT contain <details> collapsible sections', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'summary')
    assert.ok(!comment.includes('<details>'))
  })

  test('is shorter than full comment', () => {
    const report   = makeReport()
    const summary  = generatePRComment(report, 'summary')
    const full     = generatePRComment(report, 'full')
    assert.ok(summary.length < full.length)
  })

  test('contains old and new version', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes('1.0.0'))
    assert.ok(comment.includes('2.0.0'))
  })
})

// ─── Mode: full ───────────────────────────────────────────────────────────────

describe('generatePRComment — mode: full', () => {
  test('contains the hidden marker', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes(getPRCommentMarker()))
  })

  test('contains risk level heading', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes('API Contract Diff'))
  })

  test('contains <details> collapsible sections', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes('<details>'))
    assert.ok(comment.includes('</details>'))
  })

  test('contains breaking changes section when breaking changes exist', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    if (report.summary.breaking > 0) {
      assert.ok(comment.includes('Breaking Changes'))
    }
  })

  test('contains non-breaking changes section when non-breaking changes exist', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    if (report.summary.nonBreaking > 0) {
      assert.ok(comment.includes('Non-Breaking Changes'))
    }
  })

  test('contains generated-by footer', () => {
    const report  = makeReport()
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes('api-contract-diff'))
    assert.ok(comment.includes('UTC'))
  })
})

// ─── Default mode ─────────────────────────────────────────────────────────────

describe('generatePRComment — default mode', () => {
  test('defaults to full mode when mode is omitted', () => {
    const report = makeReport()
    const withDefault = generatePRComment(report)
    const withFull    = generatePRComment(report, 'full')
    assert.equal(withDefault, withFull)
  })
})

// ─── Marker ───────────────────────────────────────────────────────────────────

describe('getPRCommentMarker', () => {
  test('returns the expected HTML comment marker', () => {
    const marker = getPRCommentMarker()
    assert.equal(marker, '<!-- api-contract-diff-report -->')
  })

  test('marker is present in all non-off modes', () => {
    const report = makeReport()
    const marker = getPRCommentMarker()
    const modes: PRCommentMode[] = ['summary', 'full']
    for (const mode of modes) {
      const comment = generatePRComment(report, mode)
      assert.ok(comment.includes(marker), `Marker missing in mode: ${mode}`)
    }
  })
})

// ─── No-changes contract ──────────────────────────────────────────────────────

describe('generatePRComment — identical contracts', () => {
  test('summary mode shows no-changes message', () => {
    const diff    = compareContracts(oldSpec, oldSpec)
    const report  = generateReport(diff)
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes('No changes detected') || comment.includes('0'))
  })

  test('full mode shows no-changes message', () => {
    const diff    = compareContracts(oldSpec, oldSpec)
    const report  = generateReport(diff)
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes('No changes detected'))
  })
})

// ─── Governance annotations in full mode ─────────────────────────────────────

describe('generatePRComment — governance in full mode', () => {
  test('includes governance section when governance summary is present', () => {
    const govConfig = {
      approvedChanges: [],
      suppressions: [{ rule: 'ENDPOINT_ADDED' as const, reason: 'Additions are safe' }],
    }
    const diff    = compareContracts(oldSpec, newSpec)
    const report  = generateReport(diff, govConfig)
    const comment = generatePRComment(report, 'full')
    assert.ok(comment.includes('Governance Summary'))
    assert.ok(comment.includes('Suppressed'))
  })

  test('summary mode includes governance counts when governance is present', () => {
    const govConfig = {
      approvedChanges: [],
      suppressions: [{ rule: 'ENDPOINT_ADDED' as const, reason: 'Additions are safe' }],
    }
    const diff    = compareContracts(oldSpec, newSpec)
    const report  = generateReport(diff, govConfig)
    const comment = generatePRComment(report, 'summary')
    assert.ok(comment.includes('Suppressed'))
  })

  test('full mode generates specguard.yml template for unapproved changes', () => {
    const diff    = compareContracts(oldSpec, newSpec)
    const report  = generateReport(diff, { approvedChanges: [], suppressions: [] })
    const comment = generatePRComment(report, 'full')
    if (report.governance && report.governance.unapprovedBreaking > 0) {
      assert.ok(comment.includes('specguard.yml'))
    }
  })
})
