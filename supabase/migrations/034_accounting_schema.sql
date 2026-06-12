-- Migration: 034_accounting_schema.sql
-- Description: Create schema for Accounting App (Settings, Accounts, Transactions, Cashbooks)

-- 1. accounting_settings
CREATE TABLE IF NOT EXISTS public.accounting_settings (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    chart_of_accounts_standard VARCHAR(50) DEFAULT 'CUSTOM' CHECK (chart_of_accounts_standard IN ('TT133', 'TT200', 'CUSTOM')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. accounting_accounts (Danh mục tài khoản kế toán)
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_id UUID REFERENCES public.accounting_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, code)
);

-- 3. accounting_transactions (Phiếu kế toán chung)
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    voucher_number VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'CANCELLED')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, voucher_number)
);

-- 4. accounting_transaction_lines (Bút toán chi tiết)
CREATE TABLE IF NOT EXISTS public.accounting_transaction_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.accounting_transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
    debit_amount DECIMAL(19,4) DEFAULT 0,
    credit_amount DECIMAL(19,4) DEFAULT 0,
    description TEXT,
    cashflow_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL, -- Integration with Cashflow app
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. cash_books (Sổ quỹ định kỳ)
CREATE TABLE IF NOT EXISTS public.cash_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    opening_balance DECIMAL(19,4) DEFAULT 0,
    closing_balance DECIMAL(19,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, account_id, period_start, period_end)
);

-- Add updated_at triggers
CREATE OR REPLACE TRIGGER trg_accounting_settings_updated_at BEFORE UPDATE ON public.accounting_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_accounting_accounts_updated_at BEFORE UPDATE ON public.accounting_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_accounting_transactions_updated_at BEFORE UPDATE ON public.accounting_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_accounting_transaction_lines_updated_at BEFORE UPDATE ON public.accounting_transaction_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_cash_books_updated_at BEFORE UPDATE ON public.cash_books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Enable
ALTER TABLE public.accounting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_transaction_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_books ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies using existing function auth.company_id() or comparing to company_id
-- We assume `auth.uid()` based policy or JWT claims as per other modules.
-- Looking at existing modules, they usually use policy like: (company_id = (SELECT auth.jwt() ->> 'company_id')::uuid)
-- Or we use `public.check_company_access(company_id)` if it exists. We'll use a standard one.

CREATE POLICY "Users can view accounting_settings for their company" ON public.accounting_settings FOR SELECT USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));
CREATE POLICY "Users can update accounting_settings for their company" ON public.accounting_settings FOR UPDATE USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));
CREATE POLICY "Users can insert accounting_settings for their company" ON public.accounting_settings FOR INSERT WITH CHECK (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));

CREATE POLICY "Users can view accounting_accounts for their company" ON public.accounting_accounts FOR SELECT USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));
CREATE POLICY "Users can modify accounting_accounts for their company" ON public.accounting_accounts FOR ALL USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));

CREATE POLICY "Users can view accounting_transactions for their company" ON public.accounting_transactions FOR SELECT USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));
CREATE POLICY "Users can modify accounting_transactions for their company" ON public.accounting_transactions FOR ALL USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));

-- transaction lines check via transaction's company_id
CREATE POLICY "Users can view accounting_transaction_lines" ON public.accounting_transaction_lines FOR SELECT USING (
    transaction_id IN (SELECT id FROM public.accounting_transactions WHERE company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid))
);
CREATE POLICY "Users can modify accounting_transaction_lines" ON public.accounting_transaction_lines FOR ALL USING (
    transaction_id IN (SELECT id FROM public.accounting_transactions WHERE company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid))
);

CREATE POLICY "Users can view cash_books for their company" ON public.cash_books FOR SELECT USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));
CREATE POLICY "Users can modify cash_books for their company" ON public.cash_books FOR ALL USING (company_id = (SELECT NULLIF(current_setting('request.jwt.claim.company_id', true), '')::uuid));

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounting_accounts_company ON public.accounting_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_company ON public.accounting_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON public.accounting_transactions(company_id, date);
CREATE INDEX IF NOT EXISTS idx_accounting_lines_transaction ON public.accounting_transaction_lines(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounting_lines_account ON public.accounting_transaction_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_cash_books_company_account ON public.cash_books(company_id, account_id);
