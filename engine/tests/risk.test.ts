import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { calculateRiskScore, getRiskCategory, RISK_WEIGHTS } from '../src/rules/risk.js'
import { compareContracts } from '../src/compare/contracts.js'
import type { OpenAPIContract } from '../src/models/types.js'

const base: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Risk Test API', version: '1.0.0' },
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
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'inactive'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/orders': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
}

describe('getRiskCategory', () => {
  test('score 0 → NONE', () => assert.equal(getRiskCategory(0), 'NONE'))
  test('score 1 → LOW', () => assert.equal(getRiskCategory(1), 'LOW'))
  test('score 20 → LOW', () => assert.equal(getRiskCategory(20), 'LOW'))
  test('score 21 → MEDIUM', () => assert.equal(getRiskCategory(21), 'MEDIUM'))
  test('score 60 → MEDIUM', () => assert.equal(getRiskCategory(60), 'MEDIUM'))
  test('score 61 → HIGH', () => assert.equal(getRiskCategory(61), 'HIGH'))
  test('score 120 → HIGH', () => assert.equal(getRiskCategory(120), 'HIGH'))
  test('score 121 → CRITICAL', () => assert.equal(getRiskCategory(121), 'CRITICAL'))
})

describe('calculateRiskScore — no changes', () => {
  test('identical specs → score 0, category NONE', () => {
    const result = compareContracts(base, base)
    const risk = calculateRiskScore(result.changes)
    assert.equal(risk.score, 0)
    assert.equal(risk.category, 'NONE')
    assert.equal(risk.breakdown.length, 0)
    assert.equal(risk.topContributors.length, 0)
  })
})

describe('calculateRiskScore — endpoint removed', () => {
  test('removing one endpoint scores ' + RISK_WEIGHTS['endpoint-removed'], () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: { '/users': base.paths!['/users']! },
    }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    assert.equal(risk.score, RISK_WEIGHTS['endpoint-removed'])
    assert.equal(risk.category, 'MEDIUM')
    const item = risk.breakdown.find(b => b.changeType === 'endpoint-removed')
    assert.ok(item)
    assert.equal(item!.count, 1)
    assert.equal(item!.weight, 40)
  })
})

describe('calculateRiskScore — response field removed', () => {
  test('score includes response-field-removed weight', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { id: { type: 'string' } } },
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    assert.ok(risk.score >= RISK_WEIGHTS['response-field-removed'])
    assert.ok(['MEDIUM', 'HIGH', 'CRITICAL'].includes(risk.category))
  })
})

describe('calculateRiskScore — additive only', () => {
  test('only added endpoint → low score', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/new-resource': { get: { responses: { '200': { description: 'OK' } } } },
      },
    }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    assert.equal(risk.score, 0)
    assert.equal(risk.category, 'NONE')
  })
})

describe('calculateRiskScore — breakdown sorted by contribution', () => {
  test('breakdown items sorted descending by contribution', () => {
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    for (let i = 1; i < risk.breakdown.length; i++) {
      assert.ok(risk.breakdown[i - 1]!.contribution >= risk.breakdown[i]!.contribution)
    }
  })
})

describe('calculateRiskScore — topContributors', () => {
  test('topContributors capped at 5', () => {
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    assert.ok(risk.topContributors.length <= 5)
  })

  test('topContributors only include weighted changes', () => {
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const risk = calculateRiskScore(result.changes)
    for (const c of risk.topContributors) {
      assert.ok((RISK_WEIGHTS[c.type] ?? 0) > 0, `Expected weight > 0 for ${c.type}`)
    }
  })
})
