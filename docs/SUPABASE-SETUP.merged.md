# Supabase Setup Guide

## Overview

This guide will help you set up Supabase for the Cashflow Management System, including project creation, database schema, and environment configuration.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `cashflow-management` (or your preferred name)
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

-- The canonical schema is maintained in supabase/migrations/.
-- Run them in order via the Supabase Dashboard SQL Editor or CLI.
--
-- 001_initial_schema.sql        -> Base tables (branches, users, bank_accounts, customers, transactions)
-- 005_multi_level_admin_schema.sql -> Companies, granular roles, user fields, RLS policies
-- 005b_create_companies_table.sql  -> Companies table (if separate)
-- 006_multi_tenancy_company_id.sql -> Multi-tenancy (company_id), transaction_types, customer_fields
--
-- Key schema facts:
-- - 11 tables: users, companies, branches, bank_accounts, customers,
--   transactions, transaction_types, customer_fields, color_settings,
--   user_preferences, backup_history
-- - Multi-tenancy enforced via company_id on all data tables
-- - transaction_types is a dynamic table (NOT a hardcoded enum)
-- - Composite unique constraints include company_id
--   (company_id, customer_code), (company_id, transaction_code), (company_id, code) for branches
-- - RLS enabled on all tables

-- Quick verification after running migrations:
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

## Step 5: Row Level Security (RLS) Policies

RLS policies are defined in the migration files (primarily `005_multi_level_admin_schema.sql`).
Run those migrations instead of copying inline policies to ensure you get the latest version.

Key policy principles:
- **Users** can view/update their own profile (`auth.uid() = id`)
- **Admin Master** (`role = 'admin_master'`) has full access to all tables
- **Admin Company** (`role = 'admin_company'`) has access scoped to their `company_id`
- **Staff / Branch Manager** access is scoped to their `branch_id` and `company_id`
- **All 11 tables** have RLS enabled (`users`, `companies`, `branches`, `bank_accounts`, `customers`, `transactions`, `transaction_types`, `customer_fields`, `color_settings`, `user_preferences`, `backup_history`)

Quick verification:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
```

## Step 6: Edge Functions

The app uses a Supabase Edge Function to create user records after signup.

Deploy the `create-user` Edge Function:
```bash
supabase functions deploy create-user
```

The function code lives in `supabase/functions/create-user/` and inserts a row into `public.users` after a new auth user signs up.

## Step 7: Application-Level Balance Calculation

> **Note:** The current architecture does **not** use database triggers for balance updates.
> Customer balances (`opening_balance`, `current_balance`) are calculated in the
> application service layer (`src/services/database.ts`). This allows the math factor
> (defined per `transaction_types` row) to be applied correctly for each transaction.

## Step 8: Seed Data (Optional)

Add some initial data for testing. Note: `company_id` is required on most tables due to multi-tenancy.

```sql
-- Create a sample company first
INSERT INTO public.companies (name, code) VALUES
('Demo Company', 'DEMO001');

-- Insert sample branches (company_id required for RLS)
INSERT INTO public.branches (name, code, address, phone, email, company_id) VALUES
('Main Branch', 'MB001', '123 Main Street, City', '+1234567890', 'main@company.com', (SELECT id FROM public.companies WHERE code = 'DEMO001')),
('North Branch', 'NB001', '456 North Ave, City', '+1234567891', 'north@company.com', (SELECT id FROM public.companies WHERE code = 'DEMO001')),
('South Branch', 'SB001', '789 South Blvd, City', '+1234567892', 'south@company.com', (SELECT id FROM public.companies WHERE code = 'DEMO001'));

-- Insert sample bank accounts
INSERT INTO public.bank_accounts (account_number, account_name, bank_name, branch_id, company_id) VALUES
('1234567890', 'Main Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'MB001'), (SELECT id FROM public.companies WHERE code = 'DEMO001')),
('0987654321', 'North Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'NB001'), (SELECT id FROM public.companies WHERE code = 'DEMO001')),
('1122334455', 'South Operating Account', 'City Bank', (SELECT id FROM public.branches WHERE code = 'SB001'), (SELECT id FROM public.companies WHERE code = 'DEMO001'));
```

## Step 9: Authentication Setup

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure email templates and settings
3. Set up any additional authentication providers if needed (Google, GitHub, etc.)

## Step 10: Storage Setup (Optional)

If you need file uploads:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `documents`
3. Set up appropriate policies for file access

## Step 11: Testing the Setup

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