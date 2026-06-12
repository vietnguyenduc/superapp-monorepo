-- Migration: 032_hr_payroll_schema.sql
-- Description: Create tables for HR and Payroll module

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID, -- References employees(id), will add foreign key later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employees Table (Links to users)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, on_leave
    join_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- Add manager_id constraint to departments
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Shifts (Ca lÃ m viá»‡c)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'fixed', -- fixed, flexible, night
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_mins INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Employee Shifts (Xáº¿p ca)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, effective_date)
);

-- 5. Attendance Logs (Cháº¥m cÃ´ng Ä‘a nguá»“n)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'gps', -- gps, manual, import
    type VARCHAR(20) NOT NULL, -- in, out
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    location_lat NUMERIC(10, 8),
    location_lng NUMERIC(11, 8),
    image_url TEXT,
    status VARCHAR(50), -- on_time, late, early_leave
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Leave Requests (ÄÆ¡n tá»«)
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- annual_leave, sick_leave, unpaid, ot
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payrolls (Ká»³ lÆ°Æ¡ng)
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, processed, paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, month, year)
);

-- 8. Payroll Items (Chi tiáº¿t lÆ°Æ¡ng nhÃ¢n viÃªn)
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    standard_days NUMERIC(5, 2) DEFAULT 0,
    actual_days NUMERIC(5, 2) DEFAULT 0,
    ot_hours NUMERIC(5, 2) DEFAULT 0,
    base_salary NUMERIC(15, 2) DEFAULT 0,
    allowances NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payroll_id, employee_id)
);

-- 9. Row Level Security (RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id (assumes it's in jwt or custom auth function, usually via auth.jwt()->>'company_id' in Supabase, but depends on your setup. Given the other apps use company_id, let's use the standard approach or allow users from the same company).
-- For simplicity, standard multi-tenant RLS:
-- We assume the user has a company_id in their auth claims or users table.
-- The existing RLS in superapp usually joins with users table or uses current_setting.
-- Creating generic RLS policies based on existing patterns:

CREATE POLICY "Users can view departments in their company"
    ON departments FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage departments in their company"
    ON departments FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view employees in their company"
    ON employees FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage employees in their company"
    ON employees FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view shifts in their company"
    ON shifts FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage shifts in their company"
    ON shifts FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view employee_shifts"
    ON employee_shifts FOR SELECT
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage employee_shifts"
    ON employee_shifts FOR ALL
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view attendance_logs in their company"
    ON attendance_logs FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage attendance_logs in their company"
    ON attendance_logs FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view leave_requests in their company"
    ON leave_requests FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage leave_requests in their company"
    ON leave_requests FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view payrolls in their company"
    ON payrolls FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage payrolls in their company"
    ON payrolls FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view payroll_items"
    ON payroll_items FOR SELECT
    USING (payroll_id IN (SELECT id FROM payrolls WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage payroll_items"
    ON payroll_items FOR ALL
    USING (payroll_id IN (SELECT id FROM payrolls WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

-- Migration: Inventory Procurement & MRP Schema
-- Description: Creates tables for Suppliers, Purchase Orders, Goods Receipts, Returns and Settings

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address TEXT,
    credit_limit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_limit_days INTEGER DEFAULT 0,
    payment_terms TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 2. Supplier Products (Pricing & Lead time)
CREATE TABLE IF NOT EXISTS public.supplier_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    unit_price DECIMAL(15, 2) NOT NULL,
    lead_time_days INTEGER DEFAULT 1,
    min_order_quantity INTEGER DEFAULT 1,
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- 3. Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial_received', 'received', 'cancelled')),
    expected_date DATE,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, po_number)
);

-- 4. PO Items
CREATE TABLE IF NOT EXISTS public.po_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Goods Receipts (Nháº­p kho tá»« NCC)
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    gr_number VARCHAR(100) NOT NULL,
    receipt_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    total_amount DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, gr_number)
);

-- 6. Goods Receipt Items (Chi tiáº¿t nháº­n hÃ ng & Kiá»ƒm soÃ¡t lá»—i)
CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gr_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    po_item_id UUID REFERENCES public.po_items(id) ON DELETE SET NULL,
    expected_qty INTEGER DEFAULT 0,
    received_qty INTEGER NOT NULL DEFAULT 0,
    defective_qty INTEGER DEFAULT 0,
    wrong_branch_qty INTEGER DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) GENERATED ALWAYS AS (received_qty * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Supplier Returns
CREATE TABLE IF NOT EXISTS public.supplier_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    gr_id UUID REFERENCES public.goods_receipts(id) ON DELETE SET NULL,
    return_number VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'return' CHECK (type IN ('return', 'exchange')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    reason TEXT,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, return_number)
);

