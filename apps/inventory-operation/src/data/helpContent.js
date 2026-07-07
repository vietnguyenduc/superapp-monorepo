export const helpTopics = [
    {
        id: 'gs-1',
        title: 'Tổng quan hệ thống',
        category: 'getting-started',
        keywords: ['overview', 'tổng quan', 'giới thiệu', 'hệ thống', 'dashboard'],
        content: `Hệ thống Quản lý Tồn kho (Inventory Operation) giúp bạn:
- Quản lý danh mục sản phẩm NVL, SC, TP
- Nhập liệu tồn kho hàng ngày
- Theo dõi bán hàng và xuất hàng đặc biệt
- Xuất báo cáo kiểm kê kho
- Phân quyền theo cấp: admin_master, admin_company, staff`
    },
    {
        id: 'gs-2',
        title: 'Đăng nhập và Phân quyền',
        category: 'getting-started',
        keywords: ['login', 'đăng nhập', 'quyền', 'permission', 'role', 'rbac'],
        content: `Hệ thống hỗ trợ 3 cấp người dùng:
1. **admin_master**: Toàn quyền hệ thống
2. **admin_company**: Quản lý công ty, chi nhánh, nhân viên
3. **staff**: Nhân viên vận hành, có quyền theo phân công (staff_permissions)

Đăng nhập bằng email/password qua Supabase Auth. Nếu chưa có tài khoản, liên hệ admin để được cấp.`
    },
    {
        id: 'gs-3',
        title: 'Dashboard - Màn hình chính',
        category: 'getting-started',
        keywords: ['dashboard', 'màn hình chính', 'tổng quan', 'thống kê'],
        content: `Dashboard hiển thị:
- Tổng số sản phẩm trong danh mục
- Tổng số bản ghi tồn kho
- Cảnh báo tồn kho thấp (sắp triển khai)
- Biểu đồ xu hướng nhập/xuất

Dữ liệu được cập nhật real-time từ Supabase.`
    },
    {
        id: 'wf-1',
        title: 'Nhập sản phẩm mới (Form đơn)',
        category: 'workflows',
        keywords: ['nhập sản phẩm', 'product entry', 'thêm sản phẩm', 'form'],
        content: `Menu: **Nhập Sản Phẩm (Form)**

Các trường bắt buộc:
- Mã SP KD (businessCode): duy nhất, không trùng
- Tên sản phẩm
- Loại: NVL (nguyên vật liệu), SC (sơ chế), TP (thành phẩm)
- Định lượng nhập & ĐVT nhập

Hệ thống kiểm tra trùng lặp mã SP trước khi lưu (server-side).`
    },
    {
        id: 'wf-2',
        title: 'Nhập tồn kho (Form đơn)',
        category: 'workflows',
        keywords: ['nhập tồn kho', 'inventory entry', 'bản ghi tồn kho', 'form'],
        content: `Menu: **Nhập Tồn Kho (Form)**

Các trường bắt buộc:
- Mã SP: phải tồn tại trong danh mục
- Ngày ghi nhận
- Tồn NVL, Tồn SC, Tồn TP (ít nhất 1 > 0)

Ràng buộc: không thể tạo 2 bản ghi cùng mã SP + cùng ngày.`
    },
    {
        id: 'wf-3',
        title: 'Import hàng loạt (Excel/CSV)',
        category: 'workflows',
        keywords: ['import', 'excel', 'csv', 'hàng loạt', 'bulk', 'upload'],
        content: `Menu: **Import SP Hàng Loạt** hoặc **Import Tồn Kho Hàng Loạt**

Bước thực hiện:
1. Tải template CSV mẫu (nút "Tải template")
2. Điền dữ liệu theo đúng cột yêu cầu
3. Upload file (kéo thả hoặc chọn)
4. Kiểm tra preview và lỗi
5. Nhấn "Import" để lưu

Giới hạn: tối đa 200 dòng/lần import. Có kiểm tra trùng lặp và validate FK.`
    },
    {
        id: 'wf-4',
        title: 'Xuất báo cáo kiểm kê',
        category: 'workflows',
        keywords: ['xuất báo cáo', 'export', 'kiểm kê', 'report', 'in'],
        content: `Menu: **Xuất File Kiểm Kho**

Chọn ngày và loại sản phẩm để xuất:
- File Excel (.xlsx) với định dạng chuẩn kiểm kê
- Có thể in trực tiếp từ trình duyệt
- Hỗ trợ filter theo ngày, loại SP, và trạng thái tồn`
    },
    {
        id: 'faq-1',
        title: 'Tại sao báo lỗi "Product code already exists"?',
        category: 'faq',
        keywords: ['trùng mã', 'already exists', 'duplicate', 'lỗi', 'error'],
        content: `Mã sản phẩm (businessCode) phải là duy nhất toàn hệ thống. Lỗi này xảy ra khi:
- Bạn nhập mã đã tồn tại trong danh mục
- File import có mã trùng với SP đã có
- 2 người cùng nhập mã giống nhau (race condition)

**Cách khắc phục:**
- Kiểm tra danh mục SP trước khi nhập
- Sử dụng mã khác hoặc cập nhật SP hiện có`
    },
    {
        id: 'faq-2',
        title: 'Tại sao không import được file Excel?',
        category: 'faq',
        keywords: ['excel', 'import lỗi', 'file', 'csv', 'không import được'],
        content: `Nguyên nhân phổ biến:
1. **Sai định dạng cột**: đảm bảo đúng tên cột trong template
2. **Thiếu trường bắt buộc**: businessCode, name, category, inputQuantity, inputUnit
3. **Quá 200 dòng**: chia nhỏ file thành nhiều phần
4. **Encoding lỗi**: lưu file CSV UTF-8 với BOM nếu có tiếng Việt

**Mẹo**: luôn tải template mới nhất trước khi nhập.`
    },
    {
        id: 'faq-3',
        title: 'Tại sao không có quyền vào trang nhập liệu?',
        category: 'faq',
        keywords: ['không có quyền', 'permission denied', '403', 'unauthorized'],
        content: `Hệ thống kiểm tra quyền qua RBAC:
- **import_products**: cần để nhập sản phẩm
- **import_inventory**: cần để nhập tồn kho
- **view_reports**: cần để xem báo cáo

Nếu thiếu quyền, liên hệ admin_company hoặc admin_master để được cấp staff_permissions.`
    },
    {
        id: 'faq-4',
        title: 'Dữ liệu tồn kho được lưu ở đâu?',
        category: 'faq',
        keywords: ['lưu trữ', 'database', 'supabase', 'dữ liệu', 'cloud'],
        content: `Dữ liệu được lưu trên **Supabase** (PostgreSQL cloud):
- products: danh mục sản phẩm
- inventory_records: bản ghi tồn kho
- sales_records: dữ liệu bán hàng
- special_outbound_records: xuất hàng đặc biệt
- users: người dùng và phân quyền

RLS (Row Level Security) đảm bảo mỗi user chỉ thấy dữ liệu được phép.`
    },
    {
        id: 'tr-1',
        title: 'Lỗi "Permission denied" khi lưu dữ liệu',
        category: 'troubleshooting',
        keywords: ['permission denied', 'rls', 'không lưu được', 'lỗi lưu'],
        content: `**Nguyên nhân:** RLS policy chặn insert/update.

**Kiểm tra:**
1. User đã đăng nhập chưa? (token hết hạn?)
2. User có quyền trên bảng đó không?
3. RLS policy có đúng cú pháp (không dùng USING true)?

**Khắc phục:**
- Refresh trang để lấy session mới
- Kiểm tra app_permissions.inventory = true trong bảng users
- Liên hệ admin nếu RLS bị lỗi`
    },
    {
        id: 'tr-2',
        title: 'Lỗi kết nối Supabase (fail to fetch)',
        category: 'troubleshooting',
        keywords: ['fail to fetch', 'kết nối', 'supabase', 'network', 'offline'],
        content: `**Kiểm tra từng bước:**
1. Kiểm tra mạng internet
2. Xem console (F12) có lỗi CORS không
3. Kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong .env.local
4. Đảm bảo Supabase project đang hoạt động (không bị paused)

**Nếu vẫn lỗi:**
- Thử đăng xuất và đăng nhập lại
- Xóa localStorage và reload
- Kiểm tra Supabase Dashboard → Project Settings → API`
    },
    {
        id: 'tr-3',
        title: 'Dữ liệu import bị thiếu hoặc sai cột',
        category: 'troubleshooting',
        keywords: ['thiếu cột', 'sai cột', 'import sai', 'mapping'],
        content: `**Nguyên nhân:** Tên cột trong file không khớp với yêu cầu.

**Cách khắc phục:**
1. Tải template CSV mới nhất từ app
2. Không sửa tên cột đầu tiên (header)
3. Đảm bảo dữ liệu bắt đầu từ dòng 2
4. Kiểm tra không có dòng trống xen kẽ

**Validate trước import:**
- Dùng preview để kiểm tra lỗi từng dòng
- Sửa lỗi trong file rồi import lại`
    },
    {
        id: 'tr-4',
        title: 'Không tìm thấy sản phẩm khi nhập tồn kho',
        category: 'troubleshooting',
        keywords: ['không tìm thấy', 'product not found', 'fk', 'foreign key'],
        content: `Khi nhập tồn kho, mã SP (productCode) phải tồn tại trong danh mục.

**Kiểm tra:**
1. Vào **Quản Lý Danh Mục** để xem SP đã có chưa
2. Nếu chưa có → nhập SP trước (Nhập Sản Phẩm Form hoặc Import SP)
3. Kiểm tra chính xả mã SP (phân biệt hoa thường, khoảng trắng)

**Lưu ý:** Import tồn kho không tự động tạo sản phẩm mới.`
    },
];
export const errorCodes = {
    '23505': {
        description: 'Duplicate key value violates unique constraint',
        solution: 'Dữ liệu đã tồn tại (mã trùng). Kiểm tra và dùng giá trị khác.'
    },
    '23503': {
        description: 'Foreign key violation',
        solution: 'Mã SP hoặc tham chiếu không tồn tại. Kiểm tra danh mục trước.'
    },
    '42501': {
        description: 'RLS policy violation / Permission denied',
        solution: 'Không đủ quyền. Liên hệ admin hoặc kiểm tra đăng nhập.'
    },
    'PGRST116': {
        description: 'JWT expired or invalid',
        solution: 'Phiên đăng nhập hết hạn. Đăng xuất và đăng nhập lại.'
    },
    'PGRST301': {
        description: 'Schema not found',
        solution: 'Lỗi cấu hình Supabase. Kiểm tra URL và key.'
    },
    'CONNECTION_ERROR': {
        description: 'Cannot connect to Supabase',
        solution: 'Kiểm tra mạng, CORS, và trạng thái Supabase project.'
    },
    'MAX_BULK_ROWS': {
        description: 'Import exceeds 200 row limit',
        solution: 'Chia file thành nhiều phần, mỗi phần ≤ 200 dòng.'
    },
};
