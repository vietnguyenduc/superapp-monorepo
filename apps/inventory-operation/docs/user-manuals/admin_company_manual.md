# Admin Company User Manual

## Overview
This manual is for Company Administrators managing a specific company's inventory operations.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Product Management](#product-management)
3. [Inventory Management](#inventory-management)
4. [Branch Management](#branch-management)
5. [Staff Management](#staff-management)
6. [Reports](#reports)
7. [Settings](#settings)

## Getting Started

### First-Time Login
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the Dashboard

### Dashboard Overview
The Dashboard provides:
- Total products in your company
- Total inventory records
- Recent activity across your branches
- Stock alerts and warnings

## Product Management

### Add New Product
1. Navigate to Product Catalog
2. Click "Add Product"
3. Fill in product details:
   - Business Code (required, unique)
   - Product Name (required)
   - Category (required)
   - Input Quantity & Unit
   - Output Quantity & Unit
   - Status (Active/Inactive)
4. Click "Save"

### Bulk Import Products
1. Navigate to Product Catalog → Import
2. Download the template
3. Fill in product data in CSV format
4. Upload the file or paste data
5. Review validation errors
6. Click "Import" to save

**Note:** Maximum 200 rows per import.

### Edit Product
1. Navigate to Product Catalog
2. Search for the product
3. Click "Edit"
4. Modify product details
5. Click "Save Changes"

### Delete Product
1. Navigate to Product Catalog
2. Select the product
3. Click "Delete"
4. Confirm deletion

**Warning:** Deleting a product removes it from all inventory records. Use with caution.

## Inventory Management

### Add Inventory Record
1. Navigate to Inventory → Add Record
2. Fill in inventory details:
   - Date (required)
   - Product Code (required)
   - Product Name (required)
   - Input Quantity
   - Raw Material Stock & Unit
   - Processed Stock & Unit
   - Finished Product Stock & Unit
   - Notes (optional)
3. Click "Save"

### Bulk Import Inventory
1. Navigate to Inventory → Import
2. Download the template
3. Fill in inventory data in CSV format
4. Upload the file or paste data
5. Review validation errors
6. Click "Import" to save

**Note:** Maximum 200 rows per import. Product Code must exist in product catalog.

### View Inventory History
1. Navigate to Inventory → History
2. Select product
3. View stock changes over time
4. Filter by date range

### Stock Check
1. Navigate to Inventory → Stock Check
2. Select date range
3. Select products to check
4. Click "Generate Stock Check"
5. Review variance report

## Branch Management

### View Branch Overview
1. Navigate to Branches
2. Select a branch
3. View:
   - Total products
   - Current inventory levels
   - Recent activity
   - Staff members

### Branch Settings
1. Navigate to Branches → Settings
2. Configure branch-specific settings:
   - Default stock units
   - Notification preferences
   - Report templates
3. Click "Save Settings"

## Staff Management

### Add Staff Member
1. Navigate to Settings → Staff
2. Click "Add Staff"
3. Fill in staff details:
   - Email (required)
   - Full Name (required)
   - Branch assignment (required)
4. Configure permissions:
   - Import Products
   - Import Inventory
   - View Reports
5. Click "Create Staff"

### Edit Staff Permissions
1. Navigate to Settings → Staff
2. Select staff member
3. Toggle permissions as needed
4. Click "Save Changes"

### View Staff Activity
1. Navigate to Settings → Staff → Activity
2. Select staff member
3. View:
   - Recent actions
   - Login history
   - Performance metrics

## Reports

### Inventory Reports
1. Navigate to Reports → Inventory
2. Select report type:
   - Current Stock Levels
   - Stock Movement History
   - Variance Reports
   - Low Stock Alerts
3. Configure filters:
   - Date range
   - Branch
   - Product category
4. Click "Generate Report"
5. Export to CSV

### Sales Reports
1. Navigate to Reports → Sales
2. Select report type:
   - Daily Sales
   - Product Performance
   - Branch Comparison
3. Configure filters
4. Click "Generate Report"
5. Export to CSV

### Custom Reports
1. Navigate to Reports → Custom
2. Select data sources
3. Configure metrics
4. Save report for future use

## Settings

### Company Settings
1. Navigate to Settings → Company
2. Configure:
   - Company name and logo
   - Default currency
   - Tax settings
   - Notification preferences
3. Click "Save"

### Product Categories
1. Navigate to Settings → Categories
2. Add custom categories
3. Set default units per category
4. Click "Save"

### Import/Export Settings
1. Navigate to Settings → Import/Export
2. Configure:
   - Default export format
   - Template preferences
   - Validation rules
3. Click "Save"

## Troubleshooting

### Common Issues

**Product Import Fails**
- Check CSV format matches template
- Verify product codes are unique
- Ensure all required fields are filled
- Review error messages for specific issues

**Inventory Import Fails**
- Verify product codes exist in catalog
- Check date format (YYYY-MM-DD)
- Ensure no duplicate (productCode + date)
- Review validation errors

**Staff Cannot Access Features**
- Verify staff is active
- Check permission settings
- Ensure staff is assigned to correct branch
- Contact Master Admin if needed

### Getting Help
- Check the documentation in `/docs`
- Review import templates in `/docs/import-templates`
- Contact Master Admin for account issues
- Contact technical support for system issues

## Best Practices

### Product Management
- Use consistent product codes
- Keep product names descriptive
- Regularly review inactive products
- Use bulk import for large datasets

### Inventory Management
- Perform regular stock checks
- Document all stock movements
- Investigate variances promptly
- Keep historical data for analysis

### Staff Management
- Train staff on proper procedures
- Regularly review staff permissions
- Monitor staff activity
- Provide clear guidelines

## Appendix

### Permission Matrix
| Permission | Company Admin | Branch Manager | Staff |
|------------|---------------|----------------|-------|
| View All Products | ✅ | ✅ | ✅ |
| Add/Edit Products | ✅ | ✅ | Conditional |
| Delete Products | ✅ | ❌ | ❌ |
| View All Inventory | ✅ | Branch Only | Branch Only |
| Add Inventory Records | ✅ | ✅ | Conditional |
| Import/Export | ✅ | ✅ | Conditional |
| View Reports | ✅ | ✅ | Conditional |
| Manage Staff | ✅ | ❌ | ❌ |
| Company Settings | ✅ | ❌ | ❌ |

### Import Templates
- Product Import Template: `/docs/import-templates/product_import_template.csv`
- Inventory Import Template: `/docs/import-templates/inventory_import_template.csv`

### Contact Information
- **Master Admin:** [Contact info]
- **Technical Support:** [Contact info]
- **Company Support:** [Contact info]
