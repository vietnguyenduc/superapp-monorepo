# ADR 0002 — Balance Math and Tenant Field Protection

## Status

**Accepted**

## Context

Cashflow money math was duplicated and inconsistent:

1. `dashboardService.ts` and `customerService.ts` each implemented their own loops to convert a `transaction_type` + `amount` into a customer balance delta. The logic agreed on the main types (`charge` = `-amount`, `payment`/`refund` = `+amount`, `adjustment` = signed amount) but the duplication made it easy for future changes to drift.
2. `bank_accounts.balance` and `customers.total_balance` were exposed to user payloads in `update*` / `upsert*` paths, so a malformed or compromised form could overwrite `company_id`, `branch_id`, `total_balance`, `balance`, or `created_at`.
3. `getCustomers` sorted and mapped against a `current_balance` column that does not exist in the current schema, silently falling back to `total_balance` and masking the real data source.

## Decision

1. **Single-source balance math**: `src/services/businessLogic/balanceMath.ts` now owns all transaction-to-balance conversions.
   - `getCustomerBalanceDelta(type, amount)` — how a transaction changes a customer's receivable.
   - `getBankAccountBalanceDelta(type, amount)` — how a transaction changes a bank account's cash balance (`charge` has no cash effect).
   - `applyTransactionsToCustomerBalance` and `applyTransactionsToBankAccountBalance` reduce over a list of transactions.
2. **Service consumption**: `dashboardService.ts` and `customerService.ts` delegate customer and bank balance math to `balanceMath.ts` instead of re-implementing it.
3. **Tenant field hardening**: every `update*` / `upsert*` path (`customerService.updateCustomer`, `transactionService.updateTransaction`, `bankAccountService.upsertBankAccount`, `branchService.upsertBranch`, `transactionTypeService.upsertTransactionType`) deletes `id`, `created_at`, and `company_id` from the update payload before sending it to Supabase. The `company_id` may still be read for duplicate-code / duplicate-name checks, but it is never written.
4. **Column source of truth**: `getCustomers` now uses the existing `total_balance` column for both display and sorting.

## Consequences

### Positive

- One place to change balance sign conventions.
- User payloads cannot accidentally or maliciously retarget a row to another tenant.
- `getCustomers` no longer references a non-existent column.
- Unit tests in `src/services/businessLogic/__tests__/balanceMath.test.ts` lock the convention.

### Negative / Trade-offs

- This ADR does **not** address stored-balance maintenance (recalculating `customers.total_balance` and `bank_accounts.balance` on every transaction write). That requires a follow-up decision on whether these columns are current balances or opening balances and whether recalculation should be done in the application layer or via database triggers.

## Related

- `src/services/businessLogic/balanceMath.ts`
- `src/services/dashboardService.ts`
- `src/services/customerService.ts`
- `src/services/transactionService.ts`
- `src/services/bankAccountService.ts`
- `src/services/branchService.ts`
- `src/services/transactionTypeService.ts`
