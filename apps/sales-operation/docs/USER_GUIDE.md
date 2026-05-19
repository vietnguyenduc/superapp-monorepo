# Hướng dẫn sử dụng hệ thống Quản lý Tồn kho

## Tổng quan

Hệ thống Quản lý Tồn kho là một ứng dụng web hiện đại giúp doanh nghiệp quản lý hiệu quả việc nhập xuất tồn kho, theo dõi sản phẩm và tạo báo cáo chi tiết.

### Tính năng chính

- ✅ **Nhập liệu tồn kho**: Ghi nhận số liệu nhập hàng và tồn kho thực tế
- ✅ **Quản lý danh mục**: Quản lý thông tin sản phẩm, đơn vị quy đổi
- ✅ **Báo cáo bán hàng**: Theo dõi xuất bán, xuất khuyến mãi
- ✅ **Xuất đặc biệt**: Quản lý xuất hư hỏng, hết hạn với quy trình duyệt
- ✅ **Báo cáo nhập xuất tồn**: Phân tích chênh lệch tồn sổ và tồn thực
- ✅ **Xuất file kiểm kho**: In phiếu kiểm kho, xuất báo cáo Excel/PDF
- ✅ **Dashboard tổng quan**: Biểu đồ, thống kê, cảnh báo
- ✅ **Import/Export**: Nhập xuất dữ liệu từ Excel, Google Sheets
- ✅ **Phân quyền**: Quản lý quyền truy cập theo vai trò

## Đăng nhập hệ thống

### Tài khoản demo

Hệ thống cung cấp các tài khoản demo để trải nghiệm:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
|---------|---------------|----------|-----------|
| **Quản trị viên** | `admin` | `password123` | Toàn quyền hệ thống |
| **Quản lý vận hành** | `manager` | `password123` | Duyệt xuất đặc biệt, xem báo cáo |
| **Kế toán kho** | `accountant` | `password123` | Quản lý bán hàng, xuất báo cáo |
| **Thủ kho** | `warehouse_keeper` | `password123` | Nhập liệu tồn kho, yêu cầu xuất |

### Cách đăng nhập

1. Truy cập trang chủ hệ thống
2. Nhập **tên đăng nhập** và **mật khẩu**
3. Nhấn **"Đăng nhập"**
4. Hệ thống sẽ chuyển đến Dashboard tương ứng với vai trò

## Hướng dẫn sử dụng từng module

### 1. Dashboard - Tổng quan

**Đường dẫn**: `/dashboard`

Dashboard cung cấp cái nhìn tổng quan về tình hình kinh doanh:

#### Các widget chính:
- **Tổng số sản phẩm**: Hiển thị số lượng sản phẩm đang quản lý
- **Tồn kho hiện tại**: Tổng giá trị tồn kho theo thời gian thực
- **Cảnh báo lệch kho**: Danh sách sản phẩm có chênh lệch bất thường
- **Doanh thu hôm nay**: Thống kê doanh thu và số lượng bán

#### Biểu đồ:
- **Biểu đồ nhập xuất**: Theo dõi xu hướng nhập xuất theo thời gian
- **Biểu đồ tồn kho**: Phân tích cơ cấu tồn kho theo sản phẩm
- **Biểu đồ chênh lệch**: Hiển thị mức độ chênh lệch tồn sổ/tồn thực

#### Thao tác nhanh:
- **Nhập tồn kho mới**: Chuyển đến trang nhập liệu
- **Tạo phiếu xuất**: Tạo phiếu xuất đặc biệt
- **Xuất báo cáo**: Tải báo cáo tổng hợp

### 2. Nhập liệu tồn kho

**Đường dẫn**: `/inventory-input`

Module này giúp ghi nhận số liệu nhập hàng và kiểm kê tồn kho.

#### Cách sử dụng:

1. **Nhập thông tin cơ bản**:
   - Chọn **ngày nhập liệu**
   - Chọn **sản phẩm** từ dropdown
   - Nhập **số lượng nhập** (nếu có)
   - Nhập **tồn kho thực tế** sau kiểm đếm

