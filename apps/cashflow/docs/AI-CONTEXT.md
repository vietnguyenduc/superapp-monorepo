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

- `src/services/transactionService.ts` — CRUD + bulk import + **write-time balance sync**. `getTransactions` search covers `transaction_code`, `description`, `reference_number`, and the customer's `full_name`/`customer_code` via `customer_id.in.(...)` (no arbitrary limit). It also supports `sortBy`/`sortOrder` for `transaction_date`, `transaction_type`, `amount`, and `created_at` in both live and trial modes.
- `src/services/customerService.ts` — customer CRUD; defaults to `status='active'`; use `status='all'` to include pending/rejected.
- `src/services/bankAccountService.ts` — bank account CRUD; optional `status` filter.
- `src/services/branchService.ts` — branch CRUD; optional `status` filter.
- `src/services/approvalService.ts` — generic `updateEntityStatus(table, id, status, companyId)` used by `ApprovalsPage`.
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
- `packages/shared-utils/src/api-client/index.ts` — local `QueryBuilder.or()` parser used when the InsForge/PostgREST backend is active. It supports double-quoted values (with doubled-quote escaping) and parenthesized `in` lists (e.g., `customer_id.in.(id1,id2,id3)`) by tracking quote state and parenthesis depth.
- `src/utils/formatting.ts` — `formatCurrency`, `formatDate`, `getTransactionMathFactor`, `formatBankAccountLabel` (`bank - account_number`), `formatUserLabel` (`Full Name (email)`), and `formatShortTransactionCode` (`TXN-<suffix>` display shortener).
- `src/pages/Transactions/TransactionList.tsx` — transaction list with server-side pagination (page-size selector), column-visibility dropdown, frozen `Ngày giao dịch` + `Khách hàng` columns, sortable `Ngày` / `Loại giao dịch` / `Số tiền` headers with ▲/▼ indicators, and group-by `Ngày` / `Tuần` / `Tháng` / `Văn phòng` / `Loại giao dịch` / `Khách hàng`. Group summary uses `getCustomerBalanceDelta` to separate `Tổng phát sinh tăng` (excludes `Hoàn tiền`), `Tổng phát sinh giảm`, `Tổng hoàn tiền`, `Tổng điều chỉnh`, and `Net`.
- `src/contexts/TransactionTypeContext.tsx` — provides transaction type labels, colors, and math factors. Must load `transaction_types` scoped to the active company (via `useCompanyId()`); `getMathFactor` uses the stored `math_factor` from the resolved type row and only falls back to the canonical semantic factor when the row is missing or has no configured factor.
- `src/pages/Settings/Settings.tsx` — provider shell + `SettingsContent`; per-tab JSX in `pages/Settings/components/tabs/*.tsx`; state in `useSettingsState.ts`; shared context in `SettingsContext.tsx`; `colorOptions`/`getColorClass` in `Settings/utils.ts`.
- `src/types/index.ts` and `src/types/database.types.ts` — TS types.

## Money sign conventions (critical)

All new code must use `src/services/businessLogic/balanceMath.ts`.

Production convention: **positive `customers.total_balance` = debt / công nợ; negative = credit / overpayment**. The user-facing formula is:

```
Công nợ = Đầu kỳ + Phát sinh tăng - Phát sinh giảm + Hoàn tiền + Điều chỉnh - Đặt cọc
```

`getCustomerBalanceDelta` returns `amount * math_factor`. `math_factor` comes from the resolved `transaction_types` row (loaded per company) and is the source of truth. The canonical semantic factor is only used as a fallback when the row is missing or has no configured factor, so user overrides in Settings are respected while old inverted seed data is repaired by migration `20260804000006_fix_transaction_type_math_factors.sql`. When no factor is supplied, the canonical defaults are:

| Type      | math_factor | Customer balance delta | Bank cash delta | Meaning |
|-----------|-------------|----------------------|-----------------|---------|
| `charge`  | `+1`        | `+amount`            | `0`             | Customer owes more (debt / công nợ, phát sinh tăng). No cash moved. |
| `payment` | `-1`        | `-amount`            | `+amount`       | Customer pays (phát sinh giảm) → debt decreases, cash increases. |
| `refund`  | `+1`        | `+amount`            | `-amount`       | Customer refund received back (hoàn tiền) → debt increases, cash decreases. |
| `deposit` | `-1`        | `-amount`            | `+amount`       | Customer prepays/deposits (đặt cọc) → debt decreases, cash increases. |
| `adjustment` | `+1`     | signed amount        | signed amount   | Direct signed correction (`+amount` or `-amount`). |

