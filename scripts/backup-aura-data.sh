#!/usr/bin/env bash
# Copy Aura's live data to a dated backup and keep two weeks of copies.
set -euo pipefail

APP_DIR="${AURA_APP_DIR:-/home/ubuntu/Aura-prod}"
DEST_ROOT="${AURA_BACKUP_DIR:-/home/ubuntu/aura-backups}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
DEST="$DEST_ROOT/$STAMP"

mkdir -p "$DEST"
copied=0
for file in data/db.json data/auth.db data/recovery_data.json; do
  if [ -f "$APP_DIR/$file" ]; then
    cp -a "$APP_DIR/$file" "$DEST/"
    copied=$((copied + 1))
  fi
done

find "$DEST_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
echo "$STAMP copied=$copied" > "$DEST_ROOT/latest.txt"
echo "Aura backup $STAMP ($copied files)"
