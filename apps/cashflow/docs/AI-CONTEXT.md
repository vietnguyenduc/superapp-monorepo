# AI Context — Cashflow App

> Quick orientation for the next agent touching this app.

## What is Cashflow?

A Vite/React SPA in the Superapp monorepo for cash-flow / receivables management:
- Customers and their running balances.
- Bank accounts and their running balances.
- Transactions (payment, charge, refund, adjustment) tied to a customer and a bank account.
- Transaction types and branches (multi-tenant configuration).
- Dashboards, reports, import/export, settings, backups.

## Stack

- React 18, TypeScript strict, Vite, Tailwind CSS.
- Supabase (cloud project `peslmsctejmvkwzyohke`) for Auth, PostgreSQL, RLS, Storage.
- `@superapp/shared-utils` for `BaseService` and `apiClient`.
- `@superapp/iam` for `AuthProvider`, `CompanyProvider`, `useAuth`, `useCompany`.
- Trial mode: localStorage-backed `trialMockStore.ts` with seed data; bypasses Supabase auth/RLS.

## Entry points and routing

- `src/App.tsx` lazy-loads pages from `src/pages/**`.
- Layout in `src/components/Layout/` (Navigation, Sidebar, BottomTabBar, AppSwitcher).
- Protected by `ProtectedRoute` and RBAC helpers in `src/utils/rbac.ts`.

## Important files

- `src/services/transactionService.ts` — CRUD + bulk import + **write-time balance sync**.
- `src/services/customerService.ts` — customer CRUD + `getCustomerById` recomputes balance from `opening_balance + Σ(transaction deltas)`.
- `src/services/bankAccountService.ts` — bank account CRUD.
- `src/services/dashboardService.ts` — dashboard KPIs, balance by bank, top customers; uses shared `balanceMath.ts`.
- `src/services/businessLogic/balanceMath.ts` — single source of truth for sign/impact math.
- `src/services/businessLogic/parsers.ts` — `parseAmount`, `normalizeTransactionType`.
- `src/services/businessLogic/transformation.ts` — `transformRawCustomer`, `transformRawTransaction`, etc.
- `src/services/businessLogic/validation.ts` — form validation.
- `src/services/updateHelpers.ts` — `updateWithFallback`, `insertWithFallback`, `bulkInsertWithFallback` (strips missing columns resiliently).
- `src/services/trialMockStore.ts` — trial-mode localStorage store.
- `src/services/supabase.ts` — `apiClient`.
- `src/utils/formatting.ts` — `formatCurrency`, `formatDate`, `getTransactionMathFactor`.
- `src/types/index.ts` and `src/types/database.types.ts` — TS types.

## Money sign conventions (critical)

All new code must use `src/services/businessLogic/balanceMath.ts`.

| Type      | Customer balance delta | Bank cash delta | Meaning |
|-----------|----------------------|-----------------|---------|
| `charge`  | `-amount`            | `0`             | Customer owes more (debt / công nợ). No cash moved. |
| `payment` | `+amount`            | `+amount`       | Customer pays → debt decreases, cash increases. |
| `refund`  | `+amount`            | `-amount`       | Refund to customer → debt decreases, cash decreases. |
| `adjustment` | signed amount     | signed amount   | Direct signed correction. |

Negative `total_balance` = debt. Positive = overpayment/credit.

**Caution:** `src/utils/formatting.ts` has `getTransactionMathFactor` with the opposite fallback (`+1` for charge, `-1` for payment/refund). It is still used by `CustomerDetailModal` / `RecentTransactions`. Reconcile before changing either side.

## Recent architectural decisions

- `docs/adr/0001-transaction-type-single-source-of-truth.md`
- `docs/adr/0002-balance-math-and-tenant-protection.md` — balance math single source, tenant-field hardening, and write-time balance sync.

## Multi-tenancy rules

- `company_id` and `branch_id` are RLS tenant fields.
- Never let a user payload overwrite `company_id` / `branch_id` / `id` / `created_at` in update paths.
- `getCompanyId()` from `@superapp/shared-utils` returns the active company.
- Trial mode seeds use `trial-company` and `trial-branch`.

## Common pitfalls

- **Vite env checks:** use `import.meta.env.DEV`, not `process.env.NODE_ENV`.
- **Dates:** `date-fns` formatting can throw `RangeError` on invalid dates; `formatDate` catches and returns a fallback.
- **Trial store shallow copy:** `resetTrialStore()` does a shallow spread; tests should clear `localStorage`/`sessionStorage` and re-enable trial mode to force a deep clone from seed.
- **Supabase `.single()`** returns an error when a row is missing; guard with `if (error || !data)`.
- **`updateWithFallback`** retries updates with unknown columns stripped; useful for production schemas that lag migrations.
- **Bulk import payloads:** sanitize to the known `transactions` columns before calling `bulkInsertWithFallback` so Supabase does not log 400 errors for UI-only fields (`bank_account_name`, `branch_name`). Also do not select non-existent `branches.branch_name`; the `branches` table only has `name` and `code`.
- **Transaction type labels:** dropdowns should use `useTransactionTypes()` canonical labels (`Phát sinh tăng/giảm`, `Điều chỉnh`, `Hoàn tiền`), not raw `transaction_types.name` values.

## How to test

- Unit: `npm run test -w cashflow`
- Type check: `npm run type-check -w cashflow`
- Lint: `npm run lint -w cashflow` (currently 300+ pre-existing warnings; do not bulk-fix unrelated files).
- Real-flow E2E: run `localhost:5173` (Admin) and `localhost:5174` (Cashflow) on the WSL host; credentials are in session secrets. Use `http://<TAILSCALE_IP>:5174` from the sandbox.

## Branch / deploy flow

- `feature-branch → origin/viet` (preview) → `main` (production).
- Direct push to `main`/`viet` is not allowed; use PRs.
- Vercel preview deploys on `viet` PRs; production on `main` merge.
