# Import/Export Templates

This directory contains template files for importing data into the inventory-operation system.

## Available Templates

### Product Import Template (`product_import_template.csv`)
**Purpose:** Import product catalog data

**Columns:**
- `Business Code` (Required): Unique product identifier (e.g., PROD001)
- `Name` (Required): Product name
- `Category` (Required): Product category (BEVERAGE, FINISHED, DRY_GOODS, PROCESSED, OTHER)
- `Input Quantity`: Input quantity for conversion
- `Output Quantity`: Output quantity for conversion
- `Input Unit`: Unit of measurement for input (kg, gram, lít, ml, cái, gói, hộp, ly, phần)
- `Output Unit`: Unit of measurement for output (miếng, gram, kg, lít, ml, cái, phần, đĩa, ly)
- `Status`: Product status (ACTIVE, INACTIVE)
- `Business Status`: Business status (active, inactive)

**Validation Rules:**
- Business Code must be unique
- Name and Category are required
- Quantities must be non-negative numbers
- Category must be a valid enum value

**Row Limit:** Maximum 200 rows per import

### Inventory Import Template (`inventory_import_template.csv`)
**Purpose:** Import inventory stock records

**Columns:**
- `Date` (Required): Record date (YYYY-MM-DD format)
- `Product Code` (Required): Must match existing product Business Code
- `Product Name` (Required): Product name
- `Input Quantity`: Quantity of goods received
- `Raw Material Stock`: Stock of raw materials
- `Raw Material Unit`: Unit for raw materials (kg, gram, lít, ml, cái, gói, hộp)
- `Processed Stock`: Stock of processed goods
- `Processed Unit`: Unit for processed goods (ly, phần, cái, miếng)
- `Finished Product Stock`: Stock of finished products
- `Finished Product Unit`: Unit for finished products (ly, phần, cái, miếng)
- `Notes`: Optional notes

**Validation Rules:**
- Product Code must exist in product catalog
- Date, Product Code, and Product Name are required
- Combination of Product Code + Date must be unique
- All stock quantities must be non-negative numbers
- Foreign key validation ensures product exists

**Row Limit:** Maximum 200 rows per import

## How to Use Templates

1. **Download the appropriate template** for the data you want to import
2. **Fill in your data** following the column structure and validation rules
3. **Save as CSV** (UTF-8 encoding recommended)
4. **Use the import UI** to upload your file or paste data directly
5. **Review validation errors** before final import

## Server-Side Validation

All imports are validated server-side with:
- **Duplicate checks:** Prevents duplicate product codes and inventory records
- **Foreign key validation:** Ensures inventory records reference existing products
- **Data type validation:** Validates numeric fields and required fields
- **Business rule validation:** Ensures quantities are non-negative

## Export Functionality

The system supports CSV export for:
- Product catalog (all products)
- Inventory records (all inventory data)

Export files can be used for:
- Data backup
- External reporting
- Data migration between systems

## Error Handling

If an import fails:
- Review the error message for specific validation failures
- Check for duplicate codes in your data
- Ensure all product codes exist in the catalog (for inventory imports)
- Verify all required fields are filled
- Check data formats (dates, numbers)

## Support

For issues with import/export functionality, refer to the main documentation or contact support.
