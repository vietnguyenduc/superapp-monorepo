# ADR 0002 — Balance Math and Tenant Field Protection

## Status

**Accepted**

## Context

Cashflow money math was duplicated and inconsistent:

1. `dashboardService.ts` and `customerService.ts` each implemented their own loops to convert a `transaction_type` + `amount` into a customer balance delta. The logic agreed on the main types (`charge` = `-amount`, `payment`/`refund` = `+amount`, `adjustment` = signed amount) but the duplication made it easy for future changes to drift.
2. `bank_accounts.balance` and `customers.total_balance` were exposed to user payloads in `update*` / `upsert*` paths, so a malformed or compromised form could overwrite `company_id`, `branch_id`, `total_balance`, `balance`, or `created_at`.
3. `getCustomers` sorted and mapped against a `current_balance` column that does not exist in the current schema, silently falling back to `total_balance` and masking the real data source.
4. `customers.total_balance` and `bank_accounts.balance` were not updated when transactions were created, edited, or deleted, so the customer list and bank account list could drift from the transaction ledger.
5. UI color conventions were inconsistent: `CustomerDetailModal` and `RecentTransactions` treated a positive customer balance as debt (red), while the dashboard treated a negative balance as debt (red). Default transaction-type labels in `colorSettingsService` were stale (`Điều chỉnh tăng/giảm` instead of the business names `Phát sinh tăng`/`Phát sinh giảm`).

## Decision

1. **Single-source balance math**: `src/services/businessLogic/balanceMath.ts` now owns all transaction-to-balance conversions.
   - `getCustomerBalanceDelta(type, amount)` — how a transaction changes a customer's receivable.
   - `getBankAccountBalanceDelta(type, amount)` — how a transaction changes a bank account's cash balance (`charge` has no cash effect).
   - `applyTransactionsToCustomerBalance` and `applyTransactionsToBankAccountBalance` reduce over a list of transactions.
2. **Service consumption**: `dashboardService.ts` and `customerService.ts` delegate customer and bank balance math to `balanceMath.ts` instead of re-implementing it.
3. **Tenant field hardening**: every `update*` / `upsert*` path (`customerService.updateCustomer`, `transactionService.updateTransaction`, `bankAccountService.upsertBankAccount`, `branchService.upsertBranch`, `transactionTypeService.upsertTransactionType`) deletes `id`, `created_at`, and `company_id` from the update payload before sending it to Supabase. The `company_id` may still be read for duplicate-code / duplicate-name checks, but it is never written.
4. **Column source of truth**: `getCustomers` now uses the existing `total_balance` column for both display and sorting.
5. **Transaction write-time balance sync**: `transactionService.createTransaction`, `updateTransaction`, `deleteTransaction`, and `bulkImportTransactions` adjust the related `customers.total_balance` and `bank_accounts.balance` immediately after the transaction row is written. The same `balanceMath.ts` helpers compute the delta, the customer's `last_transaction_date` is bumped to the newest transaction date, and customer/bank-account changes on update are handled by reversing the old delta and applying the new one.
6. **UI sign & color convention**: negative customer balance = debt (red); positive/zero = credit/overpayment (green). `formatting.ts` helpers (`getCustomerListBalanceColor`, `getCustomerDetailBalanceColor`, `getTransactionTypeAmountColor`) now use `balanceMath.ts` as the source of truth. `getTransactionTypeAmountColor` accepts an optional `amount` so `adjustment` rows render red or green based on the signed delta. `CustomerTable`, `CustomerDetail`, `CustomerDetailModal`, `RecentTransactions`, and `TransactionList` display transaction amounts as signed customer deltas. Default transaction-type labels in `colorSettingsService` are `Phát sinh tăng` (charge), `Phát sinh giảm` (payment), `Điều chỉnh` (adjustment), and `Hoàn tiền` (refund).

## Consequences

### Positive

- One place to change balance sign conventions.
- User payloads cannot accidentally or maliciously retarget a row to another tenant.
- `getCustomers` no longer references a non-existent column.
- Unit tests in `src/services/businessLogic/__tests__/balanceMath.test.ts` lock the convention.
- Stored balances stay in sync with the transaction ledger after every write operation, tested in `src/services/__tests__/transactionBalanceSync.test.ts`.

### Negative / Trade-offs

- Balance sync is implemented in the application layer. If a transaction write succeeds and the balance update fails, the ledger and stored balance can drift. A future migration can move this logic to PostgreSQL triggers for atomicity, but the current implementation includes `company_id` filters and uses the same `balanceMath.ts` helpers to minimize that risk.

## Related

- `src/services/businessLogic/balanceMath.ts`
- `src/services/dashboardService.ts`
- `src/services/customerService.ts`
- `src/services/transactionService.ts`
- `src/services/bankAccountService.ts`
- `src/services/branchService.ts`
- `src/services/transactionTypeService.ts`
