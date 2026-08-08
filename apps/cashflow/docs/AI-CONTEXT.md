# AI Context — Cashflow App

> Quick orientation for the next agent touching this app.

## What is Cashflow?

A Vite/React SPA in the Superapp monorepo for cash-flow / receivables management:
- Customers and their running balances.
- Bank accounts and their running balances.
- Transactions (payment, charge, refund, adjustment, deposit) tied to a customer and a bank account.
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

Production convention: **positive `customers.total_balance` = debt / công nợ; negative = credit / overpayment**. The user-facing formula is:

```
Công nợ = Đầu kỳ + Phát sinh tăng - Phát sinh giảm + Điều chỉnh - Đặt cọc
```

`getCustomerBalanceDelta` returns `amount * math_factor`. `math_factor` comes from `transaction_types.math_factor` (loaded per company) or from an explicit override. When no factor is supplied, the canonical defaults are:

| Type      | math_factor | Customer balance delta | Bank cash delta | Meaning |
|-----------|-------------|----------------------|-----------------|---------|
| `charge`  | `+1`        | `+amount`            | `0`             | Customer owes more (debt / công nợ, phát sinh tăng). No cash moved. |
| `payment` | `-1`        | `-amount`            | `+amount`       | Customer pays (phát sinh giảm) → debt decreases, cash increases. |
| `refund`  | `-1`        | `-amount`            | `-amount`       | Refund to customer (hoàn tiền) → debt decreases, cash decreases. |
| `deposit` | `-1`        | `-amount`            | `+amount`       | Customer prepays/deposits (đặt cọc) → debt decreases, cash increases. |
| `adjustment` | `+1`     | signed amount        | signed amount   | Direct signed correction (`+amount` or `-amount`). |

Positive balance color = **red** (debt). Negative/zero balance color = **green** (credit/overpayment).

The **displayed transaction amount** is the raw user-entered value (`parseAmount(amount)`), so `TransactionList`, `CustomerDetail`, `CustomerDetailModal`, and `RecentTransactions` show positive amounts while type-based color (charge = red, payment/refund/deposit = green, adjustment = blue) indicates the transaction direction.

### Sign-aware amounts (2026-08-05)

The amount **sign** now reverses the transaction direction instead of being silently taken as an absolute value. This applies to bulk import, manual edits, and dashboard calculations.

- `charge -1000` → customer balance **-1000** (debt decreases by 1000), bank cash `0`.
- `payment -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `refund -1000` → customer balance **+1000** (debt increases by 1000), bank cash **+1000** (cash in).
- `deposit -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `adjustment -1000` / `+1000` → direct signed correction on both customer and bank.

`getCustomerBalanceDelta` and `getBankAccountBalanceDelta` multiply the type's default impact by `Math.sign(amount)`. `validateTransactionData` no longer rejects negative amounts for `payment`/`charge`/`refund`/`deposit`; it only requires a non-zero value. `TransactionList` and `TransactionEditModal` no longer call `Math.abs()` before saving non-adjustment amounts. A negative amount also flips the amount color (e.g. `charge -1000` shows green because it reduces debt).

### Balance Formula settings (2026-08-09)

A dedicated `Công thức dư nợ` tab in Settings shows the current formula, lists each `transaction_types` row with its `math_factor`/`impact_type`, lets the user toggle the factor, and previews `Dư nợ mới = Đầu kỳ + Số tiền × Hệ số` for an arbitrary amount and type. The factor map is loaded by `transactionTypeService.getTransactionTypeFactorMap` and passed into `transactionService._syncTransactionBalance`, `dashboardService.getDashboardMetrics`, and `getReceivableLedger` so every balance calculation respects the configured convention.

### UI/UX conventions for lists and header actions (2026-08-09)

- **Header buttons** — use `src/components/UI/Button.tsx` with `size="md"`. Primary CTA = `variant="primary"` (blue-teal gradient with white text); utility/export/import actions = `variant="secondary"` (white/gray with dark text). Do not write one-off `<button className="bg-blue-600 ...">` in page headers; it drifts out of sync and breaks dark mode/hover states.
- **Wide tables** — wrap tables in `overflow-x-auto` and consider a synchronized top scrollbar (`topScrollRef` + `tableContainerRef`) so users can scroll horizontally without dragging the bottom scrollbar. Make the most important column (e.g. customer name) `sticky left-0` with a solid background so it stays visible while scrolling.
- **Customer name / code in tables** — render name as a clickable `<button>` with `text-gray-900 dark:text-white` and `hover:text-blue-600 dark:hover:text-blue-400`; render code below in `font-mono text-xs text-gray-500 dark:text-gray-400`. Keep both on a high-contrast background.
- **Creator column (`Người thực hiện`)** — `transactionService.getTransactions` joins `users(full_name)` and maps `creator_name`. As a fallback, load `databaseService.users.getUsers()` once and build a `Map<userId, fullName>` for both display cells and the filter dropdown.
- **Group summary colors** — `Net` (and `Tổng điều chỉnh`) should be red when positive (increases debt) and green when negative (decreases debt). Use `getBalanceColor` or the same `data.net > 0 ? red : data.net < 0 ? green : gray` logic.
- **Import routing** — `CustomerImport` and `TransactionImport` read `?tab=bulk|single` to switch to the requested tab on navigation. Buttons in `CustomerList` and `TransactionList` route to `/import/<resource>?tab=bulk`.

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
- Local RLS simulation: see `apps/cashflow/docs/RUNBOOK.md` § "Local Supabase RLS simulation from a cloud dump". This lets you test Supabase RLS policies on your machine before any production deploy, avoiding Vercel quota delays.

