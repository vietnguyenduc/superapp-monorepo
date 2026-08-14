# Changelog — Cashflow

## 2026-08-22

### Fixed

- **UI/UX fixes on mobile Customer list and edit modal.**
  - Added missing `common.apply`, `common.clear`, `common.noResults`, `common.exporting`, and `common.addNew` i18n keys so buttons like the date-range "Áp dụng" no longer show the raw translation key.
  - Hardened `ColumnVisibilityDropdown` against clipping on narrow screens: larger `z-50` panel with `w-64 sm:w-72`, `max-w-[calc(100vw-1rem)]`, and `whitespace-nowrap` labels so column names like "Mã khách hàng" / "Tên khách hàng" no longer wrap or get cut off.
  - Removed `overflow-x-auto` from the `CustomerList` action-bar container so the column-visibility dropdown is no longer clipped by its scroll parent.

### Fixed

- **Customer balance not updating after transactions** (`critical issue: balance not update`). `transactionService._syncTransactionBalance` now recalculates `customers.total_balance` and `customers.current_balance` from `opening_balance + Σ(amount × math_factor)` instead of applying a single incremental delta. This repairs prior drift and ensures all `completed` transactions (charge, payment, refund, deposit, adjustment) are reflected.
  - `transactionService._recalcCustomerBalance` fetches `opening_balance`, sums all completed transactions for that customer using `transactionTypeService.getTransactionTypeFactorMap` (falling back to canonical factors), and updates both `total_balance` and `current_balance`.
  - `transactionService._syncTransactionBalance` recalculates the affected customer(s) on create/update/delete; bank account `balance` is still adjusted incrementally by `getBankAccountBalanceDelta`.
  - Bulk import collects unique `customer_id`s and `bank_account_id`s and recalculates each once.
  - Trial-mode seed customers now receive a derived `opening_balance` so the hardcoded `total_balance` stays consistent when recalculated.
  - `transactionTypeService.getTransactionTypes` now falls back to the canonical `math_factor` when a `transaction_types` row has `math_factor` NULL, so the factor map is never missing for known types.
- **Fixed `initErrorTracking` void-return crash** in `apps/inventory-operation/src/main.tsx`, `apps/sales-operation/src/main.tsx`, and `apps/hr-operation/src/main.tsx`. These files were discarding the `ReactDOM.createRoot(...)` result and calling `.render()` on the `initErrorTracking` return value, causing `Cannot read properties of undefined (reading 'render')` in production. They now initialize error tracking and create the React root separately.

### Added

- **Customer detail modal now shows `Tổng số tiền đã trả` (total paid amount)** immediately below `Tổng số tiền mua hàng`. `CustomerDetailModal` sums only the debt-reducing contribution of each transaction via `getCustomerBalanceDelta` (negative deltas from `payment`, `deposit`, `refund`, and debt-reducing `adjustment` amounts), so debt-increasing adjustments no longer inflate the total, and uses the new `customers.detail.totalPaid` i18n key.
- **New opening-balance export screen on Customer page** at `/customers/opening-balance`.
  - Lists all active customers with `Số dư đầu kỳ` and `Công nợ hiện tại`.
  - Searchable by customer code or name; sortable by code, name, opening balance, and current debt.
  - Summary cards show customer count, total opening balance, and total debt.
  - One-click Excel export with Vietnamese column headers (`Mã khách hàng`, `Tên khách hàng`, `Số dư đầu kỳ`, `Công nợ hiện tại`) compatible with the existing import parser.
  - Accessible from `CustomerList` via the new `Xuất tồn đầu kỳ` secondary button.
- **Settings → Số dư đầu kỳ** list now supports searching by code/name, sorting by any column, and toggling between ascending (`Bé → Lớn`) and descending (`Lớn → Bé`).
- **Supabase migration `supabase/migrations/20260804000004_balance_recalc_trigger.sql`** creates `update_customer_balance()` and `update_bank_account_balance()` trigger functions that recalculate balances from the ledger on every `INSERT`/`UPDATE`/`DELETE` of `public.transactions`, then backfills all existing customers and bank accounts.

### Docs

- Updated `AI-CONTEXT.md` and `DATA-FLOW.md` to document the `CustomerDetailModal` financial summary (`Tổng số tiền mua hàng` / `Tổng số tiền đã trả`) and the rule that `Tổng số tiền đã trả` must be computed from the signed balance delta, counting only the debt-reducing portion of each transaction.

