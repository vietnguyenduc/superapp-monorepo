-- Add pending/active status to customers, bank_accounts, and branches so staff
-- creations can queue for admin-company approval in a unified approvals page.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected'));

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected'));

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected'));

-- Backfill existing rows.
UPDATE public.customers SET status = 'active' WHERE status IS NULL;
UPDATE public.bank_accounts SET status = 'active' WHERE status IS NULL;
UPDATE public.branches SET status = 'active' WHERE status IS NULL;
