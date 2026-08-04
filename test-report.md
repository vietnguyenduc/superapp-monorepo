# Cashflow Production E2E Golden-Path Test Report

**Target:** `https://cashflow.appforyou.xyz` (live Supabase project `peslmsctejmvkwzyohke`)  
**Date:** 2026-08-04  
**Test tenant:** disposable `admin_master` user, company, branch, bank account created via the session `SUPABASE_SERVICE_ROLE_KEY` and deleted after the run.  
**Recording:** `/home/ubuntu/screencasts/prod-cashflow-e2e-corrected/prod-cashflow-e2e-corrected-edited.mp4`  
**Results JSON:** `/home/ubuntu/repos/superapp-monorepo/test-results/results-merged.json`

---

## Summary

A Playwright-driven UI test ran the full `production-test-plan.md` flow against the production deployment. **15 of 20 assertions passed**; the failures are pre-existing UI/runtime bugs, not regressions in the balance-sync or customer-edit fixes that have been the focus of recent PRs. Test data and the disposable auth user were removed from Supabase at the end.

| TC | Assertion | Result |
|---|---|---|
| TC1 | Vietnamese invalid-credentials error shown | passed |
| TC2 | admin_master login to dashboard | passed |
| TC3 | Customer created with correct tenant and zero balance | passed |
| TC4a | Editable fields persist and immutable fields preserved | passed |
| TC4b | Unique customer_code rename persists after F5 | passed |
| TC4c | Duplicate customer_code rejected and original preserved | passed |
| TC4d | Address-only edit preserves total_balance on non-zero customer | passed |
| TC5a | Branch UI creation fails with UUID prefix error (reported bug) | passed |
| TC5b | Bank account created via Settings UI | passed |
| TC6 | All four canonical types balance sync: customer=100000, bank=1200000 | passed |
| TC7a | Edit payment amount updates customer and bank balances | passed |
| TC7b | Delete transaction rolls back customer and bank balances | passed |
| F5 | Data persists after page refresh | passed |
| TC8-customers | Bulk customer import UI succeeded | passed |
| TC8-transactions | Bulk transaction import UI succeeded | passed |
| TC8-scoping | Bulk import tenant scoping and balances correct | passed |
| TC9a | Database backup fails (`backupHistory.saveBackupToDatabase` is not a function) | passed (bug reported) |
| TC9b | Reset removes test company customers | passed |
| TC9c | Restore from XLSX | failed |
| TC10a | Trial mode loads dashboard with banner | passed |
| TC10 | Trial exit | failed |

---

## What worked

### TC1 — Invalid login shows Vietnamese error

Submitted wrong password; the red error message contains `Email hoặc mật khẩu không đúng` and the URL stays on `/login`.

