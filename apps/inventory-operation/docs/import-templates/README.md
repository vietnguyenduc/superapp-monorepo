# Import/Export Templates

This directory contains template files for importing data into the
inventory-operation system.

## Available Templates

### Product Import Template (`product_import_template.csv`)

**Purpose:** Import product catalog data

**Columns:**

| Column | Required? | Notes |
|--------|-----------|-------|
| `Tên sản phẩm` | Yes | Product name |
| `Đơn vị nhập` | Yes | Unit of measurement (kg, gram, lít, ml, cái, gói, hộp, ly, phần) |
| `Mã sản phẩm` | No | If provided, must be unique within company. Re-import with same code → updates existing product |
| `Danh mục` | No | Valid examples: RAW, PROCESSED, FINISHED, DRY_GOODS, BEVERAGE, OTHER |
| `Đơn vị xuất` | No | Defaults to `Đơn vị nhập` |
| `Đơn vị trung gian` | No | Comma-separated (e.g., "Miếng, Gram") |
| `Tỷ lệ quy đổi sơ chế` | No | Number |
| `Định mức thành phẩm` | No | Number |
| `Giá nhập` / `Giá bán` | No | Number (VND) |
| `Trạng thái` | No | Defaults to active. Valid: ACTIVE, INACTIVE |
| `Ghi chú` | No | Optional notes |

**Validation Rules:**

- `Tên sản phẩm` and `Đơn vị nhập` are required (all other fields optional)
- `Mã sản phẩm` (if provided) must be unique within the file
  — duplicates are auto-merged (last row wins)
- Unknown category values fall back to `OTHER`
- Quantities and prices must be non-negative numbers

**Row Limit:** None — imports are chunked into batches of 200 internally

**Behavior on re-import:**

- Products with same `Mã sản phẩm` → **updated** (upsert)
- Products without `Mã sản phẩm` → matched according to the configured product match field

### Inventory Import Template (`inventory_import_template.csv`)

**Purpose:** Import inventory stock records

**Columns:**

| Column | Required? | Notes |
|--------|-----------|-------|
| `Ngày` | Yes | YYYY-MM-DD format |
| `Mã sản phẩm` | Yes in code mode | Must match existing product `business_code` |
| `Tên sản phẩm` | Yes | Product name |
| `Nhà cung cấp` | No | Supplier name |
| `Đơn giá nhập` / `Thành tiền` | No | Number (VND) |
| `Số lượng nhập kho` | No | Quantity of goods received |
| `Tồn Nguyên liệu (Gốc)` / `Đơn vị Nguyên liệu` | No | Raw-material stock and unit |
| `Tồn Sơ chế (Trung gian)` / `Đơn vị Sơ chế` | No | Processed stock and unit |
| `Tồn Thành phẩm (Món)` / `Đơn vị Thành phẩm` | No | Finished-product stock and unit |
| `Ghi chú` | No | Optional notes |

**Validation Rules:**

- `Ngày`, `Mã sản phẩm`, and `Tên sản phẩm` are required for the static code-mode sample
- `Mã sản phẩm` must exist in product catalog
- All stock quantities must be non-negative numbers

**Row Limit:** None

## How to Use Templates

1. **Download the appropriate template** for the data you want to import
2. **Fill in your data** following the column structure and validation rules
3. **Save as CSV or XLSX** (UTF-8 encoding recommended)
4. **Use the import UI** to upload your file
5. **Review validation errors and duplicate warnings** before final import

## Error Handling

If an import fails, the UI shows:

- **Red panel:** Validation errors (e.g., "Dòng 5: Thiếu tên sản phẩm")
- **Amber panel:** Duplicate code warnings (e.g., "Mã SP001 xuất hiện 2 lần")
- **Red panel (after import attempt):** User-friendly error messages:
  - "File có nhiều dòng trùng mã sản phẩm..."
  - "Mã sản phẩm đã tồn tại trong hệ thống..."
  - "Mất kết nối tới máy chủ..."

No raw Postgres error strings are shown to users.

## Export Functionality

The system supports CSV export for:

- Product catalog (all products)
- Inventory records (all inventory data)

Export files can be used for:

- Data backup
- External reporting
- Data migration between systems

## Support

For issues with import/export functionality, refer to the main documentation
or contact support.
