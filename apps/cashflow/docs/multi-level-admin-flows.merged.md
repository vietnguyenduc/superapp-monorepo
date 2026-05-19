# Multi-Level Admin System - User Flow Documentation

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Draft  
**Author:** Flow Stimulator

## Table of Contents
1. [Overview](#overview)
2. [Admin Master Flows](#admin-master-flows)
3. [Admin Company Flows](#admin-company-flows)
4. [Staff Flows](#staff-flows)
5. [Profile Page Flows](#profile-page-flows)
6. [Authentication Flows](#authentication-flows)
7. [Error Handling Flows](#error-handling-flows)
8. [Edge Cases](#edge-cases)

## Overview

This document describes the user flows for the multi-level admin system, covering all three user roles (Admin Master, Admin Company, Staff) and the new profile page functionality.

## Admin Master Flows

### Flow 1: Admin Master Creates Admin Company Account

**Preconditions:**
- User is logged in as Admin Master
- User has access to Supabase Dashboard or API

**Steps:**
```
1. Admin Master navigates to User Management
   ↓
2. Admin Master clicks "Create User" button
   ↓
3. CreateUserModal opens
   ↓
4. Admin Master selects role: "Admin Company"
   ↓
5. Admin Master fills in required fields:
   - Email: new.admin@company.com
   - Full Name: John Doe
   - Company: Select from dropdown (or create new)
   ↓
6. Admin Master clicks "Create"
   ↓
7. System validates input
   ↓
8. System creates user in auth.users (via Supabase)
   ↓
9. System inserts user record in database.users:
   - role: 'admin_company'
   - company_id: selected company
   - created_by: admin_master.id
   ↓
10. System sends welcome email to new user
   ↓
11. Modal closes with success message
   ↓
12. User list refreshes showing new Admin Company
```

**Success Criteria:**
- User created in auth.users
- User record created in database.users
- Role set to 'admin_company'
- Company assigned correctly
- Created by tracked

**Error Handling:**
- Email already exists → Show error "Email already registered"
- Invalid email format → Show validation error
- Company not selected → Show "Company is required"
- Network error → Show "Failed to create user, please try again"

---

### Flow 2: Admin Master Creates Staff Account

**Preconditions:**
- User is logged in as Admin Master
- Company exists

**Steps:**
```
1. Admin Master navigates to User Management
   ↓
2. Admin Master clicks "Create User" button
   ↓
3. CreateUserModal opens
   ↓
4. Admin Master selects role: "Staff"
   ↓
5. Admin Master fills in required fields:
   - Email: staff@company.com
   - Full Name: Jane Smith
   - Company: Select from dropdown
   - Branch: Select from dropdown (filtered by company)
   - Staff Permissions: Toggle checkboxes
     ✓ import_customers
     ✓ import_transactions
     ✓ view_reports
   ↓
6. Admin Master clicks "Create"
   ↓
7. System validates input
   ↓
8. System creates user in auth.users
   ↓
9. System inserts user record in database.users:
   - role: 'staff'
   - company_id: selected company
   - branch_id: selected branch
   - staff_permissions: {import_customers: true, import_transactions: true, view_reports: true}
   - created_by: admin_master.id
   ↓
10. System sends welcome email to new user
   ↓
11. Modal closes with success message
   ↓
12. User list refreshes showing new Staff
```

**Success Criteria:**
- User created in auth.users
- User record created in database.users
- Role set to 'staff'
- Company and branch assigned correctly
- Staff permissions set correctly

**Error Handling:**
- Email already exists → Show error "Email already registered"
- Branch not selected → Show "Branch is required for Staff role"
- No permissions selected → Show warning "Staff has no permissions"

---

### Flow 3: Admin Master Switches Between Companies

**Preconditions:**
- User is logged in as Admin Master
- User has access to multiple companies

**Steps:**
```
1. Admin Master is viewing Company A data
   ↓
2. Admin Master clicks company selector dropdown
   ↓
3. Dropdown shows all companies:
   - Company A (current)
   - Company B
   - Company C
   ↓
4. Admin Master selects "Company B"
   ↓
5. System updates global company context
   ↓
6. System reloads all data with company_id = Company B
   ↓
7. UI updates to show Company B data
   ↓
8. URL updates to include company_id parameter
   ↓
9. Company selector shows "Company B" as current
```

**Success Criteria:**
- Company context switches instantly
- All data filters by new company
- UI reflects new company data
- URL updated for bookmarking

**Error Handling:**
- Company not accessible → Show error "Cannot access this company"
- Network error → Show "Failed to switch companies, please try again"

---

### Flow 4: Admin Master Views All Users Across Companies

**Preconditions:**
- User is logged in as Admin Master

**Steps:**
```
1. Admin Master navigates to User Management
   ↓
2. System loads all users from database
   ↓
3. User list displays all users with columns:
   - Name
   - Email
   - Role
   - Company
   - Branch
   - Created At
   - Actions
   ↓
4. Admin Master can filter by:
   - Role (Admin Company, Staff)
   - Company
   - Status (Active, Inactive)
   ↓
5. Admin Master can sort by:
   - Name
   - Email
   - Created At
   ↓
6. Admin Master can search by:
   - Name
   - Email
   ↓
7. Admin Master clicks on user row
   ↓
8. User details modal opens
   ↓
9. Admin Master can view:
   - Full user profile
   - Permissions
   - Activity log
   ↓
10. Admin Master can edit or delete user
```

**Success Criteria:**
- All users displayed
- Filters work correctly
- Sort works correctly
- Search works correctly
- User details accessible

**Error Handling:**
- Network error → Show "Failed to load users"
- Permission error → Redirect to login

---

## Admin Company Flows

### Flow 5: Admin Company Creates Staff Account (Under Limit)

**Preconditions:**
- User is logged in as Admin Company
- Company has < 2 Staff accounts

**Steps:**
```
1. Admin Company navigates to User Management
   ↓
2. Admin Company sees Staff count: "1/2 Staff accounts used"
   ↓
3. Admin Company clicks "Create Staff" button
   ↓
4. CreateUserModal opens (pre-selected role: Staff)
   ↓
5. Admin Company fills in required fields:
   - Email: staff2@company.com
   - Full Name: Bob Johnson
   - Branch: Select from dropdown (company branches only)
   - Staff Permissions: Toggle checkboxes
     ✓ import_customers
     ✗ import_transactions
     ✓ view_reports
   ↓
6. Admin Company clicks "Create"
   ↓
7. System validates input
   ↓
8. System checks Staff count: 1 < 2 ✅
   ↓
9. System creates user in auth.users
   ↓
10. System inserts user record in database.users:
    - role: 'staff'
    - company_id: admin_company.company_id
    - branch_id: selected branch
    - staff_permissions: {import_customers: true, import_transactions: false, view_reports: true}
    - created_by: admin_company.id
    ↓
11. System sends welcome email to new user
    ↓
12. Modal closes with success message
    ↓
13. User list refreshes showing new Staff
    ↓
14. Staff count updates: "2/2 Staff accounts used"
```

**Success Criteria:**
- Staff account created
- Staff count updated to 2/2
- "Create Staff" button disabled
- Company and branch assigned correctly
- Permissions set correctly

**Error Handling:**
- Email already exists → Show error "Email already registered"
- Branch not selected → Show "Branch is required"
- Staff limit reached → Show "Cannot create more than 2 Staff accounts"

---

### Flow 6: Admin Company Attempts to Create Staff Account (At Limit)

**Preconditions:**
- User is logged in as Admin Company
- Company already has 2 Staff accounts

**Steps:**
```
1. Admin Company navigates to User Management
   ↓
2. Admin Company sees Staff count: "2/2 Staff accounts used"
   ↓
3. "Create Staff" button is disabled (grayed out)
   ↓
4. Admin Company hovers over disabled button
   ↓
5. Tooltip shows: "Staff limit reached (2/2)"
   ↓
6. Admin Company cannot create more Staff
```

**Success Criteria:**
- Staff count shows 2/2
- Create button disabled
- Tooltip explains limit
- No Staff creation possible

**Error Handling:**
- None (preventative UI)

---

### Flow 7: Admin Company Edits Staff Permissions

**Preconditions:**
- User is logged in as Admin Company
- Staff account exists in same company

**Steps:**
```
1. Admin Company navigates to User Management
   ↓
2. Admin Company sees list of Staff in their company
   ↓
3. Admin Company clicks "Edit" on Staff row
   ↓
4. EditUserModal opens with current Staff data
   ↓
5. Admin Company modifies staff_permissions:
   - Toggle import_customers: false
   - Toggle import_transactions: true
   - Toggle view_reports: true
   ↓
6. Admin Company clicks "Save"
   ↓
7. System validates changes
   ↓
8. System updates user record in database.users:
    - staff_permissions: {import_customers: false, import_transactions: true, view_reports: true}
    - updated_at: NOW()
   ↓
9. Modal closes with success message
   ↓
10. User list refreshes showing updated permissions
```

**Success Criteria:**
- Permissions updated in database
- UI reflects new permissions
- Staff loses/gains access accordingly

**Error Handling:**
- Network error → Show "Failed to update permissions"
- Permission error → Show "You don't have permission to edit this user"

---

### Flow 8: Admin Company Deletes Staff Account

**Preconditions:**
- User is logged in as Admin Company
- Staff account exists in same company

**Steps:**
```
1. Admin Company navigates to User Management
   ↓
2. Admin Company sees list of Staff in their company
   ↓
3. Admin Company clicks "Delete" on Staff row
   ↓
4. Confirmation dialog opens:
   "Are you sure you want to delete this Staff account?
    This action cannot be undone."
   ↓
5. Admin Company clicks "Confirm"
   ↓
6. System deletes user from auth.users
   ↓
7. System soft-deletes user record in database.users:
    - is_active: false
    - updated_at: NOW()
   ↓
8. Staff count updates: "1/2 Staff accounts used"
   ↓
9. "Create Staff" button becomes enabled
   ↓
10. Success message: "Staff account deleted"
```

**Success Criteria:**
- User deleted from auth
- User record soft-deleted in database
- Staff count decremented
- Create button re-enabled

**Error Handling:**
- Network error → Show "Failed to delete user"
- Permission error → Show "You don't have permission to delete this user"

---

### Flow 9: Admin Company Views Company Data Only

**Preconditions:**
- User is logged in as Admin Company
- Company has ID: company_123

**Steps:**
```
1. Admin Company navigates to Dashboard
   ↓
2. System queries data with filter: company_id = company_123
   ↓
3. Dashboard shows company-specific metrics:
   - Total outstanding for company
   - Active customers in company
   - Monthly transactions in company
   ↓
4. Admin Company navigates to Customers
   ↓
5. System queries customers with filter: company_id = company_123
   ↓
6. Customer list shows only company customers
   ↓
7. Admin Company navigates to Transactions
   ↓
8. System queries transactions with filter: company_id = company_123
   ↓
9. Transaction list shows only company transactions
```

**Success Criteria:**
- All data filtered by company_id
- No data from other companies visible
- RLS policies enforce isolation

**Error Handling:**
- Permission error → Redirect to login
- Data access error → Show "Failed to load data"

---

## Staff Flows

### Flow 10: Staff Views Profile

**Preconditions:**
- User is logged in as Staff

**Steps:**
```
1. Staff is on any page
   ↓
2. Staff clicks avatar icon in top-right corner
   ↓
3. Dropdown menu appears:
   - Profile
   - Logout
   ↓
4. Staff clicks "Profile"
   ↓
5. Profile page opens
   ↓
6. Profile displays:
   - Avatar: [User avatar or initials]
   - Name: Jane Smith
   - Email: jane@company.com
   - Role: Staff
   - Company: ACME Corp
   - Branch: Downtown
   - Created: January 15, 2026
   ↓
7. Profile displays permissions:
   Permissions:
   ✓ Import customers
   ✓ Import transactions
   ✗ View reports
   ↓
8. Staff can see but cannot modify profile
```

**Success Criteria:**
- Profile displays all user info
- Permissions clearly shown
- Staff cannot edit profile
- Staff cannot change role

**Error Handling:**
- Network error → Show "Failed to load profile"
- Permission error → Redirect to login

---

### Flow 11: Staff Attempts to Access User Management

**Preconditions:**
- User is logged in as Staff

**Steps:**
```
1. Staff attempts to navigate to /users
   ↓
2. System checks user permissions
   ↓
3. System determines: Staff cannot access user management
   ↓
4. System redirects to /dashboard
   ↓
5. Error message: "You don't have permission to access this page"
```

**Success Criteria:**
- Access denied
- Redirect to dashboard
- Clear error message

**Error Handling:**
- None (expected behavior)

---

### Flow 12: Staff Views Branch Data Only

**Preconditions:**
- User is logged in as Staff
- Staff assigned to branch: branch_456

**Steps:**
```
1. Staff navigates to Dashboard
   ↓
2. System queries data with filters:
   - company_id = staff.company_id
   - branch_id = staff.branch_id
   ↓
3. Dashboard shows branch-specific metrics:
   - Total outstanding for branch
   - Active customers in branch
   - Monthly transactions in branch
   ↓
4. Staff navigates to Customers
   ↓
5. System queries customers with filters:
   - company_id = staff.company_id
   - branch_id = staff.branch_id
   ↓
6. Customer list shows only branch customers
   ↓
7. Staff navigates to Transactions
   ↓
8. System queries transactions with filters:
   - company_id = staff.company_id
   - branch_id = staff.branch_id
   ↓
9. Transaction list shows only branch transactions
```

**Success Criteria:**
- All data filtered by company_id and branch_id
- No data from other branches visible
- No data from other companies visible
- RLS policies enforce isolation

**Error Handling:**
- Permission error → Redirect to login
- Data access error → Show "Failed to load data"

---

## Profile Page Flows

### Flow 13: User Opens Profile from Top-Right Icon

**Preconditions:**
- User is logged in (any role)

**Steps:**
```
1. User is on any page
   ↓
2. User clicks avatar/icon in top-right corner
   ↓
3. Dropdown menu appears:
   - Profile
   - Settings (if admin)
   - Logout
   ↓
4. User clicks "Profile"
   ↓
5. Profile page opens at /profile
   ↓
6. Profile page loads user data
   ↓
7. Profile displays user information
```

**Success Criteria:**
- Dropdown appears on click
- Profile page navigates correctly
- Profile data loads successfully

**Error Handling:**
- Network error → Show "Failed to load profile"
- Permission error → Redirect to login

---

### Flow 14: Admin Master Views Profile

**Preconditions:**
- User is logged in as Admin Master

**Steps:**
```
1. Admin Master opens Profile page
   ↓
2. Profile displays:
   - Avatar: [Admin avatar]
   - Name: John Admin
   - Email: admin@master.com
   - Role: Admin Master (Owner)
   - Company: All Companies
   - Branch: All Branches
   - Created: January 1, 2026
   ↓
3. Profile displays permissions:
   All System Permissions:
   ✓ Create users (all roles)
   ✓ Modify users (all roles)
   ✓ Delete users (all roles)
   ✓ View all companies
   ✓ Create companies
   ✓ Manage system settings
   ✓ Import customers
   ✓ Import transactions
   ✓ View reports
   ↓
4. Profile displays additional info:
   - Total companies managed: 5
   - Total users created: 23
   - Last login: 2 hours ago
```

**Success Criteria:**
- Profile shows Admin Master role
- All permissions displayed
- System-wide access indicators shown
- Statistics displayed

**Error Handling:**
- Network error → Show "Failed to load profile"

---

### Flow 15: Admin Company Views Profile

**Preconditions:**
- User is logged in as Admin Company

**Steps:**
```
1. Admin Company opens Profile page
   ↓
2. Profile displays:
   - Avatar: [Admin avatar]
   - Name: Jane Admin
   - Email: admin@company.com
   - Role: Admin Company
   - Company: ACME Corp
   - Branch: All Branches
   - Created: February 15, 2026
   ↓
3. Profile displays permissions:
   Company Permissions:
   ✓ Create Staff accounts (max 2)
   ✓ Modify Staff accounts
   ✓ Delete Staff accounts
   ✓ View company data
   ✓ Manage company settings
   ✓ Import customers (if permission granted)
   ✓ Import transactions (if permission granted)
   ✓ View reports (if permission granted)
   ↓
4. Profile displays additional info:
   - Staff accounts used: 2/2
   - Total branches managed: 3
   - Last login: 1 day ago
```

**Success Criteria:**
- Profile shows Admin Company role
- Company-specific permissions displayed
- Staff limit shown
- Company scope indicated

**Error Handling:**
- Network error → Show "Failed to load profile"

---

### Flow 16: Staff Views Profile

**Preconditions:**
- User is logged in as Staff

**Steps:**
```
1. Staff opens Profile page
   ↓
2. Profile displays:
   - Avatar: [Staff avatar]
   - Name: Bob Staff
   - Email: staff@company.com
   - Role: Staff
   - Company: ACME Corp
   - Branch: Downtown
   - Created: March 1, 2026
   ↓
3. Profile displays permissions:
   Staff Permissions:
   ✓ Import customers
   ✗ Import transactions
   ✓ View reports
   ✗ Manage settings
   ✗ Create users
   ✗ Modify users
   ✗ Delete users
   ↓
4. Profile displays additional info:
   - Assigned branch: Downtown
   - Last login: 3 hours ago
```

**Success Criteria:**
- Profile shows Staff role
- Granted permissions shown with ✓
- Denied permissions shown with ✗
- Branch assignment shown

**Error Handling:**
- Network error → Show "Failed to load profile"

---

## Authentication Flows

### Flow 17: User Attempts Public Signup (Disabled)

**Preconditions:**
- Public registration is disabled
- User attempts to sign up

**Steps:**
```
1. User navigates to /signup
   ↓
2. System checks if signup is enabled
   ↓
3. System determines: signup is disabled
   ↓
4. System redirects to /login
   ↓
5. Login page shows message:
   "Public registration is disabled.
    Contact your administrator to create an account."
```

**Success Criteria:**
- Signup route redirects to login
- Clear message displayed
- No signup form accessible

**Error Handling:**
- None (expected behavior)

---

### Flow 18: User Logs In Successfully

**Preconditions:**
- User account exists
- User knows credentials

**Steps:**
```
1. User navigates to /login
   ↓
2. User enters email: user@company.com
   ↓
3. User enters password: ********
   ↓
4. User clicks "Sign In"
   ↓
5. System validates credentials
   ↓
6. Supabase Auth authenticates user
   ↓
7. System retrieves user record from database.users
   ↓
8. System stores user role and permissions in context
   ↓
9. System redirects to /dashboard
   ↓
10. Dashboard loads with user-specific data
```

**Success Criteria:**
- User authenticated
- User role loaded
- Permissions loaded
- Redirected to dashboard
- Data filtered by role

**Error Handling:**
- Invalid credentials → Show "Invalid email or password"
- Account inactive → Show "Account is inactive"
- Network error → Show "Failed to login, please try again"

---

### Flow 19: User Logs Out

**Preconditions:**
- User is logged in

**Steps:**
```
1. User clicks avatar/icon in top-right corner
   ↓
2. Dropdown menu appears
   ↓
3. User clicks "Logout"
   ↓
4. System clears user session
   ↓
5. System clears auth context
   ↓
6. System redirects to /login
   ↓
7. Login page displays
```

**Success Criteria:**
- Session cleared
- Context cleared
- Redirected to login
- No data accessible

**Error Handling:**
- Network error → Show "Failed to logout, please try again"

---

## Error Handling Flows

### Flow 20: Permission Denied

**Preconditions:**
- User attempts action without permission

**Steps:**
```
1. User attempts action (e.g., access /users)
   ↓
2. System checks user permissions
   ↓
3. System determines: permission denied
   ↓
4. System shows error message:
   "You don't have permission to access this page"
   ↓
5. System redirects to /dashboard
   ↓
6. Dashboard loads
```

**Success Criteria:**
- Action blocked
- Clear error message
- Redirect to safe page
- No data exposed

**Error Handling:**
- None (expected behavior)

---

### Flow 21: Company Access Denied

**Preconditions:**
- Admin Company attempts to access other company

**Steps:**
```
1. Admin Company tries to access company_id = other_company
   ↓
2. System checks user.company_id vs target company_id
   ↓
3. System determines: company_id mismatch
   ↓
4. System shows error message:
   "You don't have permission to access this company"
   ↓
5. System filters data to user's company only
   ↓
6. UI shows user's company data
```

**Success Criteria:**
- Cross-company access blocked
- Clear error message
- Data filtered to user's company
- No other company data exposed

**Error Handling:**
- None (expected behavior)

---

### Flow 22: Staff Limit Exceeded

**Preconditions:**
- Admin Company attempts to create 3rd Staff account

**Steps:**
```
1. Admin Company clicks "Create Staff"
   ↓
2. System checks current Staff count
   ↓
3. System determines: count = 2, limit = 2
   ↓
4. System shows error message:
   "Cannot create more than 2 Staff accounts.
    Current: 2/2, Limit: 2"
   ↓
5. User creation is blocked
   ↓
6. Modal remains open
```

**Success Criteria:**
- Staff creation blocked
- Clear error message with counts
- User informed of limit
- No Staff created

**Error Handling:**
- None (expected behavior)

---

## Edge Cases

### Edge Case 1: Admin Master Attempts to Delete Own Account

**Steps:**
```
1. Admin Master views own profile
   ↓
2. Admin Master attempts to delete own account
   ↓
3. System checks: user.id === current_user.id
   ↓
4. System blocks deletion
   ↓
5. System shows error:
   "You cannot delete your own account"
```

**Success Criteria:**
- Self-deletion blocked
- Clear error message
- Account remains active

---

### Edge Case 2: Admin Company Attempts to Create Admin Company Account

**Steps:**
```
1. Admin Company clicks "Create User"
   ↓
2. Admin Company selects role: "Admin Company"
   ↓
3. System checks: user.role === 'admin_company'
   ↓
4. System blocks role selection
   ↓
5. System shows error:
   "Admin Company cannot create other Admin Company accounts"
```

**Success Criteria:**
- Admin Company creation blocked
- Role selection disabled for non-Admin Master
- Clear error message

---

### Edge Case 3: Staff Attempts to Modify Own Permissions

**Steps:**
```
1. Staff opens profile page
   ↓
2. Staff attempts to edit permissions
   ↓
3. System checks: user.role === 'staff'
   ↓
4. System blocks permission modification
   ↓
5. Edit button not shown for Staff
```

**Success Criteria:**
- Permission modification blocked
- UI prevents access
- No edit option available

---

### Edge Case 4: User with No Company Assigned

**Steps:**
```
1. Admin Master creates user without company_id
   ↓
2. User attempts to login
   ↓
3. System detects: user.company_id is null
   ↓
4. System shows error:
   "Your account is not assigned to a company.
    Contact your administrator."
   ↓
5. User cannot access dashboard
```

**Success Criteria:**
- Access blocked
- Clear error message
- User informed of missing assignment

---

### Edge Case 5: User with No Branch Assigned (Staff)

**Steps:**
```
1. Admin Master creates Staff without branch_id
   ↓
2. Staff attempts to login
   ↓
3. System detects: user.role === 'staff' and user.branch_id is null
   ↓
4. System shows error:
   "Your account is not assigned to a branch.
    Contact your administrator."
   ↓
5. Staff cannot access dashboard
```

**Success Criteria:**
- Access blocked
- Clear error message
- User informed of missing assignment

---

### Edge Case 6: Concurrent Staff Creation

**Steps:**
```
1. Admin Company A and Admin Company B both create Staff simultaneously
   ↓
2. System checks Staff count for each company independently
   ↓
3. System enforces limit per company (not global)
   ↓
4. Both creations succeed if each company has < 2 Staff
```

**Success Criteria:**
- Concurrent creation handled
- Limit enforced per company
- No race conditions
- Both succeed if limits allow

---

### Edge Case 7: Admin Master with No Companies

**Steps:**
```
1. Admin Master logs in
   ↓
2. System detects: no companies exist
   ↓
3. System shows empty state:
   "No companies found. Create your first company to get started."
   ↓
4. Admin Master can create first company
```

**Success Criteria:**
- Empty state shown
- Clear guidance
- Company creation available
- No errors

---

### Edge Case 8: Profile with Missing Avatar

**Steps:**
```
1. User opens profile page
   ↓
2. System detects: user.avatar_url is null
   ↓
3. System displays initials instead:
   - "John Doe" → "JD"
   - "Jane Smith" → "JS"
   ↓
4. Initials shown in colored circle
```

**Success Criteria:**
- Initials displayed
- Fallback works
- No broken images
- UI remains clean

---

## Summary

This flow documentation covers:
- ✅ Admin Master flows (4 flows)
- ✅ Admin Company flows (5 flows)
- ✅ Staff flows (3 flows)
- ✅ Profile page flows (4 flows)
- ✅ Authentication flows (3 flows)
- ✅ Error handling flows (3 flows)
- ✅ Edge cases (8 cases)

Total: 30 documented flows covering all user interactions in the multi-level admin system.

---

**Next Steps:**
1. UI/UX Designer: Design profile page and updated auth UI
2. Architecture: Design multi-level authorization system and company relationships
3. Database Guardian: Design schema for admin_master, admin_company roles and company relationships
4. Builder: Implement disabled public signup, multi-level auth, and profile page
