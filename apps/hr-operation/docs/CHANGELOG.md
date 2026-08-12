# hr-operation — Changelog

## 2026-08-04 — Dịch thông báo lỗi Trial Mode

- `src/lib/supabase.ts`: thông báo lỗi Trial Mode chuyển sang tiếng Việt.

## 2026-08-12 — Tenant scoping, RLS-safe reads, UI contrast

- `src/lib/supabase.ts`: thêm `getCurrentCompanyId()`, `getCurrentUser`/`isAuthenticated` guard.
- `src/services/hrService.ts`: phòng ban/nhân viên/ca làm lọc theo `company_id` và chèn `company_id` khi tạo mới; `.single()` chuyển `.maybeSingle()`.
- `src/index.css`: tăng tương phản `.btn-secondary`.
