# Current State & System Constraints

> **Merged from:** `current_state.md`, `system_constraints.md`, `database_map.md`

## Project Status

- **Date:** 2026-05-01
- **Status:** Operational
- **Priority:** P1 - Optimization & Feature Completion

## Purpose

Cashflow Management System with AI-native development approach:
- Customer and transaction management (cashflow tracking)
- Customer and transaction import/export
- Role-based access control (RBAC)
- Multi-agent AI development workflow

## Architecture

- **Frontend:** React 18 + TypeScript + TailwindCSS + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **RLS policies, real-time subscriptions**

## Working Features

- User authentication (Supabase Auth)
- Customer management (CRUD)
- Transaction management
- Import/Export (up to 200 rows per batch)
- Settings management
- RBAC permission system
- Dashboard with metrics
- Data visualization

## Core Business Logic

### Multi-Tenancy Isolation
- All data records MUST contain `company_id`.
- Cross-company data visibility is strictly prohibited.

### Customer Code & Transaction Code Uniqueness
- `customer_code` unique per `company_id` (composite unique constraint).
- `transaction_code` unique per `company_id`.

### Transaction Type Integrity
- `transactions.transaction_type` MUST reference `transaction_types.id`.
- Math factor (`-1` or `1`) and impact type (`increase`/`decrease`) defined in `transaction_types`.
- Balance calculation uses math factor from transaction type, **not hardcoded logic**.

### Balance Calculation
- `customers.current_balance` = `opening_balance` + S(transaction amounts × math factors).
- `opening_balance` is set at creation and never changes via transactions.

### Staff Permissions
- Role `staff` permissions stored in `users.staff_permissions` JSONB.
- Admin and Branch Manager bypass granular checks.

## Database Schema (11 Tables)

| Table | Key Fields |
|-------|------------|
| `users` | id (UUID), email, role, staff_permissions JSONB, company_id, branch_id |
| `companies` | id, name, code (unique) |
| `branches` | id, name, code, company_id |
| `bank_accounts` | id, account_number, account_name, bank_name, branch_id, company_id |
| `customers` | id, customer_code (unique per company), full_name, opening_balance, current_balance, company_id |
| `transactions` | id, transaction_code (unique per company), customer_id, transaction_type_id, amount, company_id |
| `transaction_types` | id, name, color, math_factor, impact_type, company_id |
| `customer_fields` | id, name, type, required, company_id |
| `color_settings` | id, setting_name, setting_value |
| `user_preferences` | id, user_id, preference_name, preference_value |
| `backup_history` | id, table_name, action, record_data, created_by |

## Database Constraints

- **Never rename columns** without migration script.
- **Use migrations** in `supabase/migrations/` for all schema changes.
- **Composite unique constraints** must include `company_id`.
- **Foreign keys** must have `ON DELETE` behavior defined.
- **RLS must be enabled** on all new tables before deployment.

## API Contracts

- No REST API endpoints — all access via Supabase client SDK.
- `supabase.auth.signUp()` / `signInWithPassword()` / `signOut()`
- `databaseService.*` methods (Supabase SDK wrappers)
- Edge Function `create-user` (triggered post-signup)
- Payload formats: `src/types/database.types.ts`

## Authentication Rules

1. Supabase Auth JWT = single source of truth for session state.
2. `public.users` row MUST exist for every authenticated user.

## Source of Truth

- Schema: `src/types/database.types.ts` + Supabase migrations
- RLS: Enabled on all tables
- Balance: Application-layer calculation (not DB triggers)
