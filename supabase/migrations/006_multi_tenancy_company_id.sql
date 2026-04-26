-- Migration: 006_multi_tenancy_company_id.sql
-- Description: Add company_id to all tables for multi-tenancy support
-- Date: 2026-04-27

-- Step 1: Add company_id to bank_accounts table
ALTER TABLE public.bank_accounts
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 2: Add company_id to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 3: Add company_id to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Step 4: Create transaction_types table
CREATE TABLE IF NOT EXISTS public.transaction_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    math_factor DECIMAL,
    impact_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Step 5: Create customer_fields table
CREATE TABLE IF NOT EXISTS public.customer_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Step 6: Create indexes for company_id
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON public.bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transaction_types_company_id ON public.transaction_types(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_fields_company_id ON public.customer_fields(company_id);

-- Step 7: Update uniqueness constraints to be composite with company_id

-- Drop old unique constraint for customers.customer_code
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_customer_code_key;

-- Add new composite unique constraint
ALTER TABLE public.customers
ADD CONSTRAINT customers_customer_code_company_key UNIQUE (company_id, customer_code);

-- Drop old unique constraint for transactions.transaction_code
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_transaction_code_key;

-- Add new composite unique constraint
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_transaction_code_company_key UNIQUE (company_id, transaction_code);

-- Drop old unique constraint for branches.code
ALTER TABLE public.branches DROP CONSTRAINT IF EXISTS branches_code_key;

-- Add new composite unique constraint for branches
ALTER TABLE public.branches
ADD CONSTRAINT branches_code_company_key UNIQUE (company_id, code);

-- Step 8: Enable RLS on new tables
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_fields ENABLE ROW LEVEL SECURITY;
