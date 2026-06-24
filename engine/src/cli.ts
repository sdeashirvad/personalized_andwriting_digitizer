#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { parseContract } from './parsers/openapi.js'
import { compareContracts } from './compare/contracts.js'
import { generateReport } from './report/ReportGenerator.js'
import { determineExitCode, ExitCode } from './report/ExitCodes.js'
import { TOOL_VERSION } from './report/ReportVersion.js'
import { toConsoleReport } from './reporters/console.js'
import { toJSONReport } from './reporters/json.js'
import { toMarkdownReport } from './reporters/markdown.js'
import { loadConfig } from './governance/ConfigLoader.js'

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
  api-contract-diff  v${TOOL_VERSION}

  Detect breaking and non-breaking changes between two OpenAPI / Swagger specs.

  Usage:
    api-contract-diff <old-spec> <new-spec> [options]

  Arguments:
    <old-spec>    Path to the old OpenAPI spec (.yaml, .yml, or .json)
    <new-spec>    Path to the new OpenAPI spec (.yaml, .yml, or .json)

  Options:
    --json              Output a structured JSON report (ContractDiffReport schema)
    --format <fmt>      Output format: console (default) | json | markdown
    --output <file>     Write output to a file instead of stdout
    --config <file>     Path to specguard.yml governance config
                        (defaults to ./specguard.yml if it exists)
    --fail-on-high      Only exit non-zero for HIGH/CRITICAL breaking changes;
                        MEDIUM/LOW breaking changes produce exit 0
    --fail-on-medium    Exit non-zero for any breaking change (default behaviour)
    --version           Print the tool version and exit
    --help              Show this help text

  Exit codes:
    0   No breaking changes detected
    1   Breaking changes found (max severity: MEDIUM or LOW)
    2   Breaking changes found (max severity: HIGH or CRITICAL)
    3   One or more contract files are invalid / unparseable
    4   Unexpected internal error

  Governance:
    Place specguard.yml in your project root to approve changes and suppress findings.
    See engine/docs/governance.md for the full config reference.

  Examples:
    # Human-readable console diff
    api-contract-diff old.yaml new.yaml

    # With governance config
    api-contract-diff old.yaml new.yaml --config specguard.yml

    # JSON report to stdout
    api-contract-diff old.yaml new.yaml --json

    # JSON report saved to file
    api-contract-diff old.yaml new.yaml --json --output report.json

    # Markdown report
    api-contract-diff old.yaml new.yaml --format markdown

    # CI: only fail pipeline on HIGH/CRITICAL changes
    api-contract-diff old.yaml new.yaml --fail-on-high
    if [ $? -eq 2 ]; then echo "BLOCKER: high-severity breaking changes"; fi

    # CI: fail pipeline on any breaking change
    api-contract-diff old.yaml new.yaml --fail-on-medium
  `)
}

// ─── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

if (args.includes('--version') || args.includes('-v')) {
  console.log(TOOL_VERSION)
  process.exit(ExitCode.OK)
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  printHelp()
  process.exit(ExitCode.OK)
}

const useWebView   = args.includes('--webview')
const failOnHigh   = args.includes('--fail-on-high')
const failOnMedium = args.includes('--fail-on-medium')
const useJSON      = args.includes('--json')

const formatIdx = args.indexOf('--format')
const formatArg = formatIdx !== -1 ? args[formatIdx + 1] : undefined
const format    = useJSON ? 'json' : (formatArg ?? 'console')

const outputIdx  = args.indexOf('--output')
const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : undefined

const configIdx  = args.indexOf('--config')
const configArg  = configIdx !== -1 ? args[configIdx + 1] : undefined

const portIdx = args.indexOf('--port')
const portArg = portIdx !== -1 ? parseInt(args[portIdx + 1] ?? '4321', 10) : 4321

// Collect positional args (skip flags and their values)
const skipNext = new Set<number>()
if (formatIdx !== -1) { skipNext.add(formatIdx); skipNext.add(formatIdx + 1) }
if (outputIdx !== -1) { skipNext.add(outputIdx); skipNext.add(outputIdx + 1) }
if (configIdx !== -1) { skipNext.add(configIdx); skipNext.add(configIdx + 1) }
if (portIdx   !== -1) { skipNext.add(portIdx);   skipNext.add(portIdx + 1) }

const positional = args.filter(
  (a, i) => !a.startsWith('--') && !skipNext.has(i)
)
const [oldPath, newPath] = positional

if (!oldPath || !newPath) {
  console.error('Error: both <old-spec> and <new-spec> are required.\n')
  printHelp()
  process.exit(ExitCode.INVALID_CONTRACT)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

try {
  let oldRaw: string
  let newRaw: string

  try {
    oldRaw = readFileSync(oldPath, 'utf-8')
    newRaw = readFileSync(newPath, 'utf-8')
  } catch (err) {
    console.error(`Error reading file: ${(err as Error).message}`)
    process.exit(ExitCode.INVALID_CONTRACT)
  }

  let oldSpec, newSpec
  try {
    oldSpec = parseContract(oldRaw)
    newSpec = parseContract(newRaw)
  } catch (err) {
    console.error(`Error parsing contract: ${(err as Error).message}`)
    process.exit(ExitCode.INVALID_CONTRACT)
  }

  // ── Load governance config ─────────────────────────────────────────────────
  const { config: govConfig, configPath: resolvedConfigPath, error: configError } = loadConfig(configArg)

  if (configError) {
    console.error(`Governance config error: ${configError}`)
    process.exit(ExitCode.INVALID_CONTRACT)
  }

  const diffResult = compareContracts(oldSpec, newSpec)
  const report     = generateReport(diffResult, govConfig ?? undefined, resolvedConfigPath ?? undefined)
  const exitCode   = determineExitCode(report, { failOnHigh, failOnMedium })

  // ── WebView mode ────────────────────────────────────────────────────────────
  if (useWebView) {
    console.log(toConsoleReport(report))

    // Read raw governance YAML so the browser can re-parse + re-run the engine
    let governanceConfigYaml: string | undefined
    if (resolvedConfigPath && existsSync(resolvedConfigPath)) {
      try { governanceConfigYaml = readFileSync(resolvedConfigPath, 'utf-8') } catch { /* non-fatal */ }
    }

    // Dynamic import keeps server deps out of the hot path for non-webview runs
    const { startWebViewServer } = await import('./webview/WebViewServer.js')
    await startWebViewServer({
      preferredPort: portArg,
      data: {
        oldContract: oldRaw,
        newContract: newRaw,
        governanceConfigYaml,
        meta: {
          oldPath,
          newPath,
          configPath: resolvedConfigPath ?? undefined,
          engineVersion: TOOL_VERSION,
          reportGeneratedAt: report.generatedAt,
          riskLevel: report.riskLevel,
          riskScore: report.riskScore,
          breakingCount: report.summary.breaking,
        },
      },
    })
    process.exit(exitCode)
  }

  // ── Standard output ─────────────────────────────────────────────────────────
  let output: string
  switch (format) {
    case 'json':
      output = toJSONReport(report)
      break
    case 'markdown':
      output = toMarkdownReport(report)
      break
    default:
      output = toConsoleReport(report)
  }

  if (outputFile) {
    writeFileSync(outputFile, output, 'utf-8')
    if (format !== 'json') {
      console.log(toConsoleReport(report))
    }
    console.log(`\n  Report written to: ${outputFile}`)
  } else {
    console.log(output)
  }

  process.exit(exitCode)
} catch (err) {
  console.error(`Internal error: ${(err as Error).message}`)
  if (process.env.DEBUG) console.error((err as Error).stack)
  process.exit(ExitCode.INTERNAL_ERROR)
}
