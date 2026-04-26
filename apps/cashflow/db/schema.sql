-- Cashflow Database Schema
-- AI-Native Development - Complete Database Structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'branch_manager', 'staff');
CREATE TYPE transaction_business_type AS ENUM ('increase', 'decrease', 'adjustment');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table with RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    position TEXT,
    role user_role NOT NULL DEFAULT 'staff',
    branch_id UUID REFERENCES branches(id),
    staff_permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction types
CREATE TABLE transaction_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    business_type transaction_business_type NOT NULL,
    default_payment_method TEXT,
    requires_approval BOOLEAN DEFAULT false,
    minimum_amount DECIMAL(15,2),
    maximum_amount DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2),
    payment_terms INTEGER DEFAULT 30,
    customer_category TEXT,
    industry_type TEXT,
    assigned_staff UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    last_transaction_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_customer_code_per_branch UNIQUE (customer_code, branch_id),
    CONSTRAINT positive_opening_balance CHECK (opening_balance >= 0),
    CONSTRAINT positive_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT valid_payment_terms CHECK (payment_terms > 0)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    transaction_type_id UUID REFERENCES transaction_types(id) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    branch_id UUID REFERENCES branches(id),
    created_by UUID REFERENCES users(id) NOT NULL,
    approved_by UUID REFERENCES users(id),
    approval_status approval_status DEFAULT 'pending',
    category_tags TEXT[],
    attachments TEXT[],
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_transaction_date CHECK (transaction_date <= NOW()),
    CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    account_type TEXT,
    branch_id UUID REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_balance CHECK (balance >= 0),
    CONSTRAINT positive_opening_balance CHECK (opening_balance >= 0)
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    branch_id UUID REFERENCES branches(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance

-- Users indexes
CREATE INDEX idx_users_branch_role ON users(branch_id, role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Customers indexes
CREATE INDEX idx_customers_branch_active ON customers(branch_id, is_active);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name ON customers(full_name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_balance ON customers(current_balance);
CREATE INDEX idx_customers_last_transaction ON customers(last_transaction_date DESC);

-- Transactions indexes
CREATE INDEX idx_transactions_customer_date ON transactions(customer_id, transaction_date DESC);
CREATE INDEX idx_transactions_branch_date ON transactions(branch_id, transaction_date DESC);
CREATE INDEX idx_transactions_type_date ON transactions(transaction_type_id, transaction_date DESC);
CREATE INDEX idx_transactions_code ON transactions(transaction_code);
CREATE INDEX idx_transactions_amount ON transactions(amount);
CREATE INDEX idx_transactions_status ON transactions(approval_status);
CREATE INDEX idx_transactions_deleted ON transactions(is_deleted);

-- Bank accounts indexes
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active);
CREATE INDEX idx_bank_accounts_branch ON bank_accounts(branch_id);
CREATE INDEX idx_bank_accounts_number ON bank_accounts(account_number);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create triggers for automatic updates

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaction_types_updated_at BEFORE UPDATE ON transaction_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id, branch_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD), OLD.created_by, OLD.branch_id);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, branch_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.created_by, NEW.branch_id);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id, branch_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by, NEW.branch_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to relevant tables
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_bank_accounts AFTER INSERT OR UPDATE OR DELETE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Customer balance update trigger
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer's current balance and last transaction date
    UPDATE customers 
    SET 
        current_balance = (
            SELECT COALESCE(SUM(
                CASE 
                    WHEN tt.business_type = 'increase' THEN t.amount
                    WHEN tt.business_type = 'decrease' THEN -t.amount
                    ELSE 0 
                END
            ), 0) + opening_balance
            FROM transactions t
            JOIN transaction_types tt ON t.transaction_type_id = tt.id
            WHERE t.customer_id = NEW.customer_id 
            AND t.is_deleted = false
        ),
        last_transaction_date = (
            SELECT MAX(transaction_date)
            FROM transactions t
            WHERE t.customer_id = NEW.customer_id 
            AND t.is_deleted = false
        )
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply balance update trigger
CREATE TRIGGER update_balance_on_transaction 
AFTER INSERT OR UPDATE OR DELETE ON transactions 
FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

