# Multi-Level Admin System Specification

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Draft  
**Author:** Product Manager

## Executive Summary

This specification defines a multi-level admin system that disables public registration and implements a hierarchical permission structure with three admin tiers: Admin Master (Owner), Admin Company, and Staff. The system includes a profile page for users to view their permissions and account details.

## 1. Business Requirements

### 1.1 Core Business Problem
- **Current Issue:** Public registration is enabled, allowing anyone to create accounts
- **Security Risk:** Uncontrolled account creation leads to security vulnerabilities
- **Management Complexity:** Lack of hierarchical admin structure makes multi-company management difficult

### 1.2 Business Objectives
- Restrict account creation to authorized administrators only
- Implement hierarchical permission structure for multi-company support
- Provide clear visibility into user permissions and account details
- Enable scalable admin management across multiple companies

### 1.3 Success Criteria
- Public registration is completely disabled
- Admin Master can create and manage accounts across all companies
- Admin Company can manage accounts within their assigned company only
- Staff accounts have limited permissions based on their role
- Profile page displays accurate user information and permissions
- System maintains security and data integrity

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

```
Admin Master (Owner)
    ├── Admin Company
    │   └── Staff
    └── Staff
```

### 2.2 Admin Master (Owner)

**Definition:** Highest privilege role with system-wide access

**Capabilities:**
- ✅ Access all companies without restrictions
- ✅ Create new companies
- ✅ Create Admin Company accounts
- ✅ Create Staff accounts (unlimited)
- ✅ Assign permissions to any user
- ✅ Modify permissions of any user
- ✅ Delete any user account
- ✅ View all system data across all companies
- ✅ Manage system-wide settings
- ✅ No limitations on any actions

**Scope:** System-wide (all companies, all data)

**Limitations:** None

### 2.3 Admin Company

**Definition:** Company-level admin with restricted scope

**Capabilities:**
- ✅ Access assigned company only
- ✅ Create Staff accounts (maximum 2 per company)
- ✅ Modify Staff accounts within their company
- ✅ Delete Staff accounts within their company
- ✅ Modify Staff permissions within their company
- ✅ View all data within their company
- ✅ Manage company-specific settings
- ❌ Cannot access other companies
- ❌ Cannot create Admin Company accounts
- ❌ Cannot create other Admin Company accounts
- ❌ Cannot delete Admin Company accounts

**Scope:** Single company only

**Limitations:**
- Maximum 2 Staff accounts per company
- Cannot access other companies
- Cannot create other admin accounts

### 2.4 Staff

**Definition:** Regular user with limited operational permissions

**Capabilities:**
- ✅ Access assigned branch within company
- ✅ View customers within their branch
- ✅ Create transactions within their branch
- ✅ View transactions within their branch
- ✅ Import customers (if permission granted)
- ✅ Import transactions (if permission granted)
- ❌ Cannot create user accounts
- ❌ Cannot modify user accounts
- ❌ Cannot delete user accounts
- ❌ Cannot access other branches
- ❌ Cannot access other companies
- ❌ Cannot modify system settings

**Scope:** Single branch within company

**Limitations:**
- Cannot manage users
- Cannot access settings
- Limited to assigned branch

## 3. Functional Requirements

### 3.1 Authentication & Registration

#### FR-1: Disable Public Registration
- **Requirement:** Remove public signup functionality
- **Implementation:**
  - Remove signup page/route
  - Remove signup link from login page
  - Disable Supabase public signup
  - Add server-side validation to prevent signup attempts
- **Priority:** P0 (Critical)

#### FR-2: Admin Master Account Creation
- **Requirement:** Only Admin Master can create new accounts
- **Implementation:**
  - Admin Master must use Supabase Dashboard or API to create accounts
  - No UI for account creation in the application
  - Account creation requires Admin Master authentication
- **Priority:** P0 (Critical)

