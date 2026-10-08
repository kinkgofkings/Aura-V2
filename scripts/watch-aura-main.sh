#!/usr/bin/env bash
# Pull origin/main when it changes, rebuild, and restart Aura.
# Live data in data/ is gitignored and is not deleted.
set -euo pipefail

APP_DIR="${AURA_APP_DIR:-/home/ubuntu/Aura-prod}"
LOG="${AURA_BACKUP_DIR:-/home/ubuntu/aura-backups}/deploy.log"
mkdir -p "$(dirname "$LOG")"
cd "$APP_DIR"

git fetch origin main
local_rev="$(git rev-parse HEAD)"
remote_rev="$(git rev-parse origin/main)"
if [ "$local_rev" = "$remote_rev" ]; then
  exit 0
fi

{
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) updating $local_rev -> $remote_rev"
  git checkout main
  git reset --hard origin/main
  npm install --legacy-peer-deps --no-audit
  npm run build
  pm2 restart aura --update-env
  pm2 save
  curl -fsS --max-time 15 http://127.0.0.1:3000/api/health
  echo
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy ok $remote_rev"
} >> "$LOG" 2>&1