2. **Lưu dữ liệu**:
   - Nhấn **"Lưu"** để ghi nhận
   - Dữ liệu sẽ được đồng bộ lên database ngay lập tức

3. **Xem lịch sử**:
   - Bảng hiển thị các lần nhập liệu gần đây
   - Có thể **chỉnh sửa** hoặc **xóa** bản ghi
   - **Tìm kiếm** theo sản phẩm hoặc ngày

#### Lưu ý:
- Tồn kho thực tế nên được kiểm đếm cẩn thận
- Hệ thống sẽ tự động tính chênh lệch với tồn sổ
- Chênh lệch lớn sẽ được cảnh báo

### 3. Quản lý danh mục sản phẩm

**Đường dẫn**: `/product-management`

Quản lý thông tin chi tiết về sản phẩm và đơn vị quy đổi.

#### Thêm sản phẩm mới:

1. Nhấn **"Thêm sản phẩm"**
2. Điền thông tin:
   - **Mã sản phẩm**: Mã định danh duy nhất
   - **Tên sản phẩm**: Tên đầy đủ
   - **Loại sản phẩm**: Nguyên liệu/Thành phẩm
   - **Đơn vị nhập**: kg, lít, cái...
   - **Đơn vị xuất**: ly, phần, chai...
   - **Tỷ lệ quy đổi**: 1 kg = 100 ly

3. Nhấn **"Lưu"** để hoàn tất

#### Chỉnh sửa sản phẩm:

1. Tìm sản phẩm trong danh sách
2. Nhấn **"Chỉnh sửa"**
3. Cập nhật thông tin cần thiết
4. Nhấn **"Cập nhật"**

#### Tìm kiếm và lọc:
- **Tìm kiếm**: Theo tên hoặc mã sản phẩm
- **Lọc theo loại**: Nguyên liệu/Thành phẩm
- **Lọc theo trạng thái**: Hoạt động/Ngừng hoạt động

### 4. Báo cáo bán hàng

**Đường dẫn**: `/sales-input`

Ghi nhận các giao dịch bán hàng và xuất khuyến mãi.

#### Nhập dữ liệu bán hàng:

1. **Thông tin cơ bản**:
   - **Ngày xuất**: Ngày thực hiện giao dịch
   - **Sản phẩm**: Chọn từ danh sách
   - **Số lượng bán**: Số lượng thực tế bán ra

2. **Phân loại xuất**:
   - **Xuất bán**: Bán hàng thông thường
   - **Xuất khuyến mãi**: Chương trình khuyến mãi
   - **Xuất cúng**: Dùng cho lễ hội, sự kiện

3. **Ghi chú**: Thêm thông tin bổ sung nếu cần

#### Xem báo cáo:
- **Báo cáo ngày**: Tổng hợp theo ngày
- **Báo cáo tháng**: Phân tích xu hướng
- **Top sản phẩm**: Sản phẩm bán chạy nhất

### 5. Xuất đặc biệt

**Đường dẫn**: `/special-outbound`

Quản lý các trường hợp xuất đặc biệt cần phê duyệt.

#### Tạo yêu cầu xuất đặc biệt:

1. **Thông tin yêu cầu**:
   - **Sản phẩm**: Chọn sản phẩm cần xuất
   - **Số lượng**: Số lượng cần xuất
   - **Lý do**: Hư hỏng/Hết hạn/Mẫu thử/Khác

2. **Chi tiết**:
   - **Mô tả chi tiết**: Giải thích cụ thể lý do
   - **Ảnh minh họa**: Đính kèm ảnh nếu cần
   - **Người yêu cầu**: Tự động điền

3. **Gửi phê duyệt**: Nhấn **"Gửi yêu cầu"**

#### Quy trình phê duyệt:

1. **Thủ kho** tạo yêu cầu
2. **Quản lý** xem xét và phê duyệt
3. **Hệ thống** cập nhật tồn kho tự động
4. **Ghi nhận** vào nhật ký audit

