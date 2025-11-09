#!/usr/bin/env bash
#!/usr/bin/env bash
set -euo pipefail

# NoCodr dev runner: starts webview-ui (Vite HMR), watches extension build, and launches VS Code dev host
# Requirements:
# - nvm with Node 20.19.2
# - pnpm
# - VS Code CLI ('code') in PATH
#
# Usage:
#   chmod +x dev-run.sh && ./dev-run.sh
#
# Notes:
# - The webview dev server writes .vite-port at repo root; the extension reads it for HMR.
# - The extension dev host is launched via --extensionDevelopmentPath to ensure Development mode.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBVIEW_DIR="$ROOT_DIR/webview-ui"
SRC_DIR="$ROOT_DIR/src"
VITE_PORT_FILE="$ROOT_DIR/.vite-port"

cleanup() {
  echo "\n[cleanup] Stopping background processes..."
  if [[ -n "${VITE_PID:-}" ]] && ps -p "$VITE_PID" >/dev/null 2>&1; then
    echo "- Killing Vite dev server (PID: $VITE_PID)"
    kill "$VITE_PID" || true
  fi
  if [[ -n "${ESBUILD_PID:-}" ]] && ps -p "$ESBUILD_PID" >/dev/null 2>&1; then
    echo "- Killing esbuild watcher (PID: $ESBUILD_PID)"
    kill "$ESBUILD_PID" || true
  fi
}
trap cleanup EXIT INT TERM

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 1) Ensure nvm + Node 20.19.2
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  set +e
  . "$HOME/.nvm/nvm.sh"
  set -e
else
  echo "[error] nvm not found at $HOME/.nvm/nvm.sh"
  echo "Please install nvm and re-run. macOS: brew install nvm"
  exit 1
fi

echo "[nvm] Using Node 20.19.2"
nvm install 20.19.2 >/dev/null
nvm use 20.19.2 >/dev/null

# 2) Check pnpm & VS Code CLI
if ! command_exists pnpm; then
  echo "[error] pnpm is not installed. Install: npm i -g pnpm"
  exit 1
fi
if ! command_exists code; then
  echo "[error] VS Code CLI 'code' is not in PATH. In VS Code: Command Palette → 'Shell Command: Install \"code\" command in PATH'"
  exit 1
fi

echo "[info] pnpm: $(pnpm --version)"
echo "[info] code: $(code --version | head -n 1)"

# 3) Install workspace deps (once)
echo "[pnpm] Installing workspace dependencies..."
PNPM_FILTER=""
# Use monorepo bootstrap script; falls back to standard install if needed
pushd "$ROOT_DIR" >/dev/null
pnpm install
popd >/dev/null

# Approve build scripts per project policy
if pnpm -v >/dev/null 2>&1; then
  echo "[pnpm] Approving build scripts..."
  pnpm approve-builds || true
fi

# 4) Start webview-ui dev server (Vite HMR)
echo "[vite] Starting webview dev server..."
pushd "$WEBVIEW_DIR" >/dev/null
pnpm install
# Run dev in background, persist port to .vite-port (handled by persistPortPlugin)
pnpm dev >/dev/null 2>&1 &
VITE_PID=$!
popd >/dev/null

# Wait for .vite-port to appear
echo "[vite] Waiting for dev server port..."
for i in {1..60}; do
  if [[ -f "$VITE_PORT_FILE" ]]; then
    VITE_PORT=$(cat "$VITE_PORT_FILE" | tr -d '\n\r')
    if [[ -n "$VITE_PORT" ]]; then
      echo "[vite] Dev server running on port $VITE_PORT"
      break
    fi
  fi
  sleep 1
done

if [[ ! -f "$VITE_PORT_FILE" ]]; then
  echo "[error] .vite-port not found after waiting. Check Vite server logs."
  exit 1
fi

# 5) Start extension build (esbuild watch)
echo "[esbuild] Starting extension watcher..."
pushd "$SRC_DIR" >/dev/null
node esbuild.mjs --watch >/dev/null 2>&1 &
ESBUILD_PID=$!
popd >/dev/null

echo "[info] Background PIDs: Vite=$VITE_PID, esbuild=$ESBUILD_PID"

# 6) Launch VS Code Extension Development Host
echo "[vscode] Launching Extension Development Host..."
code --extensionDevelopmentPath "$SRC_DIR" "$ROOT_DIR" || {
  echo "[error] Failed to launch VS Code dev host."
  exit 1
}

echo "[done] VS Code should open with the extension in Development mode."
echo "       Webview UI is served via Vite HMR on port $(cat "$VITE_PORT_FILE")."
echo "       Press Ctrl+C to stop background processes."

# Keep the script running to maintain background processes; Ctrl+C triggers cleanup
wait $VITE_PID $ESBUILD_PID
