# Admin Master User Manual

## Overview
This manual is for Master Administrators with full system access across all branches and companies.

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Management](#user-management)
3. [System Configuration](#system-configuration)
4. [Branch Management](#branch-management)
5. [Company Management](#company-management)
6. [Reports and Analytics](#reports-and-analytics)
7. [System Monitoring](#system-monitoring)

## Getting Started

### First-Time Login
1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You will be redirected to the Dashboard

### Dashboard Overview
The Dashboard provides:
- Total products across all branches
- Total inventory records
- Recent activity across all companies
- System health status

## User Management

### Create New User
1. Navigate to Settings → Users
2. Click "Add New User"
3. Fill in user details:
   - Email (required)
   - Full Name (required)
   - Role (admin, branch_manager, staff)
   - Branch assignment (for branch_manager and staff)
4. Click "Create User"
5. User will receive an invitation email

### Edit User Permissions
1. Navigate to Settings → Users
2. Select the user to edit
3. Modify role or branch assignment
4. For staff users, toggle granular permissions:
   - Import Products
   - Import Inventory
   - View Reports
   - Manage Settings
5. Click "Save Changes"

### Deactivate User
1. Navigate to Settings → Users
2. Select the user
3. Toggle "Active" status to off
4. Confirm deactivation

**Note:** Deactivated users cannot log in but their data is preserved.

## System Configuration

### Global Settings
1. Navigate to Settings → System Configuration
2. Configure global settings:
   - Default currency
   - Date format
   - Time zone
   - Language preference
3. Click "Save Configuration"

### Backup Settings
1. Navigate to Settings → Backup
2. Configure backup schedule:
   - Daily, weekly, or monthly
   - Retention period
   - Backup location
3. Click "Save Backup Settings"

### Security Settings
1. Navigate to Settings → Security
2. Configure security policies:
   - Password complexity requirements
   - Session timeout
   - MFA requirements
3. Click "Save Security Settings"

## Branch Management

### Create New Branch
1. Navigate to Settings → Branches
2. Click "Add Branch"
3. Fill in branch details:
   - Branch Name (required)
   - Branch Code (required, unique)
   - Address
   - Phone
   - Manager assignment
4. Click "Create Branch"

### Edit Branch
1. Navigate to Settings → Branches
2. Select the branch to edit
3. Modify branch details
4. Click "Save Changes"

### Deactivate Branch
1. Navigate to Settings → Branches
2. Select the branch
3. Toggle "Active" status to off
4. Confirm deactivation

**Note:** Deactivating a branch hides it from all users but preserves data.

## Company Management

### Create New Company
1. Navigate to Settings → Companies
2. Click "Add Company"
3. Fill in company details:
   - Company Name (required)
   - Company Code (required, unique)
   - Tax ID
   - Address
   - Contact Information
4. Click "Create Company"

### Edit Company
1. Navigate to Settings → Companies
2. Select the company to edit
3. Modify company details
4. Click "Save Changes"

### Company Settings
Each company has independent settings:
- Product categories
- Transaction types
- Report templates
- Notification preferences

## Reports and Analytics

### System-Wide Reports
As Master Admin, you can access:
- **All Branches Overview:** Summary across all branches
- **Company Comparison:** Compare company performance
- **User Activity:** Track user logins and actions
- **System Performance:** Monitor system health

### Generate Reports
1. Navigate to Reports
2. Select report type
3. Configure filters (date range, branches, companies)
4. Click "Generate Report"
5. Export to CSV or PDF

### Custom Reports
1. Navigate to Reports → Custom Reports
2. Click "Create Custom Report"
3. Select data sources and metrics
4. Configure visualization
5. Save report for future use

## System Monitoring

### Health Check
1. Navigate to Settings → System Health
2. View system status:
   - Database connectivity
   - API response times
   - Error rates
   - Active users

### Audit Logs
1. Navigate to Settings → Audit Logs
2. Filter by:
   - Date range
   - User
   - Action type
   - Resource
3. Review log entries
4. Export logs for analysis

### Performance Metrics
1. Navigate to Settings → Performance
2. View metrics:
   - Page load times
   - Database query performance
   - API response times
   - Error rates

## Troubleshooting

### Common Issues

**User Cannot Log In**
- Verify user is active
- Check user role assignment
- Reset user password if needed

**Data Not Syncing**
- Check database connectivity
- Verify RLS policies
- Review audit logs for errors

**Slow Performance**
- Check system health metrics
- Review database query performance
- Contact DevOps if needed

### Getting Help
- Check the documentation in `/docs`
- Review ADR documents for architectural decisions
- Contact technical support for critical issues

## Best Practices

### Security
- Use strong, unique passwords
- Enable MFA when available
- Regularly review user access
- Monitor audit logs for suspicious activity

### Data Management
- Regular backups before major changes
- Test backups regularly
- Document configuration changes
- Keep audit trail of important changes

### User Management
- Follow principle of least privilege
- Regularly review user permissions
- Deactivate unused accounts
- Provide training for new users

## Appendix

### Role Definitions
- **Admin:** Full system access
- **Branch Manager:** Branch-level management
- **Staff:** Limited operations based on permissions

### Permission Matrix
| Permission | Admin | Branch Manager | Staff |
|------------|-------|----------------|-------|
| View All Data | ✅ | ❌ | ❌ |
| Manage Users | ✅ | Limited | ❌ |
| Manage Branches | ✅ | ❌ | ❌ |
| Manage Companies | ✅ | ❌ | ❌ |
| Import Products | ✅ | ✅ | Conditional |
| Import Inventory | ✅ | ✅ | Conditional |
| View Reports | ✅ | ✅ | Conditional |
| Manage Settings | ✅ | Limited | ❌ |

### Contact Information
- **Technical Support:** [Contact info]
- **System Admin:** [Contact info]
- **Emergency Contact:** [Contact info]
