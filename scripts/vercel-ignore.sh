#!/usr/bin/env bash
set -euo pipefail

REF="${VERCEL_GIT_COMMIT_REF:-}"

# Production is always built
[ "$REF" = "main" ] && exit 1

# Preview branch: build only when this app, shared packages, or lockfile changed.
# If git metadata is unavailable, build to stay safe.
if [ "$REF" = "viet" ]; then
  if ! git rev-parse HEAD >/dev/null 2>&1; then
    exit 1
  fi
  git fetch origin main --depth=50 -q 2>/dev/null || true
  BASE=$(git merge-base origin/main HEAD 2>/dev/null || git rev-parse HEAD^ 2>/dev/null || git rev-parse HEAD)
  git diff --quiet "$BASE" HEAD -- . ../../packages ../../package-lock.json
  exit $?
fi

# All other branches/PR previews are skipped to protect the free deploy quota
exit 0
