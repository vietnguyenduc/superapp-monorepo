-- Diagnostic script to check why customer/transaction imports might be failing
-- Run this in Supabase SQL Editor to check current state

-- 1. Check if RLS is enabled on key tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('customers', 'transactions', 'users', 'branches', 'transaction_types')
  AND schemaname = 'public';

-- 2. Check existing RLS policies on customers table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'customers';

-- 3. Check existing RLS policies on transactions table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'transactions';

-- 4. Check if the current authenticated user exists in users table
-- Run this while authenticated in the app or use your actual user ID
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  branch_id
FROM users 
WHERE email = 'vietnguyenduccp@gmail.com';

-- 5. Check if branches table has data
SELECT 
  id, 
  name, 
  code 
FROM branches 
LIMIT 5;

-- 6. Check if there are any customers already
SELECT 
  id, 
  customer_code, 
  full_name, 
  branch_id, 
  company_id,
  created_at 
FROM customers 
LIMIT 5;

-- 7. Check if transaction_types exist
SELECT 
  id, 
  name, 
  color,
  math_factor,
  impact_type
FROM transaction_types;

-- 8. Test insert permission (run as authenticated user)
-- This will fail if RLS policies block inserts
DO $$
DECLARE
  test_branch_id UUID;
  test_customer_id UUID;
BEGIN
  -- Get a valid branch_id if exists
  SELECT id INTO test_branch_id FROM branches LIMIT 1;
  
  -- Generate a proper UUID for test
  test_customer_id := gen_random_uuid();
  
  -- Try insert
  INSERT INTO customers (
    id,
    customer_code,
    full_name,
    branch_id,
    created_at,
    updated_at
  ) VALUES (
    test_customer_id,
    'TEST001',
    'Permission Test User',
    test_branch_id,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Insert test succeeded with customer_id: %', test_customer_id;
  
  -- Clean up
  DELETE FROM customers WHERE id = test_customer_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Insert test failed: %', SQLERRM;
END $$;
