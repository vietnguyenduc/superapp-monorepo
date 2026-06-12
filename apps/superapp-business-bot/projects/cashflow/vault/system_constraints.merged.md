# SYSTEM CONSTRAINTS

**Last Updated:** 2026-05-01

**Owner:** Engineering Team

---

# CORE BUSINESS LOGIC

## 1. Multi-Tenancy Isolation
- All data records MUST contain `company_id`.
- Cross-company data visibility is strictly prohibited at the application and RLS level.

## 2. Customer Code & Transaction Code Uniqueness
- `customer_code` is unique per `company_id` (composite unique constraint).
- `transaction_code` is unique per `company_id` (composite unique constraint).

## 3. Transaction Type Integrity
- `transactions.transaction_type` MUST reference an existing `transaction_types.id`.
- Math factor (`-1` or `1`) and impact type (`increase` / `decrease`) are defined in `transaction_types`.
- Balance calculation uses the math factor from the transaction type, not hardcoded logic.

## 4. Balance Calculation
- `customers.current_balance` = `customers.opening_balance` + sum of all linked transaction amounts × respective math factors.
- `customers.opening_balance` is set at creation and does not change via transactions.
- `customers.current_balance` = `opening_balance` + calculated transaction total.

## 5. Staff Permissions
- Role `staff` permissions are stored in `users.staff_permissions` JSONB.
- Admin and Branch Manager bypass granular permission checks.

---

# DATABASE CONSTRAINTS

- **Never rename columns** in existing tables without a migration script.
- **Use migrations** in `supabase/migrations/` for all schema changes.
- **Composite unique constraints** must include `company_id` (e.g., `(company_id, customer_code)`).
- **Foreign keys** must reference the correct table with `ON DELETE` behavior defined.
- **RLS must be enabled** on all new tables before deployment.

---

# API CONTRACTS

The application does NOT expose REST API endpoints. All data access goes through:

- `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` / `supabase.auth.signOut()`
- `databaseService.*` methods (Supabase client SDK wrappers)
- Edge Function `create-user` (triggered post-signup)

Payload formats for `databaseService` are stable TypeScript interfaces defined in `src/types/database.types.ts`.

---

# AUTHENTICATION RULES

1. Supabase Auth JWT is the single source of truth for session state.
2. `public.users` row MUST exist for every authenticated user (created via Edge Function or `onAuthStateChange` hook).
3. Role and `company_id` are loaded from `public.users` into `AuthContext` at login.
4. RLS policies enforce `company_id` + role filtering; application code should never bypass RLS.

---

# SECURITY RULES

- Never expose `VITE_SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Never commit `.env.local` to version control.
- All Supabase queries run through the anon key; service role is reserved for Edge Functions only.
- `staff_permissions` JSONB should be validated on both client (UI gating) and server (RLS).

---

# PROTECTED MODULES

Files that should not be refactored without explicit approval:

- `src/services/database.ts` — Central data access layer; all CRUD goes through here.
- `src/services/supabase.ts` — Supabase client singleton configuration.
- `src/types/database.types.ts` — Database schema TypeScript definitions (auto-generated / hand-maintained).
- `src/utils/rbac.ts` — Role and permission logic.
- `src/contexts/AuthContext.tsx` — Global auth state provider.
- `src/contexts/TransactionTypeContext.tsx` — Global transaction type cache provider.