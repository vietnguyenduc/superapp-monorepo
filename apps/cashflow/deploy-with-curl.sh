#!/bin/bash
# Alternative Deployment Script - curl-based SQL execution
# Date: 2026-03-23

echo "🚀 ALTERNATIVE DEPLOYMENT - SQL EXECUTION"
echo "========================================"

echo "📋 STEP 1: GET SERVICE ROLE KEY"
echo "   1. Go to: https://app.supabase.com/project/peslmsctejmvkwzyohke/settings/api"
echo "   2. Copy your 'service_role' key"
echo "   3. Replace YOUR_SERVICE_ROLE_KEY below"
echo ""

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ"
PROJECT_REF="peslmsctejmvkwzyohke"

echo "📋 STEP 2: EXECUTE RLS POLICIES"
echo "   Creating RLS policies via REST API..."

# Create RLS policies
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "-- CREATE CORRECTED RLS POLICIES\n-- Policy for SELECT operations\nCREATE POLICY users_select_policy ON users\nFOR SELECT TO authenticated\nUSING (auth.uid()::uuid = id OR role = '\''admin'\'');\n\n-- Policy for INSERT operations\nCREATE POLICY users_insert_policy ON users\nFOR INSERT TO authenticated\nWITH CHECK (auth.uid()::uuid = id);\n\n-- Policy for UPDATE operations\nCREATE POLICY users_update_policy ON users\nFOR UPDATE TO authenticated\nUSING (auth.uid()::uuid = id OR role = '\''admin'\'')\nWITH CHECK (auth.uid()::uuid = id OR role = '\''admin'\'');\n\n-- Policy for DELETE operations\nCREATE POLICY users_delete_policy ON users\nFOR DELETE TO authenticated\nUSING (auth.uid()::uuid = id OR role = '\''admin'\'');"
  }'

echo ""
echo "📋 STEP 3: CREATE ADMIN USER"
echo "   Creating admin user via REST API..."

# Create admin user (you'll need to replace USER_ID_FROM_AUTH)
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/users" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "USER_ID_FROM_AUTH",
    "email": "vietnguyenduccp@gmail.com",
    "full_name": "Viet Nguyen Duc",
    "role": "admin",
    "staff_permissions": {
      "import_customers": true,
      "import_transactions": true,
      "view_reports": true,
      "manage_settings": true
    }
  }'

echo ""
echo "📋 STEP 4: VERIFICATION"
echo "   Verify deployment by running:"
echo "   node test-user-permissions.cjs"
echo "   node test-complete-system.cjs"
echo ""

echo "🎉 ALTERNATIVE DEPLOYMENT COMPLETE"
echo "   Ready for execution with service role key"
echo "========================================"

# Open Supabase dashboard for service role key
start https://app.supabase.com/project/peslmsctejmvkwzyohke/settings/api
