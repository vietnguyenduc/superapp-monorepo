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

-- 5. Goods Receipts (Nhập kho từ NCC)
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

-- 6. Goods Receipt Items (Chi tiết nhận hàng & Kiểm soát lỗi)
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

-- 8. Inventory Settings (Cài đặt hệ thống - Tính giá vốn)
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
