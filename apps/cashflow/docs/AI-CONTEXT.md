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
- `src/services/backupHistoryService.ts` — backup history CRUD + `saveBackupToDatabase`, `loadBackupData`, `revertTableFromBackup` delegates.
- `src/utils/backupRecovery.ts` — backup creation, import/export, and **restore with cross-table ID remapping**.
- `src/services/dashboardService.ts` — dashboard KPIs, balance by bank, top customers; uses shared `balanceMath.ts`.
- `src/services/businessLogic/balanceMath.ts` — single source of truth for sign/impact math.
- `src/services/businessLogic/parsers.ts` — `parseAmount`, `normalizeTransactionType`.
- `src/services/businessLogic/transformation.ts` — `transformRawCustomer`, `transformRawTransaction`, etc.
- `src/services/businessLogic/validation.ts` — form validation.
- `src/services/updateHelpers.ts` — `updateWithFallback`, `insertWithFallback`, `bulkInsertWithFallback` (strips missing columns resiliently).
- `src/services/trialMockStore.ts` — trial-mode localStorage store.
- `src/services/supabase.ts` — `apiClient`.
- `src/utils/formatting.ts` — `formatCurrency`, `formatDate`, `getTransactionMathFactor`.
- `src/pages/Transactions/TransactionList.tsx` — transaction list with group-by `Ngày` / `Tuần` / `Tháng` / `Văn phòng` / `Loại giao dịch` / `Khách hàng`. Group summary uses `getCustomerBalanceDelta` to separate `Tổng phát sinh tăng`, `Tổng phát sinh giảm`, `Tổng điều chỉnh`, and `Net`.
- `src/pages/Settings/Settings.tsx` — provider shell + `SettingsContent`; per-tab JSX in `pages/Settings/components/tabs/*.tsx`; state in `useSettingsState.ts`; shared context in `SettingsContext.tsx`; `colorOptions`/`getColorClass` in `Settings/utils.ts`.
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

All balance/amount sign display now flows through `getCustomerBalanceDelta`; `getTransactionMathFactor` delegates to it, so `CustomerDetailModal` / `RecentTransactions` render charge amounts as negative (debt) and payment/refund amounts as positive (credit).

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
- **Edit modals:** keep form state and validation inside dedicated components — `TransactionEditModal` for `TransactionList` and `CustomerFormModal` for `CustomerList`. Avoid inline modal JSX in page files so styling, validation, and i18n can be maintained in one place.
- **UUID `id` columns:** Supabase `id` columns are `uuid` type. `transformRawCustomer`, `transformRawTransaction`, `transformRawBankAccount`, `transformRawBranch`, `transformRawTransactionType`, and `transformRawBackupHistory` must generate a bare v4 UUID (`crypto.randomUUID()`), not a prefixed string like `branch-<uuid>`. Prefixed IDs will fail to insert.
- **Backup/restore FK mapping:** `restoreBackup` must create branches → bank accounts → customers → transactions in order, and build `oldId -> newId` maps for `branch_id`, `bank_account_id`, and `customer_id` so restored transactions point to the newly created rows.
- **Settings backup buttons:** `Settings.tsx` calls `databaseService.backupHistory.saveBackupToDatabase` / `loadBackupData` / `revertTableFromBackup`; these must be exported from `backupHistoryService.ts` and delegate to `backupService` / `recoveryUtils`.
- **Trial logout:** `Navigation.tsx` `handleLogout` must call `clearTrialStore()` (removes `cashflow_trial_user`, `cashflow_trial_mode_enabled`, `cashflow_trial_api_fetched`, `superapp_trial_mode`, `isTrial`) before `supabase.auth.signOut()` and `navigate('/login')`, otherwise the AuthContext re-initializes trial mode and the dashboard stays visible.

## How to test

- Unit: `npm run test -w cashflow`
- Type check: `npm run type-check -w cashflow`
- Lint: `npm run lint -w cashflow` (currently 300+ pre-existing warnings; do not bulk-fix unrelated files).
- Real-flow E2E: run `localhost:5173` (Admin) and `localhost:5174` (Cashflow) on the WSL host; credentials are in session secrets. Use `http://<TAILSCALE_IP>:5174` from the sandbox.

## Branch / deploy flow

