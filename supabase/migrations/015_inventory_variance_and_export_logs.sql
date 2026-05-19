-- Migration: 015_inventory_variance_and_export_logs.sql
-- Description: Add DB-backed variance reports and export logs for inventory operation
-- Date: 2026-05-05

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.inventory_variance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

    beginning_inventory DECIMAL(14,3) DEFAULT 0,
    inbound_quantity DECIMAL(14,3) DEFAULT 0,
    sales_quantity DECIMAL(14,3) DEFAULT 0,
    promotion_quantity DECIMAL(14,3) DEFAULT 0,
    special_outbound_quantity DECIMAL(14,3) DEFAULT 0,
    book_inventory DECIMAL(14,3) DEFAULT 0,
    actual_inventory DECIMAL(14,3) DEFAULT 0,
    variance DECIMAL(14,3) DEFAULT 0,
    variance_percentage DECIMAL(10,4) DEFAULT 0,

    unit VARCHAR(50) NOT NULL,
    notes TEXT,

    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT inventory_variance_reports_date_product_company_key UNIQUE (company_id, branch_id, date, product_id)
);

CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_type VARCHAR(100) NOT NULL,
    format VARCHAR(50) NOT NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    notes TEXT,

    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_company_id ON public.inventory_variance_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_branch_id ON public.inventory_variance_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_date ON public.inventory_variance_reports(date);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_product_id ON public.inventory_variance_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_variance ON public.inventory_variance_reports(variance);
CREATE INDEX IF NOT EXISTS idx_inventory_variance_reports_date_product ON public.inventory_variance_reports(date, product_id);

CREATE INDEX IF NOT EXISTS idx_export_logs_company_id ON public.export_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_branch_id ON public.export_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_by ON public.export_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON public.export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_export_type ON public.export_logs(export_type);

ALTER TABLE public.inventory_variance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users with inventory access can view their branch variance reports" ON public.inventory_variance_reports;
CREATE POLICY "Users with inventory access can view their branch variance reports" ON public.inventory_variance_reports
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

DROP POLICY IF EXISTS "Users with inventory access can create variance reports for their branch" ON public.inventory_variance_reports;
CREATE POLICY "Users with inventory access can create variance reports for their branch" ON public.inventory_variance_reports
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

DROP POLICY IF EXISTS "Users with inventory access can update their branch variance reports" ON public.inventory_variance_reports;
CREATE POLICY "Users with inventory access can update their branch variance reports" ON public.inventory_variance_reports
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
    )
    WITH CHECK (
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

DROP POLICY IF EXISTS "Users with inventory access can delete their branch variance reports" ON public.inventory_variance_reports;
CREATE POLICY "Users with inventory access can delete their branch variance reports" ON public.inventory_variance_reports
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

DROP POLICY IF EXISTS "Users with inventory access can view export logs" ON public.export_logs;
CREATE POLICY "Users with inventory access can view export logs" ON public.export_logs
    FOR SELECT USING (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            created_by = auth.uid()
            OR branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
            OR EXISTS (
                SELECT 1 FROM public.users
                WHERE id = auth.uid() AND role = 'admin_company'
                AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Users with inventory access can create export logs" ON public.export_logs;
CREATE POLICY "Users with inventory access can create export logs" ON public.export_logs
    FOR INSERT WITH CHECK (
        has_app_access(auth.uid(), 'inventory') = true
        AND (
            created_by = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
        )
    );

DROP TRIGGER IF EXISTS update_inventory_variance_reports_updated_at ON public.inventory_variance_reports;
CREATE TRIGGER update_inventory_variance_reports_updated_at
    BEFORE UPDATE ON public.inventory_variance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
