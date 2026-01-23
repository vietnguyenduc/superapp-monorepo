-- Inventory Operation Module Database Schema
-- Created: 2025-02-02
-- Purpose: Tables for inventory management, product catalog, and sales tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE product_category AS ENUM ('fruit', 'dry_goods', 'processed', 'finished');
CREATE TYPE product_status AS ENUM ('active', 'inactive');
CREATE TYPE business_status AS ENUM ('active', 'inactive');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');

-- Products table (Bảng 2 - Danh mục hàng hóa)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category product_category NOT NULL,
    business_code VARCHAR(50) NOT NULL UNIQUE, -- Mã SP KD
    promotion_code VARCHAR(50), -- Mã SP KM
    name VARCHAR(255) NOT NULL,
    is_finished_product BOOLEAN DEFAULT FALSE, -- Thành phẩm?
    
    -- Định mức quy đổi cơ bản
    output_quantity DECIMAL(10,3) DEFAULT 1, -- Định lượng Xuất
    input_quantity DECIMAL(10,3) DEFAULT 1, -- Định lượng Nhập
    
    finished_product_code VARCHAR(50), -- Mã Thành phẩm
    input_unit VARCHAR(50) NOT NULL, -- ĐVT Nhập
    output_unit VARCHAR(50) NOT NULL, -- ĐVT Xuất
    
    status product_status DEFAULT 'active',
    business_status business_status DEFAULT 'active',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Product conversions table (Quy đổi nâng cao)
CREATE TABLE product_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    from_unit VARCHAR(50) NOT NULL,
    to_unit VARCHAR(50) NOT NULL,
    conversion_rate DECIMAL(10,6) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, from_unit, to_unit)
);

-- Inventory records table (Bảng 1 - Nhập liệu tồn kho)
CREATE TABLE inventory_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Số liệu tồn kho
    input_quantity DECIMAL(10,3) DEFAULT 0, -- Nhập
    actual_quantity DECIMAL(10,3) DEFAULT 0, -- Tồn thực
    unit VARCHAR(50) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(date, product_id)
);

-- Sales records table (Bảng 3 - Báo cáo bán hàng)
CREATE TABLE sales_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Số liệu bán hàng
    sales_quantity DECIMAL(10,3) DEFAULT 0,
    promotion_quantity DECIMAL(10,3) DEFAULT 0, -- Xuất khuyến mãi
    unit VARCHAR(50) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(date, product_id)
);

-- Special outbound records table (Bảng 3.1 - Xuất đặc biệt)
CREATE TABLE special_outbound_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Thông tin xuất đặc biệt
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Approval workflow
    approval_status approval_status DEFAULT 'pending',
    requested_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval logs table (Lịch sử phê duyệt)
CREATE TABLE approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_type VARCHAR(50) NOT NULL, -- 'special_outbound', etc.
    record_id UUID NOT NULL,
    
    action VARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject'
    status approval_status NOT NULL,
    comment TEXT,
    
    -- User info
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory reports table (Bảng 4 - Báo cáo nhập xuất tồn)
CREATE TABLE inventory_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Số liệu báo cáo
    opening_balance DECIMAL(10,3) DEFAULT 0, -- Tồn đầu
    input_quantity DECIMAL(10,3) DEFAULT 0, -- Nhập
    output_quantity DECIMAL(10,3) DEFAULT 0, -- Xuất
    closing_balance DECIMAL(10,3) DEFAULT 0, -- Tồn cuối
    
    -- So sánh tồn sổ vs tồn thực
    book_balance DECIMAL(10,3) DEFAULT 0, -- Tồn sổ
    actual_balance DECIMAL(10,3) DEFAULT 0, -- Tồn thực
    variance DECIMAL(10,3) DEFAULT 0, -- Chênh lệch
    
    unit VARCHAR(50) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(date, product_id)
);

-- Stock check prints table (Bảng 5.1, 5.2 - Phiếu kiểm kho)
CREATE TABLE stock_check_prints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    printed_at TIMESTAMP WITH TIME ZONE,
    printed_by UUID
);

