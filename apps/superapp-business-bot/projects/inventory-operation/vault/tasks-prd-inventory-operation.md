# Task List: Inventory Operation Web App (F&B)

## Relevant Files

- `src/pages/InventoryInputPage.tsx` – Form nhập liệu tồn kho (Bảng 1)
- `src/pages/ProductCatalogPage.tsx` – Danh mục hàng hóa, định mức, quy đổi (Bảng 2)
- `src/pages/SalesReportPage.tsx` – Nhập liệu bán hàng, xuất khuyến mãi (Bảng 3)
- `src/pages/SpecialOutboundPage.tsx` – Xuất đặc biệt, approval flow (Bảng 3.1)
- `src/pages/InventoryReportPage.tsx` – Báo cáo nhập xuất tồn, cảnh báo lệch kho (Bảng 4)
- `src/pages/StockCheckPrintPage.tsx` – In phiếu kiểm kho, báo cáo chi tiết (Bảng 5.1, 5.2)
- `src/pages/DashboardPage.tsx` – Dashboard thống kê, biểu đồ, lịch sử
- `src/pages/SettingsPage.tsx` – Quản lý định mức, phân quyền
- `src/components/` – Các component UI Apple-style (Button, Card, Table, SegmentControl, Notification...)
- `src/hooks/` – Hook import Excel/Google Sheet, approval flow
- `src/utils/` – Utils quy đổi, tính chênh lệch, format số liệu, import/export
- `src/types/` – Định nghĩa type/model: Product, InventoryRecord, SalesRecord, UserRole, ApprovalLog
- `vite.config.ts`, `tailwind.config.js|cjs`, `.env.example`, `README.md` – Cấu hình dự án
- `tests/` – Unit test cho từng module/page/component

---

## Parent Tasks & Sub-Tasks

### 1. Thiết kế và khởi tạo cấu trúc hệ thống inventory-operation
- [x] Tạo các thư mục chính: `pages/`, `components/`, `hooks/`, `utils/`, `styles/`, `types/`
- [x] Thiết lập cấu hình Vite, Tailwind, TypeScript, .env, README
- [x] Định nghĩa cấu trúc routing cho các module chính
- [x] Tạo các file model/type cơ bản: Product, InventoryRecord, SalesRecord, UserRole, ApprovalLog
- [x] Setup kết nối backend (Supabase) và biến môi trường

### 2. Xây dựng module nhập liệu tồn kho, nhập kho, và nhập thực tế (Bảng 1)
- [x] Thiết kế UI form nhập liệu tồn kho (ngày, mã món, tên, nhập, tồn thực, đơn vị)
- [x] Tạo component bảng hiển thị danh sách tồn kho với các thao tác CRUD
- [x] Xây dựng service kết nối backend để lưu/tải dữ liệu tồn kho
- [x] Tạo hook quản lý state cho module tồn kho
- [x] Tích hợp form và bảng vào trang InventoryInputPage từ Excel/Google Sheet
- [x] Hiển thị lịch sử nhập liệu và chỉnh sửa

### 3. Xây dựng module quản lý danh mục nguyên vật liệu, định mức, đơn vị quy đổi (Bảng 2)
- [x] Tạo UI quản lý danh mục hàng hóa: thêm, sửa, xóa, tìm kiếm
- [x] Thiết kế form nhập định mức quy đổi, đơn vị nhập/xuất, trạng thái kinh doanh
- [x] Xây dựng logic quy đổi định lượng linh hoạt
- [x] Kết nối backend lưu danh mục và định mức
- [x] Hiển thị lịch sử cập nhật danh mục

### 4. Xây dựng module nhập liệu bán hàng, xuất khuyến mãi, xuất đặc biệt, approval flow (Bảng 3 & 3.1) ✅
- [x] Thiết kế UI nhập báo cáo bán hàng, xuất khuyến mãi, xuất đặc biệt
- [x] Tạo flow approval: khởi tạo, chờ duyệt, duyệt/từ chối, ghi log thao tác
- [x] Hiển thị trạng thái, lịch sử xuất đặc biệt, lý do, người thao tác/người duyệt
- [x] Lưu dữ liệu lên backend, đồng bộ trạng thái approval
- [x] Hỗ trợ import từ Excel/Google Sheet

### 5. Xây dựng hệ thống báo cáo nhập xuất tồn, so sánh tồn sổ và tồn thực, cảnh báo lệch kho (Bảng 4) ✅
- [x] Tạo bảng báo cáo nhập xuất tồn, tổng hợp số liệu theo ngày/kỳ
- [x] Tính toán và highlight chênh lệch tồn sổ – tồn thực
- [x] Gợi ý phiếu xuất đặc biệt khi lệch lớn
- [x] Gửi notification/email khi phát hiện lệch bất thường (optional)
- [x] Hiển thị chi tiết quy đổi theo thành phẩm

### 6. Xây dựng chức năng xuất file kiểm kho, in phiếu, và báo cáo chi tiết (Bảng 5.1, 5.2) ✅
- [x] Thiết kế UI xuất file kiểm kho (Excel/PDF) theo mẫu
- [x] Tạo bảng tổng quan tồn kho, lệch kiểm kho, hỗ trợ in phiếu
- [x] Cho phép ghi chú, chỉnh sửa trước khi in/xuất file
- [x] Lưu log thao tác xuất/in phiếu

### 7. Xây dựng dashboard thống kê, biểu đồ, lịch sử thao tác và phân quyền
- [x] Thiết kế dashboard tổng hợp: biểu đồ nhập xuất, tồn kho, chênh lệch lịch sử
- [x] Hiển thị lịch sử thao tác, approval log, filter theo user/thời gian
- [ ] Xây dựng hệ thống phân quyền: thủ kho, kế toán, quản lý, admin
- [x] Tối ưu UI cho mobile/tablet (responsive)

### 8. Tích hợp import Excel/Google Sheet, kết nối backend (Supabase)
- [x] Xây dựng service import file Excel, mapping dữ liệu tự động
- [x] Tích hợp ClipboardPasteInput cho paste trực tiếp từ Excel/Google Sheets
- [x] Kết nối các module với backend, đảm bảo realtime và bảo mật dữ liệu
- [x] Viết utils xử lý dữ liệu import/export
- [ ] Tích hợp Google Sheet API (optional)

### 9. Thiết kế UI Apple-style, responsive, và tối ưu trải nghiệm người dùng
- [x] Sử dụng bộ UI Apple-style: typography Inter, palette xanh dương-trắng-xám
- [x] Tạo các component: Button, Card, Table, SegmentControl, Notification
- [x] Đảm bảo UI/UX thân thiện, dễ dùng cho thủ kho/kế toán
- [ ] Viết tài liệu hướng dẫn sử dụng, onboarding

---

### Notes
- Ưu tiên tạo các type/model trước để dễ mapping backend và test.
- Mỗi module nên có test/unit test cơ bản ngay từ đầu.
- Có thể tách nhỏ các page thành nhiều component nhỏ để tái sử dụng.
- Đảm bảo phân quyền và bảo mật dữ liệu khi kết nối backend.
- Có thể mở rộng thêm các module (POS, mobile) về sau mà không ảnh hưởng core inventory.
