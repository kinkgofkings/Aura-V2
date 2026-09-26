#!/usr/bin/env bash
# ==============================================================================
# Aura Sanctuary - Automated Server-Side Update & Deployment Script
# ==============================================================================
# Usage:
#   chmod +x scripts/update-server.sh
#   ./scripts/update-server.sh
# ==============================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "=================================================="
echo "⚡ [AURA] Starting Server-Side Update at $(date)"
echo "📁 [AURA] Working directory: $APP_DIR"
echo "=================================================="

# 1. Fetch latest git updates if git is available
if [ -d ".git" ]; then
  echo "📥 Pulling latest code from git repository..."
  git fetch --all --prune
  # Discard accidental local edits to build artifacts and pull origin
  git reset --hard origin/main || git pull || echo "⚠️ Git pull notice: continuing with local workspace"
fi

# 2. Ensure environment variables file exists
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "⚙️ Creating .env from .env.example..."
  cp .env.example .env
fi

# 3. Create required runtime data folders
mkdir -p data/bible
mkdir -p public/uploads/sermons
mkdir -p public/uploads/youtube_series
mkdir -p public/assets
mkdir -p dist

# Sync custom assets from assets/ (e.g. icon.png and splashscreen.png)
if [ -d "assets" ]; then
  echo "🎨 Checking assets folder for custom branding..."
  if [ -f "assets/icon.png" ]; then
    echo "  -> Syncing icon.png to public/ and public/assets/"
    cp -f assets/icon.png public/icon.png
    cp -f assets/icon.png public/assets/icon.png 2>/dev/null || true
  fi
  if [ -f "assets/splashscreen.png" ]; then
    echo "  -> Syncing splashscreen.png to public/ and public/assets/"
    cp -f assets/splashscreen.png public/splashscreen.png
    cp -f assets/splashscreen.png public/assets/splashscreen.png 2>/dev/null || true
  fi
fi

# 4. Install dependencies
echo "📦 Installing / verifying npm dependencies..."
npm install --legacy-peer-deps --no-audit

# 5. Build client bundle and compile CommonJS server bundle
echo "🔨 Compiling Vite frontend and bundling server.cjs with esbuild..."
npm run build

# Ensure custom assets are also copied to dist for production static serving
if [ -f "public/icon.png" ]; then
  cp -f public/icon.png dist/icon.png 2>/dev/null || true
fi
if [ -f "public/splashscreen.png" ]; then
  cp -f public/splashscreen.png dist/splashscreen.png 2>/dev/null || true
fi

# 6. Synchronize YouTube series & sermon database
echo "📖 Synchronizing sermon and Bible study library..."
npm run sync-sermons || echo "⚠️ Sermon sync notice: continuing"

# 7. Package Over-The-Air (OTA) mobile update bundle
echo "📦 Generating OTA mobile update archive..."
npm run release:ota || echo "⚠️ OTA archive notice: continuing"

# 8. Restart process manager (PM2 or systemd or fallback to background node)
echo "🔄 Reloading Aura server service..."
if command -v pm2 &> /dev/null; then
  echo "🚀 Detected PM2. Reloading or starting 'aura'..."
  pm2 reload ecosystem.config.cjs || pm2 restart aura || pm2 start ecosystem.config.cjs || pm2 start dist/server.cjs --name aura
  pm2 save
elif systemctl is-active --quiet aura.service 2>/dev/null; then
  echo "🚀 Detected systemd service. Restarting aura.service..."
  sudo systemctl restart aura.service
else
  echo "ℹ️ PM2/systemd not detected. You can run 'npm start' or 'node dist/server.cjs' to launch."
fi

echo "=================================================="
echo "✅ [AURA] Server update complete successfully!"
echo "🌐 API Base: http://localhost:3000/api"
echo "🩺 Health Check: http://localhost:3000/api/health"
echo "📊 Diagnostics: http://localhost:3000/api/system/diagnostics"
echo "=================================================="
