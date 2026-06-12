# DATABASE MAP

> **Last Updated**: 2026-05-01
> **Source of truth**: `src/types/database.types.ts` + Supabase migrations
> **RLS**: Enabled on all tables below

---

# TABLES

users
companies
branches
bank_accounts
customers
transactions
transaction_types
customer_fields
color_settings
user_preferences
backup_history

---

# TABLE DETAILS

## users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, references auth.users(id) |
| email | TEXT | unique, not null |
| full_name | TEXT | |
| role | TEXT | e.g. admin, branch_manager, staff |
| staff_permissions | JSONB | granular staff flags |
| phone | TEXT | |
| position | TEXT | |
| company_id | UUID | FK → companies |
| branch_id | UUID | FK → branches |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## companies

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | not null |
| code | TEXT | unique |
| logo_url | TEXT | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## branches

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | not null |
| code | TEXT | unique per company |
| company_id | UUID | FK → companies |
| manager_id | UUID | FK → users |
| address | TEXT | |
| phone | TEXT | |
| email | TEXT | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## bank_accounts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| bank_name | TEXT | not null |
| account_name | TEXT | not null |
| account_number | TEXT | not null |
| account_type | TEXT | |
| balance | DECIMAL | |
| opening_balance | DECIMAL | |
| company_id | UUID | FK → companies |
| branch_id | UUID | FK → branches |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## customers

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| customer_code | TEXT | unique per company |
| full_name | TEXT | not null |
| phone | TEXT | |
| email | TEXT | |
| address | TEXT | |
| working_method | TEXT | |
| company_id | UUID | FK → companies |
| branch_id | UUID | FK → branches |
| opening_balance | DECIMAL | |
| current_balance | DECIMAL | |
| current_balance | DECIMAL | |
| last_transaction_date | TIMESTAMPTZ | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## transactions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| transaction_code | TEXT | unique per company |
| transaction_type | TEXT | FK → transaction_types.id (logical) |
| customer_id | UUID | FK → customers |
| amount | DECIMAL | not null |
| transaction_date | TIMESTAMPTZ | |
| description | TEXT | |
| reference_number | TEXT | |
| bank_account_id | UUID | FK → bank_accounts |
| company_id | UUID | FK → companies |
| branch_id | UUID | FK → branches |
| created_by | UUID | FK → users |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## transaction_types

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| company_id | UUID | FK → companies |
| name | TEXT | not null, unique per company |
| color | TEXT | |
| math_factor | DECIMAL | -1 or 1 |
| impact_type | TEXT | increase / decrease |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## customer_fields

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| company_id | UUID | FK → companies |
| name | TEXT | not null, unique per company |
| type | TEXT | |
| is_required | BOOLEAN | |
| is_active | BOOLEAN | |
| is_default | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## color_settings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| setting_key | TEXT | e.g. transaction_type_colors |
| setting_value | JSONB | color map object |
| description | TEXT | |
| updated_at | TIMESTAMPTZ | |

## user_preferences

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| preference_key | TEXT | |
| preference_value | JSONB | |
| updated_at | TIMESTAMPTZ | |

## backup_history

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| company_id | UUID | FK → companies |
| operation | TEXT | backup / restore |
| status | TEXT | |
| details | JSONB | |
| created_at | TIMESTAMPTZ | |

---

# RELATIONSHIPS

- users.company_id → companies.id
- users.branch_id → branches.id
- branches.company_id → companies.id
- branches.manager_id → users.id
- bank_accounts.company_id → companies.id
- bank_accounts.branch_id → branches.id
- customers.company_id → companies.id
- customers.branch_id → branches.id
- transactions.company_id → companies.id
- transactions.branch_id → branches.id
- transactions.customer_id → customers.id
- transactions.bank_account_id → bank_accounts.id
- transactions.created_by → users.id
- transaction_types.company_id → companies.id
- customer_fields.company_id → companies.id