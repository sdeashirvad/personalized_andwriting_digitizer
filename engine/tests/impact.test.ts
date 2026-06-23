import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { generateImpactReport, generateImpactReports } from '../src/reporters/impact.js'
import { compareContracts } from '../src/compare/contracts.js'
import type { OpenAPIContract, DiffChange } from '../src/models/types.js'

function makeChange(overrides: Partial<DiffChange>): DiffChange {
  return {
    type: 'endpoint-removed',
    severity: 'HIGH',
    breaking: true,
    path: '/test',
    description: 'Endpoint "/test" was removed',
    ...overrides,
  }
}

describe('generateImpactReport — endpoint-removed', () => {
  test('returns multiple impact bullets', () => {
    const report = generateImpactReport(makeChange({ type: 'endpoint-removed', method: 'get' }))
    assert.ok(report.impacts.length >= 2)
    assert.ok(report.impacts.some(i => i.includes('/test')))
  })

  test('includes method in first bullet when provided', () => {
    const report = generateImpactReport(makeChange({ type: 'endpoint-removed', method: 'post', path: '/orders' }))
    assert.ok(report.impacts[0].includes('POST'))
    assert.ok(report.impacts[0].includes('/orders'))
  })
})

describe('generateImpactReport — response-field-removed', () => {
  test('mentions the field name in impacts', () => {
    const report = generateImpactReport(makeChange({
      type: 'response-field-removed',
      description: 'Field "customerId" removed from response 200',
    }))
    assert.ok(report.impacts.some(i => i.includes('customerId')))
    assert.ok(report.impacts.length >= 3)
  })
})

describe('generateImpactReport — field-type-changed', () => {
  test('includes old and new type in impacts', () => {
    const report = generateImpactReport(makeChange({
      type: 'field-type-changed',
      description: 'Field "amount" type changed: "number" → "string"',
      oldValue: 'number',
      newValue: 'string',
    }))
    assert.ok(report.impacts.some(i => i.includes('number') && i.includes('string')))
  })
})

describe('generateImpactReport — enum-value-removed', () => {
  test('references the removed enum value', () => {
    const report = generateImpactReport(makeChange({
      type: 'enum-value-removed',
      description: 'Enum value "archived" removed from field "status"',
      oldValue: 'archived',
    }))
    assert.ok(report.impacts.some(i => i.includes('archived')))
  })
})

describe('generateImpactReport — field-required-changed', () => {
  test('became required → warns about validation errors', () => {
    const report = generateImpactReport(makeChange({
      type: 'field-required-changed',
      description: 'Field "email" changed from optional to required',
      oldValue: false,
      newValue: true,
    }))
    assert.ok(report.impacts.some(i => i.toLowerCase().includes('required') || i.toLowerCase().includes('validation')))
  })
})

describe('generateImpactReport — additive changes', () => {
  test('endpoint-added → non-breaking message', () => {
    const report = generateImpactReport(makeChange({ type: 'endpoint-added', breaking: false, severity: 'INFO' }))
    assert.ok(report.impacts.some(i => i.toLowerCase().includes('not affected') || i.toLowerCase().includes('additive') || i.toLowerCase().includes('no existing')))
  })

  test('response-field-added → non-breaking message', () => {
    const report = generateImpactReport(makeChange({
      type: 'response-field-added',
      breaking: false,
      severity: 'LOW',
      description: 'Field "nickname" added to response 200',
    }))
    assert.ok(report.impacts.some(i => i.toLowerCase().includes('optional') || i.toLowerCase().includes('additive') || i.toLowerCase().includes('safely ignore')))
  })
})

describe('generateImpactReports — batch', () => {
  test('returns one report per change', () => {
    const base: OpenAPIContract = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1' },
      paths: {
        '/a': { get: { responses: { '200': { description: 'ok' } } } },
        '/b': { get: { responses: { '200': { description: 'ok' } } } },
      },
    }
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const reports = generateImpactReports(result.changes)
    assert.equal(reports.length, result.changes.length)
  })

  test('each report has at least one impact bullet', () => {
    const base: OpenAPIContract = {
      openapi: '3.0.0',
      info: { title: 'T', version: '1' },
      paths: { '/x': { get: { responses: { '200': { description: 'ok' } } } } },
    }
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const reports = generateImpactReports(result.changes)
    for (const r of reports) {
      assert.ok(r.impacts.length >= 1, `Expected at least 1 impact for change type ${r.change.type}`)
    }
  })
})
