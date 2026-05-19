-- ============================================================
-- PHASE 1 VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to confirm everything is ready
-- ============================================================

-- 1. CHECK: Core inventory tables exist
SELECT 'TABLES EXIST' AS check_name,
       COUNT(*) AS table_count,
       CASE WHEN COUNT(*) = 11 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('products', 'inventory_records', 'sales_records',
                     'special_outbound_records', 'inventory_reports',
                     'stock_check_prints', 'stock_check_items',
                     'product_conversions', 'approval_logs',
                     'inventory_variance_reports', 'export_logs');

-- 2. CHECK: app_permissions column on users
SELECT 'app_permissions COLUMN' AS check_name,
       column_name,
       data_type,
       'PASS' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'app_permissions';

-- 3. CHECK: has_app_access function exists
SELECT 'has_app_access FUNCTION' AS check_name,
       proname AS function_name,
       'PASS' AS status
FROM pg_proc
WHERE proname = 'has_app_access';

-- 4. CHECK: company_id and branch_id columns on inventory tables
SELECT 'MULTI-TENANCY COLUMNS' AS check_name,
       table_name,
       string_agg(column_name, ', ') AS columns_found,
       'PASS' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('products', 'inventory_records', 'sales_records',
                     'special_outbound_records', 'inventory_reports', 'stock_check_prints',
                     'inventory_variance_reports', 'export_logs')
  AND column_name IN ('company_id', 'branch_id')
GROUP BY table_name;

-- 5. CHECK: RLS enabled on inventory tables
SELECT 'RLS ENABLED' AS check_name,
       relname AS table_name,
       relrowsecurity AS rls_enabled,
       CASE WHEN relrowsecurity THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_class
WHERE relname IN ('products', 'inventory_records', 'sales_records',
                  'special_outbound_records', 'inventory_reports',
                  'stock_check_prints', 'stock_check_items',
                  'product_conversions', 'approval_logs',
                  'inventory_variance_reports', 'export_logs')
  AND relkind = 'r';

-- 6. CHECK: RLS policies exist (count per table)
SELECT 'RLS POLICIES' AS check_name,
       tablename AS table_name,
       COUNT(*) AS policy_count,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'inventory_records', 'sales_records',
                    'special_outbound_records', 'inventory_reports',
                    'stock_check_prints', 'stock_check_items',
                    'product_conversions', 'approval_logs',
                    'inventory_variance_reports', 'export_logs')
GROUP BY tablename;

-- 7. CHECK: Sample data in products
SELECT 'SAMPLE DATA (products)' AS check_name,
       COUNT(*) AS row_count,
       CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.products;

-- 8. CHECK: Sample data in inventory_records
SELECT 'SAMPLE DATA (inventory_records)' AS check_name,
       COUNT(*) AS row_count,
       CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.inventory_records;

-- 9. CHECK: company_id and branch_id populated on sample data
SELECT 'SAMPLE DATA (company_id assigned)' AS check_name,
       COUNT(*) AS rows_with_company_id,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.products
WHERE company_id IS NOT NULL;

-- 9b. DIAGNOSTIC: Check if companies/branches exist (needed for seed data)
SELECT 'DIAGNOSTIC: companies count' AS check_name, COUNT(*) AS count FROM public.companies
UNION ALL
SELECT 'DIAGNOSTIC: branches count', COUNT(*) FROM public.branches
UNION ALL
SELECT 'DIAGNOSTIC: products with NULL company_id', COUNT(*) FROM public.products WHERE company_id IS NULL;

-- 10. CHECK: Indexes for performance
SELECT 'INDEXES' AS check_name,
       tablename AS table_name,
       indexname AS index_name
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('products', 'inventory_records', 'sales_records',
                    'inventory_reports', 'stock_check_prints',
                    'special_outbound_records',
                    'inventory_variance_reports', 'export_logs')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 11. CHECK: Enum types created
SELECT 'ENUM TYPES' AS check_name,
       typname AS type_name,
       'PASS' AS status
FROM pg_type
WHERE typname IN ('product_category', 'product_status', 'business_status',
                  'approval_status', 'user_role')
  AND typtype = 'e';

-- 12. CHECK: Trigger for updated_at exists
SELECT 'UPDATED_AT TRIGGERS' AS check_name,
       tgname AS trigger_name,
       relname AS table_name,
       'PASS' AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname LIKE 'update_%_updated_at'
  AND c.relname LIKE '%products%';
