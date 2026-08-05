# Production Cashflow golden-path E2E test plan

**Target:** `https://cashflow.appforyou.xyz` (live Supabase project `peslmsctejmvkwzyohke`)  
**Actor:** Disposable `admin_master` test user created via the session `SUPABASE_SERVICE_ROLE_KEY`  
**Test data:** A dedicated `DEVIN-PROD-*` company, branch, customers, bank account, and transactions; all deleted at the end.

## Preconditions (setup, not part of the recorded assertions)

1. Run a service-role script to:
   - create an auth user `devin-prod-<ts>@appforyou.xyz` / `DevinProdPass123!` with `email_confirm=true`;
   - create a `companies` row `DEVIN-PROD-CO-<ts>` (`name`, `code`, `is_active=true`);
   - create a `branches` row for that company;
   - create `public.users` row with `role='admin_master'`, `company_id` and `branch_id` pointing to the test company/branch;
   - create an active `transaction_types` row for the test company with `name='Hoàn tiền'` and `math_factor=-1` (so the canonical refund type is selectable) — this only provides a selectable label, the import path normalizes it to `transaction_type='refund'`;
   - record all IDs for cleanup.
2. Open `https://cashflow.appforyou.xyz/login` with a clean browser profile.

---

## TC1 — Login form with invalid credentials shows translated Vietnamese error

**Steps:**
1. Enter `devin-prod-<ts>@appforyou.xyz` and a wrong password into the login form.
2. Click `Đăng nhập`.

**Pass criteria:**
- A red error box appears with text containing `Email hoặc mật khẩu không đúng`.
- URL stays on `/login`.

**Fail criteria:**
- Error is in English (`Invalid login credentials`) or no error shown, or URL redirects.

---

## TC2 — Login success with admin_master

**Steps:**
1. Enter the correct password for the disposable test user.
2. Click `Đăng nhập`.

**Pass criteria:**
- URL becomes `/dashboard` or `/company-selector`.
- Header eventually shows the test user name/company.
- `localStorage.selectedCompanyId` is set to the test company ID (pre-selected by the test harness).

---

## TC3 — Create a customer via the Customers page

**Steps:**
1. Navigate to `/customers`.
2. Click `Thêm khách hàng` (primary button with `+` icon).
3. Fill `Mã khách hàng` = `DEVIN-CUST-001`, `Họ và tên` = `Devin Prod Customer`, `Số điện thoại` = `0909000001`, `Email` = `devin.cust@example.com`, `Địa chỉ` = `123 Prod St`, `Cách làm việc công nợ` = `Test working method`, `Người đại diện` = `Devin Rep`, `is_active` checked.
4. Click `Tạo khách hàng`.

**Pass criteria:**
- Modal closes, customer appears in the list with `Công nợ = 0 ₫`.
- DB row has `company_id = test company` and `branch_id = test branch`.

---

## TC4 — Edit customer (rename, toggle active, duplicate-code validation, preserve immutable fields)

**Steps:**
1. Open `DEVIN-CUST-001` and click `Sửa`.
2. Change `Họ và tên` to `Devin Prod Customer Updated`, `Địa chỉ` to `456 Updated St`, `Cách làm việc công nợ` to `Updated method`, `Người đại diện` to `Updated Rep`, toggle `is_active` off, save.
3. Re-open the customer: verify all changed fields persist and `is_active` is off.
4. Change `Mã khách hàng` to `DEVIN-CUST-002-NEW`, save, refresh (F5), re-open, verify code persists.
5. Create a second customer `DEVIN-CUST-002`.
6. Edit `DEVIN-CUST-001` and set `Mã khách hàng` to `DEVIN-CUST-002`; attempt save.
7. Edit a customer with a non-zero balance (create a charge first) and change only `Địa chỉ`; verify `total_balance` and `id` unchanged.

**Pass criteria:**
- All editable fields persist after save and F5.
- Duplicate code attempt is rejected (alert `Lỗi lưu khách hàng` or inline error) and original `Mã khách hàng` remains unchanged after re-open.
- `id`, `company_id`, `branch_id`, `total_balance` are never reset (verified by DB read after edits).
- `is_active` off is shown when re-opened (list rows do not show a status badge, so verification is via the edit form).
- Address-only edit on a non-zero customer keeps `total_balance` exactly the same.

**Fail criteria:**
- `id` changes, `company_id`/`branch_id` become null, `total_balance` resets, or duplicate code is accepted.

---

## TC5 — Create bank account and branch via Settings

**Steps:**
1. Go to `/settings`.
2. Open the `Văn phòng` tab, click add, fill `Tên` = `Devin Prod Branch`, `Địa chỉ` = `Branch Addr`, `Số điện thoại` = `0909000002`, save.
3. Open the `Tài khoản ngân hàng` tab, click add, fill `Tên ngân hàng` = `Devin Bank`, `Số tài khoản` = `9999999999`, `Tên tài khoản` = `Devin Prod Account`, `Số dư đầu kỳ` = `1000000`, save.

