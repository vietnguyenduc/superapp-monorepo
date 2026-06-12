# Staff User Manual

## Overview
This manual is for Staff members with limited permissions based on assigned access.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Product Catalog](#product-catalog)
3. [Inventory Operations](#inventory-operations)
4. [Reports](#reports)
5. [Profile Settings](#profile-settings)

## Getting Started

### First-Time Login
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the Dashboard

### Dashboard Overview
The Dashboard provides:
- Products in your branch
- Recent inventory records
- Your recent activity
- Stock alerts (if applicable)

### Accessing Features
Your access to features depends on permissions assigned by your administrator:
- **Import Products:** Add products to catalog
- **Import Inventory:** Add inventory records
- **View Reports:** Access inventory and sales reports
- **Manage Settings:** (typically not available to staff)

## Product Catalog

### View Products
1. Navigate to Product Catalog
2. View all products in your branch
3. Search by product code or name
4. Filter by category

### Add Product (If Permitted)
1. Navigate to Product Catalog → Add Product
2. Fill in product details:
   - Business Code (required, unique)
   - Product Name (required)
   - Category (required)
   - Input Quantity & Unit
   - Output Quantity & Unit
   - Status
3. Click "Save"

**Note:** Contact your administrator if you need permission to add products.

### Import Products (If Permitted)
1. Navigate to Product Catalog → Import
2. Download the template
3. Fill in product data in CSV format
4. Upload the file or paste data
5. Review validation errors
6. Click "Import" to save

**Note:** Maximum 200 rows per import. Ensure product codes are unique.

## Inventory Operations

### Add Inventory Record (If Permitted)
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

### Import Inventory (If Permitted)
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

### Stock Check (If Permitted)
1. Navigate to Inventory → Stock Check
2. Select date range
3. Select products to check
4. Click "Generate Stock Check"
5. Review variance report

## Reports

### View Reports (If Permitted)
1. Navigate to Reports
2. Select report type:
   - Current Stock Levels
   - Stock Movement History
   - Low Stock Alerts
3. Configure filters:
   - Date range
   - Product category
4. Click "Generate Report"
5. Export to CSV

**Note:** Contact your administrator if you need permission to view reports.

## Profile Settings

### Update Profile
1. Navigate to Settings → Profile
2. Update your information:
   - Full Name
   - Email
   - Phone
3. Click "Save Changes"

### Change Password
1. Navigate to Settings → Profile → Change Password
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click "Change Password"

### Notification Preferences
1. Navigate to Settings → Profile → Notifications
2. Configure notifications:
   - Email notifications
   - Stock alerts
   - Report updates
3. Click "Save Preferences"

## Troubleshooting

### Common Issues

**Cannot Access Feature**
- Verify you have the required permission
- Contact your administrator to request access
- Check that you're logged in to the correct branch

**Import Fails**
- Check CSV format matches template
- Verify product codes exist in catalog
- Ensure all required fields are filled
- Review error messages for specific issues

**Data Not Saving**
- Check your internet connection
- Verify all required fields are filled
- Contact your administrator if issue persists

### Getting Help
- Contact your branch manager for permission issues
- Contact your company administrator for account issues
- Check the documentation in `/docs`
- Review import templates in `/docs/import-templates`

## Best Practices

### Data Entry
- Use consistent formatting
- Double-check product codes
- Fill all required fields
- Review data before saving

### Inventory Management
- Perform regular stock checks
- Document notes for unusual movements
- Report variances promptly
- Keep records accurate and up-to-date

### Security
- Keep your password secure
- Log out when not using the system
- Report suspicious activity
- Don't share your credentials

## Appendix

### Permission Checklist
- [ ] Import Products
- [ ] Import Inventory
- [ ] View Reports
- [ ] Manage Settings (typically not available)

Contact your administrator if you need additional permissions.

### Import Templates
- Product Import Template: `/docs/import-templates/product_import_template.csv`
- Inventory Import Template: `/docs/import-templates/inventory_import_template.csv`

### Contact Information
- **Branch Manager:** [Contact info]
- **Company Administrator:** [Contact info]
- **Technical Support:** [Contact info]
