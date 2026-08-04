# Cashflow transaction edit/import balance sync — real-flow E2E report

**Branch tested:** `devin/cashflow-balance-sync` (PR #46 follow-up edits)  
**App:** Cashflow `http://localhost:5174`  
**Account:** `vietnguyenduccp@gmail.com` (`admin_master`)  
**Company:** `Thien Phuoc Loc` (`22222222-2222-2222-2222-222222222222`)  
**Test date:** 2026-08-04  
**Recording:** `/home/ubuntu/screencasts/rec-balance-sync-v2-final-3/rec-balance-sync-v2-final-3-edited.mp4`

## Summary

Ran the full real-Supabase end-to-end flow on the local Cashflow dev server. The branch edits for `TransactionList.tsx`, `TransactionImport.tsx`, `transactionService.ts`, and `updateHelpers.ts` allow the transaction edit/import paths to persist `company_id`, `transaction_code`, `customer_id`, parsed amounts, and normalized types, and to correctly sync `customers.total_balance` and `bank_accounts.balance`. All requested scenarios (S1–S9) passed.

## What changed under test

- `TransactionList.tsx` edit now uses `editForm.customer_id`, includes `transaction_code`, converts empty UUIDs to `null`, and parses amounts with `parseAmount`.
- `TransactionImport.tsx` waits for a resolved `companyId` before loading options and blocks import when `companyId` is missing.
- `transactionService.bulkImportTransactions` requires `companyId` and scopes customers / banks / branches / transaction_types by `company_id`.
- `updateHelpers.ts` drops unknown columns instead of appending them to `notes`.
- `transactionService.updateTransaction` validates partial updates, normalizes payload, strips immutable/RLS fields, and syncs balances.
- `TransactionTypeContext` maps canonical transaction types and legacy Vietnamese names to `Phát sinh tăng / Phát sinh giảm / Điều chỉnh / Hoàn tiền`.

## Scenario results

- **S1 — Create payment (`PAY-001`, 500.000 VND):** customer `DEVIN-TX-A` `+500.000`, bank `999999` `+500.000` → `1.500.000` ✅
- **S2 — Create charge (`CHR-001`, 300.000 VND):** customer `DEVIN-TX-A` `-300.000` → `+200.000`, bank `999999` unchanged `1.500.000` ✅
- **S3 — Edit payment amount 500.000 → 800.000:** customer `DEVIN-TX-A` `+500.000`, bank `999999` `1.800.000` ✅
- **S4 — Change bank account (A → B):** bank `999999` reverted to `1.000.000`, bank `888888` received `+800.000` → `2.800.000`, customer unchanged ✅
- **S5 — Change customer (A → B on charge):** customer `DEVIN-TX-A` reverted to `+800.000`, customer `DEVIN-TX-B` received `-300.000`, bank unchanged ✅
- **S6 — Change transaction type (`payment` → `charge`):** customer `DEVIN-TX-A` changed by `-1.600.000` → `-800.000`, bank `888888` reverted to `2.000.000` ✅
- **S7 — Bulk CSV/Excel import (`BULK-001`, `BULK-002`):** 2 valid rows imported and scoped to `Thien Phuoc Loc`; balances updated correctly ✅
- **S8 — F5 refresh after edits/imports:** all balances persisted ✅
- **S9 — Delete test transactions/customers/banks:** balances reverted to baseline (`0` for customers, original `1.000.000`/`2.000.000` for banks) ✅

## Test evidence

### Dashboard after login
![Dashboard after login](https://app.devin.ai/attachments/4bdb42a3-e12f-497d-8061-d36596e7d14f/01-dashboard.png)

### Mobile single-import success — payment `PAY-001`
![Single import payment PAY-001](https://app.devin.ai/attachments/721bfaa8-7a60-482d-af93-eb066d2a1c37/import-PAY-001.png)

### Mobile single-import success — charge `CHR-001`
![Single import charge CHR-001](https://app.devin.ai/attachments/a17b7c2f-60f8-4de4-9638-a8aac94a7ba9/import-CHR-001.png)

### Edit modal — amount changed to 800.000
![Edit amount PAY-001](https://app.devin.ai/attachments/a612b1bd-d77b-43c2-a93f-72fe77e9d0cf/edit-PAY-001-edit-amount.png)

### Edit modal — bank switched from A to B
![Edit switch bank](https://app.devin.ai/attachments/f74ae6f3-b971-41bf-abfb-45872c4a4a94/edit-PAY-001-switch-bank.png)

### Edit modal — customer switched on charge
![Edit switch customer](https://app.devin.ai/attachments/c54a4f7d-b7b0-4382-b3b3-4e18f95664f4/edit-CHR-001-switch-customer.png)

### Edit modal — transaction type changed (payment → charge)
![Edit change type](https://app.devin.ai/attachments/2c8abfdf-f7c2-4bda-9498-56fc0fe03184/edit-PAY-001-change-type.png)

### Bulk import preview (2 valid rows)
![Bulk preview](https://app.devin.ai/attachments/f78d6c16-b9f8-4a94-82f9-c3cd008a1e9b/07-bulk-preview.png)

### Bulk import succeeded
![Bulk imported](https://app.devin.ai/attachments/5bfa12c8-bfc2-4872-ac10-8aef92864aa4/07-bulk-imported.png)

### Final delete cleanup
![Delete PAY-001](https://app.devin.ai/attachments/bb5cf2d2-a242-45ee-9292-b8c8e382cc45/delete-PAY-001.png)

### Customers list after cleanup (test data removed)
![Final customers](https://app.devin.ai/attachments/0d7d05fe-fe6c-4f9e-85aa-475b90fc264e/final-customers.png)

## Issues / caveats

1. **Bulk import button collision:** The `/import/transactions` page contains two `Nhập dữ liệu` buttons (single-entry mobile form and bulk preview). Clicking the first one does nothing in bulk mode; the automation had to click the **last** button. This is a UX issue rather than a functional bug, but it means bulk import can fail silently if the user clicks the wrong button.
2. **Console 400s during `bulkImportTransactions`:** Several `Failed to load resource: the server responded with a status of 400 ()` messages appear in the browser console for both single and bulk imports. The insert still succeeds because `bulkInsertWithFallback` retries with a reduced column set. The final result is correct, but the 400s are noisy and should be investigated.
3. **Edit-modal transaction-type labels come from DB rows, not `TransactionTypeContext` display labels:** the DB has `Điều chỉnh giảm`/`Điều chỉnh tăng` as `payment`/`charge` names, while the import form uses the canonical display labels `Phát sinh giảm`/`Phát sinh tăng`. This inconsistency does not break the real flow, but it can confuse automation and users.

## Cleanup performed

- Stopped the Cashflow Vite dev server.
- Removed `apps/cashflow/.env.local`.
- Deleted `DEVIN-TX-A`, `DEVIN-TX-B`, `Devin Bank A Checking` (999999), `Devin Bank B Savings` (888888), and all `PAY-*` / `CHR-*` / `BULK-*` / `TXN*` transactions tied to `Thien Phuoc Loc`.
- Reverted temporary `console.log` debug statements added to `TransactionImport.tsx` and `transactionService.ts`.
- Removed temporary `.tmp-*.mjs` helper scripts and `test-results` working files.
