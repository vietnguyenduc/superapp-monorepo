# Changelog — Cashflow

## 2026-08-08

### Added

- **Deposit transaction type (`deposit` / `Đặt cọc`)** — reduces customer debt and increases bank cash like `payment`. Added to `TransactionType` union, `balanceMath.ts`, validation, parsers, import/data-cleaning helpers, UI labels/colors, transaction edit fallback, group summary, dashboard counts, and i18n (`vi`/`en`).
- **DB migration `042_deposit_transaction_type.sql`** — adds `deposit` to the `transaction_type` enum or `transactions` check constraint, seeds `deposit` rows into `transaction_types` for existing companies and the global default. (The previous `034` filename collided with an already-applied accounting migration and was removed.)
- **Trial seed** — added `deposit` and `refund` default rows to `trialMockStore.ts` with purple and green colors.

### Fixed

- **Transaction type dropdown/canonical mismatch** — `TransactionTypeContext` now exposes a `canonical` field alongside `name` (display label), and `TransactionEditModal` uses the canonical value for the select while rendering the Vietnamese label. `getNameById`/`getMathFactor`/`findByName` resolve by `id`, `canonical`, or display `name`.
- **Transaction type guard bug** — `transactionTypeService.toggleTransactionType` and `deleteTransactionType` now look up the type row and guard against `transactions.transaction_type` using the canonical name instead of the `transaction_types.id` (UUID).
- **i18n duplicate keys** — merged duplicate top-level `transactions` objects in `vi.json` and `en.json` so modal labels (e.g. edit transaction form) render in Vietnamese/English instead of showing raw keys; added `transactions.types.deposit` to the consolidated object.
- **Migration filename collision** — replaced `034_deposit_transaction_type.sql` with `042_deposit_transaction_type.sql` and made it work for both the `transaction_type` enum and the text CHECK-constraint schema used in production.

### Docs

- Updated `AI-CONTEXT.md`, `DATA-FLOW.md`, and `CHANGELOG.md` to document the `deposit` type and the canonical/display split.

## 2026-08-07

### Added

- **Transaction list grouping** — `TransactionList.tsx` now groups by `Ngày` / `Tuần` / `Tháng` and shows a `Tổng hợp theo nhóm` card with `Số giao dịch`, `Tổng phát sinh tăng`, `Tổng phát sinh giảm`, `Tổng điều chỉnh`, and `Net`. Week grouping uses ISO-week calculation; groups are sorted chronologically. Group-by also still supports `Văn phòng`, `Loại giao dịch`, and `Khách hàng`.

### Fixed

- **Transaction amount display preserves user-entered sign** — `TransactionList`, `CustomerDetail`, `CustomerDetailModal`, and `RecentTransactions` now render `formatCurrency(parseAmount(amount))` instead of `formatCurrency(getCustomerBalanceDelta(...))`, so positive amounts stay positive on screen while type color (red/green/blue) still indicates the transaction direction. Balance math in `balanceMath.ts` continues to drive `total_balance`, bank cash, and dashboard aggregations.

### Changed

- **Settings page refactor** — split `pages/Settings/Settings.tsx` into a shared `useSettingsState` hook, `SettingsContext`, and per-tab components in `pages/Settings/components/tabs/*.tsx`. `colorOptions`/`getColorClass` moved to `pages/Settings/utils.ts`, and the module-level `formatCurrency` duplicate was removed. No behavior changed; all tabs render and switch correctly in local preview.

## 2026-08-06

### Fixed

- **Dashboard tenant scoping** — `dashboardService.ts` now requires an exact `company_id` match when a company is selected, preventing cross-tenant aggregates for `admin_master`.
- **Dashboard cash-flow chart negative rect** — replaced the broken stacked-base waterfall with signed `inflow`/`outflow` bars plus a `runningTotal` balance line (`stackOffset="sign"`), so periods with net-negative cash flow no longer throw SVG `negative <rect> height` errors.
- **Import tab switching** — `TransactionImport.tsx` only warns about unsaved single-entry data when the row differs from the default empty row, so the `Nhập hàng loạt` tab is no longer blocked by the pre-filled default date.
- **Company ID fallback for admin** — `useCompanyId.ts` falls back to `localStorage.selectedCompanyId` and the user's assigned `company_id` for `admin_master`/`admin`, reducing the chance that `Dashboard.tsx` loads cross-tenant data or stays in loading before `CompanyContext` finishes restoring the selection.
- **Dashboard fetch guard** — `Dashboard.tsx` skips `getDashboardMetrics` until `companyId` is resolved.
- **Auth profile overwrite fix** — `@superapp/iam` `useAuth.ts` now uses `insert` instead of `upsert` when creating a `public.users` profile on sign-in / sign-up, and ignores `23505` unique violations. Previously `upsert({ role: "staff" })` silently overwrote an existing `admin_master`/`admin_company` role and `company_id` on every login.
- **Company badge default for admin** — `CompanyBadge.tsx` now prefers `user.company_id` as the default company for `admin_master`/`admin` before falling back to `companies[0]`, preventing an empty/wrong-tenant dashboard on first load.

## 2026-08-05

### Fixed

- **Sign-aware transaction amounts** — `balanceMath.ts` now multiplies the type's default impact by `Math.sign(amount)`, so negative amounts reverse the transaction direction instead of being silently absoluted. Applied to bulk import, manual edit, balance sync, and dashboard aggregates.
- **Vietnamese validation messages** — `validation.ts` returns user-facing errors in Vietnamese, fixing the English "Lỗi cấu hình" banner when saving bank accounts.
- **Stale modal errors** — `Settings.tsx` resets `error` when opening or canceling modals.
- **Dashboard active customers** — counts `customers.is_active !== false` instead of unique `customer_id` values in the current transaction window.
- **Customer list summary** — uses `formatCurrency` (exact number) and counts from the full `allCustomers` list.
- **Customer table responsive UX** — compact columns, sticky headers, horizontal scroll indicator, and mobile-safe pagination.
- **Search with special characters** — `customerService.getCustomers` and `transactionService.getTransactions` quote `ilike` values so searches containing `,`, `(`, `)`, `.`, `=` no longer cause PostgREST `PGRST100` errors.
- **Backup/restore robustness** — browser-safe compression (`TextEncoder`/`btoa`), restore column whitelist, per-record error reporting, and correct opening-balance reset to avoid double-counted balances after restore.
- **Export Excel** — matches the current customer table view (search, sort, and visible columns) and keeps amounts as numbers.

### Added

- `scripts/deploy-app.sh` and `scripts/deploy-changed-apps.sh` for on-demand, single-app / changed-app-only Vercel CLI deploys.
- `.github/workflows/deploy-changed-apps.yml` as an optional `workflow_dispatch` deployment path.
- `scripts/vercel-ignore.sh` now skips every preview build that is not the `viet` branch to preserve free Vercel quota.
- `scripts/supabase-local-from-dump.sh` and `apps/cashflow/docs/RUNBOOK.md` for local Supabase RLS simulation from a cloud schema dump, bypassing the broken migration chain and avoiding Vercel quota delays.

### Docs

- Updated `AI-CONTEXT.md`, `DATA-FLOW.md`, and ADRs to reflect sign-aware balance math and the minimal-deployment strategy.
- Added `apps/cashflow/docs/RUNBOOK.md` with the local Supabase RLS simulation workflow.
