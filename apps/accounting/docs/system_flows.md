# SYSTEM FLOWS

> **Last Updated:** 2026-05-01

---

# AUTHENTICATION FLOW

## Sign Up

| Step | Action | System Response | UI Feedback |
|------|--------|---------------|-------------|
| 1 | User clicks "Đăng ký" | Render sign-up form | Empty form, required fields highlighted |
| 2 | User enters email + password | Client validates format (email regex, password length) | Inline error if format invalid |
| 3 | User submits | `supabase.auth.signUp({email, password})` | Button loading state |
| 4 | Supabase Auth creates `auth.users` record | Triggers Edge Function `create-user` to insert `public.users` row with default role | — |
| 5 | Edge Function returns success | App calls `fetchUserProfile()` → loads `public.users` row | Redirect to dashboard |
| 6 | Error (email exists, weak password) | Supabase returns error message | Toast error, stay on form |

## Sign In

| Step | Action | System Response | UI Feedback |
|------|--------|---------------|-------------|
| 1 | User clicks "Đăng nhập" | Render login form | — |
| 2 | User submits credentials | `supabase.auth.signInWithPassword({email, password})` | Button loading |
| 3 | Supabase returns JWT session | `onAuthStateChange` fires `SIGNED_IN` | — |
| 4 | Auth hook calls `fetchUserProfile()` | Query `public.users` where `id = auth.uid()` (RLS allows self-read) | Spinner while loading profile |
| 5 | Profile loaded | `AuthContext` updates `{user, role, permissions}` | Redirect to dashboard |
| 6 | RLS policy blocks (no user row) | `fetchUserProfile()` returns null | Show "Tài khoản chưa kích hoạt" message |

## Sign Out

| Step | Action | System Response |
|------|--------|---------------|
| 1 | User clicks "Đăng xuất" | `supabase.auth.signOut()` |
| 2 | Session cleared | `onAuthStateChange` fires `SIGNED_OUT` |
| 3 | AuthContext resets to `null` | UI redirects to `/login` |

---

## SINGLE ENTRY CUSTOMER IMPORT FLOW

**Context:** User đã đăng nhập và có quyền quản lý khách hàng (Admin / Branch Manager / Staff được cấp). Tab "Nhập từng khách" là tab mặc định trong cụm tab con "Nhập khách hàng".

| Step | User Action | System Response | UI Feedback |
| --- | --- | --- | --- |
| 1 | User mở tab Import → chọn "Nhập từng khách hàng" | Load form với các field Mã KH, Tên KH, Số điện thoại (bắt buộc) và các field optional | Form rỗng, highlight field bắt buộc |
| 2 | Nhập Mã KH | Kiểm tra trùng (client/disc cache); chuẩn bị gửi lên server khi lưu | Tooltip nếu trùng trong session: "Mã KH đã tồn tại" |
| 3 | Nhập Tên KH, Số điện thoại, optional khác | Validate định dạng số điện thoại/email ngay khi blur | Inline error nếu sai định dạng |
| 4 | Bấm "Lưu" | Call `databaseService.customers.createCustomer(data)` → Supabase `insert` | Nút chuyển trạng thái loading, disable form |
| 5 | Supabase trả thành công | Record lưu vào `customers` table (RLS kiểm tra `company_id` + role) | Toast "Đã thêm khách hàng", reset form |
| 6 | Supabase trả lỗi (trùng `customer_code` — unique constraint `company_id + customer_code`) | Giữ nguyên dữ liệu nhập để user chỉnh | Banner đỏ hiển thị thông báo cụ thể |
| 7 | User rời form khi chưa lưu | (Thiếu) chưa có confirm | Đề xuất: modal xác nhận "Bạn có muốn bỏ dữ liệu đang nhập?" |

### Missing States / Edge Cases
- Mất kết nối khi submit: cần state retry auto/manual.
- Khi user không có quyền import nhưng mở tab: cần state "Bạn không có quyền thực hiện thao tác này" + disable form.

### Suggested Improvements
- Autocomplete/auto-format Mã KH để tránh sai chuẩn.
- Cho phép queue nhiều bản ghi draft rồi submit hàng loạt.

---

## BULK IMPORT FLOW (CUSTOMERS & TRANSACTIONS)

