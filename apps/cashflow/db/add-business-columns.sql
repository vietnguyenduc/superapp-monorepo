-- Add business columns used by the cashflow app UI/services.
-- Safe to run multiple times.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS working_method TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_balance DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_type TEXT;

ALTER TABLE public.transaction_types
  ADD COLUMN IF NOT EXISTS math_factor INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS impact_type TEXT DEFAULT 'increase';

UPDATE public.transaction_types
SET
  math_factor = CASE
    WHEN id IN ('charge', 'refund') THEN -1
    ELSE COALESCE(math_factor, 1)
  END,
  impact_type = CASE
    WHEN id IN ('charge', 'refund') THEN 'decrease'
    ELSE COALESCE(impact_type, 'increase')
  END
WHERE math_factor IS NULL OR impact_type IS NULL;

UPDATE public.customers
SET
  opening_balance = COALESCE(opening_balance, total_balance, 0),
  current_balance = COALESCE(current_balance, total_balance, opening_balance, 0),
  opening_balance_updated_at = COALESCE(opening_balance_updated_at, updated_at, created_at, NOW())
WHERE opening_balance IS NULL
   OR current_balance IS NULL
   OR opening_balance_updated_at IS NULL;

UPDATE public.bank_accounts
SET opening_balance = COALESCE(opening_balance, balance, 0)
WHERE opening_balance IS NULL;
