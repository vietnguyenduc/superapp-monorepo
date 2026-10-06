# hr-operation — Changelog

## 2026-10-06 — Khóa RPC tạo bảng lương theo công ty

- Migration `20261006160000_harden_hr_payroll_rpc.sql` yêu cầu người gọi đã đăng nhập và có vai trò quản trị.
- Quản trị công ty chỉ được tạo bảng lương cho chính công ty của mình; `admin_master` có thể thao tác công ty đã chọn.
- RPC dùng `search_path` cố định, thu hồi quyền gọi từ `PUBLIC`/`anon`, kiểm tra kỳ lương và chỉ cấp quyền cho `authenticated`.

## 2026-08-04 — Dịch thông báo lỗi Trial Mode

- `src/lib/supabase.ts`: thông báo lỗi Trial Mode chuyển sang tiếng Việt.

## 2026-08-12 — Tenant scoping, RLS-safe reads, UI contrast

- `src/lib/supabase.ts`: thêm `getCurrentCompanyId()`, `getCurrentUser`/`isAuthenticated` guard.
- `src/services/hrService.ts`: phòng ban/nhân viên/ca làm lọc theo `company_id` và chèn `company_id` khi tạo mới; `.single()` chuyển `.maybeSingle()`.
- `src/index.css`: tăng tương phản `.btn-secondary`.
