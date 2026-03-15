# SYSTEM FLOWS

---

# USER REGISTRATION FLOW

1 user signs up
2 system validates email
3 account created
4 redirect to dashboard

---

## SINGLE ENTRY CUSTOMER IMPORT FLOW

**Context:** User đã đăng nhập và có quyền quản lý khách hàng (Admin / Branch Manager / Staff được cấp). Tab "Nhập từng khách" là tab mặc định trong cụm tab con "Nhập khách hàng".

| Step | User Action | System Response | UI Feedback |
| --- | --- | --- | --- |
| 1 | User mở tab Import → chọn "Nhập từng khách hàng" | Load form với các field Mã KH, Tên KH, Số điện thoại (bắt buộc) và các field optional | Form rỗng, highlight field bắt buộc |
| 2 | Nhập Mã KH | Kiểm tra trùng (client/disc cache); chuẩn bị gửi lên server khi lưu | Tooltip nếu trùng trong session: "Mã KH đã tồn tại" |
| 3 | Nhập Tên KH, Số điện thoại, optional khác | Validate định dạng số điện thoại/email ngay khi blur | Inline error nếu sai định dạng |
| 4 | Bấm "Lưu" | Gửi request create customer lên API | Nút chuyển trạng thái loading, disable form |
| 5 | API trả thành công | Lưu record và ghi audit (user, thời gian, success_count=1) | Toast "Đã thêm khách hàng", reset form |
| 6 | API trả lỗi (ví dụ trùng mã trong DB) | Giữ nguyên dữ liệu nhập để user chỉnh | Banner đỏ hiển thị thông báo cụ thể |
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
| 5 | User bấm "Nhập dữ liệu" (khi không còn lỗi) | Gửi request bulk import lên API | Button loading, hiển thị progress nếu cần |
| 6 | API trả kết quả | - Thành công: lưu records + audit log (user, timestamp, success_count)
|   |   | - Lỗi server: trả message chi tiết |  |
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

1. Khi user mở màn hình import, gọi API check permission → nếu không đủ quyền, disable toàn bộ controls và hiển thị thông báo.
2. Mỗi lần import thành công (single hoặc bulk), ghi audit log `{user_id, action, timestamp, success_count}`.
3. Cần trang / modal "Lịch sử import" để Admin/Manager kiểm tra lại khi cần.

---

# IMPORT TRANSACTION FLOW

1 user clicks import
2 upload CSV
3 system validates file
4 transactions saved
5 portfolio recalculated
6 UI updated

---

# DASHBOARD LOAD FLOW

1 user opens dashboard
2 API request
3 database query
4 UI renders charts