#### FR-3: Account Creation Workflow
- **Requirement:** Define workflow for Admin Master to create accounts
- **Implementation:**
  1. Admin Master logs in to Supabase Dashboard
  2. Creates new user in auth.users
  3. Inserts user record into database.users with appropriate role
  4. Assigns company_id and branch_id as needed
  5. Sets initial permissions
- **Priority:** P0 (Critical)

### 3.2 Permission Management

#### FR-4: Admin Master Permission Assignment
- **Requirement:** Admin Master can assign any permissions to any user
- **Implementation:**
  - Admin Master can modify user.role field
  - Admin Master can modify user.staff_permissions JSON
  - Admin Master can assign users to any company
  - Admin Master can assign users to any branch
- **Priority:** P0 (Critical)

#### FR-5: Admin Company Permission Assignment
- **Requirement:** Admin Company can assign permissions within their company
- **Implementation:**
  - Admin Company can only modify users with matching company_id
  - Admin Company can only assign staff role
  - Admin Company cannot exceed 2 Staff accounts per company
  - Validation to prevent exceeding Staff account limit
- **Priority:** P0 (Critical)

#### FR-6: Staff Permission Assignment
- **Requirement:** Staff cannot assign permissions
- **Implementation:**
  - Staff role has no permission assignment capabilities
  - UI prevents Staff from accessing user management
- **Priority:** P0 (Critical)

### 3.3 Company & Branch Management

#### FR-7: Multi-Company Support
- **Requirement:** Admin Master can access multiple companies
- **Implementation:**
  - Admin Master queries not filtered by company_id
  - Admin Master can switch between companies in UI
  - Admin Master can create new companies
- **Priority:** P1 (High)

#### FR-8: Company-Level Isolation
- **Requirement:** Admin Company and Staff limited to their company
- **Implementation:**
  - All queries for Admin Company filtered by company_id
  - All queries for Staff filtered by company_id and branch_id
  - RLS policies enforce company-level isolation
- **Priority:** P0 (Critical)

#### FR-9: Staff Account Limit
- **Requirement:** Admin Company limited to 2 Staff accounts
- **Implementation:**
  - Database constraint or validation on user creation
  - UI shows current Staff count and limit
  - Prevents creation of 3rd Staff account
- **Priority:** P0 (Critical)

### 3.4 Profile Page

#### FR-10: Profile Page Access
- **Requirement:** Profile page accessible from top-right icon
- **Implementation:**
  - Add user avatar/icon in top-right corner
  - Click opens Profile page/modal
  - Accessible to all authenticated users
- **Priority:** P1 (High)

#### FR-11: Profile Page Content
- **Requirement:** Display user information and permissions
- **Implementation:**
  - Display user full_name
  - Display user email
  - Display user avatar (if available)
  - Display user role (Admin Master, Admin Company, Staff)
  - Display user company name (if applicable)
  - Display user branch name (if applicable)
  - Display account creation date (created_at)
  - Display list of granted permissions
  - Display staff_permissions JSON (if Staff role)
- **Priority:** P1 (High)

#### FR-12: Profile Page UI
- **Requirement:** Clean, intuitive profile display
- **Implementation:**
  - Card-based layout
  - Clear section headers
  - Visual hierarchy for information
  - Responsive design
  - Dark mode support
- **Priority:** P2 (Medium)

## 4. Database Schema Changes

### 4.1 New Role Values

**Current:**
```typescript
type UserRole = "admin" | "branch_manager" | "staff";
```

**New:**
```typescript
type UserRole = "admin_master" | "admin_company" | "staff";
```

### 4.2 Users Table Changes

**New Fields:**
- `company_id: string | null` - Link to companies table
- `avatar_url: string | null` - User avatar image URL
- `created_by: string | null` - Who created this user (for audit trail)

**Updated Constraints:**
- Add foreign key constraint: `users.company_id → companies.id`
- Add unique constraint: `company_id + role = 'admin_company'` (one admin per company)
- Add check constraint: Staff count per company ≤ 2

