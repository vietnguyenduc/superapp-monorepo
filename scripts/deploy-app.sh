#!/usr/bin/env bash
set -euo pipefail

# Deploy a single Vercel app on demand.
# Use this instead of pushing to a branch when Vercel auto-deploys are skipped
# to preserve the free deployment quota.
#
# Usage:
#   VERCEL_TOKEN=xxx scripts/deploy-app.sh cashflow [preview|production] [--dry]
#
# The script derives the Vercel project name from the app directory name
# (they must match). It runs from the repo root so each project's configured
# "Root Directory" (e.g. apps/cashflow) is respected.

APP="${1:-}"
TARGET="${2:-preview}"
DRY_RUN="${3:-}"
TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$APP" ]; then
  echo "Usage: $0 <app-directory> [preview|production] [--dry]" >&2
  exit 1
fi

if [ -z "$TOKEN" ]; then
  echo "VERCEL_TOKEN is required" >&2
  exit 1
fi

if [ ! -f "apps/$APP/vercel.json" ]; then
  echo "No apps/$APP/vercel.json found; is '$APP' a deployable Vite app?" >&2
  exit 1
fi

PROJECT="$APP"
EXTRA_ARGS=()
[ "$TARGET" = "production" ] && EXTRA_ARGS+=("--prod")
[ "$DRY_RUN" = "--dry" ] && EXTRA_ARGS+=("--dry")

echo "Deploying '$APP' to Vercel project '$PROJECT' (target: $TARGET)..."
npx vercel@latest deploy \
  --project "$PROJECT" \
  --token "$TOKEN" \
  --yes \
  "${EXTRA_ARGS[@]}"
