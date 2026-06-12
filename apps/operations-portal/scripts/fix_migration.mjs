import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env
const envPath = resolve(projectRoot, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) {
    envVars[key.trim()] = rest.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Step 1: Drop duplicate policies
const dropPolicies = [
  `DROP POLICY IF EXISTS "Admin Master can view all users" ON public.users;`,
  `DROP POLICY IF EXISTS "Admin Master can view all roles" ON public.roles;`,
  `DROP POLICY IF EXISTS "Admin Master can view all permissions" ON public.permissions;`,
  `DROP POLICY IF EXISTS "Admin Master can view all role_permissions" ON public.role_permissions;`,
  `DROP POLICY IF EXISTS "Admin Master can view all user_roles" ON public.user_roles;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_roles" ON public.admin_roles;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_permissions" ON public.admin_permissions;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_role_permissions" ON public.admin_role_permissions;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_user_roles" ON public.admin_user_roles;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_audit_logs" ON public.admin_audit_logs;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_sessions" ON public.admin_sessions;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_settings" ON public.admin_settings;`,
  `DROP POLICY IF EXISTS "Admin Master can view all admin_notifications" ON public.admin_notifications;`,
];

console.log('🔍 Dropping duplicate policies...');
for (const sql of dropPolicies) {
  const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).maybeSingle();
  if (error && !error.message.includes('does not exist')) {
    console.log(`  ⚠️  ${sql.slice(0, 60)}... error: ${error.message}`);
  } else {
    console.log(`  ✅ ${sql.slice(0, 60)}...`);
  }
}

// Step 2: Read and run the migration file
const migrationPath = resolve(projectRoot, 'supabase', 'migrations', '00001_create_operation_tables.sql');
const migrationSql = readFileSync(migrationPath, 'utf-8');

console.log('\n📦 Running migration...');
const { error: migrationError } = await supabase.rpc('exec_sql', { sql_text: migrationSql }).maybeSingle();
if (migrationError) {
  console.error(`❌ Migration error: ${migrationError.message}`);
  process.exit(1);
}
console.log('✅ Migration completed successfully!');

// Step 3: Verify tables
console.log('\n🔍 Verifying tables...');
const { data: tables, error: tablesError } = await supabase
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .in('table_name', [
    'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
    'admin_roles', 'admin_permissions', 'admin_role_permissions', 'admin_user_roles',
    'admin_audit_logs', 'admin_sessions', 'admin_settings', 'admin_notifications'
  ]);

if (tablesError) {
  console.error(`❌ Verification error: ${tablesError.message}`);
} else {
  console.log(`✅ Found ${tables.length} tables:`);
  tables.forEach(t => console.log(`   - ${t.table_name}`));
}

console.log('\n🎉 All done!');
