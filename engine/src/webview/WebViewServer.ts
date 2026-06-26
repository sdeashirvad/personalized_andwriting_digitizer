/**
 * WebViewServer — lightweight Node.js HTTP server for `--webview` mode.
 *
 * Serves the compiled SpecSentinel Studio frontend from engine/assets/webview/
 * and provides the engine-produced ContractDiffReport as /webview-data.json
 * so the browser renders exactly what the engine computed — no re-execution.
 *
 * No external HTTP framework — uses Node.js built-in `http` only.
 */
import { createServer } from 'http'
import type { AddressInfo } from 'net'
import { readFileSync, existsSync } from 'fs'
import { extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

// ─── MIME types ───────────────────────────────────────────────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
}

// ─── Types ────────────────────────────────────────────────────────────────────

import type { ContractDiffReport } from '../report/ContractDiffReport.js'

/**
 * Data served as /webview-data.json.
 * The browser deserializes `report` and calls reconstructFromReport() —
 * it does NOT re-run the diff engine.
 */
export interface WebViewData {
  /** The engine-produced ContractDiffReport — authoritative, not re-computed. */
  report: ContractDiffReport
  /** Raw contract text for display in the Playground (optional). */
  oldContract?: string
  /** Raw contract text for display in the Playground (optional). */
  newContract?: string
  /** CLI invocation info for display in the WebView banner. */
  meta: {
    oldPath: string
    newPath: string
    configPath?: string
    engineVersion: string
    reportGeneratedAt: string
    riskLevel: string
    riskScore: number
    breakingCount: number
  }
}

export interface WebViewServerOptions {
  data: WebViewData
  preferredPort?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAssetsDir(): string {
  // dist/webview/WebViewServer.js → ../../assets/webview
  const selfDir = fileURLToPath(new URL('.', import.meta.url))
  return join(selfDir, '../../assets/webview')
}

function openBrowser(url: string): void {
  let cmd: string
  switch (process.platform) {
    case 'darwin':  cmd = `open "${url}"`; break
    case 'win32':   cmd = `start "" "${url}"`; break
    default:        cmd = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || x-www-browser "${url}" 2>/dev/null`
  }
  exec(cmd, () => { /* URL is always displayed in terminal — browser failure is non-fatal */ })
}

function findAvailablePort(start: number): Promise<number> {
  return new Promise((resolve) => {
    const probe = createServer()
    probe.once('error', () => { probe.close(); resolve(start + 1) })
    probe.once('listening', () => {
      const { port } = probe.address() as AddressInfo
      probe.close(() => resolve(port))
    })
    probe.listen(start, '127.0.0.1')
  })
}

// ─── Server ───────────────────────────────────────────────────────────────────

export async function startWebViewServer(opts: WebViewServerOptions): Promise<void> {
  const assetsDir = getAssetsDir()

  // ── Validate assets ─────────────────────────────────────────────────────────
  if (!existsSync(assetsDir) || !existsSync(join(assetsDir, 'index.html'))) {
    process.stderr.write(
      [
        '',
        '  ✗  WebView assets not found.',
        `     Expected directory: ${assetsDir}`,
        '',
        '  Run the release build first:',
        '    npm run build:release',
        '',
        '  Or from the project root:',
        '    ./scripts/build-release.sh',
        '',
      ].join('\n') + '\n'
    )
    process.exit(1)
  }

  // ── Find port ────────────────────────────────────────────────────────────────
  const port = await findAvailablePort(opts.preferredPort ?? 4321)
  const url = `http://localhost:${port}`

  // ── Inject webview flag into index.html ─────────────────────────────────────
  const rawIndex = readFileSync(join(assetsDir, 'index.html'), 'utf-8')
  const injectedIndex = rawIndex.replace(
    '</head>',
    `<script>window.__SPECSENTINEL_WEBVIEW__=true;</script></head>`
  )

  const dataJson = JSON.stringify(opts.data)

  // ── HTTP request handler ─────────────────────────────────────────────────────
  const server = createServer((req, res) => {
    const pathname = (() => {
      try {
        return new URL(req.url ?? '/', `http://localhost:${port}`).pathname
      } catch {
        return '/'
      }
    })()

    // Health check
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, engineVersion: opts.data.meta.engineVersion }))
      return
    }

    // Contract data for the browser to re-run the engine
    if (pathname === '/webview-data.json') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(dataJson)
      return
    }

    // Serve index.html (root or explicit request)
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(injectedIndex)
      return
    }

    // Static assets
    const decodedPathname = decodeURIComponent(pathname)
    const requestedPath = join(assetsDir, decodedPathname)
    const resolvedPath = resolve(requestedPath)
    const resolvedAssetsDir = resolve(assetsDir)

    // Security: prevent path traversal
    if (!resolvedPath.startsWith(resolvedAssetsDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      res.end('Forbidden')
      return
    }

    if (!existsSync(resolvedPath)) {
      // SPA fallback — all unknown paths get index.html so React Router works
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(injectedIndex)
      return
    }

    try {
      const ext = extname(resolvedPath)
      const mime = MIME[ext] ?? 'application/octet-stream'
      const content = readFileSync(resolvedPath)
      res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=3600, immutable',
      })
      res.end(content)
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
    }
  })

  // ── Start & announce ─────────────────────────────────────────────────────────
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      const { meta } = opts.data
      process.stdout.write(
        [
          '',
          '  ┌─────────────────────────────────────────────────┐',
          '  │       SpecSentinel Studio — Local WebView        │',
          '  └─────────────────────────────────────────────────┘',
          '',
          `  Running at:    ${url}`,
          `  Old contract:  ${meta.oldPath}`,
          `  New contract:  ${meta.newPath}`,
          meta.configPath ? `  Governance:    ${meta.configPath}` : '',
          '',
          `  Risk level:    ${meta.riskLevel}`,
          `  Risk score:    ${meta.riskScore}`,
          `  Breaking:      ${meta.breakingCount}`,
          '',
          '  Opening browser automatically…',
          '  Press Ctrl+C to stop.',
          '',
        ].filter(line => line !== undefined).join('\n') + '\n'
      )
      openBrowser(url)
      resolve()
    })
  })

  // ── Keep alive until signal ──────────────────────────────────────────────────
  await new Promise<void>((resolve) => {
    function shutdown() {
      process.stdout.write('\n  SpecSentinel Studio stopped.\n\n')
      server.close(() => resolve())
    }
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  })
}