-- Migration: 042_deposit_transaction_type.sql
-- Description: Add 'deposit' (Đặt cọc) transaction type and allow it in the transactions table.
-- Date: 2026-08-08

-- 1. Ensure 'deposit' is a valid value for transactions.transaction_type.
--    Different environments have used either a `transaction_type` enum or a text
--    column with a CHECK constraint, so handle both idempotently.
DO $$
DECLARE
    enum_exists boolean;
    check_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'transaction_type' AND typtype = 'e')
      INTO enum_exists;

    SELECT EXISTS(
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.transactions'::regclass
          AND conname = 'transactions_transaction_type_check'
    ) INTO check_exists;

    IF enum_exists THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum
            WHERE enumtypid = 'transaction_type'::regtype
              AND enumlabel = 'deposit'
        ) THEN
            ALTER TYPE transaction_type ADD VALUE 'deposit';
        END IF;
    END IF;

    IF check_exists THEN
        ALTER TABLE public.transactions
          DROP CONSTRAINT transactions_transaction_type_check;

        ALTER TABLE public.transactions
          ADD CONSTRAINT transactions_transaction_type_check
          CHECK (transaction_type = ANY (ARRAY['payment','charge','adjustment','refund','deposit']::text[]));
    END IF;
END $$;

-- 2. Seed the deposit transaction type for every existing company and as a global default.
INSERT INTO public.transaction_types (id, company_id, name, color, math_factor, impact_type, is_active)
SELECT gen_random_uuid()::text, c.id, 'deposit', 'purple', -1, 'decrease', true
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.transaction_types tt
    WHERE tt.company_id = c.id
      AND tt.name = 'deposit'
);

INSERT INTO public.transaction_types (id, company_id, name, color, math_factor, impact_type, is_active)
SELECT gen_random_uuid()::text, NULL, 'deposit', 'purple', -1, 'decrease', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.transaction_types tt
    WHERE tt.company_id IS NULL
      AND tt.name = 'deposit'
);