## 2026-08-21

### Fixed

- **Vietnamese user-facing error messages across Cashflow services, import utils, and UI.**
  - `importUtils.ts`, `validation.ts`, `validationSystem.ts` now return Vietnamese validation errors.
  - `customerService.ts`, `transactionService.ts`, `branchService.ts`, `bankAccountService.ts`, `transactionTypeService.ts`, `approvalService.ts` translate `not found`, `already exists`, and import/backup error messages.
  - `backupRecovery.ts` and `compression.ts` translate backup/export/import compression errors.
  - `TransactionImport.tsx`, `CustomerImport.tsx`, `TransactionList.tsx`, `CustomerDetail.tsx` replace `Parse error`, `Failed to fetch...`, and generic `Import failed` messages with Vietnamese guidance.
  - `formatting.ts` returns `Ngày không hợp lệ` instead of `Invalid Date`.
  - Updated `importUtils.test.ts` and `validation.test.ts` to assert the new Vietnamese strings.

## 2026-08-20

### Fixed

- **Bulk transaction import errors are now user-friendly and list every failing row.** `transactionService.bulkImportTransactions` validates each row before inserting and returns a Vietnamese summary plus per-row messages (`Dòng X: ...`).
- **Customer lookup in bulk import now accepts `customer_code`, customer `id`, or `full_name`**, matching the trial-mode resolver. Previously the live path only matched `customer_code`, so imports using numeric IDs failed with a raw `Customer not found` error.
- **Transaction type validation now checks against active `transaction_types`** (by id, name, or canonical label) instead of silently normalizing to `payment` for unknown inputs.
- **`TransactionImport` UI now displays a scrollable list of errors** instead of only the first error message, and adds row numbers so users can fix the source file quickly.

## 2026-08-19

### Fixed

- **Bulk transaction import no longer fails with `transactions_transaction_code_company_key` unique-constraint violations.** `transactionService.bulkImportTransactions` now:
  - Fetches existing `transaction_code` values for the company before import.
  - Auto-generates a unique `TXN<timestamp>-<index>-<random>` code when the row leaves `Số chứng từ` blank.
  - Returns row-level errors (in `result.errors`) when a provided `transaction_code` already exists or is duplicated within the import file, instead of letting Postgres throw an opaque `duplicate key` error.
- `validateTransactionData` (importUtils) now checks duplicate `transaction_code` values inside the same file and reports the offending row numbers.
- `cleanTransactionData` and `convertToTransactions` preserve an optional `transaction_code` field.
- Bulk import `transaction_date` parsing now consistently uses the Vietnamese `DD/MM/YYYY` parser (shared `businessLogic/parsers.ts`). Both live and trial paths store an ISO timestamp, preventing imported dates from displaying as "Invalid Date".

## 2026-08-18

### Added

- **Transaction group by Quý / Năm** — `TransactionList` now supports grouping by `quarter` and `year` alongside `day`, `week`, and `month`.
- **Deposit column in group summary** — the group summary table (and new mobile summary cards) now shows `Tổng đặt cọc` separately from `Tổng phát sinh giảm`.
- **Mobile group summary** — `TransactionList` renders a `sm:hidden` card list when a group-by option is selected so mobile users can see the summary too.

### Fixed

- `parseAmount` now returns numeric inputs unchanged and treats a trailing separator with 1–2 fractional digits as a decimal marker. This fixes a bug where values like `990366250.4` were parsed as `9,903,662,504` (10× too large), which inflated `Customer to Watch` balances on the dashboard.
- Mobile group summary card is now placed outside the desktop-only `hidden sm:block` container so it actually appears on small screens.

### Added

- **Group-by date range filter** — when grouping transactions by `Ngày/Tuần/Tháng/Quý/Năm`, the summary header exposes `Từ ngày` / `Đến ngày` inputs on both desktop and mobile so users can narrow the displayed groups. The group summary now aggregates over all matching transactions in the selected range (up to 1,000 rows) instead of only the current paginated page. Date presets and single-day custom ranges use local midnight boundaries, and group-by `Ngày` keys are rendered in local time.
- **Selective data reset** — the `Backup & Khôi phục` settings tab now lets users pick which data to reset (`Giao dịch & Khách hàng`, `Tài khoản ngân hàng`, `Chi nhánh`) and choose between `Đưa về null` (clear selected tables) or `Reset all` (clear all three). Branch references are nulled in `transactions`, `bank_accounts`, `customers`, and `users` before deleting branches to avoid FK errors.

