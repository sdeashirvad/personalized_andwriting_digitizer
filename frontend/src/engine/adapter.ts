/**
 * Engine Adapter
 *
 * Abstracts the diff engine so the UI can switch between:
 *   - LOCAL:  the bundled TypeScript engine (current)
 *   - GLOBAL: a future globally-published npm package (@api-contract-diff/engine)
 *
 * To swap to the global version, change ENGINE_MODE to 'global' and
 * implement globalDiff below using the published package.
 *
 * Parsing (YAML / JSON) lives here so js-yaml resolves from frontend/node_modules,
 * while the pure comparison logic in @engine/compare has zero external deps.
 */

import { load as yamlLoad } from 'js-yaml'
import { compareContracts } from '@engine/compare/contracts'
import type { DiffResult, OpenAPIContract } from '@engine/models/types'

export type EngineMode = 'local' | 'global'
export const ENGINE_MODE: EngineMode = 'local'
export const ENGINE_VERSION = '1.0.0'

export interface RunDiffOptions {
  oldContract: string
  newContract: string
}

export interface RunDiffResult {
  result: DiffResult
  engineMode: EngineMode
  engineVersion: string
  durationMs: number
}

function parseContract(input: string): OpenAPIContract {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as OpenAPIContract
  }
  const parsed = yamlLoad(trimmed)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('YAML did not parse to an object')
  }
  return parsed as OpenAPIContract
}

export function runDiff(options: RunDiffOptions): RunDiffResult {
  if (ENGINE_MODE === 'global') {
    throw new Error('Global engine not yet configured.')
  }
  const t0 = performance.now()
  const oldSpec = parseContract(options.oldContract)
  const newSpec = parseContract(options.newContract)
  const result = compareContracts(oldSpec, newSpec)
  return {
    result,
    engineMode: ENGINE_MODE,
    engineVersion: ENGINE_VERSION,
    durationMs: Math.round(performance.now() - t0),
  }
}
