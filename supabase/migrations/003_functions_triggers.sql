-- Migration: 003_functions_triggers.sql
-- Description: Database functions and triggers for debt repayment application
-- Date: 2024-01-01

-- Function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customers 
        SET 
            total_balance = total_balance + 
                CASE 
                    WHEN NEW.transaction_type = 'payment' THEN -NEW.amount  -- Payment reduces debt
                    WHEN NEW.transaction_type = 'charge' THEN NEW.amount    -- Charge increases debt
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount -- Adjustment can be positive/negative
                    WHEN NEW.transaction_type = 'refund' THEN -NEW.amount   -- Refund reduces debt
                    ELSE 0
                END,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- First, reverse the old transaction
        UPDATE public.customers 
        SET 
            total_balance = total_balance - 
                CASE 
                    WHEN OLD.transaction_type = 'payment' THEN -OLD.amount  -- Reverse payment
                    WHEN OLD.transaction_type = 'charge' THEN OLD.amount    -- Reverse charge
                    WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount -- Reverse adjustment
                    WHEN OLD.transaction_type = 'refund' THEN -OLD.amount   -- Reverse refund
                    ELSE 0
                END
        WHERE id = OLD.customer_id;
        
        -- Then, apply the new transaction
        UPDATE public.customers 
        SET 
            total_balance = total_balance + 
                CASE 
                    WHEN NEW.transaction_type = 'payment' THEN -NEW.amount  -- Payment reduces debt
                    WHEN NEW.transaction_type = 'charge' THEN NEW.amount    -- Charge increases debt
                    WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount -- Adjustment can be positive/negative
                    WHEN NEW.transaction_type = 'refund' THEN -NEW.amount   -- Refund reduces debt
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
                    WHEN OLD.transaction_type = 'payment' THEN -OLD.amount  -- Reverse payment
                    WHEN OLD.transaction_type = 'charge' THEN OLD.amount    -- Reverse charge
                    WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount -- Reverse adjustment
                    WHEN OLD.transaction_type = 'refund' THEN -OLD.amount   -- Reverse refund
                    ELSE 0
                END
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bank_accounts 
        SET balance = balance + 
            CASE 
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount  -- Payment increases bank balance
                WHEN NEW.transaction_type = 'charge' THEN -NEW.amount  -- Charge decreases bank balance
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount -- Adjustment can be positive/negative
                WHEN NEW.transaction_type = 'refund' THEN NEW.amount   -- Refund increases bank balance
                ELSE 0
            END
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- First, reverse the old transaction
        UPDATE public.bank_accounts 
        SET balance = balance - 
            CASE 
                WHEN OLD.transaction_type = 'payment' THEN OLD.amount  -- Reverse payment
                WHEN OLD.transaction_type = 'charge' THEN -OLD.amount  -- Reverse charge
                WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount -- Reverse adjustment
                WHEN OLD.transaction_type = 'refund' THEN OLD.amount   -- Reverse refund
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;
        
        -- Then, apply the new transaction
        UPDATE public.bank_accounts 
        SET balance = balance + 
            CASE 
                WHEN NEW.transaction_type = 'payment' THEN NEW.amount  -- Payment increases bank balance
                WHEN NEW.transaction_type = 'charge' THEN -NEW.amount  -- Charge decreases bank balance
                WHEN NEW.transaction_type = 'adjustment' THEN NEW.amount -- Adjustment can be positive/negative
                WHEN NEW.transaction_type = 'refund' THEN NEW.amount   -- Refund increases bank balance
                ELSE 0
            END
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - 
            CASE 
                WHEN OLD.transaction_type = 'payment' THEN OLD.amount  -- Reverse payment
                WHEN OLD.transaction_type = 'charge' THEN -OLD.amount  -- Reverse charge
                WHEN OLD.transaction_type = 'adjustment' THEN OLD.amount -- Reverse adjustment
                WHEN OLD.transaction_type = 'refund' THEN OLD.amount   -- Reverse refund
                ELSE 0
            END
        WHERE id = OLD.bank_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique transaction codes
CREATE OR REPLACE FUNCTION generate_transaction_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_code := 'TXN' || to_char(now(), 'YYYYMMDD') || lpad(counter::text, 4, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE transaction_code = new_code) THEN
            RETURN new_code;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique transaction code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique customer codes
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_code := 'CUST' || to_char(now(), 'YYYY') || lpad(counter::text, 4, '0');
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM public.customers WHERE customer_code = new_code) THEN
            RETURN new_code;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique customer code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_customer_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

CREATE TRIGGER trigger_update_bank_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();

-- Triggers for updated_at columns
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 