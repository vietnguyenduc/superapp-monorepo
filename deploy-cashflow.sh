#!/bin/bash
# =============================================================
# Deploy Cashflow App to Google Cloud Run
# =============================================================
# Usage:   ./deploy-cashflow.sh
# Prereqs: gcloud CLI installed and authenticated
# =============================================================

set -e

# ---- Configuration ----
PROJECT_ID="superapp-cashflow-1998"
REGION="us-central1"
SERVICE_NAME="cashflow-app"
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest"

VITE_SUPABASE_URL="https://peslmsctejmvkwzyohke.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjY2MTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w"

# ---- Step 1: Build the Docker image via Cloud Build ----
echo "🔨 Building Docker image via Cloud Build..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions="_VITE_SUPABASE_URL=${VITE_SUPABASE_URL},_VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" \
  .

# ---- Step 2: Deploy to Cloud Run ----
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated

echo ""
echo "✅ Deployment complete!"
echo "🌐 App URL: https://${SERVICE_NAME}-509728045980.${REGION}.run.app"
