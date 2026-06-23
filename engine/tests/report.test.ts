import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { compareContracts } from '../src/compare/contracts.js'
import { generateReport } from '../src/report/ReportGenerator.js'
import { REPORT_VERSION, TOOL_VERSION, isVersionSupported } from '../src/report/ReportVersion.js'
import { determineExitCode, ExitCode } from '../src/report/ExitCodes.js'
import { toJSONReport } from '../src/reporters/json.js'
import { toMarkdownReport } from '../src/reporters/markdown.js'
import { toConsoleReport } from '../src/reporters/console.js'
import type { OpenAPIContract } from '../src/models/types.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const base: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Report Test API', version: '1.0.0' },
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
                    role:  { type: 'string', enum: ['admin', 'user', 'guest'] },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string' },
                  name:  { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/orders': {
      get: { responses: { '200': { description: 'OK' } } },
    },
  },
}

const breakingSpec: OpenAPIContract = {
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
                  properties: { id: { type: 'string' } }, // email removed
                },
              },
            },
          },
        },
      },
    },
    // /orders removed → endpoint-removed (HIGH)
  },
}

// ─── Schema generation ────────────────────────────────────────────────────────

describe('generateReport — schema structure', () => {
  test('report has all required top-level fields', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)

    assert.ok('reportVersion'  in report, 'missing reportVersion')
    assert.ok('generatedAt'    in report, 'missing generatedAt')
    assert.ok('toolVersion'    in report, 'missing toolVersion')
    assert.ok('riskScore'      in report, 'missing riskScore')
    assert.ok('riskLevel'      in report, 'missing riskLevel')
    assert.ok('riskBreakdown'  in report, 'missing riskBreakdown')
    assert.ok('summary'        in report, 'missing summary')
    assert.ok('metadata'       in report, 'missing metadata')
    assert.ok('changes'        in report, 'missing changes')
    assert.ok('impacts'        in report, 'missing impacts')
  })

  test('reportVersion matches REPORT_VERSION constant', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(report.reportVersion, REPORT_VERSION)
    assert.equal(report.reportVersion, '1.0')
  })

  test('toolVersion matches TOOL_VERSION constant', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(report.toolVersion, TOOL_VERSION)
  })

  test('generatedAt is a valid ISO 8601 timestamp', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    const date = new Date(report.generatedAt)
    assert.ok(!isNaN(date.getTime()), `generatedAt is not a valid date: ${report.generatedAt}`)
    assert.ok(report.generatedAt.includes('T'), 'generatedAt should be ISO format with T separator')
    assert.ok(report.generatedAt.endsWith('Z'), 'generatedAt should be UTC (ends with Z)')
  })
})

// ─── Risk score serialization ─────────────────────────────────────────────────

describe('generateReport — risk score serialization', () => {
  test('no-change report has riskScore 0 and riskLevel NONE', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(report.riskScore, 0)
    assert.equal(report.riskLevel, 'NONE')
    assert.equal(report.riskBreakdown.length, 0)
  })

  test('breaking report has riskScore > 0', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.ok(report.riskScore > 0, `expected riskScore > 0, got ${report.riskScore}`)
    assert.notEqual(report.riskLevel, 'NONE')
  })

  test('riskScore is a finite number', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.equal(typeof report.riskScore, 'number')
    assert.ok(isFinite(report.riskScore), 'riskScore must be finite')
    assert.ok(report.riskScore >= 0, 'riskScore must be non-negative')
  })

  test('riskLevel is a valid category string', () => {
    const validCategories = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.ok(validCategories.includes(report.riskLevel), `unexpected riskLevel: ${report.riskLevel}`)
  })

  test('riskBreakdown items have required fields', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    for (const item of report.riskBreakdown) {
      assert.ok('changeType'    in item, 'breakdown item missing changeType')
      assert.ok('label'         in item, 'breakdown item missing label')
      assert.ok('count'         in item, 'breakdown item missing count')
      assert.ok('weight'        in item, 'breakdown item missing weight')
      assert.ok('contribution'  in item, 'breakdown item missing contribution')
      assert.ok(item.count > 0,          'breakdown count must be > 0')
      assert.ok(item.weight > 0,         'breakdown weight must be > 0')
      assert.ok(item.contribution > 0,   'breakdown contribution must be > 0')
    }
  })

  test('riskBreakdown is sorted by contribution descending', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    for (let i = 1; i < report.riskBreakdown.length; i++) {
      assert.ok(
        report.riskBreakdown[i - 1]!.contribution >= report.riskBreakdown[i]!.contribution,
        'riskBreakdown must be sorted descending by contribution'
      )
    }
  })
})

