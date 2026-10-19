#!/usr/bin/env bash
# ==============================================================================
# Aura - Push Changes to GitHub Repository
# Repo: https://github.com/kinkgofkings/Aura-V2
# ==============================================================================
# Usage:
#   npm run push:github
#   ./scripts/push-to-github.sh "feat: describe your change"
#   GITHUB_TOKEN=ghp_xxx ./scripts/push-to-github.sh "feat: your commit message"
# ==============================================================================

set -e

REPO_URL="https://github.com/kinkgofkings/Aura-V2.git"
BRANCH="main"

echo "=================================================="
echo "🚀 [AURA] GitHub Sync & Push Utility"
echo "📦 Target Repository: kinkgofkings/Aura-V2 (branch: $BRANCH)"
echo "=================================================="

# Ensure we're in repo root
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# 1. Check if git is initialized
if [ ! -d ".git" ]; then
  echo "❌ Error: Not a git repository. Initializing..."
  git init
  git remote add origin "$REPO_URL"
  git branch -M "$BRANCH"
fi

# 2. Verify or set git remote
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$CURRENT_REMOTE" ]; then
  git remote add origin "$REPO_URL"
elif [ "$CURRENT_REMOTE" != "$REPO_URL" ] && [[ "$CURRENT_REMOTE" != *"github.com/kinkgofkings/Aura-V2"* ]]; then
  echo "ℹ️ Updating origin remote to $REPO_URL"
  git remote set-url origin "$REPO_URL"
fi

# 3. Configure Git user if not already set
if [ -z "$(git config user.name)" ]; then
  git config user.name "kinkgofkings"
fi
if [ -z "$(git config user.email)" ]; then
  git config user.email "savdbygrace360@gmail.com"
fi

# 4. Parse commit message argument
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="chore: update Aura Sanctuary build, scripts, and documentation [$(date -u +'%Y-%m-%d %H:%M:%S UTC')]"
fi

# 5. Check git status
echo ""
echo "🔍 Checking repository status..."
git status --short

# Check if there are changes
if git diff-index --quiet HEAD -- 2>/dev/null && [ -z "$(git status --porcelain)" ]; then
  echo "✨ Workspace is clean. Nothing new to commit."
else
  echo ""
  echo "📝 Staging modified and new files..."
  git add -A

  echo "💾 Committing changes: \"$COMMIT_MSG\""
  git commit -m "$COMMIT_MSG"
fi

# 6. Push to GitHub
echo ""
echo "📤 Preparing push to GitHub..."

# Check if GITHUB_TOKEN or GH_TOKEN is provided
TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"

if [ -n "$TOKEN" ]; then
  echo "🔑 Using provided GitHub Token for authentication..."
  PUSH_URL="https://${TOKEN}@github.com/kinkgofkings/Aura-V2.git"
  git push "$PUSH_URL" "$BRANCH"
  echo "✅ Successfully pushed changes to https://github.com/kinkgofkings/Aura-V2 (branch: $BRANCH)!"
  exit 0
fi

# Try standard push (will prompt for credentials or use stored SSH/credential helper)
echo "⚡ Attempting git push origin $BRANCH..."
if git push origin "$BRANCH"; then
  echo "✅ Push succeeded!"
else
  echo ""
  echo "⚠️ Git push required authentication."
  echo ""
  echo "👉 To push using your GitHub Personal Access Token (PAT):"
  echo "   GITHUB_TOKEN=your_personal_access_token npm run push:github"
  echo ""
  echo "Or configure your remote directly with your token:"
  echo "   git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/kinkgofkings/Aura-V2.git"
  echo "   git push origin $BRANCH"
  echo ""
  echo "You can generate a token at: https://github.com/settings/tokens (Needs 'repo' scope)"
  exit 1
fi
