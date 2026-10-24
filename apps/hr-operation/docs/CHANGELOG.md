# hr-operation — Changelog

## 2026-10-25 — Pilot nhập nhân viên từ SharePoint

- Bổ sung `HR_Input_Wizard_v1.xlsx`: form Excel không macro theo luồng từng bước, có
  danh mục chọn, kiểm tra nghiêm ngặt, cảnh báo trùng/sai dữ liệu và bảng tổng hợp chất
  lượng trước khi gửi lên SharePoint.

- Thêm đăng nhập Microsoft bằng MSAL/PKCE và quyền ủy quyền tối thiểu `Files.Read`.
- Người dùng có thể dán link file Excel/CSV trên SharePoint, xem trước lỗi theo dòng và
  nhập các mã nhân viên mới vào công ty hiện tại.
- Mã đã tồn tại được bỏ qua, mã trùng trong file bị chặn, tên phòng ban không khớp được
  cảnh báo và để trạng thái chưa xếp phòng.
- Access token chỉ nằm trong phiên trình duyệt; không lưu mật khẩu, token hoặc client
  secret vào Supabase.
- Xóa dữ liệu nhân viên giả từng hiển thị khi công ty chưa có hồ sơ thực.
- Chuẩn bị migration `20261025003000_hr_selected_company_admin_access.sql` để
  `admin_master` thao tác hồ sơ/phòng ban của công ty đang chọn; chưa áp dụng nếu
  chưa có phê duyệt migration.

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
