-- Add triggers to automatically update audit columns (updated_by, updated_at)
-- These triggers fire on UPDATE operations to track who modified the record

-- Create trigger function to update audit columns
CREATE OR REPLACE FUNCTION update_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to customers
DROP TRIGGER IF EXISTS trigger_customers_audit ON customers;
CREATE TRIGGER trigger_customers_audit
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Apply trigger to transactions
DROP TRIGGER IF EXISTS trigger_transactions_audit ON transactions;
CREATE TRIGGER trigger_transactions_audit
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Apply trigger to bank_accounts
DROP TRIGGER IF EXISTS trigger_bank_accounts_audit ON bank_accounts;
CREATE TRIGGER trigger_bank_accounts_audit
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Apply trigger to branches
DROP TRIGGER IF EXISTS trigger_branches_audit ON branches;
CREATE TRIGGER trigger_branches_audit
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Apply trigger to transaction_types
DROP TRIGGER IF EXISTS trigger_transaction_types_audit ON transaction_types;
CREATE TRIGGER trigger_transaction_types_audit
    BEFORE UPDATE ON transaction_types
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Apply trigger to customer_fields
DROP TRIGGER IF EXISTS trigger_customer_fields_audit ON customer_fields;
CREATE TRIGGER trigger_customer_fields_audit
    BEFORE UPDATE ON customer_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_columns();

-- Add comments
COMMENT ON FUNCTION update_audit_columns() IS 'Automatically updates updated_by and updated_at columns on record modification';
