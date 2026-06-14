-- Drop the broken policy
DROP POLICY IF EXISTS "users_select_admin_company" ON public.users;

-- Recreate with correct table alias to avoid self-reference
CREATE POLICY "users_select_admin_company" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users AS admin_user
            WHERE admin_user.id = auth.uid()::uuid
            AND admin_user.role = 'admin_company'
            AND admin_user.company_id = public.users.company_id
        )
    );