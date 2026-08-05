-- Migration: 006a_create_user_companies_view.sql
-- Description: Provide a user<->company join relation for RLS policies.
--              The repo migrations (007, 008, 018) reference public.user_companies,
--              but the table/view was never created. This view derives it from
--              public.users.company_id so `npx supabase start` can apply the policy
--              chain and local RLS testing works against the real schema.
-- Date: 2026-08-06

CREATE OR REPLACE VIEW public.user_companies AS
SELECT
  id AS user_id,
  company_id
FROM public.users
WHERE company_id IS NOT NULL;

COMMENT ON VIEW public.user_companies IS 'Synthetic user-company mapping derived from users.company_id; used by inventory/export RLS policies.';
