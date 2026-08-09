# Changelog — Cashflow

## 2026-08-04

### Fixed

- **Neutral customer debt balances** — removed red/green coloring from customer `total_balance` in `CustomerTable`, `CustomerDetail`, `CustomerDetailModal`, and `CustomerList` summary. Transaction amounts continue to use their type-based colors (`getTransactionTypeAmountColor`).
- **Mobile customer-table layout** — action buttons (edit/delete/transactions) are now rendered inside each mobile card header instead of a separate mid-card column; the name and address can wrap; the table header is hidden on small screens; row padding is slightly larger for better touch targets.

## 2026-08-12

### Fixed

- **Customer list/detail debt mismatch** — `customers.total_balance` is now the single source of truth displayed everywhere. `CustomerDetailModal` no longer recomputes a separate `currentBalance` from `opening_balance + transactions`, and `customerService.getCustomerById` no longer overrides the stored `total_balance`.
- **Opening balance sync** — `customerService.updateCustomer`, `updateCustomerOpeningBalance`, and `bulkUpdateOpeningBalances` now update `total_balance` (and `current_balance` for backwards compatibility) by the same delta when `opening_balance` changes, so the list and detail stay consistent after edits.
- **Backfill migration** — `supabase/migrations/043_recalculate_customer_total_balances.sql` recalculates `total_balance` for every customer from `opening_balance + Σ(amount × math_factor)` using `transaction_types.math_factor` (or canonical factors as fallback) and `positive = debt` convention.

## 2026-08-11

### Added

- **Searchable customer select in TransactionEditModal** — replaced the native `<select>` for `customer_id` with a combobox: type a customer name or code, see a filtered dropdown, and click/tap to select. The selected value is still stored as `customer_id`.
- **Mobile header declutter** — on viewports below `lg`, the sticky top bar now only shows the hamburger menu and app title. The company badge, app switcher, language toggle, user profile, and logout were moved into a dedicated panel at the top of the mobile sidebar drawer (`Sidebar.tsx`). The mobile drawer width was widened to `w-80` so the app-switcher dropdown fits.
- **Date filter for CustomerList** — the existing `CustomerFilters` date range now actually filters the customer list by `last_transaction_date` (Supabase live + trial fallback). The dropdown was raised to `z-50`, capped to `max-h-[calc(100vh-12rem)]` with scroll, and constrained to `max-w-[calc(100vw-2rem)]` so it is not cut off on small screens.
- **CustomerList table readability** — increased row/header padding (`px-3 py-3`), bumped header text to `text-xs`, cell text to `text-sm`, name text to `text-sm sm:text-base`, and raised the mobile table max-height from `calc(100vh - 36rem)` to `calc(100vh - 18rem)` so the table is no longer short/squat. The mobile balance amount now uses `getCustomerListBalanceColor` so positive debt renders red and credit/overpayment renders green.
- **CustomerList filter action wrap** — the page-size, column visibility, bulk-edit, and export buttons now wrap on mobile (`flex-wrap`) instead of being hidden in an unlabeled horizontal scroll.
- **TransactionEditModal date input layout** — the `transaction_date` field is capped to `max-w-xs` on mobile (`sm:max-w-full` on desktop) and left-aligned so it no longer stretches across the full modal width.

### Fixed

- Mobile header controls were duplicated/crowded; now all context actions live in the mobile drawer, leaving the sticky header minimal.
- Customer table mobile `total_balance` color used `>= 0 ? green` which inverted the debt convention; now uses the shared balance color helper.

## 2026-08-10

### Added

- **Apple HIG UI/UX reference** — added `apps/cashflow/docs/APPLE-HIG-UIUX-GUIDE.md` and the repo-wide skill `.agents/skills/apple-design-guidelines/` with the full HIG index (`references/hig-index.md`) and per-page raw notes (`references/raw/*.md`). This captures Apple's design principles, foundations, patterns, and components so future UI/UX work in Cashflow stays consistent and doesn't reintroduce ad-hoc button styles or low-contrast table cells.

## 2026-08-09

### Added

- **Balance Formula (`Công thức dư nợ`) settings tab** — new tab shows `Dư nợ = Đầu kỳ + Σ(Số tiền × Hệ số)`, lists every transaction type with its `math_factor` and impact, lets the user toggle the factor between `+1` (increase debt) and `-1` (decrease debt), and includes a live preview with opening balance, amount, and type selection.

### Fixed

