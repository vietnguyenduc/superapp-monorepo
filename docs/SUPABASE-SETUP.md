# Supabase Setup Guide

## Overview

This guide will help you set up Supabase for the Debt Repayment Web Application, including project creation, database schema, and environment configuration.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `debt-repayment-app` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (usually takes 1-2 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 3: Configure Environment Variables

1. Create a `.env` file in your project root (copy from `env.example`)
2. Add your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
```

## Step 4: Database Schema Setup

### Create Tables

Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'branch_manager', 'staff');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('payment', 'charge', 'adjustment', 'refund');

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

-- Branches table
CREATE TABLE public.branches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
```

## Step 5: Row Level Security (RLS) Policies

Enable RLS and create policies for data security:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Branches policies
CREATE POLICY "Users can view their branch" ON public.branches
    FOR SELECT USING (
        id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Bank accounts policies
CREATE POLICY "Users can view their branch bank accounts" ON public.bank_accounts
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Customers policies
CREATE POLICY "Users can view their branch customers" ON public.customers
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can manage their branch customers" ON public.customers
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transactions policies
CREATE POLICY "Users can view their branch transactions" ON public.transactions
    FOR SELECT USING (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can create transactions for their branch" ON public.transactions
    FOR INSERT WITH CHECK (
        branch_id = (SELECT branch_id FROM public.users WHERE id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

## Step 6: Functions and Triggers

Create functions for automatic updates:

```sql
-- Function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customers 
        SET 
            total_balance = total_balance + NEW.amount,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.customers 
        SET 
            total_balance = total_balance - OLD.amount + NEW.amount,
            last_transaction_date = NEW.transaction_date
        WHERE id = NEW.customer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.customers 
        SET 
            total_balance = total_balance - OLD.amount
        WHERE id = OLD.customer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for customer balance updates
CREATE TRIGGER trigger_update_customer_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

-- Function to update bank account balance
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bank_accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - OLD.amount + NEW.amount
        WHERE id = NEW.bank_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.bank_accounts 
        SET balance = balance - OLD.amount
        WHERE id = OLD.bank_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bank account balance updates
CREATE TRIGGER trigger_update_bank_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_bank_account_balance();
```

## Step 7: Seed Data (Optional)

Add some initial data for testing:

```sql
-- Insert sample branches
INSERT INTO public.branches (name, code, address, phone, email) VALUES
('Main Branch', 'MB001', '123 Main Street, City', '+1234567890', 'main@company.com'),
('North Branch', 'NB001', '456 North Ave, City', '+1234567891', 'north@company.com'),
('South Branch', 'SB001', '789 South Blvd, City', '+1234567892', 'south@company.com');

-- Insert sample bank accounts
INSERT INTO public.bank_accounts (account_number, account_name, bank_name, branch_id) VALUES
('1234567890', 'Main Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'MB001')),
('0987654321', 'North Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'NB001')),
('1122334455', 'South Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'SB001'));
```

## Step 8: Authentication Setup

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure email templates and settings
3. Set up any additional authentication providers if needed (Google, GitHub, etc.)

## Step 9: Storage Setup (Optional)

If you need file uploads:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `documents`
3. Set up appropriate policies for file access

## Step 10: Testing the Setup

1. Start your development server: `npm run dev`
2. Check the browser console for any Supabase connection errors
3. Test authentication by trying to sign up/sign in
4. Verify that the database connection is working

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Make sure your `.env` file is in the project root and starts with `VITE_`
2. **CORS errors**: Check that your Supabase URL is correct
3. **RLS blocking queries**: Verify that your user is authenticated and policies are set up correctly
4. **Database connection errors**: Check that your Supabase project is active and credentials are correct

### Useful Commands

```bash
# Check if environment variables are loaded
npm run dev

# Test Supabase connection
# Check browser console for connection status
```

## Next Steps

After completing this setup:

1. Configure your application to use the Supabase client
2. Set up authentication flows
3. Create API functions for data operations
4. Test all CRUD operations
5. Deploy to production with proper environment variables

## Security Notes

- Never commit your `.env` file to version control
- Use different Supabase projects for development, staging, and production
- Regularly rotate your API keys
- Monitor your Supabase usage and set up alerts
- Review and update RLS policies regularly 