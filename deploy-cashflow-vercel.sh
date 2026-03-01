#!/bin/bash
# =============================================================
# Deploy Cashflow App to Vercel
# =============================================================
# Usage:   ./deploy-cashflow-vercel.sh
# Prereqs: Vercel CLI (npx vercel) and authenticated
# =============================================================

set -e

# ---- Configuration ----
APP_DIR="apps/cashflow"
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""

# ---- Deploy to Vercel ----
echo "🚀 Deploying to Vercel..."
cd "${APP_DIR}"
npx -y vercel --prod --yes \
  -e VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  -e VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

echo ""
echo "✅ Vercel deployment complete!"