- **Balance sign convention** — `balanceMath.ts` now uses the production convention where `customers.total_balance > 0` means debt. `getCustomerBalanceDelta` honors an explicit `math_factor` (or `transaction_types.math_factor`) and returns `amount * factor`.
  - `charge` → `+1` (increases debt)
  - `payment`, `refund`, `deposit` → `-1` (decreases debt)
  - `adjustment` → `+1` (signed amount)
- **Color logic** — `formatting.ts` balance colors and `colorSettingsService.ts` defaults now show positive balances as red (debt) and negative/zero balances as green (credit/overpayment).
- **Dashboard aggregates and sorting** — `dashboardService.ts` now treats positive `total_balance` as debt; `currentIncome`/`currentDebt` use `Math.max(0, -delta)` and `Math.max(0, delta)` respectively, `topCustomers` sorts debtors descending, `debtCustomers`/`creditCustomers` use `> 0`/`< 0`, branch aggregates are swapped, and `getReceivableLedger` increase/decrease columns are aligned with the positive-debt convention.
- **Transaction sync** — `transactionService.ts` loads the per-company `math_factor` map from `transaction_types` and applies it to customer balance deltas during create, update, delete, and bulk import.
- **Transaction list group summary** — increase/decrease classification now follows the sign convention and respects each transaction type's `math_factor`.
- **Recent transactions running balance** — uses the type-specific `math_factor`.
- **Trial seed balances** — mock customer `total_balance` values are now positive to represent debt.

### Added

- **Import buttons** — `CustomerList` header has a **Nhập hàng loạt** button routing to `/import/customers?tab=bulk`; `TransactionList` header has **Nhập giao dịch** and **Nhập hàng loạt** buttons routing to `/import/transactions` and `/import/transactions?tab=bulk`. `CustomerImport.tsx` and `TransactionImport.tsx` now read the `tab=bulk|single` query parameter.

### Fixed

- **Balance Formula tab duplication** — `BalanceFormulaTab` groups transaction types by canonical name (`deposit`, `payment`, `charge`, `refund`, `adjustment`) and renders one row per canonical type instead of duplicate rows.
- **TransactionList UI/UX** — customer name/code cells have higher contrast and a sticky customer column; the creator (`Người thực hiện`) column shows the real user name from `databaseService.users.getUsers()` instead of a raw UUID; a synchronized top scrollbar lets users scroll wide tables without reaching the bottom; the group summary `Net` column uses red for positive (increases debt) and green for negative (decreases debt).
- **Header action button consistency** — new import buttons use the same `Button` component, `size="md"`, and `variant="secondary"` as other header utility actions.
- **Trial mode import customer resolution** — `transactionService.bulkImportTransactions` trial fallback now resolves `customer_code`/`customer_id` labels against `trialGet("customers")` so single-entry and file imports attach the correct customer and update balances.
- **Trial mode update balance sync safety** — `transactionService.updateTransaction` trial fallback snapshots `oldTx` with a shallow clone before `trialUpdate`, preventing stale-reference bugs when recomputing the customer/bank balance delta.
- **Trial seed `created_by`** — mock transactions and `transactionBalanceSync.test.ts` use `"trial-user"` so `Người thực hiện` resolves to "Trial User" in trial mode.

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

### UI/UX (post deposit follow-up)

- **Mobile transaction list empty / overflow** — `TransactionList.tsx` was wrapped in `hidden sm:block`, so phones saw an empty page. Added a `sm:hidden` card view with customer name, code, type badge, amount, date, branch/bank/creator, status, and action buttons. Pagination was moved outside the desktop-only block so it appears on mobile.
- **Status tabs wrapping** — the filter tab bar now uses `flex-wrap` so `Tất cả` / `Hàng chờ duyệt` / `Đã hoàn thành` wrap on narrow screens instead of forcing horizontal overflow.
- **Cash-flow chart labels** — `vi.json` `dashboard.inflow`/`dashboard.outflow` changed from `Điều chỉnh tăng`/`Điều chỉnh giảm` to `Tiền vào`/`Tiền ra` so the legend/tooltip match bank cash-flow semantics.
- **Cash-flow chart period generation** — `dashboardService.ts` `aggregateCashFlow` now builds the period window from the latest transaction date in the selected range instead of `new Date()`, so old data no longer renders as all-zero bars while real transactions sit outside the window.
- **Cash-flow chart colors** — bar fills now match the legend (`#10b981` for inflow, `#f43f5e` for outflow).

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
