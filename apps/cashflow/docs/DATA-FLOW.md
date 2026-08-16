# Data Flow — Cashflow App

## Overview

Cashflow stores three core entities:

- **customers** — `opening_balance` plus the sum of transaction deltas becomes `total_balance`.
- **bank_accounts** — `balance` is updated by payment, refund, deposit, and adjustment transactions.
- **transactions** — every financial event; `transaction_type` + `amount` drives all balance math.

Other supporting tables: `transaction_types`, `branches`, `companies`, `users`, `backup_history`, `color_settings`.

## Read paths

### Dashboard

`dashboardService.getDashboardMetrics()`:
1. Fetches active customers, transactions in the selected range, and bank accounts.
2. Filters by active `company_id`.
3. Computes `totalOutstanding` by applying `getCustomerBalanceDelta` over each transaction.
4. Computes `balanceByBranch` and bank chart cash by applying `getBankAccountBalanceDelta` (deposit is treated as cash in like payment).
5. Returns `topCustomers` sorted by the computed running balance.
6. `activeCustomers` is the count of `customers` with `is_active !== false` for the selected tenant. It is *not* derived from transactions in the selected date window, because that produced `0` when the period had no activity.

### Customer list

`customerService.getCustomers()`:
1. Queries `customers` filtered by `company_id` / `branch_id` / search.
2. Uses the stored `total_balance` column for display and sorting.
3. This column is maintained by transaction writes.

### Customer detail

`customerService.getCustomerById()`:
1. Fetches the customer row.
2. Fetches all related transactions.
3. Recomputes `total_balance = opening_balance + Σ(getCustomerBalanceDelta(type, amount))`.
4. Returns the computed value, so the detail view is always consistent even if stored balance drifted.

### Customer detail financial summary

`CustomerDetailModal` also renders two derived totals from the fetched transactions:

- `Tổng số tiền mua hàng` = `Σ(Math.abs(amount))` for `transaction_type === "charge"`.
- `Tổng số tiền đã trả` = `Σ(-min(getCustomerBalanceDelta(type, amount), 0))` — i.e. only the debt-reducing portion of every transaction.
  - `payment`, `deposit`, and `refund` (canonical `math_factor = -1`) contribute their full amount.
  - `adjustment` (canonical `math_factor = +1`) contributes only when the signed amount is negative; a positive adjustment increases debt and is excluded.
  - The result is always shown as a positive number.

### Bank account list

`bankAccountService.getBankAccounts()`:
1. Queries `bank_accounts` filtered by `company_id`.
2. Uses the stored `balance` column.

## Write paths

All form/entity validators in `src/services/businessLogic/validation.ts` return **Vietnamese** user-facing messages. Callers should pass `error.message` or `getErrorMessage(error)` to the UI; do not construct new English strings.

### Create transaction

`transactionService.createTransaction()`:
1. Validates with `validateTransactionData()`.
2. Normalizes with `transformRawTransaction()`.
3. Inserts into `transactions`.
4. Calls `_syncTransactionBalance(null, newTx)`:
   - Recalculates the affected customer's `total_balance`/`current_balance` from `opening_balance + Σ(amount × math_factor)`.
   - Adjusts the bank account `balance` by the old/new cash delta (`getBankAccountBalanceDelta`).
   - Updates `customers.last_transaction_date` to the latest completed transaction.

### Update transaction

`transactionService.updateTransaction()`:
1. Fetches the old transaction row.
2. Validates and builds the update payload (strips `id`, `created_at`, `company_id`).
3. Updates `transactions`.
4. Calls `_syncTransactionBalance(oldTx, mergedNewTx)`:
   - Recalculates the affected customer(s) from the ledger so prior drift is repaired.
   - If `customer_id` changed, both old and new customers are recalculated.
   - Bank account `balance` is adjusted by `newBankDelta - oldBankDelta`; if `bank_account_id` changed, both old and new accounts are adjusted.
   - Bumps `last_transaction_date` to the latest completed transaction.

### Delete transaction

`transactionService.deleteTransaction()`:
1. Fetches the old transaction row.
2. Deletes from `transactions`.
3. Calls `_syncTransactionBalance(oldTx, null)` to recalculate the affected customer and adjust the bank account balance.

