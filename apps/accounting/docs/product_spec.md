# PRODUCT SPECIFICATION

Product Name: **Cashflow Customer & Transaction Import**

Goal: Cho phép Admin/Manager/Staff (được cấp quyền) nhập nhanh dữ liệu khách hàng và giao dịch với trải nghiệm mượt, kiểm soát lỗi chặt, có log để audit.

---

# TARGET USERS

Primary roles:

- Admin: quản trị toàn bộ hệ thống, cần nhập bulk khi onboard dữ liệu mới.
- Branch Manager: nhập dữ liệu cho chi nhánh, giám sát staff.
- Staff có quyền import: nhập khách hàng/giao dịch hàng ngày.

---

# PROBLEM STATEMENT

Hệ thống cần kênh import dữ liệu khối lượng vừa (100–200 dòng) cho khách hàng/giao dịch với yêu cầu:
- Tránh nhập từng bản ghi thủ công.
- Kiểm soát dữ liệu sai, tránh nhập nhầm.
- Đảm bảo phân quyền: chỉ người có quyền mới import.
- Ghi nhận audit (ai import, khi nào, số dòng thành công).

---

# CORE FEATURES

1. **Single Entry Mode (Khách hàng)**
   - Cho phép nhập lần lượt từng khách hàng với preview trước khi lưu.
   - Form bắt buộc: Mã KH, Tên KH, Số điện thoại.
   - Lưu từng bản ghi ngay sau khi user xác nhận.

2. **Bulk Import Customers**
   - Drag & drop file (Excel/CSV) tối đa ~200 dòng, không lag UI.
   - Validation toàn bộ file, chặn import nếu còn lỗi.
   - Lỗi hiển thị theo từng dòng; user phải quay lại sửa file rồi upload lại.
   - Lookup Mã KH để ngăn trùng, cảnh báo các field bắt buộc.

3. **Bulk Import Transactions**
   - Bắt buộc Loại giao dịch (tăng/giảm/điều chỉnh), Mã KH, Số tiền.
   - Lookup tên KH dựa trên Mã KH để user xác nhận đúng đối tượng.
   - Đảm bảo branch/transaction type được xác định từ dữ liệu hệ thống (chưa cần mã riêng cho văn phòng/transaction type).

4. **Permission Enforcement**
   - Admin & Manager luôn có quyền.
   - Staff chỉ import khi được cấp quyền (có thể là Viewer nếu chưa cấp).

5. **Audit Logging**
   - Log: user thực hiện, timestamp, số dòng thành công.
   - Lưu để truy vết khi có sự cố.

6. **Tabbed Import UI**
   - Trang Import phải có hai tab phụ rõ ràng: "Nhập từng khách hàng" và "Nhập hàng loạt".
   - Chuyển tab không mất dữ liệu đang nhập (hiển thị cảnh báo nếu có dữ liệu chưa lưu ở tab single entry).
   - Tab Bulk luôn nhắc rõ giới hạn file và hướng dẫn tải file mẫu.

---

# SUCCESS METRICS

- Tỷ lệ import thành công > 95% cho file hợp lệ.
- Số dòng import tối đa 200 hoàn thành < 10s, UI không lag khi drag & drop.
- 0 lỗi dữ liệu do bypass validation (vì chặn toàn bộ nếu còn lỗi).
- Audit log ghi nhận 100% thao tác import.

---

# FUTURE FEATURES

- Cho phép chỉnh trực tiếp từng dòng trong bulk preview.
- Hỗ trợ nhiều template file, auto-mapping cột.
- Import scheduling / background processing cho file > 200 dòng.
- Tự động gợi ý sửa lỗi (ví dụ chuẩn hóa số điện thoại, format tiền).

---

# IMPACT & DEPENDENCIES

- **RBAC/Staff Permissions:** Mọi đổi mới phải đồng bộ với màn hình Settings > Staff permissions.
- **Transaction Import & Dashboard:** Dữ liệu khách hàng mới ảnh hưởng đến báo cáo và TransactionImport (lookup customer_code). Cần regression test các module này sau khi chỉnh import logic.
- **Audit History UI:** Khi có log mới, cập nhật hoặc tạo trang "Lịch sử import" để QA/Manager theo dõi.