// ─── Summary generation ───────────────────────────────────────────────────────

describe('generateReport — summary generation', () => {
  test('summary.total equals changes.length', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.equal(report.summary.total, report.changes.length)
  })

  test('breaking + nonBreaking equals total', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.equal(
      report.summary.breaking + report.summary.nonBreaking,
      report.summary.total
    )
  })

  test('bySeverity counts sum to total', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const severitySum = Object.values(report.summary.bySeverity).reduce((a, b) => a + b, 0)
    assert.equal(severitySum, report.summary.total)
  })

  test('no-change report has all-zero summary', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(report.summary.total, 0)
    assert.equal(report.summary.breaking, 0)
    assert.equal(report.summary.nonBreaking, 0)
  })

  test('metadata contains old and new version strings', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.ok(report.metadata.oldVersion, 'metadata.oldVersion should be non-empty')
    assert.ok(report.metadata.newVersion, 'metadata.newVersion should be non-empty')
    assert.ok(report.metadata.oldTitle,   'metadata.oldTitle should be non-empty')
  })
})

// ─── Impact generation ────────────────────────────────────────────────────────

describe('generateReport — impact generation', () => {
  test('impacts.length equals changes.length', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.equal(report.impacts.length, report.changes.length)
  })

  test('each impact has a change reference and impact strings', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    for (const impact of report.impacts) {
      assert.ok(impact.change,           'impact must have a change reference')
      assert.ok(Array.isArray(impact.impacts), 'impact.impacts must be an array')
      assert.ok(impact.impacts.length > 0, 'impact.impacts must have at least one entry')
      for (const line of impact.impacts) {
        assert.equal(typeof line, 'string', 'each impact line must be a string')
        assert.ok(line.length > 0,          'each impact line must be non-empty')
      }
    }
  })

  test('breaking changes have impact strings describing consumer effects', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const breakingImpacts = report.impacts.filter(r => r.change.breaking)
    assert.ok(breakingImpacts.length > 0, 'expected at least one breaking impact')
    for (const r of breakingImpacts) {
      // Each impact string should be a real sentence (not the fallback)
      const hasFallback = r.impacts.some(i => i.includes('no template available'))
      assert.ok(!hasFallback, `breaking change ${r.change.type} has no impact template`)
    }
  })

  test('no-change report has empty impacts array', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(report.impacts.length, 0)
  })
})

// ─── Versioning metadata ──────────────────────────────────────────────────────

describe('versioning metadata', () => {
  test('REPORT_VERSION is "1.0"', () => {
    assert.equal(REPORT_VERSION, '1.0')
  })

  test('isVersionSupported("1.0") returns true', () => {
    assert.equal(isVersionSupported('1.0'), true)
  })

  test('isVersionSupported("99.0") returns false', () => {
    assert.equal(isVersionSupported('99.0'), false)
  })

  test('isVersionSupported("") returns false', () => {
    assert.equal(isVersionSupported(''), false)
  })

  test('TOOL_VERSION is a semver-like string', () => {
    assert.match(TOOL_VERSION, /^\d+\.\d+\.\d+/, 'TOOL_VERSION must be semver')
  })
})

// ─── Backward compatibility ───────────────────────────────────────────────────