#### Trạng thái yêu cầu:
- 🟡 **Chờ duyệt**: Đang chờ quản lý xem xét
- ✅ **Đã duyệt**: Được phê duyệt và thực hiện
- ❌ **Từ chối**: Không được phê duyệt

### 6. Báo cáo nhập xuất tồn

**Đường dẫn**: `/variance-report`

Phân tích chênh lệch giữa tồn sổ và tồn thực tế.

#### Tạo báo cáo:

1. **Chọn kỳ báo cáo**:
   - **Từ ngày - đến ngày**
   - **Sản phẩm**: Tất cả hoặc chọn cụ thể

2. **Xem kết quả**:
   - **Tồn đầu kỳ**: Số liệu đầu kỳ
   - **Nhập trong kỳ**: Tổng nhập
   - **Xuất trong kỳ**: Tổng xuất (bán + đặc biệt)
   - **Tồn sổ**: Tính toán lý thuyết
   - **Tồn thực**: Kiểm đếm thực tế
   - **Chênh lệch**: Tồn thực - Tồn sổ

#### Phân tích chênh lệch:

- **Chênh lệch dương**: Tồn thực > Tồn sổ (có thể do sai sót ghi nhận xuất)
- **Chênh lệch âm**: Tồn thực < Tồn sổ (có thể do thất thoát, hư hỏng)
- **Ngưỡng cảnh báo**: Chênh lệch > 5% sẽ được highlight

#### Xử lý chênh lệch:
1. **Kiểm tra lại** số liệu nhập xuất
2. **Tạo phiếu xuất đặc biệt** nếu cần điều chỉnh
3. **Ghi nhận** nguyên nhân vào hệ thống

### 7. Xuất file kiểm kho

**Đường dẫn**: `/export-reports`

Tạo và xuất các loại báo cáo, phiếu kiểm kho.

#### Các loại báo cáo:

1. **Phiếu kiểm kho**:
   - Format: Excel/PDF
   - Nội dung: Danh sách sản phẩm cần kiểm đếm
   - Có chỗ ghi số liệu thực tế

2. **Báo cáo tồn kho**:
   - Tình hình tồn kho hiện tại
   - Phân tích theo nhóm sản phẩm
   - Cảnh báo tồn kho thấp

3. **Báo cáo nhập xuất**:
   - Chi tiết giao dịch nhập xuất
   - Thống kê theo kỳ
   - Phân tích xu hướng

#### Cách xuất file:

1. **Chọn loại báo cáo**
2. **Thiết lập tham số**:
   - Kỳ báo cáo
   - Sản phẩm
   - Định dạng file

3. **Xem trước**: Kiểm tra nội dung
4. **Xuất file**: Tải về máy tính
5. **Lưu lịch sử**: Hệ thống ghi nhận thao tác

### 8. Import/Export dữ liệu

**Đường dẫn**: `/import-export`

Nhập xuất dữ liệu hàng loạt từ Excel, Google Sheets.

#### Import từ Excel:

1. **Tải template**: Nhấn **"Tải mẫu Excel"**
2. **Điền dữ liệu**: Theo đúng format mẫu
3. **Upload file**: Kéo thả hoặc chọn file
4. **Xem trước**: Kiểm tra dữ liệu import
5. **Xác nhận**: Nhấn **"Import"** để lưu

#### Import từ Google Sheets:

1. **Cấu hình API**: Nhập Google Sheets API key
2. **Nhập URL**: URL của Google Sheets
3. **Chọn range**: Ví dụ: Sheet1!A1:G100
4. **Xem trước**: Kiểm tra dữ liệu
5. **Import**: Lưu vào database

#### Paste từ clipboard:

1. **Copy dữ liệu** từ Excel/Google Sheets
2. **Nhấn vào ô paste** trong hệ thống
3. **Ctrl+V**: Paste dữ liệu
4. **Auto-parse**: Hệ thống tự động phân tích
5. **Lưu**: Xác nhận để lưu dữ liệu

#### Export dữ liệu:

1. **Chọn dữ liệu**: Sản phẩm, tồn kho, bán hàng...
2. **Thiết lập filter**: Theo ngày, sản phẩm...
3. **Chọn format**: Excel, CSV, PDF
4. **Xuất file**: Tải về máy

## Phân quyền hệ thống

### Vai trò và quyền hạn

#### 🔧 Thủ kho (Warehouse Keeper)
- ✅ Nhập liệu tồn kho
- ✅ Xem danh mục sản phẩm
- ✅ Yêu cầu xuất đặc biệt
- ✅ Xem báo cáo cơ bản
- ✅ In phiếu kiểm kho

#### 📊 Kế toán kho (Warehouse Accountant)
- ✅ Tất cả quyền của Thủ kho
- ✅ Quản lý danh mục sản phẩm
- ✅ Nhập liệu bán hàng
- ✅ Xuất báo cáo chi tiết
- ✅ Import/Export dữ liệu

#### 👨‍💼 Quản lý vận hành (Operations Manager)
- ✅ Tất cả quyền của Kế toán
- ✅ Phê duyệt xuất đặc biệt
- ✅ Xem dashboard analytics
- ✅ Quản lý cài đặt hệ thống

#### 👑 Chủ doanh nghiệp (Business Owner)
- ✅ Tất cả quyền của Quản lý
- ✅ Quản lý người dùng
- ✅ Xem audit logs
- ✅ Cấu hình hệ thống

#### ⚙️ Quản trị viên (Admin)
- ✅ Toàn quyền hệ thống
- ✅ Quản lý database
- ✅ Backup/Restore
- ✅ Cấu hình server

## Troubleshooting - Xử lý sự cố

### Lỗi thường gặp

#### 1. Không đăng nhập được
**Triệu chứng**: Báo lỗi "Tài khoản không tồn tại"
**Nguyên nhân**: Sai tên đăng nhập hoặc mật khẩu
**Giải pháp**:
- Kiểm tra lại tên đăng nhập (phân biệt hoa thường)
- Thử mật khẩu demo: `password123`
- Liên hệ admin để reset mật khẩu

#### 2. Không thể lưu dữ liệu
**Triệu chứng**: Nhấn "Lưu" nhưng không có phản hồi
**Nguyên nhân**: Mất kết nối internet hoặc lỗi server
**Giải pháp**:
- Kiểm tra kết nối internet
- Refresh trang và thử lại
- Kiểm tra console browser (F12) để xem lỗi chi tiết

#### 3. Import file Excel lỗi
**Triệu chứng**: File upload nhưng không parse được dữ liệu
**Nguyên nhân**: Sai format hoặc dữ liệu không hợp lệ
**Giải pháp**:
- Tải lại template mẫu
- Kiểm tra format ngày tháng (YYYY-MM-DD)
- Đảm bảo số liệu là số, không có ký tự đặc biệt

#### 4. Chênh lệch tồn kho bất thường
**Triệu chứng**: Chênh lệch quá lớn giữa tồn sổ và tồn thực
**Nguyên nhân**: Sai sót trong ghi nhận nhập xuất
**Giải pháp**:
- Kiểm tra lại các phiếu nhập xuất gần đây
- Đối chiếu với chứng từ gốc
- Tạo phiếu điều chỉnh nếu cần

### Liên hệ hỗ trợ

- **Email**: support@company.com
- **Hotline**: 1900-xxxx
- **Thời gian**: 8:00 - 17:00 (T2-T6)

## Cập nhật và bảo trì

### Lịch bảo trì định kỳ
- **Hàng tuần**: Backup dữ liệu (Chủ nhật 2:00 AM)
- **Hàng tháng**: Cập nhật bảo mật
- **Hàng quý**: Nâng cấp tính năng

### Thông báo cập nhật
Hệ thống sẽ thông báo trước 24h khi có bảo trì hoặc cập nhật quan trọng.

---

*Tài liệu này được cập nhật lần cuối: {{ current_date }}*
*Phiên bản hệ thống: v1.0.0*