### 4.3 Company Admin Junction Table (Optional)

**Purpose:** Track which Admin Master manages which companies

**Schema:**
```sql
CREATE TABLE company_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(admin_id, company_id)
);
```

### 4.4 Staff Limit Enforcement

**Option 1: Database Trigger**
```sql
CREATE TRIGGER enforce_staff_limit
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.role = 'staff')
EXECUTE FUNCTION check_staff_limit();
```

**Option 2: Application Validation**
- Check Staff count before insertion
- Return error if limit exceeded

## 5. API Changes

### 5.1 Authentication Endpoints

**Removed:**
- `POST /auth/signup` - Public signup endpoint

**Modified:**
- `POST /auth/login` - No changes, but signup link removed from UI

### 5.2 User Management Endpoints

**New Endpoints (Admin Master only):**
- `POST /api/users/admin-master` - Create Admin Company account
- `POST /api/users/staff` - Create Staff account
- `PUT /api/users/:id/role` - Change user role
- `PUT /api/users/:id/company` - Assign user to company
- `PUT /api/users/:id/branch` - Assign user to branch
- `DELETE /api/users/:id` - Delete user account

**Modified Endpoints:**
- `GET /api/users` - Filter by company_id for non-Admin Master
- `PUT /api/users/:id` - Permission checks for role changes
- `GET /api/users/:id` - Permission checks for access

### 5.3 Profile Endpoint

**New Endpoint:**
- `GET /api/profile` - Get current user profile with permissions

## 6. UI/UX Requirements

### 6.1 Login Page Changes

**Changes:**
- Remove "Sign up" button/link
- Remove signup route
- Update copy to reflect account creation by admin only
- Add note: "Contact your administrator to create an account"

### 6.2 Profile Page Design

**Layout:**
```
┌─────────────────────────────────────┐
│  Profile                             │
├─────────────────────────────────────┤
│  [Avatar]                            │
│  Full Name                           │
│  Email                               │
│  Role: Admin Master                  │
│  Company: ACME Corp                  │
│  Branch: Headquarters                │
│  Created: January 15, 2026           │
├─────────────────────────────────────┤
│  Permissions                         │
│  • Create users                      │
│  • Modify users                      │
│  • Delete users                      │
│  • View all companies                │
│  • Create companies                 │
│  • Manage settings                   │
└─────────────────────────────────────┘
```

**Components:**
- Avatar display (circular, 100x100px)
- User info card
- Permissions list with icons
- Action buttons (Edit profile, Change password, Logout)

### 6.3 Navigation Changes

**Top-Right Icon:**
- User avatar or initials
- Dropdown menu with:
  - Profile
  - Settings (if admin)
  - Logout
- Click opens Profile page

### 6.4 User Management UI (Admin Only)

**Admin Master View:**
- List all users across all companies
- Filter by company
- Create new user button
- Edit user permissions
- Delete user button
- Company selector for multi-company access

**Admin Company View:**
- List users in their company only
- Create Staff button (disabled if limit reached)
- Edit Staff permissions
- Delete Staff button
- Staff count indicator (e.g., "2/2 Staff accounts used")

## 7. Security Requirements

### 7.1 Authentication Security

**Requirements:**
- All API endpoints require valid JWT token
- JWT token expiration: 1 hour
- Refresh token rotation
- Secure HTTP-only cookies for tokens

### 7.2 Authorization Security

**Requirements:**
- Server-side permission validation on all endpoints
- RLS policies on all database tables
- Role-based access control (RBAC)
- Company-level data isolation
- Branch-level data isolation for Staff

### 7.3 Audit Logging

**Requirements:**
- Log all user creation events
- Log all permission changes
- Log all role changes
- Log all company assignments
- Include timestamp, actor, target, and action

### 7.4 Data Protection

