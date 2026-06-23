/**
 * ConfigLoader — Node.js only (CLI context).
 * Loads and validates specguard.yml from disk.
 * The browser adapter receives SpecGuardConfig as an in-memory object instead.
 */
import { existsSync, readFileSync } from 'fs'
import { load as yamlLoad } from 'js-yaml'
import type { SpecGuardConfig } from './SpecGuardConfig.js'
import { validateConfig } from './SpecGuardConfig.js'

export const DEFAULT_CONFIG_PATH = './specguard.yml'

export interface LoadConfigResult {
  config: SpecGuardConfig | null
  configPath: string | null
  error?: string
}

/**
 * Attempts to load a specguard.yml from the given path.
 * - If path is provided and file does not exist: returns an error.
 * - If path is not provided and default file does not exist: returns null (governance disabled).
 * - If file exists: parses, validates, and returns config.
 */
export function loadConfig(configPath?: string): LoadConfigResult {
  const path = configPath ?? DEFAULT_CONFIG_PATH
  const isExplicit = !!configPath

  if (!existsSync(path)) {
    if (isExplicit) {
      return { config: null, configPath: null, error: `Config file not found: ${path}` }
    }
    // Default path absent — governance simply not configured
    return { config: null, configPath: null }
  }

  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = yamlLoad(raw)
    const config = validateConfig(parsed)
    return { config, configPath: path }
  } catch (err) {
    return {
      config: null,
      configPath: null,
      error: `Failed to load config from ${path}: ${(err as Error).message}`,
    }
  }
}
