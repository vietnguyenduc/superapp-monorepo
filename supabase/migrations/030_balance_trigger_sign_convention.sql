-- Migration: 030_balance_trigger_sign_convention.sql
-- Description: Align DB triggers with the app sign convention:
--              negative balance = customer debt (công nợ), positive = credit.
-- Date: 2026-08-04

-- Function to update customer balance (negative = debt)
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customers
        SET
            total_balance = total_balance +
                CASE
                    WHEN NEW.transaction_type = 'payment' THEN NEW.amount       -- Payment reduces debt -> balance increases
                    WHEN NEW.transaction_type = 'charge' THEN -NEW.amount       -- Charge increases debt -> balance decreases
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount    -- Signed adjustment: + reduces debt, - increases debt
                    WHEN NEW.transaction_type = 'refund' THEN NEW.amount        -- Refund reduces debt -> balance increases
                    ELSE 0
                END,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse the old transaction
        UPDATE public.customers
        SET
            total_balance = total_balance -
                CASE
                    WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'charge' THEN -OLD.amount
                    WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                    WHEN OLD.transaction_type = 'refund' THEN OLD.amount
                    ELSE 0
                END
        WHERE id = OLD.customer_id;

        -- Apply the new transaction
        UPDATE public.customers
        SET
            total_balance = total_balance +
                CASE
                    WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'charge' THEN -NEW.amount
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
                    WHEN NEW.transaction_type = 'refund' THEN NEW.amount
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
                    ELSE 0
                END
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update bank account balance (cash convention)
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bank_accounts
        SET balance = balance +
            CASE
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount       -- Cash in
                WHEN NEW.transaction_type = 'refund' THEN -NEW.amount       -- Cash out
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount    -- Signed adjustment
                WHEN NEW.transaction_type = 'charge' THEN 0                 -- Charge does not move cash
                ELSE 0
            END
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse the old transaction
        UPDATE public.bank_accounts
        SET balance = balance -
            CASE
                WHEN OLD.transaction_type = 'payment' THEN OLD.amount
                WHEN OLD.transaction_type = 'refund' THEN -OLD.amount
                WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount
                WHEN OLD.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;

        -- Apply the new transaction
        UPDATE public.bank_accounts
        SET balance = balance +
            CASE
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount
                WHEN NEW.transaction_type = 'refund' THEN -NEW.amount
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount
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
                WHEN OLD.transaction_type = 'charge' THEN 0
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers to bind them to the updated functions
DROP TRIGGER IF EXISTS trigger_update_customer_balance ON public.transactions;
CREATE TRIGGER trigger_update_customer_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

DROP TRIGGER IF EXISTS trigger_update_bank_account_balance ON public.transactions;
CREATE TRIGGER trigger_update_bank_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();