**Requirements:**
- Encrypt sensitive data at rest
- Hash passwords (handled by Supabase)
- Sanitize all user inputs
- Prevent SQL injection
- Prevent XSS attacks

## 8. Technical Requirements

### 8.1 Frontend Requirements

**Technology Stack:**
- React 18+
- TypeScript
- React Router
- Tailwind CSS
- Supabase Auth

**New Components:**
- `Profile.tsx` - Profile page
- `ProfileHeader.tsx` - Profile header with avatar
- `PermissionsList.tsx` - Display user permissions
- `UserManagement.tsx` - User management (admin only)
- `CreateUserModal.tsx` - Create user modal (admin only)

### 8.2 Backend Requirements

**Technology Stack:**
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase RLS
- Edge Functions (if needed)

**Database Changes:**
- Update users table schema
- Add company_admins table (optional)
- Create RLS policies for new roles
- Create triggers for Staff limit enforcement

### 8.3 API Requirements

**Authentication:**
- JWT-based authentication
- Token refresh mechanism
- Session management

**Authorization:**
- Middleware for permission checks
- Role-based access control
- Company-level filtering
- Branch-level filtering

## 9. Implementation Phases

### Phase 1: Database Schema (Week 1)
- Update users table schema
- Add company_id, avatar_url, created_by fields
- Update UserRole type
- Create RLS policies for new roles
- Create triggers for Staff limit
- Test database changes

### Phase 2: Authentication Changes (Week 1-2)
- Disable public signup in Supabase
- Remove signup page/route
- Update login page UI
- Update auth context
- Test authentication flow

### Phase 3: Authorization Logic (Week 2)
- Update RBAC system for new roles
- Add company-level filtering
- Add branch-level filtering
- Implement Staff limit validation
- Test permission checks

### Phase 4: Profile Page (Week 2-3)
- Create Profile component
- Create ProfileHeader component
- Create PermissionsList component
- Add profile route
- Add top-right profile icon
- Test profile page

### Phase 5: User Management UI (Week 3-4)
- CreateUserModal component
- UserManagement component
- Admin Master user management
- Admin Company user management
- Test user creation/management

### Phase 6: Testing & QA (Week 4)
- Unit tests
- Integration tests
- E2E tests
- Security audit
- Performance testing

### Phase 7: Deployment (Week 5)
- Database migration
- Code deployment
- Monitoring setup
- Documentation update
- User training

## 10. Testing Requirements

### 10.1 Unit Tests

**Authentication:**
- Test login with valid credentials
- Test login with invalid credentials
- Test token refresh
- Test session expiration

**Authorization:**
- Test Admin Master permissions
- Test Admin Company permissions
- Test Staff permissions
- Test company isolation
- Test branch isolation
- Test Staff limit enforcement

### 10.2 Integration Tests

**User Management:**
- Test Admin Master creates Admin Company
- Test Admin Master creates Staff
- Test Admin Company creates Staff (under limit)
- Test Admin Company creates Staff (at limit - should fail)
- Test Admin Company cannot create other admins
- Test Staff cannot create users

**Profile Page:**
- Test profile displays correct info
- Test profile displays correct permissions
- Test profile displays for each role

### 10.3 E2E Tests

**User Flows:**
- Admin Master creates Admin Company account
- Admin Company creates Staff account
- Staff views profile
- Admin Master views all users
- Admin Company views company users only

**Security:**
- Test public signup is disabled
- Test unauthorized access attempts
- Test company isolation enforcement
- Test Staff limit enforcement

## 11. Migration Strategy

### 11.1 Data Migration

**Existing Users:**
- Map existing `admin` role to `admin_master`
- Map existing `branch_manager` role to `admin_company`
- Keep existing `staff` role
- Assign company_id based on existing branch_id
- Set created_by to system user ID

**Backward Compatibility:**
- Maintain old role values in database temporarily
- Update application code to use new roles
- Run migration script to update database
- Remove old role values after verification