Transaction amount color = **red** for debt-increasing types (`charge`/`refund`), **green** for debt-decreasing types (`payment`/`deposit`), and **blue/gray** for `adjustment`. Customer running-balance text (`total_balance`) is rendered in neutral colors; do not color-code it red/green. The Supabase migration `20260804000006_fix_transaction_type_math_factors.sql` repairs inverted `math_factor`/`impact_type` rows, updates `customer_factor_for_type` to look up stored factors first (with canonical fallback), and backfills customer balances.

### Customer balance source of truth

`customers.total_balance` is the source of truth for the customer's current debt, but it is now recomputed from `opening_balance + Σ(amount × math_factor)` on every transaction write. `transactionService._syncTransactionBalance` recalculates the affected customer's balance from the ledger instead of adding an incremental delta, which repairs any prior drift and ensures `charge`/`payment`/`refund`/`deposit`/`adjustment` are all reflected. `CustomerDetailModal` and `CustomerDetail` display `customer.total_balance` directly. When `opening_balance` changes, `updateCustomer`, `updateCustomerOpeningBalance`, and `bulkUpdateOpeningBalances` still adjust `total_balance` by the same delta. The database trigger `trg_update_customer_balance` (`supabase/migrations/20260804000004_balance_recalc_trigger.sql`) mirrors this recalculation in Postgres and backfills all existing balances. The legacy migration `043_recalculate_customer_total_balances.sql` is superseded by `20260804000004_balance_recalc_trigger.sql`.

The **displayed transaction amount** is the raw user-entered value (`parseAmount(amount)`), so `TransactionList`, `CustomerDetail`, `CustomerDetailModal`, and `RecentTransactions` show positive amounts while type-based color (charge/refund = red, payment/deposit = green, adjustment = blue) indicates the transaction direction.

### Customer detail financial summary (2026-08-22)

`CustomerDetailModal` shows two totals below the running balance:

