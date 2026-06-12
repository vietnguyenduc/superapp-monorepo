-- Migration: 037_einvoice_and_tax_schema.sql
-- Description: Thêm cấu hình và các trường trạng thái cho Hóa đơn điện tử

-- 1. Bổ sung cấu hình kết nối vào accounting_settings
ALTER TABLE public.accounting_settings
    ADD COLUMN IF NOT EXISTS einvoice_provider VARCHAR(50), -- MISA, VIETTEL, VNPT
    ADD COLUMN IF NOT EXISTS einvoice_api_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS einvoice_username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS einvoice_password TEXT, -- Nên mã hóa ở application layer
    ADD COLUMN IF NOT EXISTS einvoice_template_code VARCHAR(50), -- Mẫu số hóa đơn (VD: 1C23TAA)
    ADD COLUMN IF NOT EXISTS einvoice_series VARCHAR(50); -- Ký hiệu hóa đơn

-- 2. Bổ sung trạng thái E-Invoice vào accounting_invoices
ALTER TABLE public.accounting_invoices
    ADD COLUMN IF NOT EXISTS einvoice_status VARCHAR(50) DEFAULT 'NOT_ISSUED' CHECK (einvoice_status IN ('NOT_ISSUED', 'ISSUING', 'ISSUED', 'FAILED')),
    ADD COLUMN IF NOT EXISTS einvoice_transaction_id VARCHAR(255), -- Mã giao dịch bên cung cấp
    ADD COLUMN IF NOT EXISTS einvoice_tax_code VARCHAR(100), -- Mã CQT cấp
    ADD COLUMN IF NOT EXISTS einvoice_pdf_url TEXT, -- Link tải PDF
    ADD COLUMN IF NOT EXISTS einvoice_xml_url TEXT, -- Link tải XML
    ADD COLUMN IF NOT EXISTS issue_date TIMESTAMP WITH TIME ZONE; -- Ngày phát hành thực tế
