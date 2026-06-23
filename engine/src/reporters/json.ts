import type { DiffResult } from '../models/types.js'

export function toJSON(result: DiffResult, pretty = true): string {
  return JSON.stringify(result, null, pretty ? 2 : 0)
}