-- 8. Inventory Settings (CÃ i Ä‘áº·t há»‡ thá»‘ng - TÃ­nh giÃ¡ vá»‘n)
CREATE TABLE IF NOT EXISTS public.inventory_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    costing_method VARCHAR(20) DEFAULT 'MAC' CHECK (costing_method IN ('FIFO', 'LIFO', 'MAC')),
    default_target_doh INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) setup
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies based on company_id
-- We assume the user has their company_id in their JWT claims or user metadata, similar to other apps
CREATE POLICY "Users can view their company suppliers" ON public.suppliers FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert their company suppliers" ON public.suppliers FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update their company suppliers" ON public.suppliers FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view their company purchase_orders" ON public.purchase_orders FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert their company purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update their company purchase_orders" ON public.purchase_orders FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view their company goods_receipts" ON public.goods_receipts FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert their company goods_receipts" ON public.goods_receipts FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update their company goods_receipts" ON public.goods_receipts FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view their company supplier_returns" ON public.supplier_returns FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert their company supplier_returns" ON public.supplier_returns FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update their company supplier_returns" ON public.supplier_returns FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Users can view their company inventory_settings" ON public.inventory_settings FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can insert their company inventory_settings" ON public.inventory_settings FOR INSERT WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);
CREATE POLICY "Users can update their company inventory_settings" ON public.inventory_settings FOR UPDATE USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- For child tables without company_id directly, we can join with parent, or just allow all (since they are accessed through parent via app logic usually, but better to secure)
-- For simplicity, since the parent is secured and user only accesses via parent ID, we can do:
CREATE POLICY "Users can view po_items" ON public.po_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.purchase_orders WHERE id = po_id AND company_id = (auth.jwt() ->> 'company_id')::uuid));
CREATE POLICY "Users can view goods_receipt_items" ON public.goods_receipt_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.goods_receipts WHERE id = gr_id AND company_id = (auth.jwt() ->> 'company_id')::uuid));
CREATE POLICY "Users can view supplier_products" ON public.supplier_products FOR SELECT USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_suppliers BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_purchase_orders BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_goods_receipts BEFORE UPDATE ON public.goods_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_supplier_returns BEFORE UPDATE ON public.supplier_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at_inventory_settings BEFORE UPDATE ON public.inventory_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: 034_cashflow_procurement_integration.sql
-- Description: Integrates Procurement (Suppliers, Goods Receipts) with Cashflow

-- 1. Sync Suppliers to Customers table (so Cashflow can use them)
CREATE OR REPLACE FUNCTION public.sync_supplier_to_customer()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.customers (id, customer_code, full_name, phone, email, address, is_active, partner_type)
        VALUES (NEW.id, NEW.code, NEW.name, NEW.contact_phone, NEW.contact_email, NEW.address, (NEW.status = 'active'), 'supplier')
        ON CONFLICT (id) DO NOTHING;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.customers
        SET full_name = NEW.name,
            phone = NEW.contact_phone,
            email = NEW.contact_email,
            address = NEW.address,
            is_active = (NEW.status = 'active')
        WHERE id = NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.customers WHERE id = OLD.id AND partner_type = 'supplier';
    END IF;
    RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_supplier_to_customer ON public.suppliers;
CREATE TRIGGER trg_sync_supplier_to_customer
AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.sync_supplier_to_customer();

-- Sync existing suppliers
INSERT INTO public.customers (id, customer_code, full_name, phone, email, address, is_active, partner_type)
SELECT id, code, name, contact_phone, contact_email, address, (status = 'active'), 'supplier'
FROM public.suppliers
ON CONFLICT (id) DO NOTHING;