### Bulk import

`transactionService.bulkImportTransactions()`:
1. Requires `companyId`; returns an error if it is missing.
2. Scopes option/lookup queries (`customers`, `bank_accounts`, `branches`, `transaction_types`) to the active `company_id`.
3. Resolves customers by `customer_code`/`customer_id`, bank accounts and branches by label.
4. Normalizes each row, especially `transaction_type` via `normalizeTransactionType`, and accepts id/name/canonical/Vietnamese aliases.
5. Returns clear per-row errors such as `Loại giao dịch "..." không hợp lệ. Các loại được hỗ trợ: ...`.
6. Bulk inserts into `transactions`.
7. Collects the unique `customer_id`s and `bank_account_id`s from the inserted rows and recalculates each customer/bank balance once, instead of calling `_syncTransactionBalance` per row.

### Transaction edit UI (`TransactionList.tsx`)

`handleEditSubmit()`:
1. Parses the amount with `parseAmount`.
2. Preserves the amount sign for all types; the sign flips the type's default effect (e.g. `charge -1000` reduces debt the same as `payment 1000`).
3. Sends `null` for empty `customer_id`/`bank_account_id`/`branch_id`/`reference_number`/`description`.
4. Includes `transaction_code` and the original `customer_id` so edits do not lose tenant or document context.
5. `transactionService.updateTransaction()` normalizes the payload, strips immutable/RLS fields, and recalculates balances.

### Transaction list grouping (`TransactionList.tsx`)

A group-by selector produces a `Tổng hợp theo nhóm` table above the transaction list:
- Group keys: `day` (ISO date), `week` (ISO week), `month` (year-month), plus existing `branch`, `transaction_type`, `customer`.
- Group summary per key: count, `Tổng phát sinh tăng` (sum of `abs(delta)` for non-adjustment deltas `> 0`), `Tổng phát sinh giảm` (sum of `abs(delta)` for non-adjustment deltas `< 0`), `Tổng điều chỉnh` (signed sum of adjustment deltas), and `Net` (sum of all signed deltas).
- The transaction's canonical type is resolved from the row's display name (via `getTransactionTypeName`) so a UUID whose name is `Đặt cọc` is classified as `deposit`, not as `payment`/`refund`.
- `getMathFactor` enforces canonical semantics for standard transaction types before trusting the stored `math_factor`, so inverted `math_factor` rows do not swap the increase/decrease totals.
- Day/week/month groups are sorted chronologically by key; other groups are sorted by label.

### Sign-aware amount handling

