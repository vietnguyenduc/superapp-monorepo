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
VITE_ADMIN_PORTAL_URL=""
VITE_SALES_APP_URL=""
VITE_INVENTORY_APP_URL=""
VITE_CASHFLOW_APP_URL=""
VITE_HR_APP_URL=""
VITE_ACCOUNTING_APP_URL=""
VITE_OPERATIONS_APP_URL=""

# ---- Deploy to Vercel ----
echo "🚀 Deploying to Vercel..."
cd "${APP_DIR}"
npx -y vercel --prod --yes \
  -e VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  -e VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
  -e VITE_ADMIN_PORTAL_URL="${VITE_ADMIN_PORTAL_URL}" \
  -e VITE_SALES_APP_URL="${VITE_SALES_APP_URL}" \
  -e VITE_INVENTORY_APP_URL="${VITE_INVENTORY_APP_URL}" \
  -e VITE_CASHFLOW_APP_URL="${VITE_CASHFLOW_APP_URL}" \
  -e VITE_HR_APP_URL="${VITE_HR_APP_URL}" \
  -e VITE_ACCOUNTING_APP_URL="${VITE_ACCOUNTING_APP_URL}" \
  -e VITE_OPERATIONS_APP_URL="${VITE_OPERATIONS_APP_URL}"

echo ""
echo "✅ Vercel deployment complete!"
