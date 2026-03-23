#!/bin/bash
# Alternative Deployment Script - psql-based SQL execution
# Date: 2026-03-23

echo "🚀 ALTERNATIVE DEPLOYMENT - PSQL EXECUTION"
echo "========================================"

echo "📋 STEP 1: GET DATABASE CONNECTION STRING"
echo "   1. Go to: https://app.supabase.com/project/peslmsctejmvkwzyohke/settings/database"
echo "   2. Copy your database connection string"
echo "   3. It should look like: postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres"
echo "   4. Replace YOUR_CONNECTION_STRING below"
echo ""

CONNECTION_STRING="YOUR_CONNECTION_STRING"

echo "📋 STEP 2: EXECUTE SQL WITH PSQL"
echo "   Creating RLS policies via psql..."

# Create RLS policies
psql "${CONNECTION_STRING}" << 'EOF'
-- CREATE CORRECTED RLS POLICIES
-- Policy for SELECT operations
CREATE POLICY users_select_policy ON users
FOR SELECT TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin');

-- Policy for INSERT operations  
CREATE POLICY users_insert_policy ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::uuid = id);

-- Policy for UPDATE operations
CREATE POLICY users_update_policy ON users
FOR UPDATE TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin')
WITH CHECK (auth.uid()::uuid = id OR role = 'admin');

-- Policy for DELETE operations
CREATE POLICY users_delete_policy ON users
FOR DELETE TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin');
EOF

echo ""
echo "📋 STEP 3: CREATE ADMIN USER"
echo "   Creating admin user via psql..."

# Create admin user (you'll need to replace USER_ID_FROM_AUTH)
psql "${CONNECTION_STRING}" << 'EOF'
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  staff_permissions,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH',
  'vietnguyenduccp@gmail.com',
  'Viet Nguyen Duc',
  'admin',
  '{"import_customers": true, "import_transactions": true, "view_reports": true, "manage_settings": true}',
  NOW(),
  NOW()
);
EOF

echo ""
echo "📋 STEP 4: VERIFICATION"
echo "   Verify deployment by running:"
echo "   node test-user-permissions.cjs"
echo "   node test-complete-system.cjs"
echo ""

echo "🎉 PSQL DEPLOYMENT COMPLETE"
echo "   Ready for execution with psql"
echo "========================================"

# Open Supabase dashboard for connection string
start https://app.supabase.com/project/peslmsctejmvzyohke/settings/database
