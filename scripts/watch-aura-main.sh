#!/usr/bin/env bash
# ==============================================================================
# Aura Main Branch Continuous Watcher & Auto-Deployer
# Pulls origin/main when changes are detected, rebuilds, and restarts Aura.
# ==============================================================================
set -euo pipefail

LOCK_FILE="/tmp/aura-deploy.lock"
exec 200>"$LOCK_FILE"
flock -n 200 || { exit 0; }

APP_DIR="${AURA_APP_DIR:-/home/ubuntu/Aura-prod}"
LOG="${AURA_BACKUP_DIR:-/home/ubuntu/aura-backups}/deploy.log"
mkdir -p "$(dirname "$LOG")"

cd "$APP_DIR"
git fetch origin main --quiet 2>/dev/null || exit 0
local_rev="$(git rev-parse HEAD)"
remote_rev="$(git rev-parse origin/main)"

if [ "$local_rev" = "$remote_rev" ]; then
  exit 0
fi

{
  echo "=================================================="
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ⚡ New commit detected: $local_rev -> $remote_rev"
  echo "📥 Running update-server.sh pipeline..."
  chmod +x scripts/*.sh 2>/dev/null || true
  ./scripts/update-server.sh
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ✅ Deploy successful for $remote_rev"
  echo "=================================================="
} >> "$LOG" 2>&1