-- 2. Trigger for Goods Receipt -> Cashflow Transaction
CREATE OR REPLACE FUNCTION public.handle_goods_receipt_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_code text;
BEGIN
  -- Only trigger if the Goods Receipt changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if total amount is > 0 to avoid empty transactions
    IF NEW.total_amount > 0 THEN
        -- Generate a unique transaction code
        v_transaction_code := 'GR-' || substring(NEW.id::text from 1 for 8);

        INSERT INTO public.transactions (
          transaction_code,
          transaction_date,
          transaction_type,
          amount,
          customer_id,
          description,
          status,
          company_id,
          created_by
        ) VALUES (
          v_transaction_code,
          NEW.receipt_date,
          'charge', -- Recording debt/payable to supplier
          NEW.total_amount,
          NEW.supplier_id, -- Maps to customer_id in transactions table (which acts as partner_id)
          'CÃ´ng ná»£ nháº­p kho tá»« NCC: ' || NEW.gr_number,
          'completed', -- Debt is confirmed immediately upon GR completion
          NEW.company_id,
          NEW.received_by
        );
    END IF;
  END IF;
  
  -- Handle cancellation: Reverse transaction if GR is cancelled after completion
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
     -- Look for the transaction we created and cancel it
     UPDATE public.transactions 
     SET status = 'cancelled'
     WHERE transaction_code = 'GR-' || substring(NEW.id::text from 1 for 8);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_goods_receipt_transaction ON public.goods_receipts;
CREATE TRIGGER trg_goods_receipt_transaction
AFTER UPDATE ON public.goods_receipts
FOR EACH ROW
EXECUTE FUNCTION public.handle_goods_receipt_transaction();

-- Migration: 035_hr_performance_3p_schema.sql
-- Description: Create tables for HR Performance (BSC, OKR) and 3P Salary

-- 1. HR Settings (For configuring BSC vs OKR and other preferences)
CREATE TABLE IF NOT EXISTS hr_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    performance_framework VARCHAR(20) DEFAULT 'okr', -- 'okr', 'bsc'
    p3_profit_percentage NUMERIC(5, 2) DEFAULT 0, -- % of total company profit to distribute as P3
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id)
);

-- 2. Positions (P1 Salary Setup)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    base_salary_min NUMERIC(15, 2) DEFAULT 0,
    base_salary_max NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add position_id and p2_allowance to employees table
ALTER TABLE employees 
    ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS p2_allowance NUMERIC(15, 2) DEFAULT 0;

-- 3. KPI Cycles (monthly, quarterly, annual)
CREATE TABLE IF NOT EXISTS kpi_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cycle_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Objectives (For BSC Perspectives or OKR Objectives)
CREATE TABLE IF NOT EXISTS objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES kpi_cycles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    bsc_perspective VARCHAR(50), -- 'financial', 'customer', 'internal', 'learning' (only used if framework is BSC)
    owner_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Can be department or individual
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    weight NUMERIC(5, 2) DEFAULT 100, -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Key Results / Metrics
CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_value NUMERIC(15, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT '%',
    weight NUMERIC(5, 2) DEFAULT 100, -- relative to objective
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Employee KPIs (Assigned KPIs and progress tracking)
CREATE TABLE IF NOT EXISTS employee_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    actual_value NUMERIC(15, 2) DEFAULT 0,
    completion_percentage NUMERIC(5, 2) DEFAULT 0, -- To be updated by application logic or trigger
    manager_score NUMERIC(5, 2), -- Optional override by manager
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, key_result_id)
);

-- 7. Update payroll_items for 3P
ALTER TABLE payroll_items 
    ADD COLUMN IF NOT EXISTS p1_salary NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS p2_allowance NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS p3_bonus NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS kpi_score_percentage NUMERIC(5, 2) DEFAULT 0;

-- 8. Row Level Security
ALTER TABLE hr_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;

-- Generic multi-tenant RLS policies
CREATE POLICY "Users can view hr_settings in their company"
    ON hr_settings FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage hr_settings in their company"
    ON hr_settings FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view positions in their company"
    ON positions FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage positions in their company"
    ON positions FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view kpi_cycles in their company"
    ON kpi_cycles FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage kpi_cycles in their company"
    ON kpi_cycles FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view objectives in their company"
    ON objectives FOR SELECT
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can manage objectives in their company"
    ON objectives FOR ALL
    USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- For key_results, join with objectives for company_id
