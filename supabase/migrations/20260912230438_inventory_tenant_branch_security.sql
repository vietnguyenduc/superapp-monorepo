-- Close the cross-tenant hole in the legacy Inventory policies.
-- The old admin_company branch compared the user's company_id to itself,
-- rather than to the protected row's company_id.

DO $migration$
DECLARE
  table_name text;
  policy_name text;
  branch_scope text;
  policy_count integer;
  protected_tables text[] := ARRAY[
    'products',
    'inventory_records',
    'sales_records',
    'special_outbound_records',
    'inventory_reports',
    'stock_check_prints'
  ];
BEGIN
  FOREACH table_name IN ARRAY protected_tables LOOP
    -- Remove every legacy Inventory-access policy. PostgreSQL policies are
    -- permissive by default, so leaving even one faulty policy would preserve
    -- the cross-company path.
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname LIKE 'Users with inventory access%'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
    END LOOP;

    branch_scope := CASE
      WHEN table_name = 'products' THEN
        format('(public.%1$I.branch_id IS NULL OR (current_user_row.branch_id IS NOT NULL AND public.%1$I.branch_id = current_user_row.branch_id))', table_name)
      ELSE
        format('(current_user_row.branch_id IS NOT NULL AND public.%1$I.branch_id = current_user_row.branch_id)', table_name)
    END;

    EXECUTE format($policy$
      CREATE POLICY inventory_tenant_branch_access
      ON public.%1$I
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.users AS current_user_row
          WHERE current_user_row.id = (SELECT auth.uid())
            AND (
              current_user_row.role::text = 'admin_master'
              OR (
                public.has_app_access((SELECT auth.uid()), 'inventory') = true
                AND public.%1$I.company_id = current_user_row.company_id
                AND (
                  current_user_row.role::text = 'admin_company'
                  OR %2$s
                )
              )
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users AS current_user_row
          WHERE current_user_row.id = (SELECT auth.uid())
            AND (
              current_user_row.role::text = 'admin_master'
              OR (
                public.has_app_access((SELECT auth.uid()), 'inventory') = true
                AND public.%1$I.company_id = current_user_row.company_id
                AND (
                  current_user_row.role::text = 'admin_company'
                  OR %2$s
                )
              )
            )
        )
      )
    $policy$, table_name, branch_scope);

    -- Fail closed if production drift left any other permissive policy behind.
    -- Because migrations are transactional, this aborts and restores the old
    -- policies instead of deploying a partially audited policy set.
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = table_name;

    IF policy_count <> 1 THEN
      RAISE EXCEPTION 'Unexpected RLS policy set on public.%: expected 1 policy after cleanup, found %', table_name, policy_count;
    END IF;
  END LOOP;
END
$migration$;

COMMENT ON POLICY inventory_tenant_branch_access ON public.inventory_records IS
  'Inventory users are restricted to their company; admin_company sees its company, branch users see only their branch, admin_master sees all.';
