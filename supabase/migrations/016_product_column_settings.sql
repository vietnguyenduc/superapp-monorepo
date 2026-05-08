-- Migration: Product Column Settings
-- Description: Persisted company-scoped column configurations for product catalog
-- Phase 4 - Configurable product columns by industry and settings

-- Table: product_column_presets (Industry presets)
CREATE TABLE IF NOT EXISTS public.product_column_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    industry_type VARCHAR(50) NOT NULL, -- 'thuong_mai', 'fandb', 'san_xuat_so_che'
    description TEXT,
    is_system BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: product_column_settings (Company-specific column configurations)
CREATE TABLE IF NOT EXISTS public.product_column_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    column_key VARCHAR(100) NOT NULL,
    column_label VARCHAR(200) NOT NULL,
    column_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'date', 'boolean', 'select'
    width VARCHAR(50) DEFAULT 'auto',
    required BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    select_options JSONB, -- Array of select options
    business_relevance TEXT, -- Description of business relevance
    role_visibility JSONB, -- Array of roles that can see this column
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT product_column_settings_company_column_key_unique UNIQUE (company_id, column_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_column_settings_company_id ON public.product_column_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_product_column_settings_visible ON public.product_column_settings(visible);
CREATE INDEX IF NOT EXISTS idx_product_column_settings_order ON public.product_column_settings(company_id, order_index);

-- RLS Policies
ALTER TABLE public.product_column_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_column_settings ENABLE ROW LEVEL SECURITY;

-- Policy: product_column_presets - All authenticated users can read system presets
CREATE POLICY product_column_presets_select_policy ON public.product_column_presets
FOR SELECT TO authenticated
USING (true);

-- Policy: product_column_settings - Users can read their company's settings
CREATE POLICY product_column_settings_select_policy ON public.product_column_settings
FOR SELECT TO authenticated
USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Policy: product_column_settings - Admins can insert/update settings
CREATE POLICY product_column_settings_insert_policy ON public.product_column_settings
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'branch_manager'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

CREATE POLICY product_column_settings_update_policy ON public.product_column_settings
FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'branch_manager'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin_master')
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin_company'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'branch_manager'
        AND company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    )
);

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_column_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_column_settings_updated_at
BEFORE UPDATE ON public.product_column_settings
FOR EACH ROW
EXECUTE FUNCTION update_product_column_settings_updated_at();

CREATE TRIGGER trigger_update_product_column_presets_updated_at
BEFORE UPDATE ON public.product_column_presets
FOR EACH ROW
EXECUTE FUNCTION update_product_column_settings_updated_at();

-- Insert industry presets
INSERT INTO public.product_column_presets (name, industry_type, description, is_system) VALUES
('Thương mại', 'thuong_mai', 'Cấu hình cột cho ngành thương mại bán lẻ', true),
('F&B', 'fandb', 'Cấu hình cột cho ngành F&B (Food & Beverage)', true),
('Sản xuất/Sơ chế', 'san_xuat_so_che', 'Cấu hình cột cho ngành sản xuất và sơ chế', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default F&B column configuration (will be used as template for new companies)
-- This is a system preset that companies can customize
INSERT INTO public.product_column_settings (company_id, column_key, column_label, column_type, width, required, visible, order_index, select_options, business_relevance, role_visibility) VALUES
(NULL, 'ngay_cap_nhat', 'Ngày cập nhật', 'date', '120px', true, true, 1, NULL, 'Theo dõi thời gian cập nhật sản phẩm', '["admin", "branch_manager", "staff"]'),
(NULL, 'loai', 'Loại', 'select', '100px', true, true, 2, '["Đĩa trái cây", "Nước ép", "Smoothie", "Nguyên liệu", "Đồ uống", "Thức ăn"]', 'Phân loại sản phẩm theo loại', '["admin", "branch_manager", "staff"]'),
(NULL, 'ma_nguyen_vat_lieu', 'Mã Nguyên vật liệu', 'text', '150px', true, true, 3, NULL, 'Mã định danh nguyên vật liệu', '["admin", "branch_manager", "staff"]'),
(NULL, 'ten_nguyen_vat_lieu', 'Tên Nguyên vật liệu', 'text', '200px', true, true, 4, NULL, 'Tên đầy đủ nguyên vật liệu', '["admin", "branch_manager", "staff"]'),
(NULL, 'thanh_pham', 'Thành phẩm?', 'boolean', '100px', false, true, 5, NULL, 'Đánh dấu là thành phẩm', '["admin", "branch_manager", "staff"]'),
(NULL, 'dinh_luong_xuat', 'Định lượng Xuất', 'number', '120px', false, true, 6, NULL, 'Định lượng xuất tiêu chuẩn', '["admin", "branch_manager", "staff"]'),
(NULL, 'dinh_luong_nhap', 'Định lượng Nhập', 'number', '120px', false, true, 7, NULL, 'Định lượng nhập tiêu chuẩn', '["admin", "branch_manager", "staff"]'),
(NULL, 'ma_sp_kd', 'Mã SP KD', 'text', '100px', false, true, 8, NULL, 'Mã sản phẩm kinh doanh', '["admin", "branch_manager", "staff"]'),
(NULL, 'ten_thanh_pham', 'Tên Thành phẩm', 'text', '200px', true, true, 9, NULL, 'Tên thành phẩm hoàn chỉnh', '["admin", "branch_manager", "staff"]'),
(NULL, 'dvt_nhap', 'ĐVT Nhập', 'select', '80px', false, true, 10, '["đĩa", "ly", "kg", "gram", "trái", "cái", "hộp"]', 'Đơn vị tính nhập', '["admin", "branch_manager", "staff"]'),
(NULL, 'dvt_xuat', 'ĐVT Xuất', 'select', '80px', false, true, 11, '["đĩa", "ly", "kg", "gram", "trái", "cái", "hộp"]', 'Đơn vị tính xuất', '["admin", "branch_manager", "staff"]'),
(NULL, 'tinh_trang', 'Tình trạng', 'select', '100px', true, true, 12, '["Đang bán", "Ngưng bán", "Hết hàng"]', 'Trạng thái kinh doanh', '["admin", "branch_manager", "staff"]'),
(NULL, 'gia_nhap', 'Giá Nhập', 'number', '120px', false, false, 13, NULL, 'Giá nhập hàng', '["admin", "branch_manager"]'),
(NULL, 'gia_ban', 'Giá Bán', 'number', '120px', true, true, 14, NULL, 'Giá bán lẻ', '["admin", "branch_manager", "staff"]'),
(NULL, 'nha_cung_cap_gan_nhat', 'Nhà cung cấp gần nhất', 'text', '200px', false, false, 15, NULL, 'Nhà cung cấp gần nhất', '["admin", "branch_manager"]'),
(NULL, 'nha_cung_cap_pho_bien_nhat', 'Nhà cung cấp phổ biến nhất', 'text', '200px', false, false, 16, NULL, 'Nhà cung cấp phổ biến nhất', '["admin", "branch_manager"]'),
(NULL, 'thue', 'Thuế', 'number', '100px', false, false, 17, NULL, 'Thuế suất', '["admin", "branch_manager"]'),
(NULL, 'ghi_chu', 'Ghi chú', 'text', '200px', false, true, 18, NULL, 'Ghi chú bổ sung', '["admin", "branch_manager", "staff"]')
ON CONFLICT (company_id, column_key) DO NOTHING;
