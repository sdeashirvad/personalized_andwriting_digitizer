import { load as yamlLoad } from 'js-yaml'
import type { OpenAPIContract } from '../models/types.js'

export function parseContract(input: string): OpenAPIContract {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as OpenAPIContract
    } catch (e) {
      throw new Error(`Failed to parse JSON contract: ${(e as Error).message}`)
    }
  }
  try {
    const parsed = yamlLoad(trimmed)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('YAML did not parse to an object')
    }
    return parsed as OpenAPIContract
  } catch (e) {
    throw new Error(`Failed to parse YAML contract: ${(e as Error).message}`)
  }
}
