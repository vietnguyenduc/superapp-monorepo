# accounting — Changelog

## 2026-08-04 — Rà soát lỗi user-facing và RLS theo Lesson Learned

- Dịch toàn bộ thông báo lỗi user-facing sang tiếng Việt (`importUtils.ts`, `validation.ts`, `validationSystem.ts`, `backupRecovery.ts`, `services/*`, `formatting.ts`).
- Chuẩn hóa định dạng ngày mặc định `dd/MM/yyyy` và fallback `"Ngày không hợp lệ"`.
- Sửa `.single()` → `.maybeSingle()` cho các truy vấn đọc (`getCustomerById`, `getBankAccountById`, `getBranchById`, `getTransactionById`, v.v.) để tránh lỗi RLS 406 khi không có dòng.
- Cập nhật unit test theo message tiếng Việt.

## 2026-08-12 — Vietnamese errors and RLS-safe reads

- Dịch các thông báo lỗi user-facing sang tiếng Việt.
- `src/lib/supabase.ts`: đọc profile bằng `.maybeSingle()` để tránh lỗi 406.
