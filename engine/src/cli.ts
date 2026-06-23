import { readFileSync } from 'fs'
import { parseContract } from './parsers/openapi.js'
import { compareContracts } from './compare/contracts.js'
import { toConsole } from './reporters/console.js'
import { toJSON } from './reporters/json.js'
import { toMarkdown } from './reporters/markdown.js'

function usage() {
  console.log(`
  Usage: api-contract-diff <old-spec> <new-spec> [options]

  Arguments:
    <old-spec>    Path to the old OpenAPI spec (YAML or JSON)
    <new-spec>    Path to the new OpenAPI spec (YAML or JSON)

  Options:
    --format json|markdown|console   Output format (default: console)
    --help                           Show this help
  `)
}

const args = process.argv.slice(2)
if (args.includes('--help') || args.length < 2) {
  usage()
  process.exit(0)
}

const formatIdx = args.indexOf('--format')
const format = formatIdx !== -1 ? args[formatIdx + 1] : 'console'
const [oldPath, newPath] = args.filter(a => !a.startsWith('--') && a !== format)

if (!oldPath || !newPath) {
  console.error('Error: both <old-spec> and <new-spec> are required')
  usage()
  process.exit(1)
}

try {
  const oldRaw = readFileSync(oldPath, 'utf-8')
  const newRaw = readFileSync(newPath, 'utf-8')

  const oldSpec = parseContract(oldRaw)
  const newSpec = parseContract(newRaw)

  const result = compareContracts(oldSpec, newSpec)

  switch (format) {
    case 'json':
      console.log(toJSON(result))
      break
    case 'markdown':
      console.log(toMarkdown(result))
      break
    default:
      console.log(toConsole(result))
  }

  process.exit(result.summary.breaking > 0 ? 1 : 0)
} catch (err) {
  console.error(`Error: ${(err as Error).message}`)
  process.exit(2)
}