### 11.2 Rollback Plan

**If Issues Arise:**
- Revert database schema changes
- Restore previous code version
- Re-enable public signup if needed
- Document rollback reasons

## 12. Success Metrics

### 12.1 Functional Metrics
- ✅ Public registration disabled
- ✅ Admin Master can create accounts
- ✅ Admin Company can create Staff (max 2)
- ✅ Company isolation enforced
- ✅ Branch isolation enforced
- ✅ Profile page functional

### 12.2 Security Metrics
- ✅ No unauthorized account creation
- ✅ No cross-company data access
- ✅ No Staff limit violations
- ✅ All permission checks enforced

### 12.3 User Experience Metrics
- ✅ Profile page load time < 1s
- ✅ User management UI intuitive
- ✅ Clear permission visibility
- ✅ No confusion about role capabilities

## 13. Open Questions

1. **Admin Master Creation:** How is the first Admin Master account created? (Manual database insertion?)
2. **Company Assignment:** Should Admin Company be able to self-assign to a company, or must Admin Master assign?
3. **Staff Limit:** Is the 2 Staff limit per company hard-coded or configurable?
4. **Avatar Storage:** Should avatars be stored in Supabase Storage or external CDN?
5. **Audit Retention:** How long should audit logs be retained?

## 14. Appendices

### Appendix A: Role Matrix

| Permission | Admin Master | Admin Company | Staff |
|------------|--------------|---------------|-------|
| Create users | ✅ (all roles) | ✅ (Staff only, max 2) | ❌ |
| Modify users | ✅ (all users) | ✅ (Staff in company) | ❌ |
| Delete users | ✅ (all users) | ✅ (Staff in company) | ❌ |
| View all companies | ✅ | ❌ | ❌ |
| Create companies | ✅ | ❌ | ❌ |
| View company data | ✅ (all) | ✅ (own) | ✅ (own branch) |
| Manage settings | ✅ (system) | ✅ (company) | ❌ |
| Import customers | ✅ | ✅ (if permission) | ✅ (if permission) |
| Import transactions | ✅ | ✅ (if permission) | ✅ (if permission) |

### Appendix B: Database Schema

**Users Table (Updated):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  position TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin_master', 'admin_company', 'staff')),
  company_id UUID REFERENCES companies(id),
  branch_id UUID REFERENCES branches(id),
  staff_permissions JSONB,
  avatar_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policies
CREATE POLICY users_admin_master_all ON users
FOR ALL TO authenticated
USING (role = 'admin_master' OR auth.uid()::uuid = id);

CREATE POLICY users_admin_company_company ON users
FOR ALL TO authenticated
USING (role = 'admin_company' AND company_id IN (
  SELECT company_id FROM users WHERE id = auth.uid()::uuid
));

CREATE POLICY users_staff_own ON users
FOR ALL TO authenticated
USING (role = 'staff' AND id = auth.uid()::uuid);
```

### Appendix C: API Endpoints

**Profile Endpoint:**
```typescript
GET /api/profile
Response: {
  id: string,
  email: string,
  full_name: string,
  avatar_url: string | null,
  role: UserRole,
  company: Company | null,
  branch: Branch | null,
  created_at: string,
  permissions: Permission[],
  staff_permissions: StaffPermissions | null
}
```

**Create User Endpoint (Admin Master):**
```typescript
POST /api/users
Body: {
  email: string,
  full_name: string,
  role: UserRole,
  company_id: string,
  branch_id?: string,
  staff_permissions?: StaffPermissions
}
Response: {
  data: User | null,
  error: string | null
}
```

## 15. Approval

**Product Manager:** _________________ Date: _______  
**Technical Lead:** _________________ Date: _______  
**Security Officer:** _______________ Date: _______  
**Stakeholder:** ___________________ Date: _______

---

**Document History:**
- v1.0 (2026-04-26): Initial specification
