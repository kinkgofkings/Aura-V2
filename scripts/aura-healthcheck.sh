#!/usr/bin/env bash
# Restart Aura if the local health check stops answering.
set -euo pipefail

LOG="${AURA_BACKUP_DIR:-/home/ubuntu/aura-backups}/health.log"
mkdir -p "$(dirname "$LOG")"

if curl -fsS --max-time 10 http://127.0.0.1:3000/api/health >/dev/null; then
  exit 0
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) health failed, restarting" >> "$LOG"
pm2 restart aura --update-env >> "$LOG" 2>&1 || true
