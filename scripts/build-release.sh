#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SpecGuard Release Build Pipeline
#
# Steps:
#   1. Build engine TypeScript → dist/
#   2. Build frontend React → dist/
#   3. Copy frontend/dist → engine/assets/webview/
#   4. Package the engine (npm pack)
#
# Usage:
#   ./scripts/build-release.sh [--pack]
#
# Pass --pack to also run `npm pack` at the end.
# ─────────────────────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACK=false

for arg in "$@"; do
  [[ "$arg" == "--pack" ]] && PACK=true
done

echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │      SpecSentinel — Release Build Pipeline              │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

# ── Step 1: Build engine ──────────────────────────────────────────────────────
echo "  [1/4] Building engine TypeScript..."
cd "$ROOT/engine"
npm run build
echo "  ✓  engine/dist/ ready"
echo ""

# ── Step 2: Build frontend ────────────────────────────────────────────────────
echo "  [2/4] Building frontend (Studio-only webview bundle)..."
cd "$ROOT/frontend"
npm run build:webview
echo "  ✓  frontend/dist/ ready"
echo ""

# ── Step 3: Copy frontend dist → engine/assets/webview/ ──────────────────────
echo "  [3/4] Copying frontend assets → engine/assets/webview/..."
WEBVIEW_DIR="$ROOT/engine/assets/webview"
rm -rf "$WEBVIEW_DIR"
mkdir -p "$WEBVIEW_DIR"
cp -r "$ROOT/frontend/dist/." "$WEBVIEW_DIR/"
echo "  ✓  engine/assets/webview/ populated"
echo ""

# ── Step 4: Verify ────────────────────────────────────────────────────────────
echo "  [4/4] Verifying build artifacts..."

assert_exists() {
  if [[ ! -e "$1" ]]; then
    echo "  ✗  Missing: $1" >&2
    exit 1
  fi
}

assert_exists "$ROOT/engine/dist/index.js"
assert_exists "$ROOT/engine/dist/cli.js"
assert_exists "$ROOT/engine/dist/webview/WebViewServer.js"
assert_exists "$ROOT/engine/assets/webview/index.html"
assert_exists "$ROOT/engine/assets/webview/assets"

echo "  ✓  All artifacts verified"
echo ""

# ── Optional: npm pack ────────────────────────────────────────────────────────
if [[ "$PACK" == "true" ]]; then
  echo "  [+] Running npm pack..."
  cd "$ROOT/engine"
  npm pack --pack-destination "$ROOT"
  TGZ=$(ls "$ROOT"/*.tgz | head -1)
  echo "  ✓  Package: $TGZ"
  echo ""
  echo "  Package contents:"
  tar tzf "$TGZ" | sed 's/^/    /'
  echo ""
fi

echo "  ✓  Release build complete"
echo ""