-- Generate customer code function
CREATE OR REPLACE FUNCTION generate_customer_code(p_branch_id UUID)
RETURNS TEXT AS $$
DECLARE
    branch_code TEXT;
    sequence_number INTEGER;
BEGIN
    -- Get branch code
    SELECT code INTO branch_code FROM branches WHERE id = p_branch_id;
    
    -- Get next sequence number for this branch
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM customers 
    WHERE branch_id = p_branch_id;
    
    -- Return formatted code: CUST_BRANCHCODE_0001
    RETURN 'CUST_' || branch_code || '_' || LPAD(sequence_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate transaction code function
CREATE OR REPLACE FUNCTION generate_transaction_code()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    sequence_number INTEGER;
BEGIN
    -- Get date part: YYYYMMDD
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_code FROM 12) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM transactions 
    WHERE transaction_code LIKE 'TXN_' || date_part || '%';
    
    -- Return formatted code: TXN_YYYYMMDD_0001
    RETURN 'TXN_' || date_part || '_' || LPAD(sequence_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert default data

-- Default transaction types
INSERT INTO transaction_types (name, description, business_type) VALUES
('Thu tiền', 'Khách hàng thanh toán công nợ', 'increase'),
('Bán hàng', 'Giao dịch bán hàng phát sinh công nợ', 'decrease'),
('Chiết khấu', 'Giảm trừ công nợ cho khách hàng', 'adjustment'),
('Phạt', 'Phạt trễ thanh toán', 'increase'),
('Hoàn tiền', 'Hoàn lại tiền cho khách hàng', 'decrease'),
('Điều chỉnh tăng', 'Điều chỉnh tăng công nợ', 'adjustment'),
('Điều chỉnh giảm', 'Điều chỉnh giảm công nợ', 'adjustment');

-- Default system settings
INSERT INTO system_settings (key, value, description) VALUES
('app_name', '"Quản lý công nợ - TPL"', 'Application name'),
('default_currency', '"VND"', 'Default currency'),
('date_format', '"DD/MM/YYYY"', 'Date format'),
('decimal_places', '0', 'Decimal places for amounts'),
('enable_email_notifications', 'true', 'Enable email notifications'),
('backup_retention_days', '90', 'Backup retention period in days');

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added separately based on requirements
-- Allow admins to update any user
CREATE POLICY "Admins can update user permissions" ON users FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
-- Create views for common queries

-- Customer balance view
CREATE VIEW customer_balance_view AS
SELECT 
    c.id,
    c.customer_code,
    c.full_name,
    c.phone,
    c.email,
    c.branch_id,
    b.name as branch_name,
    c.opening_balance,
    COALESCE(c.current_balance, 0) as current_balance,
    c.last_transaction_date,
    c.is_active,
    c.created_at,
    -- Calculate aging
    CASE 
        WHEN c.last_transaction_date IS NULL THEN 0
        WHEN c.current_balance <= 0 THEN 0
        ELSE EXTRACT(DAYS FROM NOW() - c.last_transaction_date)
    END as days_since_last_transaction
FROM customers c
JOIN branches b ON c.branch_id = b.id;

-- Transaction summary view
CREATE VIEW transaction_summary_view AS
SELECT 
    t.id,
    t.transaction_code,
    t.customer_id,
    c.full_name as customer_name,
    c.customer_code,
    t.transaction_type_id,
    tt.name as transaction_type_name,
    tt.business_type,
    t.amount,
    t.transaction_date,
    t.branch_id,
    b.name as branch_name,
    t.created_by,
    u.full_name as created_by_name,
    t.approval_status,
    t.notes,
    -- Balance impact
    CASE 
        WHEN tt.business_type = 'increase' THEN t.amount
        WHEN tt.business_type = 'decrease' THEN -t.amount
        ELSE 0 
    END as balance_impact
FROM transactions t
JOIN customers c ON t.customer_id = c.id
JOIN transaction_types tt ON t.transaction_type_id = tt.id
JOIN branches b ON t.branch_id = b.id
JOIN users u ON t.created_by = u.id
WHERE t.is_deleted = false;

-- Branch performance view
CREATE VIEW branch_performance_view AS
SELECT 
    b.id,
    b.name,
    b.code,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_customer_count,
    COALESCE(SUM(c.current_balance), 0) as total_outstanding,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(t.amount), 0) as total_transaction_volume,
    COUNT(DISTINCT u.id) as user_count,
    MAX(t.transaction_date) as last_transaction_date
