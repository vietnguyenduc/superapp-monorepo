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
   - `getCustomerBalanceDelta(type, amount)` applied to the customer.
   - `getBankAccountBalanceDelta(type, amount)` applied to the bank account.
   - `customers.last_transaction_date` updated if the transaction date is newer.

### Update transaction

`transactionService.updateTransaction()`:
1. Fetches the old transaction row.
2. Validates and builds the update payload (strips `id`, `created_at`, `company_id`).
3. Updates `transactions`.
4. Calls `_syncTransactionBalance(oldTx, mergedNewTx)`:
   - If `customer_id` changed: reverse old delta on old customer, apply new delta on new customer.
   - If `bank_account_id` changed: reverse old bank delta on old account, apply new delta on new account.
   - Otherwise adjust by `newDelta - oldDelta` on the same entity.
   - Bumps `last_transaction_date` on the new customer if needed.

### Delete transaction

`transactionService.deleteTransaction()`:
1. Fetches the old transaction row.
2. Deletes from `transactions`.
3. Calls `_syncTransactionBalance(oldTx, null)` to reverse both deltas.

### Bulk import

`transactionService.bulkImportTransactions()`:
1. Requires `companyId`; returns an error if it is missing.
2. Scopes option/lookup queries (`customers`, `bank_accounts`, `branches`, `transaction_types`) to the active `company_id`.
3. Resolves customers by `customer_code`, bank accounts and branches by label.
4. Normalizes each row.
5. Bulk inserts into `transactions`.
6. Iterates the inserted rows and calls `_syncTransactionBalance(null, row)` for each.

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
- Group summary per key: count, `Tổng phát sinh tăng` (sum of `abs(delta)` for non-adjustment deltas `< 0`), `Tổng phát sinh giảm` (sum of `abs(delta)` for non-adjustment deltas `> 0`), `Tổng điều chỉnh` (signed sum of adjustment deltas), and `Net` (sum of all signed deltas).
- Day/week/month groups are sorted chronologically by key; other groups are sorted by label.

### Sign-aware amount handling

- `balanceMath.ts` is the single source of truth: `getCustomerBalanceDelta` and `getBankAccountBalanceDelta` multiply the type's default magnitude by `Math.sign(amount)`.
- `charge -1000` increases customer balance by 1000 (debt decreases), bank cash 0.
- `payment -1000` decreases customer balance by 1000 (debt increases), bank cash decreases by 1000.
- `refund -1000` decreases customer balance by 1000, bank cash increases by 1000.
- `deposit -1000` decreases customer balance by 1000 (debt increases), bank cash decreases by 1000.
- `adjustment -1000` / `+1000` is a direct signed correction on both customer and bank.
- `validateTransactionData` only rejects zero/NaN amounts; negative amounts are accepted for all types.
- UI display (`TransactionList`, `CustomerDetail`, `CustomerDetailModal`, `RecentTransactions`) shows `formatCurrency(parseAmount(amount))` — the raw user-entered value — while color is still driven by the signed delta from `getCustomerBalanceDelta(...)`, so a positive charge appears red (debt) and a negative charge appears green (credit).

### Missing-column fallback

`updateHelpers.ts` drops unknown columns on the first schema error instead of retrying with a `notes` column fallback. Most Cashflow tables do not have a `notes` column, so the previous fallback caused an infinite retry loop on `transactions` inserts.

## Sign convention for display

- Negative customer balance = debt (red).
- Positive/zero customer balance = credit/overpayment (green).
- `formatting.ts` (`getCustomerListBalanceColor`, `getCustomerDetailBalanceColor`, `getTransactionTypeAmountColor`) and all list/detail components use `getCustomerBalanceDelta` from `balanceMath.ts` to determine the signed amount and color.
- Transaction type labels are: `Phát sinh tăng` (charge), `Phát sinh giảm` (payment), `Điều chỉnh` (adjustment), `Hoàn tiền` (refund), `Đặt cọc` (deposit, purple).

## Balance math helpers

Single source of truth: `src/services/businessLogic/balanceMath.ts`.

```
getCustomerBalanceDelta(type, amount)
getBankAccountBalanceDelta(type, amount)
applyTransactionsToCustomerBalance(opening, txs)
applyTransactionsToBankAccountBalance(opening, txs)
```

All dashboard, customer detail, and transaction write code uses these functions. `deposit` uses the same customer-balance and bank-cash direction as `payment`.

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

- `customers.total_balance` and `bank_accounts.balance` are updated at write time by `transactionService` and by the PostgreSQL triggers in `supabase/migrations/030_balance_trigger_sign_convention.sql` (negative balance = debt). Migration `034_deposit_transaction_type.sql` adds the `deposit` enum value, seeds `transaction_types` rows, and extends the triggers to handle `deposit` like `payment`. A one-time backfill set `total_balance = current_balance` for existing customers.
- `getCustomerById()` recomputes the balance from transactions as a safety net.
- `getDashboardMetrics()` recomputes all totals from scratch, so dashboards are never stale.
