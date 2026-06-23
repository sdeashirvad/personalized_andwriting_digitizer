import { strict as assert } from 'assert'
import { test, describe } from 'node:test'
import { compareContracts } from '../src/compare/contracts.js'
import { parseContract } from '../src/parsers/openapi.js'
import type { OpenAPIContract } from '../src/models/types.js'

const base: OpenAPIContract = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
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
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/products/{id}': {
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
                    price: { type: 'number' },
                    status: { type: 'string', enum: ['active', 'draft', 'archived'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

describe('compareContracts — no changes', () => {
  test('identical specs produce zero changes', () => {
    const result = compareContracts(base, base)
    assert.equal(result.summary.total, 0)
    assert.equal(result.summary.breaking, 0)
  })
})

describe('compareContracts — endpoint changes', () => {
  test('detects removed endpoint', () => {
    const newSpec: OpenAPIContract = { ...base, paths: { '/users': base.paths!['/users']! } }
    const result = compareContracts(base, newSpec)
    const removed = result.changes.find(c => c.type === 'endpoint-removed')
    assert.ok(removed, 'expected endpoint-removed change')
    assert.equal(removed!.path, '/products/{id}')
    assert.equal(removed!.breaking, true)
    assert.equal(removed!.severity, 'HIGH')
  })

  test('detects added endpoint', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: { ...base.paths, '/orders': { get: { responses: { '200': { description: 'OK' } } } } },
    }
    const result = compareContracts(base, newSpec)
    const added = result.changes.find(c => c.type === 'endpoint-added')
    assert.ok(added)
    assert.equal(added!.breaking, false)
    assert.equal(added!.severity, 'INFO')
  })
})

describe('compareContracts — method changes', () => {
  test('detects removed method', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': { get: base.paths!['/users']!.get },
      },
    }
    const result = compareContracts(base, newSpec)
    const removed = result.changes.find(c => c.type === 'method-removed')
    assert.ok(removed)
    assert.equal(removed!.method, 'post')
    assert.equal(removed!.breaking, true)
  })
})

describe('compareContracts — field changes', () => {
  test('detects response field removed', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths!['/users'],
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
      },
    }
    const result = compareContracts(base, newSpec)
    const emailRemoved = result.changes.find(
      c => c.type === 'response-field-removed' && c.description.includes('email')
    )
    assert.ok(emailRemoved)
    assert.equal(emailRemoved!.breaking, true)
    assert.equal(emailRemoved!.severity, 'HIGH')
  })

  test('detects request field added (non-breaking)', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/users': {
          ...base.paths!['/users'],
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                      email: { type: 'string' },
                      name: { type: 'string' },
                      nickname: { type: 'string' },
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
    const result = compareContracts(base, newSpec)
    const added = result.changes.find(
      c => c.type === 'request-field-added' && c.description.includes('nickname')
    )
    assert.ok(added)
    assert.equal(added!.breaking, false)
  })
})

describe('compareContracts — type & enum changes', () => {
  test('detects field type changed', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/products/{id}': {
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
                        price: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'draft', 'archived'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = compareContracts(base, newSpec)
    const typeChange = result.changes.find(c => c.type === 'field-type-changed')
    assert.ok(typeChange)
    assert.equal(typeChange!.oldValue, 'number')
    assert.equal(typeChange!.newValue, 'string')
    assert.equal(typeChange!.breaking, true)
    assert.equal(typeChange!.severity, 'HIGH')
  })

  test('detects enum value removed', () => {
    const newSpec: OpenAPIContract = {
      ...base,
      paths: {
        ...base.paths,
        '/products/{id}': {
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
                        price: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'draft'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    const result = compareContracts(base, newSpec)
    const enumRemoved = result.changes.find(c => c.type === 'enum-value-removed')
    assert.ok(enumRemoved)
    assert.equal(enumRemoved!.oldValue, 'archived')
    assert.equal(enumRemoved!.breaking, true)
  })
})

describe('parseContract', () => {
  test('parses valid JSON', () => {
    const spec = parseContract(JSON.stringify(base))
    assert.equal(spec.info?.title, 'Test API')
  })

  test('parses valid YAML', () => {
    const yaml = `openapi: "3.0.0"\ninfo:\n  title: YAML API\n  version: "2.0.0"\npaths: {}`
    const spec = parseContract(yaml)
    assert.equal(spec.info?.title, 'YAML API')
  })

  test('throws on invalid input', () => {
    assert.throws(() => parseContract('not { valid } yaml: ['))
  })
})

describe('summary counts', () => {
  test('bySeverity sums to total', () => {
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    const severitySum = Object.values(result.summary.bySeverity).reduce((a, b) => a + b, 0)
    assert.equal(severitySum, result.summary.total)
  })

  test('breaking + nonBreaking equals total', () => {
    const newSpec: OpenAPIContract = { ...base, paths: {} }
    const result = compareContracts(base, newSpec)
    assert.equal(result.summary.breaking + result.summary.nonBreaking, result.summary.total)
  })
})
