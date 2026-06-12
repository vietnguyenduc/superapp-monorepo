# Multi-Level Admin System - Database Schema Design

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Draft  
**Author:** Database Guardian

> **Implementation Note:** The `audit_logs` table described in this design document was implemented as `backup_history` in the actual system. See `database_map.md` and `supabase/migrations/` for the current production schema.

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Users Table](#users-table)
3. [Companies Table](#companies-table)
4. [Branches Table](#branches-table)
5. [Audit Logs Table](#audit-logs-table)
6. [RLS Policies](#rls-policies)
7. [Indexes](#indexes)
8. [Constraints](#constraints)
9. [Triggers](#triggers)
10. [Migration Script](#migration-script)

## Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   users     │────────▶│  companies  │◀────────│   users     │
│             │company_id│             │         │ (created_by)│
└─────────────┘         └─────────────┘         └─────────────┘
       │                                                 │
       │ branch_id                                       │
       │                                                 │
       ▼                                                 │
┌─────────────┐                                         │
│  branches   │                                         │
│             │                                         │
└─────────────┘                                         │
       │                                                 │
       │ company_id                                     │
       └─────────────────────────────────────────────────┘

┌─────────────┐
│ audit_logs  │
│             │
└─────────────┘
       │
       │ user_id
       │
       ▼
┌─────────────┐
│   users     │
└─────────────┘
```

### Schema Changes Summary

**New Tables:**
- `companies` - Company/organization management
- `audit_logs` - Audit trail for user actions

**Modified Tables:**
- `users` - Add company_id, avatar_url, created_by fields
- `branches` - Ensure company_id foreign key exists

**Updated Constraints:**
- Role check constraint for new roles
- Foreign key constraints for company relationships
- Unique constraints for company codes

## Users Table

### Schema Definition

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  position TEXT,
  avatar_url TEXT,
  
  -- Role & Permissions
  role TEXT NOT NULL CHECK (role IN ('admin_master', 'admin_company', 'staff')),
  staff_permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Company & Branch Assignment
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Audit Trail
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `email` | TEXT | User email, unique identifier |
| `full_name` | TEXT | User's full name |
| `phone` | TEXT | User's phone number |
| `position` | TEXT | Job title or position |
| `avatar_url` | TEXT | URL to user's avatar image |
| `role` | TEXT | User role: 'admin_master', 'admin_company', or 'staff' |
| `staff_permissions` | JSONB | Granular permissions for staff users |
| `company_id` | UUID | Foreign key to companies table |
| `branch_id` | UUID | Foreign key to branches table |
| `created_by` | UUID | Foreign key to users table (who created this user) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `is_active` | BOOLEAN | Account active status |

### Staff Permissions JSONB Structure

```json
{
  "import_customers": true,
  "import_transactions": true,
  "view_reports": false,
  "export_data": true,
  "manage_settings": false
}
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_created_by ON users(created_by);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Composite index for common queries
CREATE INDEX idx_users_company_role ON users(company_id, role);
CREATE INDEX idx_users_company_branch ON users(company_id, branch_id);
```

## Companies Table

### Schema Definition

```sql
CREATE TABLE companies (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  
  -- Contact Information
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Audit Trail
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | TEXT | Company name |
| `code` | TEXT | Unique company code |
| `logo_url` | TEXT | URL to company logo |
| `description` | TEXT | Company description |
| `address` | TEXT | Company address |
| `phone` | TEXT | Company phone number |
| `email` | TEXT | Company email |
| `website` | TEXT | Company website URL |
| `created_by` | UUID | Foreign key to users table (who created this company) |
| `created_at` | TIMESTAMP | Company creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `is_active` | BOOLEAN | Company active status |

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_created_at ON companies(created_at);
```

## Branches Table

### Schema Definition

```sql
CREATE TABLE branches (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Branch Information
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  
  -- Company Assignment
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Manager Assignment
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit Trail
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  UNIQUE(company_id, code)
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | TEXT | Branch name |
| `code` | TEXT | Branch code (unique within company) |
| `address` | TEXT | Branch address |
| `phone` | TEXT | Branch phone number |
| `email` | TEXT | Branch email |
| `company_id` | UUID | Foreign key to companies table (required) |
| `manager_id` | UUID | Foreign key to users table (branch manager) |
| `created_by` | UUID | Foreign key to users table (who created this branch) |
| `created_at` | TIMESTAMP | Branch creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `is_active` | BOOLEAN | Branch active status |

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_branches_active ON branches(is_active);
CREATE INDEX idx_branches_created_by ON branches(created_by);
CREATE INDEX idx_branches_created_at ON branches(created_at);

-- Composite index for company-specific queries
CREATE INDEX idx_branches_company_code ON branches(company_id, code);
```

## Audit Logs Table

### Schema Definition

```sql
CREATE TABLE audit_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Action Information
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  
  -- Details
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to users table (who performed the action) |
| `action` | TEXT | Action performed (e.g., 'create', 'update', 'delete') |
| `resource` | TEXT | Resource type (e.g., 'users', 'companies', 'branches') |
| `resource_id` | UUID | ID of the affected resource |
| `details` | JSONB | Additional details about the action |
| `ip_address` | TEXT | IP address of the user |
| `user_agent` | TEXT | User agent string |
| `created_at` | TIMESTAMP | Audit log creation timestamp |

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Composite index for common queries
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_resource_action ON audit_logs(resource, action);
```

## RLS Policies

### Users Table RLS Policies

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Admin Master: Full access to all users
CREATE POLICY users_admin_master_select ON users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

CREATE POLICY users_admin_master_insert ON users
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

CREATE POLICY users_admin_master_update ON users
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

CREATE POLICY users_admin_master_delete ON users
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

-- Admin Company: Access to users in their company only
CREATE POLICY users_admin_company_select ON users
FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
);

CREATE POLICY users_admin_company_insert ON users
FOR INSERT TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
  AND role = 'staff'  -- Can only create staff
);

CREATE POLICY users_admin_company_update ON users
FOR UPDATE TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
  AND role = 'staff'  -- Can only update staff
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
  AND role = 'staff'  -- Can only update staff
);

CREATE POLICY users_admin_company_delete ON users
FOR DELETE TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
  AND role = 'staff'  -- Can only delete staff
);

-- Staff: Access to own record only
CREATE POLICY users_staff_select ON users
FOR SELECT TO authenticated
USING (id = auth.uid()::uuid AND role = 'staff');

CREATE POLICY users_staff_update ON users
FOR UPDATE TO authenticated
USING (id = auth.uid()::uuid AND role = 'staff')
WITH CHECK (id = auth.uid()::uuid AND role = 'staff');
```

### Companies Table RLS Policies

```sql
-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS companies_select_policy ON companies;
DROP POLICY IF EXISTS companies_insert_policy ON companies;
DROP POLICY IF EXISTS companies_update_policy ON companies;
DROP POLICY IF EXISTS companies_delete_policy ON companies;

-- Admin Master: Full access
CREATE POLICY companies_admin_master_all ON companies
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

-- Admin Company: Read access to own company
CREATE POLICY companies_admin_company_select ON companies
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
);

-- Staff: Read access to own company
CREATE POLICY companies_staff_select ON companies
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'staff'
  )
);
```

### Branches Table RLS Policies

```sql
-- Enable RLS on branches table
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS branches_select_policy ON branches;
DROP POLICY IF EXISTS branches_insert_policy ON branches;
DROP POLICY IF EXISTS branches_update_policy ON branches;
DROP POLICY IF EXISTS branches_delete_policy ON branches;

-- Admin Master: Full access
CREATE POLICY branches_admin_master_all ON branches
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

-- Admin Company: Access to branches in their company
CREATE POLICY branches_admin_company_all ON branches
FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
);

-- Staff: Read access to own branch
CREATE POLICY branches_staff_select ON branches
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT branch_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'staff'
  )
);
```

## Indexes

### Complete Index List

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_created_by ON users(created_by);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_company_role ON users(company_id, role);
CREATE INDEX idx_users_company_branch ON users(company_id, branch_id);

-- Companies table indexes
CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Branches table indexes
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_branches_active ON branches(is_active);
CREATE INDEX idx_branches_created_by ON branches(created_by);
CREATE INDEX idx_branches_created_at ON branches(created_at);
CREATE INDEX idx_branches_company_code ON branches(company_id, code);

-- Audit logs table indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_resource_action ON audit_logs(resource, action);
```

## Constraints

### Users Table Constraints

```sql
-- Role check constraint
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin_master', 'admin_company', 'staff'));

-- Email format constraint (optional)
ALTER TABLE users ADD CONSTRAINT users_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Staff cannot be created without company and branch
ALTER TABLE users ADD CONSTRAINT users_staff_requires_company_branch 
CHECK (
  NOT (role = 'staff' AND (company_id IS NULL OR branch_id IS NULL))
);

-- Admin Company requires company
ALTER TABLE users ADD CONSTRAINT users_admin_company_requires_company 
CHECK (
  NOT (role = 'admin_company' AND company_id IS NULL)
);
```

### Companies Table Constraints

```sql
-- Company code format constraint (optional)
ALTER TABLE companies ADD CONSTRAINT companies_code_format 
CHECK (code ~* '^[A-Z0-9]{3,10}$');

-- Name not empty
ALTER TABLE companies ADD CONSTRAINT companies_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);
```

### Branches Table Constraints

```sql
-- Branch code format constraint (optional)
ALTER TABLE branches ADD CONSTRAINT branches_code_format 
CHECK (code ~* '^[A-Z0-9]{3,10}$');

-- Name not empty
ALTER TABLE branches ADD CONSTRAINT branches_name_not_empty 
CHECK (LENGTH(TRIM(name)) > 0);

-- Company required (already enforced by NOT NULL)
-- Code unique within company (already enforced by UNIQUE constraint)
```

## Triggers

### Staff Limit Enforcement Trigger

```sql
-- Function to check staff limit
CREATE OR REPLACE FUNCTION check_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
  staff_count INTEGER;
BEGIN
  -- Only check for new staff or reactivating staff
  IF NEW.role = 'staff' AND NEW.is_active = TRUE THEN
    -- Count active staff in the same company
    SELECT COUNT(*) INTO staff_count
    FROM users
    WHERE company_id = NEW.company_id
      AND role = 'staff'
      AND is_active = TRUE
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Enforce limit of 2 staff per company
    IF staff_count >= 2 THEN
      RAISE EXCEPTION 'Staff limit reached (max 2 per company). Current: %, Limit: 2', staff_count + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_staff_limit
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_staff_limit();
```

### Updated At Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Audit Log Trigger

```sql
-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the action
  INSERT INTO audit_logs (
    user_id,
    action,
    resource,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object(
      'old', OLD,
      'new', NEW
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for critical tables
CREATE TRIGGER log_users_changes AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER log_companies_changes AFTER INSERT OR UPDATE OR DELETE ON companies
FOR EACH ROW EXECUTE FUNCTION log_user_action();
```

## Migration Script

### Complete Migration Script

```sql
-- Migration: Multi-Level Admin System
-- Version: 1.0
-- Date: 2026-04-26

-- Begin transaction
BEGIN;

-- ============================================
-- Step 1: Create new tables
-- ============================================

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Step 2: Modify users table
-- ============================================

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin_master', 'admin_company', 'staff'));

-- Add new constraints
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_staff_requires_company_branch 
CHECK (NOT (role = 'staff' AND (company_id IS NULL OR branch_id IS NULL)));

ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_admin_company_requires_company 
CHECK (NOT (role = 'admin_company' AND company_id IS NULL));

-- ============================================
-- Step 3: Modify branches table (ensure company_id exists)
-- ============================================

-- Ensure branches table has company_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'branches' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE branches ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on company_id + code
ALTER TABLE branches DROP CONSTRAINT IF EXISTS branches_company_code_unique;
ALTER TABLE branches ADD CONSTRAINT branches_company_code_unique UNIQUE(company_id, code);

-- ============================================
-- Step 4: Create indexes
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_company_branch ON users(company_id, branch_id);

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_code ON companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- Branches table indexes
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_manager ON branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_created_by ON branches(created_by);
CREATE INDEX IF NOT EXISTS idx_branches_created_at ON branches(created_at);
CREATE INDEX IF NOT EXISTS idx_branches_company_code ON branches(company_id, code);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_action ON audit_logs(resource, action);

-- ============================================
-- Step 5: Create functions and triggers
-- ============================================

-- Staff limit function
CREATE OR REPLACE FUNCTION check_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
  staff_count INTEGER;
BEGIN
  IF NEW.role = 'staff' AND NEW.is_active = TRUE THEN
    SELECT COUNT(*) INTO staff_count
    FROM users
    WHERE company_id = NEW.company_id
      AND role = 'staff'
      AND is_active = TRUE
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF staff_count >= 2 THEN
      RAISE EXCEPTION 'Staff limit reached (max 2 per company). Current: %, Limit: 2', staff_count + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Staff limit trigger
DROP TRIGGER IF EXISTS enforce_staff_limit ON users;
CREATE TRIGGER enforce_staff_limit
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_staff_limit();

-- Updated at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 6: Create RLS policies
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

DROP POLICY IF EXISTS companies_select_policy ON companies;
DROP POLICY IF EXISTS companies_insert_policy ON companies;
DROP POLICY IF EXISTS companies_update_policy ON companies;
DROP POLICY IF EXISTS companies_delete_policy ON companies;

DROP POLICY IF EXISTS branches_select_policy ON branches;
DROP POLICY IF EXISTS branches_insert_policy ON branches;
DROP POLICY IF EXISTS branches_update_policy ON branches;
DROP POLICY IF EXISTS branches_delete_policy ON branches;

-- Create users RLS policies
CREATE POLICY users_admin_master_select ON users
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY users_admin_master_insert ON users
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY users_admin_master_update ON users
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY users_admin_master_delete ON users
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY users_admin_company_select ON users
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company'));

CREATE POLICY users_admin_company_insert ON users
FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company') AND role = 'staff');

CREATE POLICY users_admin_company_update ON users
FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company') AND role = 'staff')
WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company') AND role = 'staff');

CREATE POLICY users_admin_company_delete ON users
FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company') AND role = 'staff');

CREATE POLICY users_staff_select ON users
FOR SELECT TO authenticated
USING (id = auth.uid()::uuid AND role = 'staff');

CREATE POLICY users_staff_update ON users
FOR UPDATE TO authenticated
USING (id = auth.uid()::uuid AND role = 'staff')
WITH CHECK (id = auth.uid()::uuid AND role = 'staff');

-- Create companies RLS policies
CREATE POLICY companies_admin_master_all ON companies
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY companies_admin_company_select ON companies
FOR SELECT TO authenticated
USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company'));

CREATE POLICY companies_staff_select ON companies
FOR SELECT TO authenticated
USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'staff'));

-- Create branches RLS policies
CREATE POLICY branches_admin_master_all ON branches
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY branches_admin_company_all ON branches
FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company'))
WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company'));

CREATE POLICY branches_staff_select ON branches
FOR SELECT TO authenticated
USING (id IN (SELECT branch_id FROM users WHERE id = auth.uid()::uuid AND role = 'staff'));

-- ============================================
-- Step 7: Data migration
-- ============================================

-- Migrate existing roles
UPDATE users SET role = 'admin_master' WHERE role = 'admin';
UPDATE users SET role = 'admin_company' WHERE role = 'branch_manager';
-- Staff role remains the same

-- Assign company_id based on branch_id
UPDATE users u
SET company_id = b.company_id
FROM branches b
WHERE u.branch_id = b.id AND u.company_id IS NULL;

-- Commit transaction
COMMIT;

-- Migration complete
```

### Rollback Script

```sql
-- Rollback: Multi-Level Admin System
-- Version: 1.0
-- Date: 2026-04-26

-- Begin transaction
BEGIN;

-- Revert role migration
UPDATE users SET role = 'admin' WHERE role = 'admin_master';
UPDATE users SET role = 'branch_manager' WHERE role = 'admin_company';

-- Drop new columns
ALTER TABLE users DROP COLUMN IF EXISTS company_id;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE users DROP COLUMN IF EXISTS created_by;

-- Revert role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'branch_manager', 'staff'));

-- Drop new constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_staff_requires_company_branch;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_admin_company_requires_company;

-- Drop new tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS companies;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_company;
DROP INDEX IF EXISTS idx_users_branch;
DROP INDEX IF EXISTS idx_users_created_by;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_company_role;
DROP INDEX IF EXISTS idx_users_company_branch;

-- Drop triggers
DROP TRIGGER IF EXISTS enforce_staff_limit ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_branches_updated_at ON branches;

-- Drop functions
DROP FUNCTION IF EXISTS check_staff_limit;
DROP FUNCTION IF EXISTS update_updated_at_column;

-- Commit transaction
COMMIT;

-- Rollback complete
```

## Summary

This database schema design provides:
- ✅ Complete schema for multi-level admin system
- ✅ Users table with company and branch relationships
- ✅ Companies table for multi-tenant support
- ✅ Branches table with company assignment
- ✅ Audit logs table for compliance
- ✅ Comprehensive RLS policies for security
- ✅ Performance indexes for efficient queries
- ✅ Constraints for data integrity
- ✅ Triggers for business logic enforcement
- ✅ Complete migration script with rollback

---

**Next Steps:**
1. Builder: Implement disabled public signup, multi-level auth, and profile page