-- Stock check items table
CREATE TABLE stock_check_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_check_id UUID NOT NULL REFERENCES stock_check_prints(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Thông tin kiểm kho
    book_quantity DECIMAL(10,3) DEFAULT 0, -- Tồn sổ
    actual_quantity DECIMAL(10,3), -- Tồn thực (để trống khi in)
    variance DECIMAL(10,3), -- Chênh lệch (tính sau)
    unit VARCHAR(50) NOT NULL,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_business_code ON products(business_code);
CREATE INDEX idx_products_status ON products(status, business_status);

CREATE INDEX idx_product_conversions_product_id ON product_conversions(product_id);
CREATE INDEX idx_product_conversions_units ON product_conversions(from_unit, to_unit);

CREATE INDEX idx_inventory_records_date ON inventory_records(date);
CREATE INDEX idx_inventory_records_product_id ON inventory_records(product_id);
CREATE INDEX idx_inventory_records_date_product ON inventory_records(date, product_id);

CREATE INDEX idx_sales_records_date ON sales_records(date);
CREATE INDEX idx_sales_records_product_id ON sales_records(product_id);
CREATE INDEX idx_sales_records_date_product ON sales_records(date, product_id);

CREATE INDEX idx_special_outbound_date ON special_outbound_records(date);
CREATE INDEX idx_special_outbound_status ON special_outbound_records(approval_status);
CREATE INDEX idx_special_outbound_requested_by ON special_outbound_records(requested_by);

CREATE INDEX idx_approval_logs_record ON approval_logs(record_type, record_id);
CREATE INDEX idx_approval_logs_user ON approval_logs(user_id);
CREATE INDEX idx_approval_logs_created_at ON approval_logs(created_at);

CREATE INDEX idx_inventory_reports_date ON inventory_reports(date);
CREATE INDEX idx_inventory_reports_product_id ON inventory_reports(product_id);
CREATE INDEX idx_inventory_reports_date_product ON inventory_reports(date, product_id);

CREATE INDEX idx_stock_check_prints_date ON stock_check_prints(check_date);
CREATE INDEX idx_stock_check_items_check_id ON stock_check_items(stock_check_id);
CREATE INDEX idx_stock_check_items_product_id ON stock_check_items(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_conversions_updated_at BEFORE UPDATE ON product_conversions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_records_updated_at BEFORE UPDATE ON inventory_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_records_updated_at BEFORE UPDATE ON sales_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_outbound_records_updated_at BEFORE UPDATE ON special_outbound_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_reports_updated_at BEFORE UPDATE ON inventory_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO products (category, business_code, name, input_unit, output_unit, business_status) VALUES
('fruit', 'CAM001', 'Cam sành', 'quả', 'miếng', 'active'),
('fruit', 'TAO001', 'Táo fuji', 'quả', 'lát', 'active'),
('dry_goods', 'HAT001', 'Hạt điều', 'kg', 'gram', 'active'),
('processed', 'NL001', 'Nước lọc', 'chai', 'ly', 'active'),
('finished', 'SP001', 'Sinh tố cam', 'ly', 'ly', 'active');

-- Insert sample conversions
INSERT INTO product_conversions (product_id, from_unit, to_unit, conversion_rate, description) 
SELECT 
    p.id, 
    'quả', 
    'miếng', 
    8.0,
    '1 quả cam = 8 miếng'
FROM products p WHERE p.business_code = 'CAM001';

INSERT INTO product_conversions (product_id, from_unit, to_unit, conversion_rate, description) 
SELECT 
    p.id, 
    'quả', 
    'lát', 
    6.0,
    '1 quả táo = 6 lát'
FROM products p WHERE p.business_code = 'TAO001';

-- Insert sample inventory records
INSERT INTO inventory_records (date, product_id, input_quantity, actual_quantity, unit)
SELECT 
    CURRENT_DATE,
    p.id,
    100,
    95,
    p.input_unit
FROM products p
WHERE p.business_code IN ('CAM001', 'TAO001', 'HAT001');

COMMENT ON TABLE products IS 'Bảng 2 - Danh mục hàng hóa, định mức, quy đổi';
COMMENT ON TABLE product_conversions IS 'Quy đổi nâng cao giữa các đơn vị';
COMMENT ON TABLE inventory_records IS 'Bảng 1 - Nhập liệu tồn kho, nhập kho, nhập thực tế';
COMMENT ON TABLE sales_records IS 'Bảng 3 - Báo cáo bán hàng, xuất khuyến mãi';
COMMENT ON TABLE special_outbound_records IS 'Bảng 3.1 - Xuất đặc biệt với approval flow';
COMMENT ON TABLE inventory_reports IS 'Bảng 4 - Báo cáo nhập xuất tồn, so sánh tồn sổ vs tồn thực';
COMMENT ON TABLE stock_check_prints IS 'Bảng 5.1, 5.2 - Phiếu kiểm kho và báo cáo chi tiết';
