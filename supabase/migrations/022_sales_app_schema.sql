-- Migration: 022_sales_app_schema
-- Description: Complete Sales module schema - orders, channels, targets, commissions, marketing
-- Date: 2024-12-19

-- ═══════════════════════════════════════════════════════════════
-- 1. SALES CHANNELS - Kênh bán hàng
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sales_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default channels
INSERT INTO public.sales_channels (code, name, description) VALUES
    ('pos', 'POS (Bán lẻ tại quầy)', 'Bán hàng trực tiếp tại cửa hàng'),
    ('b2b', 'B2B (Bán buôn)', 'Bán sỉ cho doanh nghiệp, đại lý'),
    ('online', 'Online (Website/App)', 'Bán qua website hoặc ứng dụng'),
    ('marketplace', 'Marketplace', 'Bán qua sàn thương mại điện tử (Shopee, Lazada, Tiki...)'),
    ('agent', 'Đại lý/Cộng tác viên', 'Bán qua hệ thống đại lý, CTV'),
    ('social', 'Social Commerce', 'Bán qua mạng xã hội (Facebook, Zalo, TikTok...)'),
    ('wholesale', 'Chợ đầu mối', 'Bán tại chợ đầu mối, chợ truyền thống'),
    ('delivery', 'Giao hàng tận nơi', 'Đặt hàng qua điện thoại, giao tận nơi'),
    ('catering', 'Catering/Sự kiện', 'Phục vụ tiệc, sự kiện, hội nghị'),
    ('export', 'Xuất khẩu', 'Bán hàng xuất khẩu quốc tế')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON public.sales_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin insert/update" ON public.sales_channels FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_master'))
);

-- ═══════════════════════════════════════════════════════════════
-- 2. COMMISSION SETTINGS - Cài đặt hoa hồng
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.commission_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    calculation_method TEXT CHECK (calculation_method IN (
        'percentage_revenue',    -- % doanh thu
        'percentage_profit',     -- % lợi nhuận
        'fixed_per_order',       -- Số tiền cố định / đơn
        'fixed_per_item',        -- Số tiền cố định / sản phẩm
        'tiered_revenue',        -- Bậc thang theo doanh thu
        'tiered_quantity'        -- Bậc thang theo số lượng
    )) NOT NULL DEFAULT 'percentage_revenue',
    rate NUMERIC(10,4) DEFAULT 0,           -- % hoặc fixed amount
    min_amount NUMERIC(15,2) DEFAULT 0,     -- Hoa hồng tối thiểu
    max_amount NUMERIC(15,2),               -- Hoa hồng tối đa (NULL = không giới hạn)
    tiers JSONB,                            -- Bậc thang: [{"from":0,"to":50000000,"rate":3},{"from":50000000,"to":null,"rate":5}]
    applies_to TEXT CHECK (applies_to IN ('all', 'channel', 'product_category', 'customer_segment')) DEFAULT 'all',
    applies_to_value TEXT,                  -- channel code, category, hoặc segment
    is_active BOOLEAN DEFAULT true,
    company_id UUID REFERENCES public.companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default commission settings
INSERT INTO public.commission_settings (name, calculation_method, rate) VALUES
    ('Hoa hồng mặc định (3% doanh thu)', 'percentage_revenue', 3.0000)
ON CONFLICT DO NOTHING;

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read commission" ON public.commission_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage commission" ON public.commission_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_master'))
);