## Branch / deploy flow

- `feature-branch → origin/viet` (preview) → `main` (production).
- Direct push to `main`/`viet` is not allowed; use PRs.
- Vercel preview deploys on `viet` PRs; production on `main` merge.
- **Vercel `ignoreCommand` gotcha:** each `apps/<app>/vercel.json` `ignoreCommand` has a hard 256-character limit. If the command is longer, Vercel returns `bad_request: ignoreCommand should NOT be longer than 256 characters` and the build fails before it starts. Keep the command short (e.g. `bash ../../scripts/vercel-ignore.sh`) and put all branch/path logic in `scripts/vercel-ignore.sh`.
- **Root `project` Vercel project:** the default project linked to the repo root has no correct `outputDirectory` for the monorepo and should be deleted or reconfigured; it does not map to any real app.

### Reducing Vercel deployment quota usage

The account has 7 Vercel projects, so the default Git integration creates up to 7 deployment attempts per push and quickly exhausts the free `api-deployments-free-per-day` quota.

Current mitigations (2026-08-05):
- `scripts/vercel-ignore.sh` now skips every preview build that is **not** the `viet` branch and only builds `main` (production) or `viet` when the relevant app actually changed. This stops preview deployments on every `devin/*` PR.
- `scripts/deploy-app.sh` and `scripts/deploy-changed-apps.sh` let you deploy a single app (or only the changed apps) on demand via the Vercel CLI:
  ```bash
  VERCEL_TOKEN=xxx scripts/deploy-app.sh cashflow preview
  VERCEL_TOKEN=xxx scripts/deploy-app.sh cashflow production
  VERCEL_TOKEN=xxx scripts/deploy-changed-apps.sh preview origin/main
  ```
- `.github/workflows/deploy-changed-apps.yml` is a `workflow_dispatch` job that deploys only changed apps. If you want full automation without burning quota, disable Vercel's Git integration and let this workflow own `main`/`viet` deployments.

Recommended workflow to avoid the quota:
1. Develop and verify on `http://<TAILSCALE_IP>:5174` (local Vite on WSL).
2. Push to a `devin/*` branch for code review; no Vercel preview is created.
3. When you actually need a preview, run `scripts/deploy-app.sh cashflow preview` or trigger the GitHub Action manually.
4. Merge to `viet` only when ready; `viet` still auto-deploys a preview.
5. Merge `viet` → `main`; production deploys once per merge (not per app push).

## Production hotfixes and current state (2026-08-05)

### Bugs fixed
1. **Vietnamese validation messages** — `src/services/businessLogic/validation.ts` now returns user-facing errors in Vietnamese (e.g. `Tên tài khoản là bắt buộc`, `Mã khách hàng là bắt buộc`). This fixes the English "Lỗi cấu hình" banner when saving bank accounts.
2. **Stale modal error state** — `src/pages/Settings/Settings.tsx` resets `error` when opening or canceling any modal, and `handleSaveBankAccount` / `handleSaveTransactionType` / branch handlers now extract a readable message from both string and `{ message: ... }` error objects.
3. **Dashboard active customers** — `src/services/dashboardService.ts` now counts `customers.is_active !== false` instead of unique `customer_id` values in the current transaction window, which was frequently `0`.
4. **Customer list summary** — `src/pages/Customers/CustomerList.tsx` now uses `formatCurrency` (exact number) instead of `formatCompactCurrency` (e.g. `20.7B đ`) and counts from the full `allCustomers` list, not the paginated subset.
5. **Customer table responsive UX** — `CustomerList.tsx`/`CustomerTable.tsx` use a wider `2xl:max-w-screen-2xl` container, reduced mobile padding, and compact filter card actions that stay in a single horizontal row on small screens. `CustomerFilters` and `ColumnVisibilityDropdown` shrink their buttons on mobile. The table has explicit `min-w`/`max-w`, wrapped names/addresses (`line-clamp-2`), wrapping headers, and a styled horizontal scrollbar. Mobile table height is capped with `calc(100vh - ...)` so rows scroll inside the table instead of being covered by the fixed bottom navigation.
6. **Search with special characters** — `customerService.getCustomers` and `transactionService.getTransactions` now wrap `ilike` values in double quotes and double any internal quotes, so searches containing `,`, `(`, `)`, `.`, `=`, etc. no longer produce a PostgREST `PGRST100` parse error and the `Lỗi tải khách hàng` / transaction-list error banner.
7. **Backup/restore fixes (2026-08-05)** —
   - `src/utils/compression.ts` no longer uses Node-only `Buffer`; it now uses `TextEncoder`/`TextDecoder` + `btoa`/`atob` so browser backups do not throw `Buffer is not defined`.
   - `src/utils/backupRecovery.ts` now whitelists allowed columns during restore (`BRANCH_KEYS`, `BANK_ACCOUNT_KEYS`, `CUSTOMER_KEYS`, `TRANSACTION_KEYS`), preventing `PGRST204` errors for joined/display-only columns like `customer_name` or `bank_account_name`.
   - Restore helpers now collect per-record errors and `restoreBackup` returns them in `result.errors`; `Settings.tsx` / `Dashboard.tsx` show these instead of a false "Khôi phục thành công!".
   - `src/services/backupHistoryService.ts` `saveBackupToDatabase` now throws when `ServiceResponse.success` is `false`, so the UI surfaces backup failures.
   - `src/utils/backupRecovery.ts` `restoreCustomers` / `restoreBankAccounts` derive and reset the pre-transaction opening balance (`total_balance` / `current_balance` / `balance`) before re-inserting transactions, so `transactionService._syncTransactionBalance` does not double-count restored balances.