FROM branches b
LEFT JOIN customers c ON b.id = c.branch_id
LEFT JOIN transactions t ON b.id = t.branch_id AND t.is_deleted = false
LEFT JOIN users u ON b.id = u.branch_id AND u.is_active
GROUP BY b.id, b.name, b.code;

-- Grant necessary permissions
-- Note: These will be adjusted based on RLS policies

-- Create functions for common operations

-- Get customer aging
CREATE OR REPLACE FUNCTION get_customer_aging(p_customer_id UUID)
RETURNS TABLE (
    current DECIMAL,
    days_30 DECIMAL,
    days_60 DECIMAL,
    days_90 DECIMAL,
    days_90_plus DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as current,
        COALESCE(SUM(CASE WHEN t.amount < 0 AND EXTRACT(DAYS FROM NOW() - t.transaction_date) <= 30 THEN ABS(t.amount) ELSE 0 END), 0) as days_30,
        COALESCE(SUM(CASE WHEN t.amount < 0 AND EXTRACT(DAYS FROM NOW() - t.transaction_date) BETWEEN 31 AND 60 THEN ABS(t.amount) ELSE 0 END), 0) as days_60,
        COALESCE(SUM(CASE WHEN t.amount < 0 AND EXTRACT(DAYS FROM NOW() - t.transaction_date) BETWEEN 61 AND 90 THEN ABS(t.amount) ELSE 0 END), 0) as days_90,
        COALESCE(SUM(CASE WHEN t.amount < 0 AND EXTRACT(DAYS FROM NOW() - t.transaction_date) > 90 THEN ABS(t.amount) ELSE 0 END), 0) as days_90_plus
    FROM transactions t
    WHERE t.customer_id = p_customer_id 
    AND t.is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Get branch metrics
CREATE OR REPLACE FUNCTION get_branch_metrics(p_branch_id UUID, p_date_from TIMESTAMPTZ DEFAULT NULL, p_date_to TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
    total_customers INTEGER,
    active_customers INTEGER,
    total_outstanding DECIMAL,
    transaction_count INTEGER,
    total_volume DECIMAL,
    new_customers INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_customers,
        COALESCE(SUM(c.current_balance), 0) as total_outstanding,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_volume,
        COUNT(DISTINCT CASE WHEN c.created_at >= COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ) THEN c.id END) as new_customers
    FROM branches b
    LEFT JOIN customers c ON b.id = c.branch_id
    LEFT JOIN transactions t ON b.id = t.branch_id 
        AND t.is_deleted = false 
        AND (p_date_from IS NULL OR t.transaction_date >= p_date_from)
        AND (p_date_to IS NULL OR t.transaction_date <= p_date_to)
    WHERE b.id = p_branch_id;
END;
$$ LANGUAGE plpgsql;

-- This schema provides a solid foundation for the AI-native Cashflow application
-- with proper constraints, triggers, indexes, and performance optimizations

-- Next steps:
-- 1. Implement Row Level Security policies
-- 2. Create migration scripts for version control
-- 3. Set up backup and recovery procedures
-- 4. Configure monitoring and alerting