- **`Tổng số tiền mua hàng`** — `Math.abs(amount)` of `charge` transactions only.
- **`Tổng số tiền đã trả`** — sum of the **debt-reducing contribution** of every transaction, computed via `getCustomerBalanceDelta`:
  - `delta = amount * math_factor`
  - if `delta < 0` (transaction reduced the customer's debt), add `-delta` to the total.
  - This naturally includes `payment` and `deposit` (canonical factor `-1`), and only the debt-reducing part of a signed `adjustment` (positive `adjustment` amounts are ignored because they increase debt). `refund` is excluded because its canonical factor is `+1` (it increases debt).
  - The amount shown is always positive.

### Customer detail transaction navigation (2026-08-29)

- Clicking any transaction row in `CustomerDetail` or `CustomerDetailModal` navigates to `/transactions?transaction_id=<id>`.
- `TransactionList` detects `?transaction_id=...` on load, fetches the referenced transaction, and opens it in `TransactionEditModal` so the user can edit it directly.

### Sign-aware amounts (2026-08-05)

The amount **sign** now reverses the transaction direction instead of being silently taken as an absolute value. This applies to bulk import, manual edits, and dashboard calculations.

- `charge -1000` → customer balance **-1000** (debt decreases by 1000), bank cash `0`.
- `payment -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `refund -1000` → customer balance **-1000** (debt decreases by 1000), bank cash **+1000** (cash in).
- `deposit -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `adjustment -1000` / `+1000` → direct signed correction on both customer and bank.

`getCustomerBalanceDelta` returns `amount * math_factor`; the stored `math_factor` (or canonical fallback) determines direction. `getBankAccountBalanceDelta` applies the type's fixed cash impact and scales it by `Math.sign(amount)`. `validateTransactionData` no longer rejects negative amounts for `payment`/`charge`/`refund`/`deposit`; it only requires a non-zero value. `TransactionList` and `TransactionEditModal` no longer call `Math.abs()` before saving non-adjustment amounts. A negative amount also flips the amount color (e.g. `charge -1000` shows green because it reduces debt).

### Balance Formula settings (2026-08-09)

A dedicated `Công thức dư nợ` tab in Settings shows the current formula, lists each `transaction_types` row with its `math_factor`/`impact_type`, lets the user toggle the factor, and previews `Dư nợ mới = Đầu kỳ + Số tiền × Hệ số` for an arbitrary amount and type. The factor map is loaded by `transactionTypeService.getTransactionTypeFactorMap` and passed into `transactionService._syncTransactionBalance`, `dashboardService.getDashboardMetrics`, and `getReceivableLedger` so every balance calculation respects the configured convention.

### UI/UX conventions for lists and header actions (2026-08-09)

- **Header buttons** — use `src/components/UI/Button.tsx` with `size="md"`. Primary CTA = `variant="primary"` (blue-teal gradient with white text); utility/export/import actions = `variant="secondary"` (white/gray with dark text). Do not write one-off `<button className="bg-blue-600 ...">` in page headers; it drifts out of sync and breaks dark mode/hover states.
- **Wide tables / freeze panes** — wrap tables in `overflow-x-auto` and consider a synchronized top scrollbar (`topScrollRef` + `tableContainerRef`). For `CustomerTable.tsx`, freeze the first columns as a contiguous block with fixed widths and `sticky` offsets so the customer name and last-transaction date stay visible while scrolling: `GD` (`left-0`), `Mã` (`left-[3.5rem]`), `Tên khách hàng` (`left-[7.5rem]`, `w-[14rem]`), `Công nợ` (`left-[21.5rem]`, `w-[6rem]`), `Giao dịch cuối` (`left-[27.5rem]`, `w-[9rem]`) on the appropriate breakpoints (`sm:` / `md:` / `lg:`). Frozen body cells need a solid background (`bg-white` / `dark:bg-gray-800`) and `group-hover` background to keep covering non-frozen cells behind them.
- **Customer name / code in tables** — render name as a clickable `<button>` with `text-gray-900 dark:text-white` and `hover:text-blue-600 dark:hover:text-blue-400`; render code below in `font-mono text-xs text-gray-500 dark:text-gray-400`. Keep both on a high-contrast background.
- **Creator column (`Người thực hiện`)** — `transactionService.getTransactions` joins `users(full_name, email)` and maps `creator_name` to `full_name` or `email`. As a fallback, load `databaseService.users.getUsers()` once, include the current auth user, and build a `Map<userId, displayName>` for display cells, the filter dropdown, and exports. Unknown IDs are shown as `Người dùng <shortId>` rather than raw UUIDs.
- **Group summary colors** — `Net` (and `Tổng điều chỉnh`) should be red when positive (increases debt) and green when negative (decreases debt). Use `getBalanceColor` or the same `data.net > 0 ? red : data.net < 0 ? green : gray` logic.
- **Import routing** — `CustomerImport` and `TransactionImport` read `?tab=bulk|single` to switch to the requested tab on navigation. Buttons in `CustomerList` and `TransactionList` route to `/import/<resource>?tab=bulk`.
- **Mobile-first transaction list** — below the `sm:` breakpoint, `TransactionList` renders a card list instead of the wide table. Each card shows type badge, signed amount, clickable customer name + code, date, branch/bank, creator, status badge, and edit/delete actions. Pagination is shared between desktop and mobile.
- **Forms on mobile** — avoid native `<select>` for long lists (e.g. customer picker). Use a searchable combobox with an input + filtered dropdown, clear button, and click/tap selection. Date inputs should not stretch full-width on mobile; cap with `max-w-xs` and left-align the text.
- **Mobile header** — keep the sticky top bar minimal (hamburger + app title only). Move company badge, app switcher, language toggle, user profile, and logout into the mobile sidebar drawer. Ensure drawer width is wide enough for the app-switcher dropdown (`w-80`).
- **Dropdowns on mobile** — use `z-50` (above the fixed bottom nav `z-50`) and `max-h-[calc(100vh-12rem)]` with `overflow-y-auto` so they are not clipped by the viewport or covered by other sticky elements. Constrain width to `max-w-[calc(100vw-2rem)]`.
- **Customer table mobile** — rows should not be too short/squat. Use `px-3 py-3`, `text-sm` cells, and a sensible `max-h` so enough rows are visible. Customer `total_balance` text stays neutral (no red/green) on both desktop and mobile cards; only transaction amounts carry the type-based color.
- **Filter action rows** — on mobile, let utility buttons wrap (`flex-wrap`) instead of hiding them in a horizontal overflow, so users can see all options without discovering a hidden scroll.
- **Customer list export** — combine export actions (`Xuất Excel`, `Xuất tồn đầu kỳ`) into a single `Xuất` dropdown to reduce header clutter; keep the dropdown `right-0 z-50` with a `w-56` menu and clear hover states in both light and dark modes.
- **Customer list filter/header layout** — the search bar is a sticky full-width bar at the top; the filter card and controls sit below it. Page-size, column visibility, bulk edit, and export controls are grouped in one row with `h-10` secondary buttons and the total-debt summary is merged into the pagination line. `CustomerFilters` dropdown uses plain hover presets, compact date inputs, and shared `Button` components for `Đặt lại` / `Áp dụng`.
- **Cash-flow chart** — `dashboardService.ts` `aggregateCashFlow` derives the period window from the latest transaction in the selected range (not `new Date()`). `CashFlowChart.tsx` renders a waterfall: an invisible `base` bar positions each period at the prior running total and a visible `flow` bar shows the net increase (`#10b981`) or decrease (`#f43f5e`); start/end balances are solid indigo bars from zero. A stepped `Line` (`type="stepAfter"`) follows the post-period running total.
- **Balance color rule** — customer running-balance text (`total_balance` in lists, detail, dashboard top customers) should be neutral (`text-gray-900 dark:text-white`) so users read the number without a false good/bad signal. Only transaction *amounts* use type-based colors (`getTransactionTypeAmountColor`) and status badges use their semantic colors.
- **Dark-mode contrast** — status/filter tabs and icon-only action buttons must use `dark:text-*` variants with light enough values (e.g., `dark:text-blue-300`, `dark:text-gray-200`) and explicit `dark:bg-gray-800` / `dark:bg-gray-900` backgrounds. Replace emoji dropdown triggers with SVG icons so they render consistently and respect currentColor.
- **Sticky/fixed z-ordering on mobile** — keep the main sticky header at `z-[200]`, time-range/selectors at `z-40`, fixed FAB above the `z-50` bottom nav (`bottom-20` on mobile so it does not overlap the nav), and add enough `pb-36` bottom padding to `main` so long lists scroll clear of the FAB.
- **Dashboard recent-transactions table headers** — `RecentTransactions.tsx` tablet table uses `t("dashboard.description")`, `t("dashboard.customer")`, `t("dashboard.account")`, `t("dashboard.date")`, `t("dashboard.amount")`, `t("dashboard.type")`, and `BalanceByBankChart.tsx` uses `t("dashboard.currentBalance")`; these keys must exist in both `vi.json` and `en.json`.
- **Customer list column widths / freeze panes** — in `CustomerTable.tsx`, keep `fullName` readable (`w-[14rem]` so long names wrap), `lastTransaction` (`w-[9rem]`), and remove `line-clamp-2` from the customer-name cell. Freeze the first columns (`GD`, `Mã`, `Tên khách hàng`, `Công nợ`, `Giao dịch cuối`) with fixed widths and `sticky` left offsets so customer name and last-transaction date stay visible during horizontal scroll.
- **Settings navigation** — `Settings.tsx` renders 8 compact tabs in a vertical grid (`grid-cols-3 sm:grid-cols-4 lg:grid-cols-5`, icon above label) and merges related settings: `transaction-config` (Loại giao dịch + Công thức dư nợ) and `system` (Tài khoản & phân quyền + Phân quyền duyệt + Tích hợp). `useSettingsState` resets `activeTab` to the first available tab if the persisted tab no longer exists.

## Transaction status workflow (2026-08-15)

- `Transaction.status` values are `draft` / `pending` / `completed` / `rejected` (VN labels: Nháp / Chờ duyệt / Hoàn thành / Từ chối). `TransactionList` renders a tab for each status and a status badge per row. Approval actions (Duyệt / Từ chối / Gửi duyệt) are shown based on `canApproveTransactions(user)`.
- `canBypassTransactionApproval(user)` returns `true` for `admin_master`, `admin`, `admin_company`, plus any `staff` with `staff_permissions.transactions.bypass_approval`. `getInitialTransactionStatus(user, saveAsDraft)` returns `draft` if `saveAsDraft` is `true`, `completed` if bypass applies, otherwise `pending`.
- `TransactionImport` single/bulk flows call `databaseService.transactions.bulkImportTransactions(...)` with `status` set to `getInitialTransactionStatus(user, saveAsDraft)`. Two buttons are provided: "Lưu nháp" (save as draft) and the existing import button (completed/pending based on role).
- `transactionService.ts` balance sync now ignores delta for any transaction whose `status` is not `completed`. This means draft/pending/rejected rows do not move `customers.total_balance` or `bank_accounts.balance`; status transitions reverse/adjust deltas correctly.

## Unified approvals & per-company approval settings (2026-08-16)

- New `ApprovalsPage` at `/approvals` (sidebar item visible only to admin roles) lists all pending `transactions`, `customers`, `bank_accounts`, and `branches` in one place. Admin can approve or reject each item; approved transactions become `completed` (and trigger balance sync through `transactionService.updateTransaction`), while customers/bank accounts/branches become `active`; rejected items become `rejected`.
- `Settings` has a new `Phân quyền duyệt` tab where admin toggles which entity types require approval on creation (`companies.approval_settings` JSONB: `transactions`, `customers`, `bank_accounts`, `branches`). All default to `true`.
- `customers`, `bank_accounts`, and `branches` now have a `status` column (`active` / `pending` / `rejected`). New records compute initial status via `getInitialEntityStatus(user, entityType, company.approval_settings, saveAsDraft, hasPermission)`. Helpers `canBypassEntityApproval` and `getInitialTransactionStatusWithSettings` combine user role, the relevant staff permission, and the per-company approval setting.
- `customerService.getCustomers` defaults to `status = 'active'`; pass `status: 'all'` to include pending/rejected. `bankAccountService.getBankAccounts` and `branchService.getBranches` accept an optional `status` parameter. Dropdowns in `TransactionList`, `TransactionImport`, and `Dashboard` request `active` records only so pending items are not selectable.

## Transaction status workflow (2026-08-15)

- `Transaction.status` values are `draft` / `pending` / `completed` / `rejected` (VN labels: Nháp / Chờ duyệt / Hoàn thành / Từ chối). `TransactionList` renders a tab for each status and a status badge per row. Approval actions (Duyệt / Từ chối / Gửi duyệt) are shown based on `canApproveTransactions(user)`.
- `canBypassTransactionApproval(user)` returns `true` for `admin_master`, `admin`, `admin_company`, plus any `staff` with `staff_permissions.transactions.bypass_approval`. `getInitialTransactionStatus(user, saveAsDraft)` returns `draft` if `saveAsDraft` is `true`, `completed` if bypass applies, otherwise `pending`.
- `TransactionImport` single/bulk flows call `databaseService.transactions.bulkImportTransactions(...)` with `status` set to `getInitialTransactionStatus(user, saveAsDraft)`. Two buttons are provided: "Lưu nháp" (save as draft) and the existing import button (completed/pending based on role).
- `transactionService.ts` balance sync now ignores delta for any transaction whose `status` is not `completed`. This means draft/pending/rejected rows do not move `customers.total_balance` or `bank_accounts.balance`; status transitions reverse/adjust deltas correctly.

## Unified approvals & per-company approval settings (2026-08-16)

- New `ApprovalsPage` at `/approvals` (sidebar item visible only to admin roles) lists all pending `transactions`, `customers`, `bank_accounts`, and `branches` in one place. Admin can approve or reject each item; approved transactions become `completed` (and trigger balance sync through `transactionService.updateTransaction`), while customers/bank accounts/branches become `active`; rejected items become `rejected`.
- `Settings` has a new `Phân quyền duyệt` tab where admin toggles which entity types require approval on creation (`companies.approval_settings` JSONB: `transactions`, `customers`, `bank_accounts`, `branches`). All default to `true`.
- `customers`, `bank_accounts`, and `branches` now have a `status` column (`active` / `pending` / `rejected`). New records compute initial status via `getInitialEntityStatus(user, entityType, company.approval_settings, saveAsDraft, hasPermission)`. Helpers `canBypassEntityApproval` and `getInitialTransactionStatusWithSettings` combine user role, the relevant staff permission, and the per-company approval setting.
- `customerService.getCustomers` defaults to `status = 'active'`; pass `status: 'all'` to include pending/rejected. `bankAccountService.getBankAccounts` and `branchService.getBranches` accept an optional `status` parameter. Dropdowns in `TransactionList`, `TransactionImport`, and `Dashboard` request `active` records only so pending items are not selectable.

## Recent architectural decisions

- `docs/adr/0001-transaction-type-single-source-of-truth.md`
- `docs/adr/0002-balance-math-and-tenant-protection.md` — balance math single source, tenant-field hardening, and write-time balance sync.

## Multi-tenancy rules

- `company_id` and `branch_id` are RLS tenant fields.
- Never let a user payload overwrite `company_id` / `branch_id` / `id` / `created_at` in update paths.
- `getCompanyId()` from `@superapp/shared-utils` returns the active company.
- Trial mode seeds use `trial-company` and `trial-branch`.

## UI/UX reference

- Apple HIG guide for Cashflow: `apps/cashflow/docs/APPLE-HIG-UIUX-GUIDE.md`
- Apple HIG full index and per-page notes: `.agents/skills/apple-design-guidelines/`
- Core convention summary: positive `total_balance` = debt, negative/zero = credit/overpayment. **Customer running balances are rendered in neutral text**; only transaction *amounts* carry the type-based red/green semantic color. Transaction type color badges: `charge` red, `payment`/`refund`/`deposit` green, `adjustment` blue.
- Use `src/components/UI/Button.tsx` with `variant="primary"` for the single main action and `variant="secondary"` for import/export/filter actions. Never write one-off `<button className="bg-blue-600 ...">`.

## Common pitfalls

- **Vite env checks:** use `import.meta.env.DEV`, not `process.env.NODE_ENV`.
- **Dates:** `date-fns` formatting can throw `RangeError` on invalid dates; `formatDate` catches and returns a fallback.
- **Trial store shallow copy:** `resetTrialStore()` does a shallow spread; tests should clear `localStorage`/`sessionStorage` and re-enable trial mode to force a deep clone from seed.
- **Supabase `.single()`** returns an error when a row is missing; guard with `if (error || !data)`.
- **`updateWithFallback`** retries updates with unknown columns stripped; useful for production schemas that lag migrations.
- **Bulk import payloads:** sanitize to the known `transactions` columns before calling `bulkInsertWithFallback` so Supabase does not log 400 errors for UI-only fields (`bank_account_name`, `branch_name`). Also do not select non-existent `branches.branch_name`; the `branches` table only has `name` and `code`.
- **Bulk import validation (live path):** `transactionService.bulkImportTransactions` validates every row before insert. It accepts `customer_code`, customer `id`, or `full_name`; validates `transaction_type` against active `transaction_types`; and returns a Vietnamese summary plus per-row errors (`Dòng X: ...`). The UI renders the full list in a scrollable box instead of showing only the first message.
- **Trial-mode bulk import:** the UI sends labels (`customer_id` may be `CUST0001 - ...`, `bank_account` may be `Vietcombank - TK Chính`) even in trial mode. The trial fallback must resolve these labels to IDs against `trialGet("customers")` / `trialGet("bank_accounts")` / `trialGet("branches")` before inserting, or transactions will be created with `customer_id: null` and balances will not update.
- **Trial-mode update balance sync:** always snapshot `oldTx` (e.g. `{ ...oldTx }`) before calling `trialUpdate` when recomputing balance deltas; otherwise the old and new transaction objects can share references and the diff collapses to zero.
- **Transaction type labels / canonicals:** dropdowns must use `useTransactionTypes().typesForDropdown`. Each item has a resolved `name` (Vietnamese business label) and an English `canonical` (`payment`, `charge`, `deposit`, `refund`, `adjustment`). The `<option>` value must be `canonical` so it matches `transactions.transaction_type`, while the displayed text comes from `name`. Do not build dropdowns directly from raw `transaction_types` rows.
- **Edit modals:** keep form state and validation inside dedicated components — `TransactionEditModal` for `TransactionList` and `CustomerFormModal` for `CustomerList`. Avoid inline modal JSX in page files so styling, validation, and i18n can be maintained in one place.
- **UUID `id` columns:** Supabase `id` columns are `uuid` type. `transformRawCustomer`, `transformRawTransaction`, `transformRawBankAccount`, `transformRawBranch`, `transformRawTransactionType`, and `transformRawBackupHistory` must generate a bare v4 UUID (`crypto.randomUUID()`), not a prefixed string like `branch-<uuid>`. Prefixed IDs will fail to insert.
- **Backup/restore FK mapping:** `restoreBackup` must create branches → bank accounts → customers → transactions in order, and build `oldId -> newId` maps for `branch_id`, `bank_account_id`, and `customer_id` so restored transactions point to the newly created rows.
- **Settings backup buttons:** `Settings.tsx` calls `databaseService.backupHistory.saveBackupToDatabase` / `loadBackupData` / `revertTableFromBackup`; these must be exported from `backupHistoryService.ts` and delegate to `backupService` / `recoveryUtils`.
- **Trial logout:** `Navigation.tsx` `handleLogout` must call `clearTrialStore()` (removes `cashflow_trial_user`, `cashflow_trial_mode_enabled`, `cashflow_trial_api_fetched`, `superapp_trial_mode`, `isTrial`) before `supabase.auth.signOut()` and `navigate('/login')`, otherwise the AuthContext re-initializes trial mode and the dashboard stays visible.
- **Customer detail `Tổng số tiền đã trả`:** do not use `Math.abs(amount)` by transaction type. Use `getCustomerBalanceDelta` and add only the negative portion (`-delta` when `delta < 0`). A positive `adjustment` increases debt and must **not** be counted as paid; `refund` reduces debt and is therefore counted, even though it is not money received from the customer.
- **Mobile modals z-index:** `Navigation` uses `z-[200]`. Any full-screen modal (`CustomerFormModal`, `CustomerBulkEditModal`, `CustomerDetailModal`, etc.) must use `z-[200]` or higher so the sticky top nav does not overlay the modal header on phones. Also use explicit `{" "}` text nodes in JSX for spaces between dynamic values to prevent minifiers from collapsing them.

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
2. **Cash-flow chart (resolved 2026-08-18)** — `CashFlowChart.tsx` renders a waterfall with a transparent `base` segment + visible `flow` segment; `base = min(previousTotal, runningTotal)`, `flow = abs(netFlow)`. The stepped balance `Line` was removed for a cleaner look. The `Số dư` toggle filters `type === "total"` items from `displayData`, hiding the start/end balance bars and their legend item.
3. **Import tab blocked by default date** — `TransactionImport.tsx` `hasTableChanges` compares the row against `emptyRow` instead of an empty string, so the pre-filled default `transaction_date` no longer triggers the `window.confirm` that was silently dismissed by Playwright and blocked switching to `Nhập hàng loạt`.

4. **Auth profile overwrite / role reset** — `@superapp/iam/src/hooks/useAuth.ts` used `.upsert({ role: "staff" })` on `SIGNED_IN` and `signUp`, which silently overwrote `public.users.role` (and cleared `company_id`) every time an existing user signed in. This caused `admin_master` accounts to become `staff` after login. Changed to `.insert(...)` with `23505` unique-violation ignored.

5. **Admin default company selection** — `CompanyBadge.tsx` and `useCompanyId.ts` now prefer `user.company_id` for `admin_master`/`admin` before `localStorage.selectedCompanyId` and before `companies[0]`. This stops `Dashboard.tsx` from staying in `LoadingFallback` or defaulting to the wrong tenant when no company has been explicitly selected.

6. **Dashboard `RecentTransactions` layout (2026-08-18)** — `RecentTransactions.tsx` was simplified to a single compact card list mirroring `TopCustomers`. Each card shows customer name, short `TXN-<suffix>` code, date, amount with type color, type badge, bank account label, and branch. A `maxItems` selector sits in the top-right.

### Still to do for production-grade
- `Settings.tsx` is 3000+ lines with ~50 `useState` hooks and inline modal JSX; split into tab/page components.
- `TransactionImport.tsx` / `CustomerImport.tsx` still contain parser/validator/preview logic inline; extract to `utils/importUtils` or dedicated modules.
- Replace remaining `alert()` / `console.*` with `toast` / `logger`.
- Reduce `any` casts and lint warnings in touched files.
- Finish the 12 standard Cashflow docs (currently only `AI-CONTEXT.md`, `DATA-FLOW.md`, `CHANGELOG.md`, and ADRs exist).
- Clean up the `supabase/migrations/` chain so `npx supabase start` can bootstrap from migrations alone. The repo has duplicate version prefixes and ordering bugs; a dump-based local stack now works (see RUNBOOK.md) as an interim solution.

## Error message convention (2026-08-21)

- All user-facing error strings in Cashflow must be in Vietnamese.
- Service errors are returned as `{ data, error: { message } }` and consumed by UI `toast.error` / inline banners.
- Import errors include row numbers (`Dòng X: ...`) and actionable guidance.
- `formatDate` falls back to `Ngày không hợp lệ` instead of `Invalid Date`.
- Tests that assert messages must match the Vietnamese strings (see `importUtils.test.ts`, `validation.test.ts`).
- Internal logger/debug messages can stay English, but avoid `console.*`; use `logger`.
