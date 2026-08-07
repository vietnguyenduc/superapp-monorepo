-- Migration: 034_deposit_transaction_type.sql
-- Description: Add 'deposit' (Đặt cọc) transaction type and align DB triggers
-- Date: 2026-08-04

-- 1. Add 'deposit' to the transaction_type enum idempotently
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'transaction_type'::regtype
          AND enumlabel = 'deposit'
    ) THEN
        ALTER TYPE transaction_type ADD VALUE 'deposit';
    END IF;
END $$;

-- 2. Ensure the balance trigger functions understand deposit
--    Deposit behaves like payment for the customer balance (reduces debt)
--    and like payment for the bank account (cash in).
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customers
        SET
            total_balance = total_balance +
                CASE
                    WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'charge' THEN -NEW.amount
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'refund' THEN NEW.amount
                    WHEN NEW.transaction_type = 'deposit' THEN NEW.amount
                    ELSE 0
                END,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.customers
        SET
            total_balance = total_balance -
                CASE
                    WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'charge' THEN -OLD.amount
                    WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'refund' THEN OLD.amount
                    WHEN OLD.transaction_type = 'deposit' THEN OLD.amount
                    ELSE 0
                END
        WHERE id = OLD.customer_id;

        UPDATE public.customers
        SET
            total_balance = total_balance +
                CASE
                    WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'charge' THEN -NEW.amount
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'refund' THEN NEW.amount
                    WHEN NEW.transaction_type = 'deposit' THEN NEW.amount
                    ELSE 0
                END,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.customers
        SET
            total_balance = total_balance -
                CASE
                    WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'charge' THEN -OLD.amount
                    WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'refund' THEN OLD.amount
                    WHEN OLD.transaction_type = 'deposit' THEN OLD.amount
                    ELSE 0
                END
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bank_accounts
        SET balance = balance +
            CASE
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                WHEN NEW.transaction_type = 'refund' THEN -NEW.amount
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
                WHEN NEW.transaction_type = 'deposit' THEN NEW.amount
                WHEN NEW.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.bank_accounts
        SET balance = balance -
            CASE
                WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                WHEN OLD.transaction_type = 'refund' THEN -OLD.amount
                WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                WHEN OLD.transaction_type = 'deposit' THEN OLD.amount
                WHEN OLD.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;

        UPDATE public.bank_accounts
        SET balance = balance +
            CASE
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                WHEN NEW.transaction_type = 'refund' THEN -NEW.amount
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
                WHEN NEW.transaction_type = 'deposit' THEN NEW.amount
                WHEN NEW.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.bank_accounts
        SET balance = balance -
            CASE
                WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                WHEN OLD.transaction_type = 'refund' THEN -OLD.amount
                WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                WHEN OLD.transaction_type = 'deposit' THEN OLD.amount
                WHEN OLD.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_balance ON public.transactions;
CREATE TRIGGER trigger_update_customer_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

DROP TRIGGER IF EXISTS trigger_update_bank_account_balance ON public.transactions;
CREATE TRIGGER trigger_update_bank_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- 3. Seed the deposit transaction type for every existing company and global default
INSERT INTO public.transaction_types (company_id, name, color, math_factor, impact_type, is_active)
SELECT DISTINCT company_id, 'deposit', 'purple', -1, 'decrease', true
FROM public.companies
WHERE company_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.transaction_types tt
      WHERE tt.company_id = companies.company_id
        AND tt.name = 'deposit'
  );

INSERT INTO public.transaction_types (company_id, name, color, math_factor, impact_type, is_active)
SELECT NULL, 'deposit', 'purple', -1, 'decrease', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.transaction_types tt
    WHERE tt.company_id IS NULL
      AND tt.name = 'deposit'
);
