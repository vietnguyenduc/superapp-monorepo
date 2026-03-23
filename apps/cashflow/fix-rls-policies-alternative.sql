
-- Alternative RLS Policy Fix (Single Policy)
-- Date: 2026-03-23

-- ALTERNATIVE: SINGLE POLICY APPROACH
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

CREATE POLICY users_policy ON users
FOR ALL TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin')
WITH CHECK (auth.uid()::uuid = id OR role = 'admin');

-- CREATE ADMIN USER RECORD
-- Replace 'USER_ID_FROM_AUTH' with actual auth.user.id from your session
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  staff_permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH',  -- Get this from auth system after login
  'vietnguyenduccp@gmail.com',
  'Viet Nguyen Duc',
  'admin',
  '{"import_customers": true, "import_transactions": true, "view_reports": true, "manage_settings": true}',
  true,
  NOW(),
  NOW()
);

-- VERIFY RLS POLICIES WORKING
-- After applying fixes, run these tests:

-- Test 1: Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Test 2: Test user access (run as authenticated user)
SELECT COUNT(*) as accessible_users 
FROM users 
WHERE id = auth.uid()::uuid OR role = 'admin';

-- Test 3: Test admin access
SELECT COUNT(*) as total_users 
FROM users;

-- Test 4: Verify user record exists
SELECT * FROM users WHERE email = 'vietnguyenduccp@gmail.com';
