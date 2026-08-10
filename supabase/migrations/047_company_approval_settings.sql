-- Per-company approval configuration: which entity types require admin approval on create.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS approval_settings JSONB DEFAULT '{
    "transactions": true,
    "customers": true,
    "bank_accounts": true,
    "branches": true
  }'::jsonb;

-- Backfill existing companies with all categories requiring approval by default.
UPDATE public.companies
SET approval_settings = '{
    "transactions": true,
    "customers": true,
    "bank_accounts": true,
    "branches": true
  }'::jsonb
WHERE approval_settings IS NULL;
