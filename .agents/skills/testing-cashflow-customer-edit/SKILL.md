---
name: testing-cashflow-customer-edit
description: End-to-end UI testing of the Cashflow customer list / edit / create flow on a local dev server with live Supabase and with trial mode.
---

# Testing Cashflow customer edits locally

## Dev server

- `npx turbo run dev --filter=cashflow` runs on `http://localhost:5174`.
- Cashflow needs `apps/cashflow/.env.local` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from the session env. Delete it after the run.
- If the `computer` tool fails to type into form inputs, drive the browser with a temporary Playwright script that reuses the running Vite server while the desktop recording continues.

## Real-flow login and company selection

- Real account: credentials are provided per-session via `CASHFLOW_REAL_USER` / `CASHFLOW_REAL_PASSWORD` secrets (admin_master).
- For `admin_master`, `CompanyContext` reads the selected company from `localStorage.selectedCompanyId`.
- Pre-select the target company for repeatable tests by setting `localStorage.selectedCompanyId = "22222222-2222-2222-2222-222222222222"` before navigating, or choose `Thien Phuoc Loc` from the header switcher.
- Useful reference customers in `Thien Phuoc Loc`:
  - `customer_code = "810"` — use as a known duplicate for negative tests.
  - `customer_code = "824"` (`NR - Anh Vũ - Số 05 Tân Phúc`) — a non-zero-balance customer for balance-preservation tests.

## Customer edit form fields and verification

- The edit modal (`CustomerFormModal.tsx`) exposes `customer_code`, `full_name`, `email`, `phone`, `address`, `nguoi_dai_dien`, `working_method`, and `is_active`.
- `full_name` is required; the inline error is `Họ và tên là bắt buộc`.
- On save error the UI shows an alert `Lỗi lưu khách hàng`; the underlying backend duplicate-code message is currently swallowed.
- `is_active` is toggled in the form, but the customer list rows do **not** render a status badge (`getStatusBadge` is defined but unused in `CustomerTable.tsx`). Verify `is_active` by reopening the edit form after reload.
- The detail modal (`CustomerDetailModal.tsx`) computes `Công nợ hiện tại` from `opening_balance` + transactions; `Số dư đầu kỳ` is `opening_balance`.

## Known live-data caveat: `nguoi_dai_dien`

- The live Supabase `customers` table does **not** have the `nguoi_dai_dien` column. Migration `supabase/migrations/20260527000003_add_nguoi_dai_dien_to_customers.sql` exists but is unapplied.
- The edit form accepts the field and `updateCustomer` sends it, but Supabase discards it on update.
- Do not report a failing `nguoi_dai_dien` persistence test as a regression from customer-edit code changes; it is a schema issue.

## Trial mode

- From `/login` click `Dùng thử ngay (không cần đăng nhập)`.
- Seed customer `CUST0001` / `Công ty TNHH ABC` is available for edit persistence checks.
- The trial store is written to `localStorage["cashflow_trial_store"]` only after a mutation; edits survive reload once persisted.
- Revert any trial seed changes before finishing.

## Cleanup

- Delete `DEVIN-TEST-*` customers via the UI delete icon or, if the UI fails, with the service-role key from `docker-compose.yml`.
- Restore reference customer `824` to its original `address` (`số 05 Tân Phúc`) if you edited it.
- Stop the Vite server and delete `apps/cashflow/.env.local`.

## Devin Secrets Needed

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` for `.env.local`.
- `SUPABASE_SERVICE_ROLE_KEY` from `docker-compose.yml` for cleanup and reference DB checks.
