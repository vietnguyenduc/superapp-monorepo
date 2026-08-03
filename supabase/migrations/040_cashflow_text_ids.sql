-- Migration: 040_cashflow_text_ids
-- Description: Align Cashflow operational table IDs with the app's string ID
-- generation (cust-..., txn-..., bank-..., backup-...) so production writes
-- do not fail against the Supabase cloud UUID columns.

BEGIN;

-- 1. Drop all FKs that reference the primary keys we are about to alter.
ALTER TABLE public.accounting_transaction_lines DROP CONSTRAINT IF EXISTS accounting_transaction_lines_cashflow_transaction_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_bank_account_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_pkey;

-- 2. Transactions (id generated as "txn-<timestamp>-<random>", bank_account_id references bank_accounts.id)
ALTER TABLE public.transactions ALTER COLUMN id TYPE text;
ALTER TABLE public.transactions ALTER COLUMN bank_account_id TYPE text;
ALTER TABLE public.accounting_transaction_lines ALTER COLUMN cashflow_transaction_id TYPE text;

-- 3. Bank accounts (id generated as "bank-<timestamp>-<random>")
ALTER TABLE public.bank_accounts ALTER COLUMN id TYPE text;

-- 4. Restore primary keys.
ALTER TABLE public.bank_accounts ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

-- 5. Restore foreign keys once both sides are text.
ALTER TABLE public.transactions ADD CONSTRAINT transactions_bank_account_id_fkey
    FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE public.accounting_transaction_lines ADD CONSTRAINT accounting_transaction_lines_cashflow_transaction_id_fkey
    FOREIGN KEY (cashflow_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

-- 6. Backup history (id generated as "backup-<uuid/random>")
ALTER TABLE public.backup_history DROP CONSTRAINT IF EXISTS backup_history_pkey;
ALTER TABLE public.backup_history ALTER COLUMN id TYPE text;
ALTER TABLE public.backup_history ADD CONSTRAINT backup_history_pkey PRIMARY KEY (id);

-- 7. Color settings uses string setting_key and a UUID id; make id text for consistency.
ALTER TABLE public.color_settings DROP CONSTRAINT IF EXISTS color_settings_pkey;
ALTER TABLE public.color_settings ALTER COLUMN id TYPE text;
ALTER TABLE public.color_settings ADD CONSTRAINT color_settings_pkey PRIMARY KEY (id);

COMMIT;