CREATE POLICY "Users can view key_results"
    ON key_results FOR SELECT
    USING (objective_id IN (SELECT id FROM objectives WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage key_results"
    ON key_results FOR ALL
    USING (objective_id IN (SELECT id FROM objectives WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));

-- For employee_kpis, join with employees for company_id
CREATE POLICY "Users can view employee_kpis"
    ON employee_kpis FOR SELECT
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));
CREATE POLICY "Users can manage employee_kpis"
    ON employee_kpis FOR ALL
    USING (employee_id IN (SELECT id FROM employees WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())));


-- Migration: 036_hr_payroll_rpc.sql
-- Description: Create RPC to generate monthly payroll items with 3P calculation

CREATE OR REPLACE FUNCTION generate_monthly_payrolls(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER,
    p_system_profit NUMERIC -- Parameter for system-wide profit/revenue to calculate P3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payroll_id UUID;
    v_p3_percentage NUMERIC;
    v_total_p3_pool NUMERIC;
    v_total_kpi_score NUMERIC := 0;
    v_emp_record RECORD;
    v_result JSONB;
BEGIN
    -- 1. Check if payroll already exists
    SELECT id INTO v_payroll_id FROM payrolls 
    WHERE company_id = p_company_id AND month = p_month AND year = p_year;

    IF v_payroll_id IS NULL THEN
        -- Create new payroll
        INSERT INTO payrolls (company_id, month, year, status)
        VALUES (p_company_id, p_month, p_year, 'draft')
        RETURNING id INTO v_payroll_id;
    END IF;

    -- 2. Get P3 Profit Percentage from hr_settings
    SELECT p3_profit_percentage INTO v_p3_percentage FROM hr_settings WHERE company_id = p_company_id;
    IF v_p3_percentage IS NULL THEN
        v_p3_percentage := 0;
    END IF;

    -- Total P3 Pool to distribute among employees
    v_total_p3_pool := p_system_profit * (v_p3_percentage / 100.0);

    -- 3. Calculate Total KPI Score for the company (to distribute pool proportionally)
    -- We assume cycle matches month and year loosely, or we just average all key results for the employee
    -- For simplicity, we calculate the average completion_percentage for each employee in the active cycle
    FOR v_emp_record IN 
        SELECT e.id as emp_id,
               COALESCE((SELECT AVG(ek.completion_percentage) 
                         FROM employee_kpis ek 
                         JOIN key_results kr ON ek.key_result_id = kr.id
                         JOIN objectives o ON kr.objective_id = o.id
                         JOIN kpi_cycles kc ON o.cycle_id = kc.id
                         WHERE ek.employee_id = e.id 
                           AND kc.status = 'active'), 0) as avg_kpi
        FROM employees e
        WHERE e.company_id = p_company_id AND e.status = 'active'
    LOOP
        v_total_kpi_score := v_total_kpi_score + v_emp_record.avg_kpi;
    END LOOP;

    -- 4. Generate Payroll Items
    FOR v_emp_record IN 
        SELECT e.id as emp_id, 
               p.base_salary_min as p1_salary, 
               COALESCE(e.p2_allowance, 0) as p2_allowance,
               COALESCE((SELECT AVG(ek.completion_percentage) 
                         FROM employee_kpis ek 
                         JOIN key_results kr ON ek.key_result_id = kr.id
                         JOIN objectives o ON kr.objective_id = o.id
                         JOIN kpi_cycles kc ON o.cycle_id = kc.id
                         WHERE ek.employee_id = e.id 
                           AND kc.status = 'active'), 0) as avg_kpi
        FROM employees e
        LEFT JOIN positions p ON e.position_id = p.id
        WHERE e.company_id = p_company_id AND e.status = 'active'
    LOOP
        DECLARE
            v_p3_bonus NUMERIC := 0;
            v_net_salary NUMERIC := 0;
        BEGIN
            -- Calculate P3 for this employee
            IF v_total_kpi_score > 0 THEN
                v_p3_bonus := (v_emp_record.avg_kpi / v_total_kpi_score) * v_total_p3_pool;
            END IF;

            v_net_salary := COALESCE(v_emp_record.p1_salary, 0) + v_emp_record.p2_allowance + v_p3_bonus;

            -- Upsert payroll item
            INSERT INTO payroll_items (
                payroll_id, 
                employee_id, 
                p1_salary, 
                p2_allowance, 
                p3_bonus, 
                kpi_score_percentage, 
                net_salary,
                base_salary
            ) VALUES (
                v_payroll_id, 
                v_emp_record.emp_id, 
                COALESCE(v_emp_record.p1_salary, 0), 
                v_emp_record.p2_allowance, 
                v_p3_bonus, 
                v_emp_record.avg_kpi,
                v_net_salary,
                COALESCE(v_emp_record.p1_salary, 0)
            )
            ON CONFLICT (payroll_id, employee_id) 
            DO UPDATE SET 
                p1_salary = EXCLUDED.p1_salary,
                p2_allowance = EXCLUDED.p2_allowance,
                p3_bonus = EXCLUDED.p3_bonus,
                kpi_score_percentage = EXCLUDED.kpi_score_percentage,
                net_salary = EXCLUDED.net_salary,
                base_salary = EXCLUDED.base_salary;
        END;
    END LOOP;

    v_result := jsonb_build_object(
        'success', true,
        'payroll_id', v_payroll_id,
        'message', 'Payroll generated successfully'
    );
    RETURN v_result;
END;
$$;

-- Migration: 20260527000002_operations_portal_phase3.sql
-- Description: Schema for Operations Portal Phase 3 (Training & Quizzes)

-- Training Courses
CREATE TABLE public.operation_training_courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- e.g., 'onboarding', 'skills'
    cover_image TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Materials (Lessons & Quizzes)
CREATE TABLE public.operation_training_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.operation_training_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    material_type TEXT NOT NULL DEFAULT 'video', -- 'video', 'document', 'quiz'
    file_url TEXT,
    content TEXT, -- For text-based lessons or quiz instructions
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Questions (For Quiz materials)
CREATE TABLE public.operation_training_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID REFERENCES public.operation_training_materials(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- e.g., ["A", "B", "C", "D"]
    correct_option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training Progress (Course level)
CREATE TABLE public.operation_training_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.operation_training_courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'started', -- 'started', 'completed'
    quiz_score INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- Indexes
CREATE INDEX idx_op_training_courses_company_id ON public.operation_training_courses(company_id);
CREATE INDEX idx_op_training_materials_course_id ON public.operation_training_materials(course_id);
CREATE INDEX idx_op_training_questions_material_id ON public.operation_training_questions(material_id);
CREATE INDEX idx_op_training_progress_course_user ON public.operation_training_progress(course_id, user_id);

-- Enable RLS
ALTER TABLE public.operation_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Courses
CREATE POLICY "Users can view courses in their company" ON public.operation_training_courses FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Admin/Manager can manage courses" ON public.operation_training_courses FOR ALL USING (
    company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Materials
CREATE POLICY "Users can view materials for their courses" ON public.operation_training_materials FOR SELECT USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Admin/Manager can manage materials" ON public.operation_training_materials FOR ALL USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Questions
CREATE POLICY "Users can view questions for their materials" ON public.operation_training_questions FOR SELECT USING (
    material_id IN (SELECT id FROM public.operation_training_materials WHERE course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid())))
);
CREATE POLICY "Admin/Manager can manage questions" ON public.operation_training_questions FOR ALL USING (
    material_id IN (SELECT id FROM public.operation_training_materials WHERE course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))) AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'branch_manager'))
);

-- Progress
CREATE POLICY "Users can view all progress in their company" ON public.operation_training_progress FOR SELECT USING (
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can insert their own progress" ON public.operation_training_progress FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);
CREATE POLICY "Users can update their own progress" ON public.operation_training_progress FOR UPDATE USING (
    user_id = auth.uid() AND
    course_id IN (SELECT id FROM public.operation_training_courses WHERE company_id IN (SELECT company_id FROM public.users WHERE id = auth.uid()))
);