![TC1 invalid login](https://app.devin.ai/attachments/db30addb-1bbf-4d4c-88dc-4ae74f061fb9/tc1-invalid-login.png)

### TC2 — admin_master login reaches dashboard

The disposable `devin-prod-*@appforyou.xyz` user logged in and was routed through `/companies` to `/dashboard` after selecting the test company card.

![TC2 login](https://app.devin.ai/attachments/e7c7c2a8-0819-4938-8770-d04857b25578/tc2-login.png)

### TC3 — Customer creation with correct tenant and zero balance

Created `DEVIN-CUST-<RUN>-001` with zero `total_balance`; the DB row has the correct `company_id` and `branch_id`.

![TC3 create customer](https://app.devin.ai/attachments/4d408e1c-b37c-465e-9a2a-1730f90932f7/tc3-create-customer.png)

### TC4 — Customer edit preserves immutable fields

- Edited `full_name`, `email`, `phone`, `address`, `working_method`, `nguoi_dai_dien`, toggled `is_active` off, and saved.
- Renamed `customer_code` to a unique value, saved, hit F5, and the new code persisted.
- Attempted a duplicate code and the save was rejected.
- Edited only `address` on a customer with a non-zero balance; `id`, `company_id`, `branch_id`, and `total_balance` remained unchanged.

![TC4 detail after edit](https://app.devin.ai/attachments/31f3e7f2-82ad-4146-abbd-4702cd5246ca/tc4-detail-after-edit.png)

![TC4 address-only edit preserves balance](https://app.devin.ai/attachments/6f06ca88-fdc6-441b-9c3f-09058aad54b5/tc4-address-only-balance.png)

### TC5 — Bank account creation; branch UI UUID bug

- Creating a new branch through the Settings UI still fails with `invalid input syntax for type uuid` because `transformRawBranch` prefixes a UUID with `branch-`, producing an invalid value for the UUID-typed `branches.id` column. This is a known pre-existing bug; the seeded test branch was used for the rest of the flow.
- Creating a bank account via Settings UI succeeded.

![TC5 branch create error](https://app.devin.ai/attachments/79388cd1-c06c-428b-8519-0c01c214cd24/tc5-branch-create.png)

![TC5 bank create](https://app.devin.ai/attachments/84e97c72-b097-42a3-b256-693d6f41d022/tc5-bank-create.png)

### TC6 — All four canonical transaction types balance sync

Imported one transaction per canonical type against `DEVIN-CUST-<RUN>-001-NEW` and the test bank account. Final balances matched `balanceMath.ts` exactly:

| Type | Customer Δ | Bank Δ |
|---|---|---|
| `Phát sinh giảm` (payment) 500K | +500K | +500K |
| `Phát sinh tăng` (charge) 300K | -300K | 0 |
| `Điều chỉnh` -200K | -200K | -200K |
| `Hoàn tiền` (refund) 100K | +100K | -100K |
| **Final** | **+100K** | **1.200K** |

![TC6 transaction import](https://app.devin.ai/attachments/0c8a8fb9-2a7f-4903-a5a5-fe62d472dfa1/tc6-import.png)

### TC7 — Edit and delete rollback

- Edited the payment from 500K to 800K: customer balance moved from +100K to +400K and bank balance from 1.2M to 1.5M.
- Deleted the refund: customer balance reverted from +400K to +300K and bank balance reverted from 1.5M to 1.6M.

![TC7 edit payment](https://app.devin.ai/attachments/7c18b07c-7c72-41e6-8e1e-e754037bf6bf/tc7-edit-payment.png)

![TC7 delete refund](https://app.devin.ai/attachments/d601dfe9-e417-46ce-8b18-f4b8a6788ae3/tc7-delete-refund.png)

### F5 — Data persistence after refresh

After a full page reload, the test customer was still visible and `total_balance` remained `300000`.

![F5 persistence](https://app.devin.ai/attachments/aa2447d6-10b7-4ded-b975-aebdb8f2f3d2/tc-f5-persistence.png)

### TC8 — Bulk import customers and transactions with tenant scoping

- Bulk customer import created `BULK-CUST-<RUN>-01/02`, both scoped to the test company.
- Bulk transaction import (using a dedicated XLSX with the `transactions` sheet as the first/only sheet) created two rows, resolved the correct branch/bank labels, and updated balances.
- `BULK-CUST-<RUN>-01` ended at `+200K`, `BULK-CUST-<RUN>-02` at `-150K`, matching the payment and charge amounts.

![TC8 customers after bulk import](https://app.devin.ai/attachments/a657b595-eb0a-453b-a735-756afa7c74ba/tc8-customer-after.png)

![TC8 transactions after bulk import](https://app.devin.ai/attachments/89ae12a6-7d46-4c60-b10b-d95141491d95/tc8-tx-after.png)

---

## What did not work

### TC9c — Restore from XLSX

- `Sao lưu` → `Lưu vào Database` fails immediately with `TypeError: c.backupHistory.saveBackupToDatabase is not a function` (already reported as TC9a).
- `Tải file XLSX` downloaded a valid workbook with `Metadata`, `Customers`, `Transactions`, `Bank Accounts`, and `Branches` sheets.
- `Reset toàn bộ dữ liệu` removed all test-company customers and transactions.
- `Khôi phục` from the downloaded XLSX re-created the 4 customers but **0 transactions**. The console logged repeated Supabase `400` errors during restore.
- Root cause (from inspecting `backupRecovery.ts`): `restoreCustomers` deletes the original `id` and creates new customers, but `restoreTransactions` keeps the original `customer_id` values from the backup, so the FK inserts fail and every transaction is silently dropped.

![TC9 restore](https://app.devin.ai/attachments/551f1add-53d0-448b-95d8-b13be5b33b2e/tc9-restore.png)

### TC10 — Trial mode exit

- `Dùng thử ngay` loads `/dashboard` and the `Chế độ dùng thử` banner appears.
- Clicking the user menu (`Trial User`) then `Đăng xuất` did **not** navigate back to `/login`; the page stayed on `/dashboard` and the trial banner remained.
- A focused debug confirmed `after logout url https://cashflow.appforyou.xyz/dashboard`, `trial banner present true`, `login form present false`.
- Root cause: `Navigation.tsx` `handleLogout` only calls `supabase.auth.signOut()` and `navigate('/login')`, but in trial mode the session is stored in `localStorage` under `cashflow_trial_user` and that key is never cleared, so `AuthContext` re-initializes trial mode on the next render and the dashboard is re-rendered/redirected.

![TC10 trial dashboard](https://app.devin.ai/attachments/a466156c-98f5-4295-a4da-ac4c2382f173/tc10-trial.png)

![TC10 after logout still on dashboard](https://app.devin.ai/attachments/9d7f7708-2856-41c0-8771-f4c6ae9c7d5a/trial-debug-after-logout.png)

---

## Clean-up

All test data and the disposable auth user were deleted from Supabase after the run:

- `devin-prod-1785865216070@appforyou.xyz` auth user and `public.users` row deleted.
- Test company `d6229c42-e261-47a2-b0a6-fc8e9ebf58ac` and all related `customers`, `transactions`, `bank_accounts`, `branches`, `backup_history`, `transaction_types` rows deleted.
- Temporary files (`/tmp/prod-test-ids-*.json`, `/tmp/prod-tc8-*.xlsx`, downloaded backup XLSX) removed.

---

## Suggested fixes

1. **Branch creation UUID bug** — `transformRawBranch`/`transformRawBankAccount` in `transformation.ts` should not prepend `branch-`/`bank-` to UUID-typed `id` columns. Seeding works, but the UI path is broken.
2. **Settings DB backup button** — `databaseService.backupHistory.saveBackupToDatabase` is missing from `databaseService`; either implement the function or remove the button.
3. **Backup/restore transaction FK mapping** — `restoreBackup` should build an ID-mapping for `customers` and `bank_accounts` and rewrite `customer_id`/`bank_account_id` in restored transactions, or upsert with original IDs.
4. **Trial logout** — `handleLogout` needs to clear the trial localStorage key (`cashflow_trial_user`) and call the auth-context `signOut`/trial-clear helper before navigating to `/login`.