## 2026-08-17

### Added

- **Customer balance range filter** — `CustomerList` now has `Dư nợ từ` / `Dư nợ đến` inputs in the filter bar so users can filter customers by `total_balance`. The filter is applied server-side (`total_balance` gte/lte) and reflected in the total-debt summary and Excel export.
- **Transaction customer filter** — `TransactionList` now exposes a `Tất cả khách hàng` dropdown in the filter grid, synced with the existing `customer_id` URL parameter. Clicking `Xem giao dịch` on a customer pre-selects that customer in the dropdown and filters the transaction list.

### Changed

- Renamed the customer-card `GD` button to `Xem giao dịch` for clarity, and made the mobile action row wrap gracefully when the label is longer.

### Fixed

- `CustomerFilters` balance-range inputs now keep local min/max state so changing one bound no longer overwrites the other; the active filter pill formats values with `formatCompactCurrency`.
- Trial seed data now includes `status: 'active'` for customers, so `CustomerList` filters work in trial mode.

### Migration

- `supabase/migrations/046_entity_pending_status.sql` — adds `status` columns to `customers`, `bank_accounts`, and `branches` with `active` default and backfills existing rows.
- `supabase/migrations/047_company_approval_settings.sql` — adds `companies.approval_settings` JSONB with all categories enabled by default and backfills existing companies.

## 2026-08-16

### Added

- **Unified Approvals page** — new `/approvals` route and sidebar item (admin only) that lists pending `transactions`, `customers`, `bank_accounts`, and `branches`. Admin can approve (status becomes `completed`/`active`) or reject (status becomes `rejected`) each item from one screen. `ApprovalsPage` is lazy-loaded and uses `approvalService.updateEntityStatus` for non-transaction entities; transactions reuse `transactionService.updateTransaction` so balance deltas are applied on approval.
- **Per-company approval settings** — `Settings` has a new `Phân quyền duyệt` tab (admin only) with toggles for `transactions`, `customers`, `bank_accounts`, and `branches`. When a category is ON, staff creations go to `pending` and wait for admin approval; when OFF, staff can create directly if they have the relevant permission. Settings are persisted in `companies.approval_settings` JSONB.
- **Entity status columns** — `customers`, `bank_accounts`, and `branches` now have a `status` column (`active` | `pending` | `rejected`). Default is `active`; new records created by staff respect `getInitialEntityStatus` and the company approval settings. Existing records are backfilled to `active`.
- **Status-based filtering in services** — `customerService.getCustomers` defaults to `status = 'active'` (use `status: 'all'` to bypass). `bankAccountService.getBankAccounts` and `branchService.getBranches` accept an optional `status` parameter. Transaction/customer/bank/branch dropdowns in `TransactionList`, `TransactionImport`, and `Dashboard` now request only `active` records so pending items are not selectable.

### UI/UX (Apple HIG)

- `ApprovalsPage` now uses entity-type SVG icons, colored badges, `formatCurrency`/`formatDate`, and an empty-state illustration with a refresh action; filter pills have `role="tab"` and `aria-selected` and meet 44 px touch targets.
- `Settings` tab grid replaces emoji with inline SVG icons, adds `role="tab"`/`aria-selected`, increases touch target to `min-h-[52px]`, highlights the active tab with a subtle shadow, and improves dark-mode contrast.
- `TransactionList` and `CustomerList` pagination info now shows `0 / 0` instead of `1-0 / 0` when there are no results.
- `TransactionList` status tabs use bright `dark:text-*` colors and high-contrast active badges; date/column trigger buttons use SVG chevrons instead of emojis; action buttons have explicit `dark:bg-gray-800` backgrounds so they remain legible in dark mode.

### Migration

- `supabase/migrations/046_entity_pending_status.sql` — adds `status` columns to `customers`, `bank_accounts`, and `branches` with `active` default and backfills existing rows.
- `supabase/migrations/047_company_approval_settings.sql` — adds `companies.approval_settings` JSONB with all categories enabled by default and backfills existing companies.

## 2026-08-15

### Added