- `balanceMath.ts` is the single source of truth.
- `getCustomerBalanceDelta(type, amount, mathFactor)` returns `parseAmount(amount) * math_factor`. The `math_factor` is loaded per company from `transaction_types.math_factor` or falls back to canonical defaults: `charge +1`, `payment/refund/deposit -1`, `adjustment +1`.
- `getBankAccountBalanceDelta` still applies cash-flow semantics: `payment`/`deposit` increase cash, `refund` decreases cash, `charge` has no cash effect, `adjustment` is signed.
- `charge -1000` → customer balance **-1000** (debt decreases by 1000), bank cash `0`.
- `payment -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `refund -1000` → customer balance **+1000** (debt increases by 1000), bank cash **+1000** (cash in).
- `deposit -1000` → customer balance **+1000** (debt increases by 1000), bank cash **-1000** (cash out).
- `adjustment -1000` / `+1000` is a direct signed correction on both customer and bank.
- `validateTransactionData` only rejects zero/NaN amounts; negative amounts are accepted for all types.
- UI display (`TransactionList`, `CustomerDetail`, `CustomerDetailModal`, `RecentTransactions`) shows `formatCurrency(parseAmount(amount))` — the raw user-entered value — while color is driven by the signed delta, so positive-debt deltas appear red and negative/credit deltas appear green.

### Missing-column fallback

`updateHelpers.ts` drops unknown columns on the first schema error instead of retrying with a `notes` column fallback. Most Cashflow tables do not have a `notes` column, so the previous fallback caused an infinite retry loop on `transactions` inserts.

## Sign convention for display

- **Positive `customers.total_balance` = debt / công nợ (red).**
- **Negative/zero customer balance = credit / overpayment (green).**
- `formatting.ts` (`getCustomerListBalanceColor`, `getCustomerDetailBalanceColor`, `getTransactionTypeAmountColor`) and all list/detail components use `getCustomerBalanceDelta` from `balanceMath.ts` to determine the signed amount and color.
- Transaction type labels are: `Phát sinh tăng` (charge), `Phát sinh giảm` (payment), `Điều chỉnh` (adjustment), `Hoàn tiền` (refund), `Đặt cọc` (deposit, purple).
- The dedicated **Công thức dư nợ** settings tab shows the formula `Dư nợ = Đầu kỳ + Σ(Số tiền × Hệ số)`, lets users inspect and toggle each transaction type's `math_factor`, and previews the result for an arbitrary opening balance, amount, and type.

## Balance math helpers

Single source of truth: `src/services/businessLogic/balanceMath.ts`.

```
getCustomerBalanceDelta(type, amount, mathFactor?)
getBankAccountBalanceDelta(type, amount)
applyTransactionsToCustomerBalance(opening, txs, factorMap?)
applyTransactionsToBankAccountBalance(opening, txs)
```

`transactionTypeService.buildFactorMap` and `getTransactionTypeFactorMap` load the per-company `math_factor` map from `transaction_types`. For standard canonical types, `buildFactorMap` ignores stored `math_factor` and uses the canonical semantic factor (`charge` +1, `payment`/`refund`/`deposit` -1, `adjustment` +1) so corrupted rows cannot invert balances. `transactionService`, `dashboardService.getDashboardMetrics`, and `dashboardService.getReceivableLedger` pass this map into `getCustomerBalanceDelta` / `applyTransactionsToCustomerBalance` so every balance calculation respects the configured convention. `deposit` uses the same customer-balance and bank-cash direction as `payment`.

## Backup and restore

`src/utils/backupRecovery.ts` orchestrates backup/restore:

1. Backup exports JSON/Excel of selected tables scoped to the active `company_id`.
2. Restore reads `company_id` from options, normalizes every record to that `company_id`, applies `branchMapping`, and removes `created_at`/`updated_at`.
3. For each entity it checks existence; existing rows are updated only when `overwriteExisting` is true, missing rows are inserted with a fresh ID.
4. Restoration order: branches → bank accounts → customers → transactions, so foreign-key references resolve correctly.
5. `backupHistoryService.ts` delegates to the same helpers, so branch/bank account restore is no longer a no-op.

## User data reset

`Settings.tsx` `handleResetData` prompts for `CONFIRM` and requires an active `company_id`. It deletes in FK order:

1. `transactions` (references customers and bank accounts)
2. `customers`
3. `bank_accounts`

All deletions are filtered by `company_id` and governed by RLS.

## Tenant boundaries

- `company_id` is set on insert from the active company context and never updated.
- `branch_id` is optional context and set on insert where relevant.
- `RLS` policies at the Supabase level enforce row visibility by user/role/company/branch.
- In trial mode, `company_id` filters are applied in code against the `trial-company` seed.

## Data consistency notes

- `customers.total_balance` and `bank_accounts.balance` are updated at write time by `transactionService` and by the PostgreSQL triggers in `supabase/migrations/003_functions_triggers.sql`, `030_balance_trigger_sign_convention.sql`, and `20260804000004_balance_recalc_trigger.sql`. The newest trigger recalculates the full ledger on every `INSERT`/`UPDATE`/`DELETE` of `transactions` and backfills all existing balances, using the per-company `math_factor` map. Production uses **positive `total_balance` = debt**. Migration `042_deposit_transaction_type.sql` adds/seeds the `deposit` row in `transaction_types` for existing companies; the app computes customer deltas using `transaction_types.math_factor`.
- `getCustomerById()` recomputes the balance from transactions as a safety net.
- `getDashboardMetrics()` recomputes all totals from scratch using the per-company `math_factor` map, so dashboards are never stale.
