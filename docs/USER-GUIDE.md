# User Guide

## Overview

Welcome to the Debt and Repayment Web Application! This comprehensive guide will help you understand and use all the features available in the system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard](#dashboard)
4. [Customer Management](#customer-management)
5. [Transaction Management](#transaction-management)
6. [Data Import](#data-import)
7. [Reporting and Export](#reporting-and-export)
8. [User Management](#user-management)
9. [Settings and Preferences](#settings-and-preferences)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. **Access the Application**
   - Open your web browser
   - Navigate to the application URL
   - You'll be redirected to the login page

2. **Initial Login**
   - Enter your email address
   - Enter your password
   - Click "Sign In"
   - If this is your first time, you may need to change your password

3. **Complete Profile**
   - Update your profile information
   - Set your preferred language (English or Vietnamese)
   - Configure notification preferences

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet**: Stable internet connection required
- **Screen Resolution**: Minimum 1024x768 (1366x768 recommended)

## Authentication

### Signing In

1. **Navigate to Login Page**
   - Enter your email address in the "Email" field
   - Enter your password in the "Password" field
   - Click the "Sign In" button

2. **Two-Factor Authentication (if enabled)**
   - Enter the verification code sent to your email/phone
   - Click "Verify"

3. **Remember Me**
   - Check "Remember me" to stay signed in for 30 days
   - Uncheck for session-based login

### Password Management

1. **Change Password**
   - Go to User Menu → Profile Settings
   - Click "Change Password"
   - Enter current password
   - Enter new password (minimum 8 characters)
   - Confirm new password
   - Click "Update Password"

2. **Reset Password**
   - On login page, click "Forgot Password?"
   - Enter your email address
   - Check your email for reset link
   - Click the link and set new password

### Signing Out

1. **Manual Sign Out**
   - Click your name in the top-right corner
   - Select "Sign Out"
   - Confirm the action

2. **Automatic Sign Out**
   - System automatically signs you out after 8 hours of inactivity
   - You'll be notified 5 minutes before automatic sign out

## Dashboard

### Overview

The dashboard provides a comprehensive view of your debt and repayment data with real-time updates.

### Key Metrics

1. **Total Outstanding Balance**
   - Shows the total amount owed across all customers
   - Displays percentage change from previous period
   - Color-coded: Green for decrease, Red for increase

2. **Active Customers**
   - Number of customers with outstanding balances
   - Shows trend over time

3. **Monthly Transactions**
   - Total transactions processed this month
   - Comparison with previous month

4. **Total Transactions**
   - All-time transaction count
   - Historical overview

### Balance Breakdown

1. **By Branch**
   - Card view showing balance for each branch
   - Click to view detailed branch information
   - Color-coded by balance amount

2. **By Bank Account**
   - Column chart showing balance distribution
   - Hover for detailed amounts
   - Click to view account details

### Recent Activity

1. **Recent Transactions**
   - Latest 10 transactions
   - Shows customer name, amount, type, and date
   - Click to view full transaction details

2. **Top Customers**
   - Customers with highest outstanding balances
   - Shows balance amount and customer code
   - Click to view customer details

### Time Range Filter

- **Quick Filters**: Today, Week, Month, Quarter, Year
- **Custom Range**: Select specific start and end dates
- **Real-time Updates**: Data refreshes automatically

## Customer Management

### Customer List

1. **Viewing Customers**
   - Navigate to "Customers" in the sidebar
   - View all customers in a sortable table
   - Columns: Code, Name, Phone, Balance, Last Transaction, Status

2. **Sorting**
   - Click column headers to sort
   - Click again to reverse sort order
   - Multiple sort levels supported

3. **Search**
   - Use the search bar to find customers
   - Searches across: Name, Code, Phone, Email
   - Auto-suggestions appear as you type
   - Real-time results

### Customer Filters

1. **Date Range Filter**
   - Filter by last transaction date
   - Quick presets: Today, Week, Month, Quarter, Year
   - Custom date range selection

2. **Status Filter**
   - Active customers only
   - Inactive customers only
   - All customers

3. **Balance Filter**
   - Positive balance only
   - Negative balance only
   - All balances

### Customer Actions

1. **View Customer Details**
   - Click the three-dot menu → "View"
   - See comprehensive customer information
   - View transaction history
   - See balance breakdown

2. **Edit Customer**
   - Click the three-dot menu → "Edit"
   - Update customer information
   - Modify contact details
   - Change status

3. **Delete Customer**
   - Click the three-dot menu → "Delete"
   - Confirm deletion
   - Customer will be marked as inactive

### Adding New Customers

1. **Manual Entry**
   - Click "Add Customer" button
   - Fill in required fields:
     - Customer Code (unique identifier)
     - Full Name
   - Fill in optional fields:
     - Email address
     - Phone number
     - Address
   - Click "Save Customer"

2. **Bulk Import**
   - Use the data import feature
   - Upload Excel/CSV file with customer data
   - Validate and import multiple customers

## Transaction Management

### Viewing Transactions

1. **Transaction List**
   - Navigate to "Transactions" in the sidebar
   - View all transactions in chronological order
   - Columns: Code, Customer, Type, Amount, Date, Status

2. **Transaction Details**
   - Click on any transaction to view details
   - See full transaction information
   - View related customer and account details

### Adding Transactions

1. **Manual Entry**
   - Click "Add Transaction" button
   - Select customer from dropdown
   - Choose transaction type:
     - Payment (reduces balance)
     - Charge (increases balance)
     - Adjustment (modifies balance)
     - Refund (reverses previous transaction)
   - Enter amount
   - Add description (optional)
   - Select bank account
   - Set transaction date
   - Click "Save Transaction"

2. **Bulk Import**
   - Use the data import feature
   - Upload Excel/CSV file with transaction data
   - Validate and import multiple transactions

### Transaction Types

1. **Payment**
   - Customer pays money
   - Reduces outstanding balance
   - Green color coding

2. **Charge**
   - Customer owes money
   - Increases outstanding balance
   - Red color coding

3. **Adjustment**
   - Manual balance adjustment
   - Can be positive or negative
   - Blue color coding

4. **Refund**
   - Reverses a previous transaction
   - Restores previous balance
   - Orange color coding

## Data Import

### Supported Formats

1. **Excel Files (.xlsx, .xls)**
   - Microsoft Excel format
   - Multiple sheets supported
   - Automatic data detection

2. **CSV Files (.csv)**
   - Comma-separated values
   - UTF-8 encoding required
   - Standard format

3. **Google Sheets**
   - Copy and paste data
   - Direct text input
   - Real-time validation

### Import Process

1. **Prepare Your Data**
   - Ensure data is in correct format
   - Include required headers
   - Remove any formatting issues

2. **Upload File**
   - Click "Choose File" or drag and drop
   - Select your file
   - Wait for upload to complete

3. **Preview Data**
   - Review imported data
   - Check for errors (highlighted in red)
   - Verify data accuracy

4. **Map Fields**
   - Match your columns to system fields
   - Set data types (text, number, date)
   - Configure validation rules

5. **Validate Data**
   - System checks for errors
   - Fix any validation issues
   - Confirm data is correct

6. **Import Data**
   - Click "Import" to save data
   - Monitor import progress
   - Review import results

### Data Validation

1. **Required Fields**
   - Customer Code (must be unique)
   - Customer Name (minimum 2 characters)
   - Transaction Amount (positive number)
   - Transaction Date (valid date)

2. **Format Validation**
   - Email addresses (valid format)
   - Phone numbers (numeric only)
   - Dates (YYYY-MM-DD format)
   - Amounts (decimal numbers)

3. **Business Rules**
   - Customer must exist for transactions
   - Bank account must be active
   - Transaction dates cannot be in future
   - Amounts cannot be zero

### Error Handling

1. **Validation Errors**
   - Red highlighting for invalid data
   - Error messages explain issues
   - Click to edit and fix errors

2. **Duplicate Detection**
   - System identifies duplicate records
   - Choose to skip or update existing
   - Merge duplicate customers

3. **Import Results**
   - Summary of successful imports
   - List of failed records
   - Download error report

## Reporting and Export

### Available Reports

1. **Key Metrics Report**
   - Dashboard overview
   - Total outstanding balance
   - Active customer count
   - Transaction summaries
   - Period comparisons

2. **Customer Balance Report**
   - Customer-by-customer breakdown
   - Balance summaries
   - Payment history
   - Aging analysis

3. **Transaction Report**
   - Detailed transaction list
   - Filtered by date range
   - Grouped by type
   - Amount summaries

4. **Cash Flow Report**
   - Inflow vs outflow analysis
   - Net cash flow calculation
   - Time-based trends
   - Branch comparisons

### Generating Reports

1. **Select Report Type**
   - Choose from available reports
   - Read report description
   - Understand data included

2. **Set Filters**
   - Date range selection
   - Branch filtering
   - Customer filtering
   - Transaction type filtering

3. **Configure Options**
   - Include charts and graphs
   - Add summary statistics
   - Choose detail level
   - Set sorting preferences

4. **Preview Report**
   - Review report content
   - Check data accuracy
   - Adjust filters if needed

5. **Export Report**
   - Choose format (Excel or CSV)
   - Set export options
   - Download file

### Export Options

1. **Excel Format (.xlsx)**
   - Multiple sheets
   - Formatted data
   - Charts and graphs
   - Professional appearance

2. **CSV Format (.csv)**
   - Simple text format
   - Compatible with all systems
   - Fast processing
   - Smaller file size

3. **Export Settings**
   - Include headers
   - Add summary sheets
   - Include charts
   - Set date format

### Scheduled Reports

1. **Set Up Automation**
   - Choose report type
   - Set frequency (daily, weekly, monthly)
   - Configure delivery method
   - Set recipients

2. **Email Delivery**
   - Automatic email delivery
   - Custom email templates
   - Multiple recipients
   - File attachments

3. **Manage Schedules**
   - View all scheduled reports
   - Edit existing schedules
   - Pause or resume automation
   - Delete schedules

## User Management

### User Roles

1. **Admin**
   - Full system access
   - User management
   - System configuration
   - All reports and exports

2. **Branch Manager**
   - Branch-specific access
   - Customer management
   - Transaction management
   - Branch reports

3. **Staff**
   - Limited access
   - View customers and transactions
   - Basic reporting
   - No user management

### User Permissions

1. **Customer Management**
   - View customers
   - Add/edit customers
   - Delete customers
   - Import customer data

2. **Transaction Management**
   - View transactions
   - Add transactions
   - Edit transactions
   - Delete transactions

3. **Reporting**
   - Generate reports
   - Export data
   - View analytics
   - Schedule reports

4. **System Administration**
   - User management
   - System settings
   - Data backup
   - Security settings

### Managing Users

1. **Add New User**
   - Go to User Management
   - Click "Add User"
   - Enter user details
   - Assign role and permissions
   - Send invitation email

2. **Edit User**
   - Select user from list
   - Update information
   - Change role or permissions
   - Reset password if needed

3. **Deactivate User**
   - Select user from list
   - Click "Deactivate"
   - Confirm action
   - User loses access immediately

## Settings and Preferences

### Profile Settings

1. **Personal Information**
   - Update name and contact details
   - Change profile picture
   - Set timezone
   - Update language preference

2. **Notification Preferences**
   - Email notifications
   - SMS notifications
   - In-app notifications
   - Notification frequency

3. **Security Settings**
   - Two-factor authentication
   - Password requirements
   - Session timeout
   - Login history

### System Preferences

1. **Display Settings**
   - Theme selection (light/dark)
   - Font size adjustment
   - Color scheme
   - Layout preferences

2. **Data Preferences**
   - Date format (MM/DD/YYYY, DD/MM/YYYY)
   - Currency format
   - Number formatting
   - Time format

3. **Language Settings**
   - Interface language
   - Date and number formatting
   - Currency display
   - Regional settings

### Branch Settings

1. **Branch Information**
   - Branch name and code
   - Contact information
   - Address details
   - Operating hours

2. **Bank Accounts**
   - Account numbers
   - Bank names
   - Account types
   - Balance tracking

3. **Default Values**
   - Default transaction types
   - Default bank accounts
   - Default date ranges
   - Default filters

## Troubleshooting

### Common Issues

1. **Login Problems**
   - **Issue**: Can't sign in
   - **Solution**: Check email and password, reset password if needed
   - **Prevention**: Use strong passwords, enable 2FA

2. **Slow Performance**
   - **Issue**: Application is slow
   - **Solution**: Clear browser cache, check internet connection
   - **Prevention**: Regular browser updates, stable internet

3. **Data Not Loading**
   - **Issue**: Data doesn't appear
   - **Solution**: Refresh page, check filters, contact support
   - **Prevention**: Regular data backups, stable connection

4. **Import Errors**
   - **Issue**: Data import fails
   - **Solution**: Check file format, validate data, fix errors
   - **Prevention**: Use templates, validate before import

### Error Messages

1. **"Invalid credentials"**
   - Check email and password
   - Ensure caps lock is off
   - Try password reset

2. **"Network error"**
   - Check internet connection
   - Try refreshing page
   - Contact IT support

3. **"Permission denied"**
   - Contact administrator
   - Check user role
   - Verify permissions

4. **"Data validation failed"**
   - Review error details
   - Fix data format
   - Re-import data

### Getting Help

1. **In-App Help**
   - Click help icon (?) for context-sensitive help
   - Use tooltips for field explanations
   - Read error messages carefully

2. **Documentation**
   - User guide (this document)
   - Video tutorials
   - FAQ section
   - Best practices guide

3. **Support Contact**
   - Email: support@company.com
   - Phone: +1-800-SUPPORT
   - Live chat: Available during business hours
   - Ticket system: Submit through help portal

### Best Practices

1. **Data Management**
   - Regular data backups
   - Validate data before import
   - Use consistent naming conventions
   - Keep customer information updated

2. **Security**
   - Use strong passwords
   - Enable two-factor authentication
   - Log out when finished
   - Don't share credentials

3. **Performance**
   - Clear browser cache regularly
   - Use appropriate filters
   - Export large datasets in batches
   - Close unused browser tabs

4. **Reporting**
   - Schedule regular reports
   - Use appropriate date ranges
   - Export data regularly
   - Keep report templates updated

---

For additional support, please contact your system administrator or refer to the technical documentation. 