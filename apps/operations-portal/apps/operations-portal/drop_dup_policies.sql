-- Drop duplicate policies that cause SQLSTATE 42710 errors
-- Generated for project peslmsctejmvkwzyohke

DO $$
DECLARE
    policy_record RECORD;
    policy_count INTEGER;
BEGIN
    FOR policy_record IN
        SELECT
            schemaname,
            tablename,
            policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename);
    END LOOP;
END $$;
