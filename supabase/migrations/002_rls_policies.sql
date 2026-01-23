-- Migration: 002_rls_policies.sql
-- Description: Row Level Security policies for debt repayment application
-- Date: 2024-01-01

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Branches policies
CREATE POLICY "Users can view their branch" ON public.branches
    FOR SELECT USING (
        id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all branches" ON public.branches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Bank accounts policies
CREATE POLICY "Users can view their branch bank accounts" ON public.bank_accounts
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can manage their branch bank accounts" ON public.bank_accounts
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers policies
CREATE POLICY "Users can view their branch customers" ON public.customers
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can manage their branch customers" ON public.customers
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions policies
CREATE POLICY "Users can view their branch transactions" ON public.transactions
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create transactions for their branch" ON public.transactions
    FOR INSERT WITH CHECK (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their branch transactions" ON public.transactions
    FOR UPDATE USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete their branch transactions" ON public.transactions
    FOR DELETE USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    ); 