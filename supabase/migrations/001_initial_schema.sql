-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for debt repayment application
-- Date: 2024-01-01

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'branch_manager', 'staff');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('payment', 'charge', 'adjustment', 'refund');

-- Branches table
CREATE TABLE public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'staff',
    branch_id UUID REFERENCES public.branches(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for branches.manager_id
ALTER TABLE public.branches 
ADD CONSTRAINT fk_branches_manager 
FOREIGN KEY (manager_id) REFERENCES public.users(id);

-- Bank accounts table
CREATE TABLE public.bank_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    branch_id UUID REFERENCES public.branches(id),
    balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    branch_id UUID REFERENCES public.branches(id),
    total_balance DECIMAL(15,2) DEFAULT 0.00,
    last_transaction_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    branch_id UUID REFERENCES public.branches(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_number TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_customers_branch_id ON public.customers(branch_id);
CREATE INDEX idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX idx_transactions_branch_id ON public.transactions(branch_id);
CREATE INDEX idx_transactions_transaction_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_bank_account_id ON public.transactions(bank_account_id);
CREATE INDEX idx_users_branch_id ON public.users(branch_id);
CREATE INDEX idx_bank_accounts_branch_id ON public.bank_accounts(branch_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY; 