**Context:** User chuyển sang tab "Nhập hàng loạt" trong cùng giao diện. Có quyền import, dùng file Excel/CSV chuẩn template, tối đa 100–200 dòng.

| Step | User Action | System Response | UI Feedback |
| --- | --- | --- | --- |
| 1 | Mở tab Import → chọn "Nhập hàng loạt" ⇒ chọn loại (Customers/Transactions) | Hiển thị dropzone + hướng dẫn fields bắt buộc + link template | Banner nhắc file <=200 dòng, drag & drop area |
| 2 | Drag & drop file hoặc chọn file | Client đọc file, parse dữ liệu; hiển thị trạng thái "Đang xử lý" | Spinner, disable nút Import |
| 3 | Validation toàn bộ file (bắt buộc, định dạng, lookup mã khách) | Nếu có lỗi -> tạo danh sách lỗi theo dòng/cột | Bảng lỗi hiển thị chi tiết; nút Import bị disable |
| 4 | User xem preview dữ liệu hợp lệ | Render bảng preview, highlight dòng lỗi | Tooltip: "Không chỉnh trực tiếp, hãy sửa file và upload lại" |
| 5 | User bấm "Nhập dữ liệu" (khi không còn lỗi) | Call `databaseService.customers.bulkCreateCustomers(rows)` → Supabase `upsert` batch | Button loading, hiển thị progress nếu cần |
| 6 | Supabase trả kết quả | - Thành công: rows inserted/updated (RLS validates each)
|   |   | - Lỗi server: trả message chi tiết (constraint violation, RLS deny) |  |
| 7 | UI phản hồi | Thành công: modal/alert "Nhập thành công X dòng" + link xem lịch sử. Lỗi server: banner đỏ + nút retry | Toast + cập nhật danh sách khách hàng/giao dịch |
| 8 | User tải log lỗi (nếu có) | (Thiếu) | Đề xuất: nút "Tải danh sách lỗi" |

### Missing States / Edge Cases
- File vượt quá 200 dòng: cần chặn ngay sau khi upload.
- Import đang chạy mà user đóng tab: cần cảnh báo "Đang xử lý, rời trang sẽ hủy".
- Staff quyền viewer truy cập: phải disable toàn bộ controls và hiển thị note "Liên hệ Admin để được cấp quyền import".

### Suggested Improvements
- Filter chỉ các dòng lỗi trong preview để user xem nhanh.
- Cho phép lưu draft cấu hình import (ví dụ mapping cột nếu sau này mở rộng).
- Hiển thị thời gian ước lượng hoặc progress khi upload/validate lâu.

---

## PERMISSION & AUDIT FLOW SNAPSHOT

1. Khi user mở màn hình import, `useAuth` cung cấp `user.staff_permissions` → component kiểm tra `hasPermission("customers","import")` / `hasPermission("transactions","import")`. Nếu không đủ quyền, disable toàn bộ controls và hiển thị thông báo.
2. Mỗi lần import thành công (single hoặc bulk), có thể ghi vào `backup_history` (operation = 'import') với metadata `{user_id, action, timestamp, success_count}`.
3. Trang Settings → Backup History (`backup_history` table) cho phép Admin/Manager xem lại các thao tác import/export.

---

# DASHBOARD LOAD FLOW

| Step | Action | System Response | UI Feedback |
|------|--------|---------------|-------------|
| 1 | User opens `/dashboard` | `useAuth` checks session + profile | Redirect to login if unauthenticated |
| 2 | Dashboard mounts | Calls `databaseService.dashboard.getMetrics(branchId?, timeRange?)` | Skeleton loaders |
| 3 | Supabase queries `customers`, `transactions` | RLS filters by `company_id` + `branch_id` (if applicable) | — |
| 4 | Data returned | Aggregations computed in SQL or frontend | Metric cards populate |
| 5 | Charts render | `Recharts` renders pie chart (transaction types) + recent list | Full dashboard visible |

## Trial / Offline Fallback Flow

| Step | Action | System Response |
|------|--------|---------------|
| 1 | Supabase client fails to connect (network error / missing env) | `databaseService` falls back to `trialMockStore.ts` |
| 2 | Data read from `localStorage` | Returns pre-seeded mock customers & transactions |
| 3 | User can browse but changes only persist to `localStorage` | No auth required; read-only demo mode |
| 4 | When Supabase reconnects | Prompt user to sync or discard local changes |