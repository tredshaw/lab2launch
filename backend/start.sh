#!/bin/bash
# Lab2Launch dev server — run from backend/ directory
# Uses venv from the repo root (shared across worktrees)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../" && pwd)"
VENV="$REPO_ROOT/venv"

export DYLD_LIBRARY_PATH="/opt/homebrew/lib:${DYLD_LIBRARY_PATH}"

# Load .env from repo root if present
if [ -f "$REPO_ROOT/.env" ]; then
  export $(grep -v '^#' "$REPO_ROOT/.env" | xargs) 2>/dev/null
fi

cd "$SCRIPT_DIR"
exec "$VENV/bin/uvicorn" main:app --reload --host 127.0.0.1 --port 8000