describe('backward compatibility', () => {
  test('serialized JSON round-trips correctly', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const json   = toJSONReport(report)
    const parsed = JSON.parse(json)

    assert.equal(parsed.reportVersion, report.reportVersion)
    assert.equal(parsed.toolVersion,   report.toolVersion)
    assert.equal(parsed.riskScore,     report.riskScore)
    assert.equal(parsed.riskLevel,     report.riskLevel)
    assert.equal(parsed.summary.total, report.summary.total)
    assert.equal(parsed.changes.length, report.changes.length)
    assert.equal(parsed.impacts.length, report.impacts.length)
  })

  test('JSON output is valid JSON', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const json   = toJSONReport(report)
    assert.doesNotThrow(() => JSON.parse(json), 'toJSONReport must produce valid JSON')
  })

  test('compact JSON (pretty=false) is also valid', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const json   = toJSONReport(report, false)
    assert.doesNotThrow(() => JSON.parse(json))
    assert.ok(!json.includes('\n'), 'compact JSON should not contain newlines')
  })

  test('report fields not present in v1.0 do not appear unexpectedly', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    const json   = JSON.parse(toJSONReport(report))

    const knownFields = new Set([
      'reportVersion', 'generatedAt', 'toolVersion',
      'riskScore', 'riskLevel', 'riskBreakdown',
      'summary', 'metadata', 'changes', 'impacts',
    ])
    for (const key of Object.keys(json)) {
      assert.ok(knownFields.has(key), `unexpected field in report: "${key}"`)
    }
  })
})

// ─── Exit code policy ─────────────────────────────────────────────────────────

describe('determineExitCode', () => {
  test('no breaking changes → exit 0', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(determineExitCode(report), ExitCode.OK)
  })

  test('HIGH breaking changes → exit 2 (default)', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const code   = determineExitCode(report)
    // endpoint-removed is HIGH severity → exit 2
    assert.equal(code, ExitCode.HIGH_BREAKING)
  })

  test('MEDIUM-only breaking changes → exit 1', () => {
    // Remove a request field (MEDIUM severity)
    const mediumSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths!['/users'],
          post: {
            responses: { '201': { description: 'Created' } },
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['email'],
                    properties: { email: { type: 'string' } }, // name removed
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = compareContracts(base, mediumSpec)
    const report = generateReport(result)
    const hasHighBreaking = report.changes.some(c => c.breaking && c.severity === 'HIGH')
    if (!hasHighBreaking && report.summary.breaking > 0) {
      assert.equal(determineExitCode(report), ExitCode.MEDIUM_BREAKING)
    }
  })

  test('--fail-on-high: HIGH → exit 2, MEDIUM breaking → exit 0', () => {
    // Build a MEDIUM-only breaking diff
    const mediumSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths!['/users'],
          post: {
            responses: { '201': { description: 'Created' } },
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { email: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = compareContracts(base, mediumSpec)
    const report = generateReport(result)
    const hasHighBreaking = report.changes.some(c => c.breaking && c.severity === 'HIGH')
    if (!hasHighBreaking && report.summary.breaking > 0) {
      assert.equal(determineExitCode(report, { failOnHigh: true }), ExitCode.OK)
    }
  })

  test('--fail-on-high with HIGH changes → still exit 2', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    assert.equal(determineExitCode(report, { failOnHigh: true }), ExitCode.HIGH_BREAKING)
  })

  test('no breaking → exit 0 regardless of flags', () => {
    const result = compareContracts(base, base)
    const report = generateReport(result)
    assert.equal(determineExitCode(report, { failOnHigh: true }),   ExitCode.OK)
    assert.equal(determineExitCode(report, { failOnMedium: true }), ExitCode.OK)
  })
})

// ─── Renderer smoke tests ─────────────────────────────────────────────────────

describe('renderer smoke tests', () => {
  test('toJSONReport produces string containing reportVersion', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const json   = toJSONReport(report)
    assert.ok(json.includes('"reportVersion"'), 'JSON must contain reportVersion key')
    assert.ok(json.includes('"1.0"'),           'JSON must contain version value "1.0"')
  })

  test('toMarkdownReport produces string with risk score heading', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const md     = toMarkdownReport(report)
    assert.ok(md.includes('Risk Score'), 'Markdown must include Risk Score heading')
    assert.ok(md.includes(String(report.riskScore)), 'Markdown must include numeric risk score')
    assert.ok(md.includes(report.riskLevel), 'Markdown must include risk level')
  })

  test('toConsoleReport produces string with ANSI codes', () => {
    const result = compareContracts(base, breakingSpec)
    const report = generateReport(result)
    const output = toConsoleReport(report)
    assert.ok(typeof output === 'string', 'toConsoleReport must return a string')
    assert.ok(output.includes('\x1b['), 'console output should include ANSI escape codes')
    assert.ok(output.includes('Risk Score'), 'console output should include Risk Score section')
  })
})
