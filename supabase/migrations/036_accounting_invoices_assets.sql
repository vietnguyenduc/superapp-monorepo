-- Migration: 036_accounting_invoices_assets.sql
-- Description: Thêm bảng quản lý hóa đơn và tài sản cố định

-- 1. Bổ sung trường invoice_mode vào accounting_settings
ALTER TABLE public.accounting_settings 
ADD COLUMN IF NOT EXISTS invoice_mode VARCHAR(20) DEFAULT 'SIMPLE' CHECK (invoice_mode IN ('SIMPLE', 'ACCOUNTING'));

-- 2. Bảng Hóa đơn
CREATE TABLE IF NOT EXISTS public.accounting_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('SALE', 'PURCHASE')),
    invoice_number VARCHAR(100),
    invoice_date DATE NOT NULL,
    due_date DATE,
    partner_name VARCHAR(255) NOT NULL, -- Tên khách hàng / nhà cung cấp
    sub_total DECIMAL(19,4) DEFAULT 0,
    tax_amount DECIMAL(19,4) DEFAULT 0,
    total_amount DECIMAL(19,4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_accounting_invoices
    BEFORE UPDATE ON public.accounting_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Bảng Tài sản cố định
CREATE TABLE IF NOT EXISTS public.accounting_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_code VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price DECIMAL(19,4) NOT NULL DEFAULT 0,
    salvage_value DECIMAL(19,4) DEFAULT 0,
    useful_life_months INTEGER NOT NULL,
    depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE' CHECK (depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE')),
    accumulated_depreciation DECIMAL(19,4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'DISPOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_accounting_assets_code ON public.accounting_assets(company_id, asset_code);

CREATE TRIGGER set_updated_at_accounting_assets
    BEFORE UPDATE ON public.accounting_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices of their company" ON public.accounting_invoices FOR SELECT USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can insert invoices of their company" ON public.accounting_invoices FOR INSERT WITH CHECK (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can update invoices of their company" ON public.accounting_invoices FOR UPDATE USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can delete invoices of their company" ON public.accounting_invoices FOR DELETE USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));

CREATE POLICY "Users can view assets of their company" ON public.accounting_assets FOR SELECT USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can insert assets of their company" ON public.accounting_assets FOR INSERT WITH CHECK (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can update assets of their company" ON public.accounting_assets FOR UPDATE USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));
CREATE POLICY "Users can delete assets of their company" ON public.accounting_assets FOR DELETE USING (company_id IN (SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID));

-- 4. Logic sinh bút toán hóa đơn (Chỉ sinh nếu invoice_mode = 'ACCOUNTING' và status chuyển sang APPROVED)
CREATE OR REPLACE FUNCTION public.sync_invoice_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_mode VARCHAR;
    v_tx_id UUID;
    v_acc_receivable UUID; -- Phải thu
    v_acc_payable UUID; -- Phải trả
    v_acc_revenue UUID; -- Doanh thu
    v_acc_expense UUID; -- Chi phí
    v_acc_tax_out UUID; -- Thuế đầu ra
    v_acc_tax_in UUID; -- Thuế đầu vào
BEGIN
    -- Lấy cấu hình invoice_mode
    SELECT invoice_mode INTO v_mode FROM public.accounting_settings WHERE company_id = NEW.company_id;
    
    -- Nếu không phải chế độ ACCOUNTING thì bỏ qua
    IF COALESCE(v_mode, 'SIMPLE') != 'ACCOUNTING' THEN
        RETURN NEW;
    END IF;

    -- Chỉ sinh phiếu khi hóa đơn chuyển từ DRAFT sang APPROVED
    IF NEW.status = 'APPROVED' AND OLD.status = 'DRAFT' THEN
        -- Tìm ID các tài khoản cơ bản dựa vào Chuẩn mực kế toán
        SELECT id INTO v_acc_receivable FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code = '131' LIMIT 1;
        SELECT id INTO v_acc_payable FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code = '331' LIMIT 1;
        SELECT id INTO v_acc_revenue FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code = '511' LIMIT 1;
        SELECT id INTO v_acc_expense FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code IN ('642', '641', '156') LIMIT 1;
        SELECT id INTO v_acc_tax_out FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code = '333' LIMIT 1;
        SELECT id INTO v_acc_tax_in FROM public.accounting_accounts WHERE company_id = NEW.company_id AND code = '133' LIMIT 1;

        -- Tạo phiếu kế toán
        INSERT INTO public.accounting_transactions (company_id, date, voucher_number, description, status)
        VALUES (NEW.company_id, NEW.invoice_date, 'INV-' || COALESCE(NEW.invoice_number, NEW.id::text), 'Ghi nhận Hóa đơn: ' || NEW.partner_name, 'DRAFT')
        RETURNING id INTO v_tx_id;

        -- Ghi định khoản tùy theo Mua / Bán
        IF NEW.invoice_type = 'SALE' THEN
            -- Nợ 131 (Tổng tiền) / Có 511 (Doanh thu), Có 333 (Thuế)
            IF v_acc_receivable IS NOT NULL THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_receivable, NEW.total_amount, 0, 'Phải thu khách hàng');
            END IF;
            IF v_acc_revenue IS NOT NULL AND NEW.sub_total > 0 THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_revenue, 0, NEW.sub_total, 'Doanh thu bán hàng');
            END IF;
            IF v_acc_tax_out IS NOT NULL AND NEW.tax_amount > 0 THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_tax_out, 0, NEW.tax_amount, 'Thuế GTGT đầu ra');
            END IF;
        ELSIF NEW.invoice_type = 'PURCHASE' THEN
            -- Nợ Chi Phí (Giá trị trước thuế), Nợ Thuế đầu vào / Có 331 (Phải trả)
            IF v_acc_payable IS NOT NULL THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_payable, 0, NEW.total_amount, 'Phải trả nhà cung cấp');
            END IF;
            IF v_acc_expense IS NOT NULL AND NEW.sub_total > 0 THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_expense, NEW.sub_total, 0, 'Chi phí mua hàng/dịch vụ');
            END IF;
            IF v_acc_tax_in IS NOT NULL AND NEW.tax_amount > 0 THEN
                INSERT INTO public.accounting_transaction_lines (transaction_id, account_id, debit_amount, credit_amount, description)
                VALUES (v_tx_id, v_acc_tax_in, NEW.tax_amount, 0, 'Thuế GTGT đầu vào');
            END IF;
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger chạy khi cập nhật Hóa đơn
DROP TRIGGER IF EXISTS trg_sync_invoice_to_accounting ON public.accounting_invoices;
CREATE TRIGGER trg_sync_invoice_to_accounting
AFTER UPDATE ON public.accounting_invoices
FOR EACH ROW
EXECUTE FUNCTION public.sync_invoice_to_accounting();
