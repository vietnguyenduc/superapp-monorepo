-- Drop duplicate policies that already exist on remote
DROP POLICY IF EXISTS "Admin Master can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin Master can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admin Company can view company users" ON public.users;
DROP POLICY IF EXISTS "Admin Company can manage company users" ON public.users;
DROP POLICY IF EXISTS "Admin Master can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admin Master can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Admin Master can manage all branches" ON public.branches;
DROP POLICY IF EXISTS "Admin Company can manage company branches" ON public.branches;
DROP POLICY IF EXISTS "Users can view their branch bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can manage their branch bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can view their branch customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage their branch customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions for their branch" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their branch transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their branch transactions" ON public.transactions;
