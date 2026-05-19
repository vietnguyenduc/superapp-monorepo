-- Migration: 012_inventory_multi_tenancy.sql
-- Description: Add company_id and branch_id to inventory tables for multi-tenancy support
-- Date: 2026-05-01

    -- Step 1: Add company_id and branch_id to products table
    ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 2: Add company_id and branch_id to inventory_records table
ALTER TABLE public.inventory_records
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 3: Add company_id and branch_id to sales_records table
ALTER TABLE public.sales_records
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 4: Add company_id and branch_id to special_outbound_records table
ALTER TABLE public.special_outbound_records
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 5: Add company_id and branch_id to inventory_reports table
ALTER TABLE public.inventory_reports
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 6: Add company_id and branch_id to stock_check_prints table
ALTER TABLE public.stock_check_prints
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- Step 7: Create indexes for company_id and branch_id
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_branch_id ON public.products(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_company_id ON public.inventory_records(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_records_branch_id ON public.inventory_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_company_id ON public.sales_records(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_branch_id ON public.sales_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_special_outbound_company_id ON public.special_outbound_records(company_id);
CREATE INDEX IF NOT EXISTS idx_special_outbound_branch_id ON public.special_outbound_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_company_id ON public.inventory_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reports_branch_id ON public.inventory_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_check_prints_company_id ON public.stock_check_prints(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_check_prints_branch_id ON public.stock_check_prints(branch_id);

-- Step 8: Update uniqueness constraints to be composite with company_id

-- Drop old unique constraint for products.business_code
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_business_code_key;

-- Add new composite unique constraint for products
ALTER TABLE public.products
ADD CONSTRAINT products_business_code_company_key UNIQUE (company_id, business_code);

-- Drop old unique constraint for inventory_records (date, product_id)
ALTER TABLE public.inventory_records DROP CONSTRAINT IF EXISTS inventory_records_date_product_id_key;

-- Add new composite unique constraint for inventory_records
ALTER TABLE public.inventory_records
ADD CONSTRAINT inventory_records_date_product_company_key UNIQUE (company_id, branch_id, date, product_id);

-- Drop old unique constraint for sales_records (date, product_id)
ALTER TABLE public.sales_records DROP CONSTRAINT IF EXISTS sales_records_date_product_id_key;

-- Add new composite unique constraint for sales_records
ALTER TABLE public.sales_records
ADD CONSTRAINT sales_records_date_product_company_key UNIQUE (company_id, branch_id, date, product_id);

-- Drop old unique constraint for inventory_reports (date, product_id)
ALTER TABLE public.inventory_reports DROP CONSTRAINT IF EXISTS inventory_reports_date_product_id_key;

-- Add new composite unique constraint for inventory_reports
ALTER TABLE public.inventory_reports
ADD CONSTRAINT inventory_reports_date_product_company_key UNIQUE (company_id, branch_id, date, product_id);

-- Step 9: Enable RLS on inventory tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_outbound_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_check_prints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;