-- ═══════════════════════════════════════════════════════════════
-- 3. SALES ORDERS - Đơn hàng bán ra
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES public.sales_channels(id),
    channel_code TEXT,                          -- Denormalized: pos, b2b, online, etc.
    salesperson_id UUID REFERENCES public.users(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('draft','pending','confirmed','processing','delivered','cancelled','returned')) DEFAULT 'draft',
    payment_status TEXT CHECK (payment_status IN ('unpaid','partial','paid','refunded')) DEFAULT 'unpaid',
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    shipping_fee NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    debt_amount NUMERIC(15,2) DEFAULT 0,         -- total - paid
    commission_setting_id UUID REFERENCES public.commission_settings(id),
    commission_rate NUMERIC(5,4) DEFAULT 0,
    commission_amount NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    company_id UUID REFERENCES public.companies(id),
    branch_id UUID REFERENCES public.branches(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_customer ON public.sales_orders(customer_id);
CREATE INDEX idx_sales_orders_channel ON public.sales_orders(channel_code);
CREATE INDEX idx_sales_orders_salesperson ON public.sales_orders(salesperson_id);
CREATE INDEX idx_sales_orders_date ON public.sales_orders(order_date);
CREATE INDEX idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX idx_sales_orders_company ON public.sales_orders(company_id);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read orders" ON public.sales_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert orders" ON public.sales_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update orders" ON public.sales_orders FOR UPDATE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. SALES ORDER ITEMS - Chi tiết sản phẩm trong đơn
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_code TEXT,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL,
    unit TEXT,
    unit_price NUMERIC(15,2) NOT NULL,
    discount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.sales_order_items(order_id);
CREATE INDEX idx_order_items_product ON public.sales_order_items(product_id);

ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read items" ON public.sales_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert items" ON public.sales_order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update items" ON public.sales_order_items FOR UPDATE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 5. SALES TARGETS - Chỉ tiêu bán hàng (nhân viên & team)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sales_targets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    target_type TEXT CHECK (target_type IN ('individual', 'team', 'branch', 'company')) NOT NULL DEFAULT 'individual',
    user_id UUID REFERENCES public.users(id),         -- NULL nếu là team/branch target
    branch_id UUID REFERENCES public.branches(id),    -- Team/Branch target
    period_type TEXT CHECK (period_type IN ('monthly', 'quarterly')) NOT NULL DEFAULT 'monthly',
    period_key TEXT NOT NULL,                          -- '2024-12', '2024-Q4'
    target_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
    target_orders INT DEFAULT 0,
    target_new_customers INT DEFAULT 0,
    actual_revenue NUMERIC(15,2) DEFAULT 0,
    actual_orders INT DEFAULT 0,
    actual_new_customers INT DEFAULT 0,
    achievement_rate NUMERIC(5,2) DEFAULT 0,           -- Calculated: actual/target * 100
    company_id UUID REFERENCES public.companies(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(target_type, user_id, branch_id, period_type, period_key, company_id)
);

CREATE INDEX idx_targets_user ON public.sales_targets(user_id);
CREATE INDEX idx_targets_period ON public.sales_targets(period_key);
CREATE INDEX idx_targets_company ON public.sales_targets(company_id);

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read targets" ON public.sales_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage targets" ON public.sales_targets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_master'))
);

-- ═══════════════════════════════════════════════════════════════
-- 6. MARKETING COSTS - Chi phí marketing per customer/campaign
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.marketing_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cost_type TEXT CHECK (cost_type IN ('acquisition', 'retention', 'campaign', 'referral', 'other')) NOT NULL DEFAULT 'acquisition',
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    campaign_name TEXT,
    channel TEXT,                                       -- marketing channel: google, facebook, zalo, referral, etc.
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    cost_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    company_id UUID REFERENCES public.companies(id),
    branch_id UUID REFERENCES public.branches(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketing_customer ON public.marketing_costs(customer_id);
CREATE INDEX idx_marketing_date ON public.marketing_costs(cost_date);
CREATE INDEX idx_marketing_company ON public.marketing_costs(company_id);

ALTER TABLE public.marketing_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read marketing" ON public.marketing_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin manage marketing" ON public.marketing_costs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'admin_master'))
);

-- ═══════════════════════════════════════════════════════════════
-- 7. Add customer segments to existing customers table
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS segment TEXT CHECK (segment IN ('vip', 'regular', 'new', 'inactive')) DEFAULT 'new';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS first_order_date TIMESTAMPTZ;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_orders INT DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS acquisition_channel TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(15,2) DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════
-- 8. Trigger: Auto-update customer stats on order changes
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_customer_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status NOT IN ('draft', 'cancelled', 'returned') THEN
        UPDATE public.customers SET
            total_orders = COALESCE((SELECT COUNT(*) FROM public.sales_orders WHERE customer_id = NEW.customer_id AND status NOT IN ('draft','cancelled','returned')), 0),
            total_spent = COALESCE((SELECT SUM(total_amount) FROM public.sales_orders WHERE customer_id = NEW.customer_id AND status NOT IN ('draft','cancelled','returned')), 0),
            first_order_date = COALESCE(first_order_date, NEW.order_date),
            last_transaction_date = NOW(),
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_customer_stats ON public.sales_orders;
CREATE TRIGGER trg_update_customer_stats
AFTER INSERT OR UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_stats_on_order();

-- ═══════════════════════════════════════════════════════════════
-- 9. Trigger: Auto-create Cashflow transaction on order
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_sales_order_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_transaction_code TEXT;
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status = 'confirmed' AND NEW.total_amount > 0 THEN
        v_transaction_code := 'SO-' || substring(NEW.id::text from 1 for 8);
        
        -- Check if transaction already exists
        IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE transaction_code = v_transaction_code) THEN
            INSERT INTO public.transactions (
                transaction_code, transaction_date, transaction_type, amount,
                customer_id, description, status, company_id, branch_id, created_by
            ) VALUES (
                v_transaction_code, NEW.order_date, 'charge', NEW.debt_amount,
                NEW.customer_id, 'Công nợ đơn hàng ' || NEW.order_code,
                'pending', NEW.company_id, NEW.branch_id, NEW.created_by
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sales_order_transaction ON public.sales_orders;
CREATE TRIGGER trg_sales_order_transaction
AFTER INSERT OR UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_sales_order_transaction();
