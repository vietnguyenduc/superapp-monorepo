-- Minimal RLS Policy Fix
-- Date: 2026-03-23
-- Version: Minimal (only essential columns)

-- CREATE CORRECTED RLS POLICIES
CREATE POLICY users_select_policy ON users
FOR SELECT TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin');

CREATE POLICY users_insert_policy ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid()::uuid = id);

CREATE POLICY users_update_policy ON users
FOR UPDATE TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin')
WITH CHECK (auth.uid()::uuid = id OR role = 'admin');

CREATE POLICY users_delete_policy ON users
FOR DELETE TO authenticated
USING (auth.uid()::uuid = id OR role = 'admin');

-- CREATE ADMIN USER RECORD (MINIMAL VERSION)
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'USER_ID_FROM_AUTH',
  'vietnguyenduccp@gmail.com',
  'Viet Nguyen Duc',
  'admin',
  NOW(),
  NOW()
);