- `feature-branch → origin/viet` (preview) → `main` (production).
- Direct push to `main`/`viet` is not allowed; use PRs.
- Vercel preview deploys on `viet` PRs; production on `main` merge.
- **Vercel `ignoreCommand` gotcha:** each `apps/<app>/vercel.json` `ignoreCommand` has a hard 256-character limit. If the command is longer, Vercel returns `bad_request: ignoreCommand should NOT be longer than 256 characters` and the build fails before it starts. Keep the command short (e.g. `bash ../../scripts/vercel-ignore.sh`) and put all branch/path logic in `scripts/vercel-ignore.sh`.
- **Root `project` Vercel project:** the default project linked to the repo root has no correct `outputDirectory` for the monorepo and should be deleted or reconfigured; it does not map to any real app.

## Production hotfixes and current state (2026-08-05)

### Bugs fixed
1. **Vietnamese validation messages** — `src/services/businessLogic/validation.ts` now returns user-facing errors in Vietnamese (e.g. `Tên tài khoản là bắt buộc`, `Mã khách hàng là bắt buộc`). This fixes the English "Lỗi cấu hình" banner when saving bank accounts.
2. **Stale modal error state** — `src/pages/Settings/Settings.tsx` resets `error` when opening or canceling any modal, and `handleSaveBankAccount` / `handleSaveTransactionType` / branch handlers now extract a readable message from both string and `{ message: ... }` error objects.
3. **Dashboard active customers** — `src/services/dashboardService.ts` now counts `customers.is_active !== false` instead of unique `customer_id` values in the current transaction window, which was frequently `0`.
4. **Customer list summary** — `src/pages/Customers/CustomerList.tsx` now uses `formatCurrency` (exact number) instead of `formatCompactCurrency` (e.g. `20.7B đ`) and counts from the full `allCustomers` list, not the paginated subset.
5. **Customer table UX** — `src/pages/Customers/components/CustomerTable.tsx` is more compact (`px-1.5 py-1.5`, smaller text), uses `min-w-max` with a constrained container `max-h-[calc(100vh-260px)]`, and has sticky `th` headers for easier horizontal scrolling.
6. **Search with special characters** — `customerService.getCustomers` and `transactionService.getTransactions` now wrap `ilike` values in double quotes and double any internal quotes, so searches containing `,`, `(`, `)`, `.`, `=`, etc. no longer produce a PostgREST `PGRST100` parse error and the `Lỗi tải khách hàng` / transaction-list error banner.
7. **Backup/restore fixes (2026-08-05)** —
   - `src/utils/compression.ts` no longer uses Node-only `Buffer`; it now uses `TextEncoder`/`TextDecoder` + `btoa`/`atob` so browser backups do not throw `Buffer is not defined`.
   - `src/utils/backupRecovery.ts` now whitelists allowed columns during restore (`BRANCH_KEYS`, `BANK_ACCOUNT_KEYS`, `CUSTOMER_KEYS`, `TRANSACTION_KEYS`), preventing `PGRST204` errors for joined/display-only columns like `customer_name` or `bank_account_name`.
   - Restore helpers now collect per-record errors and `restoreBackup` returns them in `result.errors`; `Settings.tsx` / `Dashboard.tsx` show these instead of a false "Khôi phục thành công!".
   - `src/services/backupHistoryService.ts` `saveBackupToDatabase` now throws when `ServiceResponse.success` is `false`, so the UI surfaces backup failures.
   - `src/utils/backupRecovery.ts` `restoreCustomers` / `restoreBankAccounts` derive and reset the pre-transaction opening balance (`total_balance` / `current_balance` / `balance`) before re-inserting transactions, so `transactionService._syncTransactionBalance` does not double-count restored balances.

8. **Vercel rate-limit workaround (2026-08-05)** — The Vercel Hobby account hit `api-deployments-free-per-day` while PR #67/#68 were building, so a normal `main` production deploy could not start. To stop the customer-search `PGRST100` regression from staying live, `cashflow.appforyou.xyz` was manually aliased to the successful PR #67 preview deployment (`cashflow-r9iym8czc-viet-ducs-projects-3717a482.vercel.app`) after verifying the search-with-comma flow returns `0` rows and no `Lỗi tải khách hàng` banner. A regular production deploy from `main` will replace this alias once the Vercel quota resets.

### Still to do for production-grade
- `Settings.tsx` is 3000+ lines with ~50 `useState` hooks and inline modal JSX; split into tab/page components.
- `TransactionImport.tsx` / `CustomerImport.tsx` still contain parser/validator/preview logic inline; extract to `utils/importUtils` or dedicated modules.
- Replace remaining `alert()` / `console.*` with `toast` / `logger`.
- Reduce `any` casts and lint warnings in touched files.
- Finish the 12 standard Cashflow docs (currently only `AI-CONTEXT.md`, `DATA-FLOW.md`, and ADRs exist).
