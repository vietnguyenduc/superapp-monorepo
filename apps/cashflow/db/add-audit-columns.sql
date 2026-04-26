-- Add audit columns (created_by, updated_by) to all main tables
-- This enables tracking who created and modified each record

-- Add created_by and updated_by to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add updated_by to transactions (created_by already exists)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add created_by and updated_by to bank_accounts
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add created_by and updated_by to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add created_by and updated_by to transaction_types
ALTER TABLE transaction_types ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE transaction_types ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add created_by and updated_by to customer_fields
ALTER TABLE customer_fields ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE customer_fields ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes for audit columns
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_updated_by ON customers(updated_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_by ON transactions(updated_by);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_created_by ON bank_accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_updated_by ON bank_accounts(updated_by);
CREATE INDEX IF NOT EXISTS idx_branches_created_by ON branches(created_by);
CREATE INDEX IF NOT EXISTS idx_branches_updated_by ON branches(updated_by);
CREATE INDEX IF NOT EXISTS idx_transaction_types_created_by ON transaction_types(created_by);
CREATE INDEX IF NOT EXISTS idx_transaction_types_updated_by ON transaction_types(updated_by);
CREATE INDEX IF NOT EXISTS idx_customer_fields_created_by ON customer_fields(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_fields_updated_by ON customer_fields(updated_by);

-- Add comments
COMMENT ON COLUMN customers.created_by IS 'User who created this customer record';
COMMENT ON COLUMN customers.updated_by IS 'User who last updated this customer record';
COMMENT ON COLUMN transactions.updated_by IS 'User who last updated this transaction record';
COMMENT ON COLUMN bank_accounts.created_by IS 'User who created this bank account record';
COMMENT ON COLUMN bank_accounts.updated_by IS 'User who last updated this bank account record';
COMMENT ON COLUMN branches.created_by IS 'User who created this branch record';
COMMENT ON COLUMN branches.updated_by IS 'User who last updated this branch record';
COMMENT ON COLUMN transaction_types.created_by IS 'User who created this transaction type record';
COMMENT ON COLUMN transaction_types.updated_by IS 'User who last updated this transaction type record';
COMMENT ON COLUMN customer_fields.created_by IS 'User who created this customer field record';
COMMENT ON COLUMN customer_fields.updated_by IS 'User who last updated this customer field record';
