# Database Guide

> **Merged from:** `SUPABASE-SETUP.md`, `DATABASE_SAFETY_GUIDELINES.md`, `DATABASE_OPERATIONS_CHECKLIST.md`, `DATA-MIGRATION-RULES.md`, `DATA-MIGRATION-TASKS.md`, `DATA-MIGRATION-HUB.md`

Comprehensive guide for the Supabase PostgreSQL backend, schema management, RLS policies, data migrations, and safe database operations.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [RLS Policies](#rls-policies)
3. [Edge Functions](#edge-functions)
4. [Application-Level Balance Calculation](#application-level-balance-calculation)
5. [Seed Data](#seed-data)
6. [Database Safety Guidelines](#database-safety-guidelines)
7. [Operations Checklist](#operations-checklist)
8. [Data Migration Rules](#data-migration-rules)

---

## Schema Overview

The canonical schema is maintained in `supabase/migrations/`. Run them in order via the Supabase Dashboard SQL Editor or CLI.

| Migration | Description |
|-----------|-------------|
| `001_initial_schema.sql` | Base tables: `branches`, `users`, `bank_accounts`, `customers`, `transactions` |
| `005_multi_level_admin_schema.sql` | Companies, granular roles, user fields, RLS policies |
| `005b_create_companies_table.sql` | Companies table (if separate) |
| `006_multi_tenancy_company_id.sql` | Multi-tenancy (`company_id`), `transaction_types`, `customer_fields` |

### Key Schema Facts

- **11 tables**: `users`, `companies`, `branches`, `bank_accounts`, `customers`, `transactions`, `transaction_types`, `customer_fields`, `color_settings`, `user_preferences`, `backup_history`
- **Multi-tenancy** enforced via `company_id` on all data tables
- `transaction_types` is a **dynamic table** (NOT a hardcoded enum)
- **Composite unique constraints** include `company_id`: `(company_id, customer_code)`, `(company_id, transaction_code)`, `(company_id, code)` for branches
- **RLS enabled** on all tables

### Quick Verification

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## RLS Policies

RLS policies are defined in the migration files (primarily `005_multi_level_admin_schema.sql`). Run those migrations as the source of truth.

### Key Policy Principles

| Role | Access |
|------|--------|
| **Users** | View/update their own profile (`auth.uid() = id`) |
| **Admin Master** (`role = 'admin_master'`) | Full access to all tables |
| **Admin Company** (`role = 'admin_company'`) | Scoped to their `company_id` |
| **Staff / Branch Manager** | Scoped to their `branch_id` and `company_id` |

All 11 tables have RLS enabled.

---

## Edge Functions

The app uses a Supabase Edge Function to create user records after signup.

```bash
supabase functions deploy create-user
```

The function lives in `supabase/functions/create-user/` and inserts a row into `public.users` after a new auth user signs up.

---

## Application-Level Balance Calculation

> **Note:** The current architecture does **not** use database triggers for balance updates.
> Customer balances (`opening_balance`, `current_balance`) are calculated in the application service layer (`src/services/database.ts`). This allows the math factor (defined per `transaction_types` row) to be applied correctly for each transaction.

---

## Seed Data

Add initial data for testing. `company_id` is required on most tables due to multi-tenancy.

```sql
-- Create a sample company first
INSERT INTO public.companies (name, code) VALUES
('Demo Company', 'DEMO001');

-- Insert sample branches
INSERT INTO public.branches (name, code, address, phone, email, company_id) VALUES
('Main Branch', 'MB001', '123 Main Street, City', '+1234567890', 'main@company.com',
  (SELECT id FROM public.companies WHERE code = 'DEMO001'));

-- Insert sample bank accounts
INSERT INTO public.bank_accounts (account_number, account_name, bank_name, branch_id, company_id) VALUES
('1234567890', 'Main Operating Account', 'City Bank',
  (SELECT id FROM public.branches WHERE code = 'MB001'),
  (SELECT id FROM public.companies WHERE code = 'DEMO001'));
```

---

## Database Safety Guidelines

### Core Principles

1. **Data Integrity is Sacred**
   - Never compromise data integrity for convenience
   - All changes must be intentional, verifiable, and reversible

2. **Verification Before Assumption**
   - Never assume schema structure — always verify with actual database
   - Never assume field exists — check schema first
   - Never assume data type — verify in schema
   - Never assume relationship — check foreign keys

3. **Safety First for Mass Operations**
   - Never perform mass updates without backup
   - Never update ALL records without specific `WHERE` clause
   - Always test on single record before mass operation
   - Always have rollback plan ready

4. **Complete Field Coverage**
   - Forms must include ALL database fields
   - No missing fields between form and database
   - No orphaned data in database
   - All relationships must be explicit

### Pre-Operation Steps (Mandatory)

1. **Schema Inspection**
   - Read database schema using MCP Supabase tools
   - Check all required fields (NOT NULL), foreign keys, data types, defaults, constraints

2. **Form-to-Database Mapping**
   - Create a mapping: form_field → database_field
   - Verify ALL database fields are covered in the form
   - Resolve ALL mismatches before proceeding

3. **Backup & Rollback Plan**
   - Export current data before mass updates
   - Save rollback SQL script
   - Test rollback script on test data
   - `NEVER` use `UPDATE table SET field = value` without `WHERE`

---

## Operations Checklist

### Before Any Database Change

- [ ] Read database schema (tables, columns, types, constraints)
- [ ] Check foreign key relationships and cascade rules
- [ ] Verify field requirements (NOT NULL, defaults, optional)
- [ ] Map form fields to database fields (100% coverage)
- [ ] Create backup plan and rollback SQL
- [ ] Verify WHERE clause for updates (never update all rows)

### During Development

- [ ] Include ALL database fields in forms
- [ ] Required fields → input controls
- [ ] Foreign key fields → dropdown/select with referenced table data
- [ ] Optional fields → allow empty/NULL
- [ ] Verify field binding: state matches database field names/types
- [ ] Handle NULL cases explicitly

### After Changes

- [ ] Verify data integrity (no orphaned records)
- [ ] Test with real data patterns
- [ ] Check constraint compliance
- [ ] Validate foreign key references
- [ ] Run integration tests
- [ ] Monitor for errors

---

## Data Migration Rules

### User Experience Rules

- **Familiar Interface**: Keep Excel/Google Sheets experience
- **Progressive Enhancement**: Introduce new features gradually
- **Zero Learning Curve**: Users can use immediately

### Technical Rules

- **Type Safety**: Always use strict TypeScript
- **Error Handling**: Comprehensive error handling with logging
- **Validation**: Validate before any database write
- **Rollback**: Every migration must be reversible

### Migration Execution

1. **Pre-migration**: Backup current data
2. **Migration**: Run in test environment first
3. **Verification**: Validate data integrity after migration
4. **Rollback**: Keep rollback script ready

### Common Migration Tasks

| Task | Description |
|------|-------------|
| Add column | `ALTER TABLE ... ADD COLUMN ...` |
| Rename column | `ALTER TABLE ... RENAME COLUMN ...` |
| Add constraint | `ALTER TABLE ... ADD CONSTRAINT ...` |
| Update data | `UPDATE ... WHERE ...` (never without WHERE) |
| Create index | `CREATE INDEX ...` |

---

## Related Docs

- Cashflow app database details: `apps/cashflow/docs/DATABASE.md`
- Current implementation state: `apps/cashflow/docs/CURRENT_STATE.md`
- Supabase migrations: `supabase/migrations/`
