// DevOps Distribution - Alternative SQL Deployment Methods
// Provide alternative ways to deploy SQL fixes when dashboard fails

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjYxMTIsImV4cCI6MjA4NjA0MjYxMn0.Ulua_wXmMGoWRvJ22DDWC8U_JE6g0L-EuAEhbBNhB-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function provideAlternativeDeployment() {
  console.log('🚨 DevOps Distribution: ALTERNATIVE SQL DEPLOYMENT METHODS...\n');
  
  try {
    // Step 1: Analyze the dashboard error
    console.log('🔍 Dashboard Error Analysis:');
    console.log('   Error: "requested path is invalid"');
    console.log('   Issue: Supabase Dashboard URL may be incorrect');
    console.log('   Solution: Try alternative deployment methods');
    
    // Step 2: Provide alternative URLs
    console.log('\n🌐 ALTERNATIVE SUPABASE DASHBOARD URLS:');
    console.log('');
    console.log('📍 OPTION 1: Direct Project Dashboard');
    console.log('   URL: https://app.supabase.com/project/peslmsctejmvkwzyohke');
    console.log('   Steps:');
    console.log('   1. Open the URL above');
    console.log('   2. Login to Supabase');
    console.log('   3. Navigate to your project');
    console.log('   4. Click "SQL Editor"');
    console.log('   5. Execute the SQL');
    console.log('');
    
    console.log('📍 OPTION 2: Main Supabase Dashboard');
    console.log('   URL: https://app.supabase.com');
    console.log('   Steps:');
    console.log('   1. Open the URL above');
    console.log('   2. Login to Supabase');
    console.log('   3. Select your project: peslmsctejmvkwzyohke');
    console.log('   4. Click "SQL Editor"');
    console.log('   5. Execute the SQL');
    console.log('');
    
    console.log('📍 OPTION 3: Direct API Method');
    console.log('   Use Supabase REST API directly');
    console.log('   Steps:');
    console.log('   1. Get your service role key from project settings');
    console.log('   2. Use curl or Postman to execute SQL');
    console.log('   3. More complex but reliable method');
    console.log('');
    
    // Step 3: Create curl-based deployment script
    console.log('📋 Creating curl-based deployment script...');
    
    const fs = require('fs');
    const path = require('path');
    
    const curlScript = `#!/bin/bash
# Alternative Deployment Script - curl-based SQL execution
# Date: 2026-03-23

echo "🚀 ALTERNATIVE DEPLOYMENT - SQL EXECUTION"
echo "========================================"

echo "📋 STEP 1: GET SERVICE ROLE KEY"
echo "   1. Go to: https://app.supabase.com/project/peslmsctejmvkwzyohke/settings/api"
echo "   2. Copy your 'service_role' key"
echo "   3. Replace YOUR_SERVICE_ROLE_KEY below"
echo ""

SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
PROJECT_REF="peslmsctejmvkwzyohke"

echo "📋 STEP 2: EXECUTE RLS POLICIES"
echo "   Creating RLS policies via REST API..."

# Create RLS policies
curl -X POST "https://\${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql" \\
  -H "Authorization: Bearer \${SERVICE_ROLE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sql": "-- CREATE CORRECTED RLS POLICIES\\n-- Policy for SELECT operations\\nCREATE POLICY users_select_policy ON users\\nFOR SELECT TO authenticated\\nUSING (auth.uid()::uuid = id OR role = '\\''admin'\\'');\\n\\n-- Policy for INSERT operations\\nCREATE POLICY users_insert_policy ON users\\nFOR INSERT TO authenticated\\nWITH CHECK (auth.uid()::uuid = id);\\n\\n-- Policy for UPDATE operations\\nCREATE POLICY users_update_policy ON users\\nFOR UPDATE TO authenticated\\nUSING (auth.uid()::uuid = id OR role = '\\''admin'\\'')\\nWITH CHECK (auth.uid()::uuid = id OR role = '\\''admin'\\'');\\n\\n-- Policy for DELETE operations\\nCREATE POLICY users_delete_policy ON users\\nFOR DELETE TO authenticated\\nUSING (auth.uid()::uuid = id OR role = '\\''admin'\\'');"
  }'

echo ""
echo "📋 STEP 3: CREATE ADMIN USER"
echo "   Creating admin user via REST API..."

# Create admin user (you'll need to replace USER_ID_FROM_AUTH)
curl -X POST "https://\${PROJECT_REF}.supabase.co/rest/v1/users" \\
  -H "Authorization: Bearer \${SERVICE_ROLE_KEY}" \\
  -H "Content-Type: application/json" \\
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
`;
    
    fs.writeFileSync(path.join(__dirname, 'deploy-with-curl.sh'), curlScript);
    console.log('✅ Created: deploy-with-curl.sh');
    
    // Step 4: Create psql-based deployment script
    console.log('\n📋 Creating psql-based deployment script...');
    
    const psqlScript = `#!/bin/bash
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
psql "\${CONNECTION_STRING}" << 'EOF'
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
psql "\${CONNECTION_STRING}" << 'EOF'
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
`;
    
    fs.writeFileSync(path.join(__dirname, 'deploy-with-psql.sh'), psqlScript);
    console.log('✅ Created: deploy-with-psql.sh');
    
    // Step 5: Create simple web-based deployment
    console.log('\n🌐 Creating web-based deployment script...');
    
    const webScript = `<!DOCTYPE html>
<html>
<head>
    <title>SQL Deployment Helper</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .sql-content { background: #fff; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
        .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .button:hover { background: #0056b3; }
        .copy-btn { background: #28a745; }
        .copy-btn:hover { background: #1e7e34; }
        .url-btn { background: #17a2b8; }
        .url-btn:hover { background: #138496; }
        .status { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <h1>🚀 SQL Deployment Helper</h1>
    <p>This page helps you deploy SQL fixes when the Supabase Dashboard fails.</p>
    
    <div class="container">
        <h2>📋 Alternative URLs</h2>
        <button class="button url-btn" onclick="window.open('https://app.supabase.com/project/peslmsctejmvkwzyohke')">Open Supabase Dashboard</button>
        <button class="button url-btn" onclick="window.open('https://app.supabase.com/project/peslmsctejmvkwzyohke/sql')">Open SQL Editor Direct</button>
        <button class="button url-btn" onclick="window.open('https://app.supabase.com/project/peslmsctejmvzyohke/settings/api')">Get Service Role Key</button>
        <button class="button url-btn" onclick="window.open('https://app.supabase.com/project/peslmsctejmvzyohke/settings/database')">Get Connection String</button>
    </div>
    
    <div class="container">
        <h2>📄 Corrected SQL Content</h2>
        <div class="sql-content">
-- RLS Policy Fix for Users Table (CORRECTED)
-- Date: 2026-03-23
-- Architect: Senior Software Architect
-- Fix: Removed non-existent columns

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

-- CREATE ADMIN USER RECORD (CORRECTED)
-- Using only columns that exist in the table
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  staff_permissions,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH',  -- Get this from auth system after login
  'vietnguyenduccp@gmail.com',
  'Viet Nguyen Duc',
  'admin',
  '{"import_customers": true, "import_transactions": true, "view_reports": true, "manage_settings": true}',
  NOW(),
  NOW()
);
        </div>
        <button class="button copy-btn" onclick="copySQL()">📋 Copy SQL to Clipboard</button>
        <div id="copyStatus" class="status"></div>
    </div>
    
    <div class="container">
        <h2>👤 User Creation Steps</h2>
        <ol>
            <li>Execute the RLS policies first (CREATE POLICY statements)</li>
            <li>Login to your application</li>
            <li>Open browser console (F12)</li>
            <li>Run: <code>window.supabase.auth.getUser().then(user => console.log(user.id))</code></li>
            <li>Copy the user ID value</li>
            <li>Replace USER_ID_FROM_AUTH in the SQL above</li>
            <li>Execute the INSERT statement</li>
        </ol>
    </div>
    
    <div class="container">
        <h2>🧪 Verification Steps</h2>
        <ol>
            <li>Run: <code>node test-user-permissions.cjs</code></li>
            <li>Run: <code>node test-complete-system.cjs</code></li>
            <li>Run: <code>node test-post-deployment.cjs</code></li>
            <li>Check that all tests pass</li>
        </ol>
    </div>
    
    <script>
        function copySQL() {
            const sqlContent = document.querySelector('.sql-content').textContent;
            navigator.clipboard.writeText(sqlContent).then(() => {
                const status = document.getElementById('copyStatus');
                status.className = 'status success';
                status.textContent = '✅ SQL copied to clipboard!';
                setTimeout(() => {
                    status.className = 'status';
                    status.textContent = '';
                }, 3000);
            }).catch(err => {
                const status = document.getElementById('copyStatus');
                status.className = 'status error';
                status.textContent = '❌ Failed to copy: ' + err.message;
            });
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync(path.join(__dirname, 'deployment-helper.html'), webScript);
    console.log('✅ Created: deployment-helper.html');
    
    // Step 6: Display deployment options
    console.log('\n📋 ALTERNATIVE DEPLOYMENT OPTIONS:');
    console.log('');
    console.log('🌐 OPTION 1: Web-Based Helper');
    console.log('   File: deployment-helper.html');
    console.log('   Action: Double-click to open in browser');
    console.log('   Features: Direct links, copy-paste, step-by-step guide');
    console.log('');
    console.log('🔧 OPTION 2: curl Script');
    console.log('   File: deploy-with-curl.sh');
    console.log('   Action: bash deploy-with-curl.sh');
    console.log('   Requirements: Service role key');
    console.log('');
    console.log('🗄️ OPTION 3: psql Script');
    console.log('   File: deploy-with-psql.sh');
    console.log('   Action: bash deploy-with-curl.sh');
    console.log('   Requirements: psql installed, connection string');
    console.log('');
    console.log('🌐 OPTION 4: Alternative URLs');
    console.log('   Direct dashboard URLs (see above)');
    console.log('   Action: Click links to open correct pages');
    console.log('');
    
    // Step 7: Open web helper
    console.log('🌐 Opening web-based deployment helper...');
    
    try {
      const { spawn } = require('child_process');
      
      // Try to open the HTML file in default browser
      if (process.platform === 'win32') {
        spawn('cmd', ['/c', 'start', path.join(__dirname, 'deployment-helper.html')], { stdio: 'ignore' });
      } else {
        spawn('open', [path.join(__dirname, 'deployment-helper.html')], { stdio: 'ignore' });
      }
      
      console.log('   ✅ Web helper opened in default browser');
    } catch (error) {
      console.log('   ⚠️ Could not open web helper automatically');
      console.log('   Action: Double-click deployment-helper.html');
    }
    
    console.log('\n🎉 ALTERNATIVE DEPLOYMENT METHODS COMPLETE!');
    console.log('   Multiple deployment options are now available');
    console.log('   Choose the method that works best for you');
    console.log('   System functionality will be restored after deployment');
    
  } catch (error) {
    console.error('❌ Alternative Deployment Setup Failed:', error.message);
    console.log('   ACTION: Check file system permissions');
  }
}

// Execute alternative deployment setup
provideAlternativeDeployment().catch(console.error);
