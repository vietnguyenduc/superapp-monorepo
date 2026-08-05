#!/usr/bin/env bash
set -euo pipefail

# Deploy only the Vercel apps whose files changed against a base commit.
# Use this in CI or locally to avoid burning the Vercel quota on unchanged apps.
#
# Usage:
#   VERCEL_TOKEN=xxx scripts/deploy-changed-apps.sh [preview|production] [base-ref]
#
# Default base-ref for preview is origin/main; for production it is HEAD^1.

TARGET="${1:-preview}"
BASE_REF="${2:-}"
TOKEN="${VERCEL_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "VERCEL_TOKEN is required" >&2
  exit 1
fi

if [ -z "$BASE_REF" ]; then
  if [ "$TARGET" = "production" ]; then
    BASE_REF="HEAD^1"
  else
    BASE_REF="origin/main"
  fi
fi

if [ "$BASE_REF" = "origin/main" ]; then
  git fetch origin main --depth=100 -q 2>/dev/null || true
fi

BASE_SHA=$(git rev-parse "$BASE_REF" 2>/dev/null || git merge-base "$BASE_REF" HEAD 2>/dev/null || true)
if [ -z "$BASE_SHA" ]; then
  echo "Could not resolve base ref '$BASE_REF'; nothing to deploy." >&2
  exit 1
fi

CHANGED=$(git diff --name-only "$BASE_SHA" HEAD 2>/dev/null || true)
if [ -z "$CHANGED" ]; then
  echo "No changed files between $BASE_REF and HEAD."
  exit 0
fi

# Collect unique app directories that have a vercel.json.
deploy_apps=()
while IFS= read -r path; do
  app=$(echo "$path" | awk -F/ '{print $2}')
  if [ -n "$app" ] && [ -f "apps/$app/vercel.json" ]; then
    if [[ " ${deploy_apps[*]} " != *" $app "* ]]; then
      deploy_apps+=("$app")
    fi
  fi
done <<< "$CHANGED"

if [ ${#deploy_apps[@]} -eq 0 ]; then
  echo "No deployable apps changed."
  exit 0
fi

for app in "${deploy_apps[@]}"; do
  "$(dirname "$0")/deploy-app.sh" "$app" "$TARGET"
done
