#!/usr/bin/env bash
set -euo pipefail

# Deploy a Superapp frontend app to Vercel and wait for it to be READY.
# Usage: ./scripts/deploy-frontend.sh [app-name]
# Default app: sales-operation

APP_NAME="${1:-sales-operation}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/$APP_NAME"

if [ ! -d "$APP_DIR" ]; then
  echo "Error: app directory not found: $APP_DIR" >&2
  exit 1
fi

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "Error: VERCEL_TOKEN is not set" >&2
  exit 1
fi

if [ -z "${GH_TOKEN:-}" ]; then
  # Try to extract from the git remote URL
  GH_TOKEN="$(git -C "$REPO_ROOT" remote get-url origin 2>/dev/null | sed -n 's#https://\([^@]*\)@github.com.*#\1#p' || true)"
  export GH_TOKEN
fi

# Ensure gh is authenticated for GitHub operations
export GH_TOKEN

# Commit and push any local changes
cd "$REPO_ROOT"
if [ -n "$(git status --short)" ]; then
  echo "=== Staging and committing local changes ==="
  git add -A
  git commit -m "chore: deploy $APP_NAME" --no-verify || true
  git push origin viet
fi

# Trigger a Vercel deployment from the local app directory
echo "=== Deploying $APP_NAME to Vercel ==="
cd "$APP_DIR"
vercel --token "$VERCEL_TOKEN" --prod --yes

# Poll for READY status (up to 5 minutes)
echo "=== Waiting for Vercel deployment to be READY ==="
for i in {1..30}; do
  STATE=$(vercel list --token "$VERCEL_TOKEN" "$APP_NAME" 2>/dev/null | grep -oE "READY|BUILDING|ERROR|QUEUED" | head -n 1 || true)
  if [ "$STATE" = "READY" ]; then
    echo "=== Deployment READY ==="
    vercel list --token "$VERCEL_TOKEN" "$APP_NAME" 2>/dev/null | head -n 2
    exit 0
  fi
  echo "  state: ${STATE:-unknown} (retry $i/30)"
  sleep 10
done

echo "Error: deployment did not become READY within 5 minutes" >&2
exit 1