- **Transaction status workflow** — transactions now have four statuses: `Nháp` (draft), `Chờ duyệt` (pending), `Hoàn thành` (completed), and `Từ chối` (rejected). `TransactionList` shows a tab for each status and a status badge per row. `admin-company`, `admin`, and `admin-master` accounts can create transactions as completed directly; `staff` accounts create transactions as pending unless `staff_permissions.transactions.bypass_approval` is enabled. Every new transaction can be saved as a draft from `TransactionImport` using the new "Lưu nháp" buttons.
- **Staff `bypass_approval` permission** — `UsersTab` now has a toggle "Tạo giao dịch không cần duyệt" in the Giao dịch section, stored in `staff_permissions.transactions.bypass_approval` and honored by `getInitialTransactionStatus` and `canApproveTransactions` helpers.
- **Status-aware balance sync** — `transactionService.ts` only applies balance deltas for transactions whose `status === "completed"`. Draft/pending/rejected rows do not affect `customers.total_balance` or `bank_accounts.balance`; status transitions (e.g. completed → rejected) reverse/adjust deltas correctly.

### Migration

- `supabase/migrations/045_transaction_status_draft_rejected.sql` — migrates the `transactions.status` CHECK constraint to allow `draft`, `pending`, `completed`, `rejected`; maps any existing `cancelled` rows to `rejected`; keeps default `completed` for backward-compatible inserts.

## 2026-08-13

### Fixed

- **Deposit transaction type label** — `TransactionTypeContext` now normalizes the canonical value to the English key (`deposit`) for all Vietnamese aliases, and `TransactionList` passes the global `typesForDropdown` (with canonical + resolved Vietnamese display names) to `TransactionEditModal`. The edit modal select now stores `transaction_type` as `payment`/`charge`/`deposit`/`refund`/`adjustment` while showing labels like `Phát sinh giảm`, `Phát sinh tăng`, `Đặt cọc`, `Hoàn tiền`, `Điều chỉnh`. This fixes the raw "deposit" option and the inability to change transaction types in the edit modal.
- **Auth profile company fetch 406** — `@superapp/iam/src/hooks/useAuth.ts` now uses `.maybeSingle()` when fetching `branches` and `companies`, preventing a `406 Not Acceptable` console error for roles whose RLS policy does not allow viewing those rows directly.
- **Deposit seed data** — `supabase/migrations/042_deposit_transaction_type.sql` seeds `name='Đặt cọc'` instead of `'deposit'`, and `044_fix_deposit_vietnamese_name.sql` backfills any existing rows.

## 2026-08-04

### Fixed

- **Neutral customer debt balances** — removed red/green coloring from customer `total_balance` in `CustomerTable`, `CustomerDetail`, `CustomerDetailModal`, `CustomerList` summary, and `TopCustomers` dashboard rows. Transaction amounts continue to use their type-based colors (`getTransactionTypeAmountColor`).
- **Mobile customer-table layout** — action buttons (edit/delete/transactions) are now rendered inside each mobile card header instead of a separate mid-card column; the name and address can wrap; the table header is hidden on small screens; row padding is slightly larger for better touch targets.
- **Dashboard time-range selector overlay** — converted the `fixed` selector container on `Dashboard.tsx` to `sticky` so it no longer sits on top of the sticky navigation and blocks the top action buttons on mobile.
- **Mobile floating action button overlap** — raised the `Layout.tsx` FAB to `bottom-20` on small screens (above the fixed bottom nav) and increased `main` padding-bottom to `pb-36` so the last page content is not hidden behind the FAB on scroll.
- **Dashboard recent-transactions header translations** — added missing `dashboard.description`, `dashboard.customer`, `dashboard.account`, `dashboard.date`, `dashboard.amount`, `dashboard.type`, and `dashboard.currentBalance` keys to `vi.json` and `en.json` so the tablet table no longer shows raw i18n keys.
- **Customer list readability** — widened `fullName` (`w-[14rem]`) and `lastTransaction` (`w-[9rem]`) columns and removed `line-clamp-2` from the customer-name cell so long company names wrap instead of being truncated.
- **Customer table freeze panes** — froze the first five columns (`GD`, `Mã`, `Tên khách hàng`, `Công nợ`, `Giao dịch cuối`) with fixed widths and `sticky` left offsets so the customer name and last-transaction date remain visible during horizontal scroll on narrow viewports.
- **Settings tab layout** — converted the horizontal scrolling tab nav in `Settings.tsx` into a responsive vertical grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) to avoid horizontal scroll and make the 10 settings tabs easier to reach on mobile.

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
