# Import/Export Templates

This directory contains template files for importing data into the
inventory-operation system.

## Available Templates

### Product Import Template (`product_import_template.csv`)

**Purpose:** Import product catalog data

**Columns:**

| Column | Required? | Notes |
|--------|-----------|-------|
| `Name` | Yes | Product name |
| `Input Unit` | Yes | Unit of measurement (kg, gram, lít, ml, cái, gói, hộp, ly, phần) |
| `Business Code` | No | If provided, must be unique within company. Re-import with same code → updates existing product |
| `Category` | No | Defaults to `other`. Valid: fruit, dry_goods, processed, finished, beverage, tobacco, other |
| `Output Unit` | No | Defaults to `Input Unit` |
| `Input Quantity` | No | Defaults to 1 |
| `Output Quantity` | No | Defaults to 1 |
| `Status` | No | Defaults to `active`. Valid: ACTIVE, INACTIVE |
| `Business Status` | No | Defaults to `active` |
| `Intermediate Units` | No | Comma-separated (e.g., "Miếng, Gram") |
| `Conversion Ratio Raw→Processed` | No | Number |
| `Conversion Ratio Processed→Finished` | No | Number |
| `Standard Input Price` | No | Number (VND) |

**Validation Rules:**

- `Name` and `Input Unit` are required (all other fields optional)
- `Business Code` (if provided) must be unique within the file
  — duplicates are auto-merged (last row wins)
- `Category` must be a valid enum value (see above)
- Quantities and prices must be non-negative numbers

**Row Limit:** None — imports are chunked into batches of 200 internally

**Behavior on re-import:**

- Products with same `Business Code` → **updated** (upsert)
- Products without `Business Code` → **new row created** (cannot deduplicate)

### Inventory Import Template (`inventory_import_template.csv`)

**Purpose:** Import inventory stock records

**Columns:**

| Column | Required? | Notes |
|--------|-----------|-------|
| `Date` | Yes | YYYY-MM-DD format |
| `Product Code` | Yes | Must match existing product `business_code` |
| `Product Name` | Yes | Product name |
| `Input Quantity` | No | Quantity of goods received |
| `Raw Material Stock` | No | Stock of raw materials |
| `Raw Material Unit` | No | kg, gram, lít, ml, cái, gói, hộp |
| `Processed Stock` | No | Stock of processed goods |
| `Processed Unit` | No | ly, phần, cái, miếng |
| `Finished Product Stock` | No | Stock of finished products |
| `Finished Product Unit` | No | ly, phần, cái, miếng |
| `Notes` | No | Optional notes |

**Validation Rules:**

- `Date`, `Product Code`, and `Product Name` are required
- `Product Code` must exist in product catalog
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