**Pass criteria:**
- Branch appears in the branch list and in transaction-form branch selects.
- Bank account appears with `Số dư = 1.000.000 ₫` and in transaction-form bank selects.
- Both rows have `company_id = test company`.

---

## TC6 — Create transactions of all canonical types and verify balance sync

**Steps:**
1. Go to `/import/transactions` (single-entry `Nhập từng giao dịch` tab).
2. Import one row for each canonical type using `DEVIN-CUST-001`, the test bank account, and the test branch:
   - `TXN-PAY` `Phát sinh giảm` `500000`
   - `TXN-CHG` `Phát sinh tăng` `300000`
   - `TXN-ADJ` `Điều chỉnh` `-200000` (signed negative adjustment)
   - `TXN-REF` `Hoàn tiền` `100000`
3. After each import, check `/customers` for `DEVIN-CUST-001` total balance and `/settings` bank account balance.

**Pass criteria (per `balanceMath.ts`):**
- After `Phát sinh giảm` 500K: customer `+500.000 ₫`, bank `+500.000 ₫` (bank total `1.500.000 ₫`).
- After `Phát sinh tăng` 300K: customer `+200.000 ₫`, bank unchanged `1.500.000 ₫`.
- After `Điều chỉnh` -200K: customer `0 ₫`, bank `1.300.000 ₫`.
- After `Hoàn tiền` 100K: customer `+100.000 ₫`, bank `1.200.000 ₫`.

**Fail criteria:**
- Any balance differs from the expected values by more than `0.001 ₫`.

---

## TC7 — Edit and delete a transaction and verify balance rollback

**Steps:**
1. On `/transactions`, edit `TXN-PAY` amount from `500000` to `800000`.
2. Verify customer/bank balances update accordingly (customer `+400.000 ₫`, bank `+1.500.000 ₫` from baseline after refund/charge/adjust).
3. Delete `TXN-REF` from the list and confirm.
4. Verify bank balance reverts and customer balance reverts.

**Pass criteria:**
- Edit: balances reflect the new amount immediately.
- Delete: `TXN-REF` disappears and bank/customer balances revert to values before that transaction was created.

---

## TC8 — Bulk import customers and transactions with tenant scoping

**Steps:**
1. Prepare a small XLSX:
   - `customers` sheet: `customer_code`, `full_name`, `phone`, `email`, `address` with two new rows `BULK-CUST-01` and `BULK-CUST-02`.
   - `transactions` sheet: `transaction_code`, `transaction_date`, `customer_code`, `transaction_type`, `amount`, `description`, `bank_account`, `branch` with two rows using `BULK-CUST-01` and `BULK-CUST-02`, bank `9999999999 - Devin Prod Account`, branch `Devin Prod Branch`.
2. Go to `/import/customers`, upload the file, import.
3. Go to `/import/transactions`, switch to `Nhập hàng loạt`, upload the file, import.

**Pass criteria:**
- Import succeeds for all rows.
- All imported customers/transactions have `company_id = test company`.
- Bank and branch labels resolve to the correct IDs.
- Customer balances and bank balance update correctly.

---

## TC9 — Settings backup, restore, and reset for the test company

**Steps:**
1. Go to `/settings` → `Sao lưu` tab.
2. Click `Lưu vào Database`; wait for `Sao lưu thành công!`.
3. Click `Tải file XLSX` and keep the downloaded file.
4. Go to `/settings` → `Reset dữ liệu`, type `CONFIRM` in the prompt, click `Reset toàn bộ dữ liệu`.
5. Verify customers/transactions/bank accounts for the test company are deleted (branches may remain by design).
6. Go back to `Sao lưu` → `Khôi phục từ file sao lưu`, upload the downloaded XLSX, click `Khôi phục`.
7. Confirm conflict dialog if shown.

**Pass criteria:**
- After reset, `/customers` and `/transactions` show no test data.
- After restore, the backed-up customers, transactions, and bank account reappear with the same values.

---

## TC10 — Trial mode entry and exit

**Steps:**
1. Sign out from the user menu (`Đăng xuất`).
2. On `/login`, click `Dùng thử ngay (không cần đăng nhập)`.
3. Wait for the dashboard to load and observe the `Chế độ dùng thử` banner.
4. Click `Đăng xuất` again or clear `localStorage.cashflow_trial_user` and reload.

**Pass criteria:**
- Trial mode loads the dashboard without credentials and shows the trial banner.
- After exit, the app returns to `/login` and the banner is gone.

---

## Cleanup

1. Delete all test transactions, customers, bank accounts, branches, `backup_history` rows, and the test company scoped to the test company ID.
2. Delete the disposable auth user and `public.users` row.
3. Delete the seeded `Hoàn tiền` transaction type for the test company.
4. Verify no `DEVIN-PROD-*` / `BULK-*` / `TXN-*` data remains in Supabase.
