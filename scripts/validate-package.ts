#!/usr/bin/env tsx
/**
 * validate-package.ts — pre-release validation for the SpecSentinel engine package.
 *
 * Verifies that all required build artifacts are present and the package.json
 * is correctly configured for npm publish / npx usage.
 *
 * Usage:
 *   tsx scripts/validate-package.ts
 *   # or after build:
 *   npx tsx scripts/validate-package.ts
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const ENGINE = join(ROOT, 'engine')

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function check(label: string, condition: boolean, hint?: string): void {
  if (condition) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.log(`  ✗  ${label}${hint ? `\n     ${hint}` : ''}`)
    failed++
  }
}

function section(title: string): void {
  console.log(`\n  ── ${title} ${'─'.repeat(Math.max(0, 46 - title.length))}`)
}

// ─── Validation ───────────────────────────────────────────────────────────────

console.log('\n  ┌─────────────────────────────────────────────────┐')
console.log('  │      SpecSentinel Package Validation               │')
console.log('  └─────────────────────────────────────────────────┘')

// ── Engine dist artifacts ────────────────────────────────────────────────────
section('Engine build artifacts')
check('engine/dist/ exists',                        existsSync(join(ENGINE, 'dist')),
  'Run: cd engine && npm run build')
check('engine/dist/index.js',                       existsSync(join(ENGINE, 'dist', 'index.js')),
  'Run: cd engine && npm run build')
check('engine/dist/index.d.ts',                     existsSync(join(ENGINE, 'dist', 'index.d.ts')),
  'Run: cd engine && npm run build')
check('engine/dist/cli.js',                         existsSync(join(ENGINE, 'dist', 'cli.js')),
  'Run: cd engine && npm run build')
check('engine/dist/webview/WebViewServer.js',       existsSync(join(ENGINE, 'dist', 'webview', 'WebViewServer.js')),
  'Run: cd engine && npm run build')

// ── WebView assets ────────────────────────────────────────────────────────────
section('WebView assets (release build only)')
const webviewDir = join(ENGINE, 'assets', 'webview')
check('engine/assets/webview/ exists',              existsSync(webviewDir),
  'Run: ./scripts/build-release.sh')
check('engine/assets/webview/index.html',           existsSync(join(webviewDir, 'index.html')),
  'Run: ./scripts/build-release.sh')
check('engine/assets/webview/assets/ exists',       existsSync(join(webviewDir, 'assets')),
  'Run: ./scripts/build-release.sh')

// ── package.json configuration ────────────────────────────────────────────────
section('package.json configuration')
const pkgPath = join(ENGINE, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

check('Has "bin.specsentinel" entry',               !!pkg.bin?.specsentinel,
  'Add: "bin": { "specsentinel": "./dist/cli.js" }')
check('"bin.specsentinel" points to dist/cli.js',   pkg.bin?.specsentinel === './dist/cli.js',
  `Got: ${pkg.bin?.specsentinel}`)
check('"files" includes dist/**/*',                  (pkg.files ?? []).some((f: string) => f.includes('dist')),
  'Add "dist/**/*" to files array')
check('"files" includes assets/**/*',                (pkg.files ?? []).some((f: string) => f.includes('assets')),
  'Add "assets/**/*" to files array — required for --webview')
check('"type" is "module"',                          pkg.type === 'module',
  'ESM package required')
check('"exports[.].import" set',                     !!pkg.exports?.['.']),
check('Has build script',                            !!pkg.scripts?.build)

// ── CLI shebang ───────────────────────────────────────────────────────────────
section('CLI entry point')
const cliJs = join(ENGINE, 'dist', 'cli.js')
if (existsSync(cliJs)) {
  const firstLine = readFileSync(cliJs, 'utf-8').split('\n')[0] ?? ''
  check('dist/cli.js has #!/usr/bin/env node shebang',
    firstLine.startsWith('#!/'),
    'Add #!/usr/bin/env node as the very first line of engine/src/cli.ts')
} else {
  check('dist/cli.js has shebang (skipped — file missing)', false, 'Build engine first')
}

// ── WebView injection ─────────────────────────────────────────────────────────
section('WebView index.html sanity check')
const indexPath = join(webviewDir, 'index.html')
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf-8')
  check('index.html has <div id="root">',            html.includes('id="root"'))
  check('index.html has </head> tag (for injection)', html.includes('</head>'))
  // The injected flag should NOT be in the source — it's added by the server at runtime
  check('index.html does NOT pre-inject __SPECSENTINEL_WEBVIEW__',
    !html.includes('__SPECSENTINEL_WEBVIEW__'))
} else {
  check('WebView index.html checks (skipped — file missing)', false, 'Run build-release.sh first')
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n  ${'─'.repeat(51)}`)
console.log(`  ${passed} passed · ${failed} failed\n`)

if (failed > 0) {
  process.exit(1)
} else {
  console.log('  ✓  Package is ready for release.\n')
  process.exit(0)
}
