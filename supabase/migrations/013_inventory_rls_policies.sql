-- Migration: 013_inventory_rls_policies.sql
-- Description: Create RLS policies for inventory tables with app-level permission checks
-- Date: 2026-05-01
-- CRITICAL: Avoid USING true to prevent infinite recursion (lesson from cashflow)

-- Step 1: Products table RLS policies
CREATE POLICY "Users with inventory access can view their branch products" ON public.products
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create products for their branch" ON public.products
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can update their branch products" ON public.products
    FOR UPDATE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can delete their branch products" ON public.products
    FOR DELETE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 2: Inventory records table RLS policies
CREATE POLICY "Users with inventory access can view their branch inventory records" ON public.inventory_records
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create inventory records for their branch" ON public.inventory_records
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can update their branch inventory records" ON public.inventory_records
    FOR UPDATE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can delete their branch inventory records" ON public.inventory_records
    FOR DELETE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 3: Sales records table RLS policies
CREATE POLICY "Users with inventory access can view their branch sales records" ON public.sales_records
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create sales records for their branch" ON public.sales_records
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can update their branch sales records" ON public.sales_records
    FOR UPDATE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can delete their branch sales records" ON public.sales_records
    FOR DELETE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 4: Special outbound records table RLS policies
CREATE POLICY "Users with inventory access can view their branch special outbound records" ON public.special_outbound_records
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create special outbound records for their branch" ON public.special_outbound_records
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can update their branch special outbound records" ON public.special_outbound_records
    FOR UPDATE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can delete their branch special outbound records" ON public.special_outbound_records
    FOR DELETE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 5: Inventory reports table RLS policies
CREATE POLICY "Users with inventory access can view their branch inventory reports" ON public.inventory_reports
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create inventory reports for their branch" ON public.inventory_reports
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can update their branch inventory reports" ON public.inventory_reports
    FOR UPDATE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can delete their branch inventory reports" ON public.inventory_reports
    FOR DELETE USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 6: Stock check prints table RLS policies
CREATE POLICY "Users with inventory access can view their branch stock check prints" ON public.stock_check_prints
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create stock check prints for their branch" ON public.stock_check_prints
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

-- Step 7: Product conversions table RLS policies (read-only for users)
CREATE POLICY "Users with inventory access can view product conversions" ON public.product_conversions
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
    );

-- Step 8: Stock check items table RLS policies (inherits from stock_check_prints)
CREATE POLICY "Users with inventory access can view stock check items" ON public.stock_check_items
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND EXISTS (
            SELECT 1 FROM public.stock_check_prints scp
            WHERE scp.id = stock_check_items.stock_check_id
            AND (
                scp.branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
                OR EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'admin_company'
                    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
                )
            )
        )
    );

CREATE POLICY "Users with inventory access can create stock check items" ON public.stock_check_items
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND EXISTS (
            SELECT 1 FROM public.stock_check_prints scp
            WHERE scp.id = stock_check_items.stock_check_id
            AND (
                scp.branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
                OR EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND role = 'admin_company'
                    AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
                )
            )
        )
    );

-- Step 9: Approval logs table RLS policies
CREATE POLICY "Users with inventory access can view approval logs" ON public.approval_logs
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

CREATE POLICY "Users with inventory access can create approval logs" ON public.approval_logs
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND user_id = auth.uid()
    );
