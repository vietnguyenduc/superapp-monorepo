#!/usr/bin/env bash
set -euo pipefail

ENV="${VERCEL_ENV:-preview}"
REF="${VERCEL_GIT_COMMIT_REF:-}"

# ignoreCommand runs from apps/<app>/ (where vercel.json lives).
APP_DIR=$(basename "$PWD")
cd ../..

# No git metadata: skip to preserve quota rather than burn builds.
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "Git metadata unavailable; skipping build."
  exit 0
fi

HEAD_SHA=$(git rev-parse HEAD)
BASE_SHA=""

if [ "$ENV" = "production" ] || [ "$REF" = "main" ]; then
  # Production deploy on main: compare against previous main commit.
  BASE_SHA=$(git rev-parse HEAD^ 2>/dev/null || echo "$HEAD_SHA")
else
  # Previews (viet, PR branches, etc.): compare against the merge-base with origin/main.
  git fetch origin main --depth=50 -q 2>/dev/null || true
  BASE_SHA=$(git merge-base origin/main HEAD 2>/dev/null || git rev-parse HEAD^ 2>/dev/null || echo "$HEAD_SHA")
fi

if [ "$BASE_SHA" = "$HEAD_SHA" ] || [ -z "$BASE_SHA" ]; then
  echo "Could not determine diff base; skipping build to protect quota."
  exit 0
fi

CHANGED=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" 2>/dev/null || true)

if [ -z "$CHANGED" ]; then
  echo "No changed files detected; skipping build."
  exit 0
fi

APP_PATH="apps/$APP_DIR"
if echo "$CHANGED" | grep -qE "^$APP_PATH/|^packages/|^package-lock\.json$|^package\.json$|^turbo\.json$|^scripts/"; then
  echo "Changes detected for $APP_PATH or shared dependencies; building."
  exit 1
else
  echo "No changes for $APP_PATH; skipping build."
  exit 0
fi
