# Data Flow — Cashflow App

## Overview

Cashflow stores three core entities:

- **customers** — `opening_balance` plus the sum of transaction deltas becomes `total_balance`.
- **bank_accounts** — `balance` is updated by payment, refund, and adjustment transactions.
- **transactions** — every financial event; `transaction_type` + `amount` drives all balance math.

Other supporting tables: `transaction_types`, `branches`, `companies`, `users`, `backup_history`, `color_settings`.

## Read paths

### Dashboard

`dashboardService.getDashboardMetrics()`:
1. Fetches active customers, transactions in the selected range, and bank accounts.
2. Filters by active `company_id`.
3. Computes `totalOutstanding` by applying `getCustomerBalanceDelta` over each transaction.
4. Computes `balanceByBranch` and bank chart cash by applying `getBankAccountBalanceDelta`.
5. Returns `topCustomers` sorted by the computed running balance.

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
2. Stores absolute values for `payment`/`charge`/`refund`; `adjustment` keeps the signed value.
3. Sends `null` for empty `customer_id`/`bank_account_id`/`branch_id`/`reference_number`/`description`.
4. Includes `transaction_code` and the original `customer_id` so edits do not lose tenant or document context.
5. `transactionService.updateTransaction()` normalizes the payload, strips immutable/RLS fields, and recalculates balances.

### Missing-column fallback

`updateHelpers.ts` drops unknown columns on the first schema error instead of retrying with a `notes` column fallback. Most Cashflow tables do not have a `notes` column, so the previous fallback caused an infinite retry loop on `transactions` inserts.

## Sign convention for display

- Negative customer balance = debt (red).
- Positive/zero customer balance = credit/overpayment (green).
- `formatting.ts` (`getCustomerListBalanceColor`, `getCustomerDetailBalanceColor`, `getTransactionTypeAmountColor`) and all list/detail components use `getCustomerBalanceDelta` from `balanceMath.ts` to determine the signed amount and color.
- Transaction type labels are: `Phát sinh tăng` (charge), `Phát sinh giảm` (payment), `Điều chỉnh` (adjustment), `Hoàn tiền` (refund).

## Balance math helpers

Single source of truth: `src/services/businessLogic/balanceMath.ts`.

```
getCustomerBalanceDelta(type, amount)
getBankAccountBalanceDelta(type, amount)
applyTransactionsToCustomerBalance(opening, txs)
applyTransactionsToBankAccountBalance(opening, txs)
```

All dashboard, customer detail, and transaction write code uses these functions.

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

- `customers.total_balance` and `bank_accounts.balance` are now updated at write time, but the **atomicity is at the application layer**. If a balance update fails after the transaction insert succeeds, the ledger and stored balance can diverge. A future improvement is to move this logic into PostgreSQL triggers.
- `getCustomerById()` recomputes the balance from transactions as a safety net.
- `getDashboardMetrics()` recomputes all totals from scratch, so dashboards are never stale.