8. **Vercel rate-limit workaround (2026-08-05)** — The Vercel Hobby account hit `api-deployments-free-per-day` while PR #67/#68 were building, so a normal `main` production deploy could not start. To stop the customer-search `PGRST100` regression from staying live, `cashflow.appforyou.xyz` was manually aliased to the successful PR #67 preview deployment (`cashflow-r9iym8czc-viet-ducs-projects-3717a482.vercel.app`) after verifying the search-with-comma flow returns `0` rows and no `Lỗi tải khách hàng` banner. A regular production deploy from `main` will replace this alias once the Vercel quota resets.

## 2026-08-06 hotfix round

1. **Dashboard cross-tenant aggregates** — `dashboardService.ts` `isInScope` now requires an exact `company_id` match when `companyId` is provided. `Dashboard.tsx` also skips `getDashboardMetrics` until `companyId` resolves, and `useCompanyId.ts` falls back to `localStorage.selectedCompanyId` for `admin_master` so the dashboard no longer flashes all-tenant totals.
2. **Cash-flow chart negative rect** — `CashFlowChart.tsx` no longer uses a transparent `base` + `delta` stacked waterfall; that pattern produced invalid negative SVG `<rect>` heights whenever a period's net flow pushed the running total across zero. It now renders signed `inflow`/`outflow` bars with `stackOffset="sign"` and a `runningTotal` balance line, which Recharts handles natively for negative values.
3. **Import tab blocked by default date** — `TransactionImport.tsx` `hasTableChanges` compares the row against `emptyRow` instead of an empty string, so the pre-filled default `transaction_date` no longer triggers the `window.confirm` that was silently dismissed by Playwright and blocked switching to `Nhập hàng loạt`.

4. **Auth profile overwrite / role reset** — `@superapp/iam/src/hooks/useAuth.ts` used `.upsert({ role: "staff" })` on `SIGNED_IN` and `signUp`, which silently overwrote `public.users.role` (and cleared `company_id`) every time an existing user signed in. This caused `admin_master` accounts to become `staff` after login. Changed to `.insert(...)` with `23505` unique-violation ignored.

5. **Admin default company selection** — `CompanyBadge.tsx` and `useCompanyId.ts` now prefer `user.company_id` for `admin_master`/`admin` before `localStorage.selectedCompanyId` and before `companies[0]`. This stops `Dashboard.tsx` from staying in `LoadingFallback` or defaulting to the wrong tenant when no company has been explicitly selected.

### Still to do for production-grade
- `Settings.tsx` is 3000+ lines with ~50 `useState` hooks and inline modal JSX; split into tab/page components.
- `TransactionImport.tsx` / `CustomerImport.tsx` still contain parser/validator/preview logic inline; extract to `utils/importUtils` or dedicated modules.
- Replace remaining `alert()` / `console.*` with `toast` / `logger`.
- Reduce `any` casts and lint warnings in touched files.
- Finish the 12 standard Cashflow docs (currently only `AI-CONTEXT.md`, `DATA-FLOW.md`, `CHANGELOG.md`, and ADRs exist).
- Clean up the `supabase/migrations/` chain so `npx supabase start` can bootstrap from migrations alone. The repo has duplicate version prefixes and ordering bugs; a dump-based local stack now works (see RUNBOOK.md) as an interim solution.
