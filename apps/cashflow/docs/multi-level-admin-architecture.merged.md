# Multi-Level Admin System - Architecture Design

**Version:** 1.0  
**Date:** 2026-04-26  
**Status:** Draft  
**Author:** Architect

## Table of Contents
1. [System Overview](#system-overview)
2. [Authorization Architecture](#authorization-architecture)
3. [Company Relationship Model](#company-relationship-model)
4. [Permission System Design](#permission-system-design)
5. [Data Access Patterns](#data-access-patterns)
6. [Security Architecture](#security-architecture)
7. [API Architecture](#api-architecture)
8. [State Management](#state-management)
9. [Migration Strategy](#migration-strategy)

## System Overview

### Architecture Principles

1. **Defense in Depth:** Multiple layers of security (auth, RBAC, RLS)
2. **Principle of Least Privilege:** Users only have access to what they need
3. **Separation of Concerns:** Clear boundaries between auth, authorization, and business logic
4. **Scalability:** Design supports multi-tenant growth
5. **Maintainability:** Clear, documented architecture

### System Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (React Components)                  │
│  - Profile Page                                         │
│  - User Management UI                                   │
│  - Navigation Components                               │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer (React Hooks/Context)             │
│  - useAuth (authentication state)                       │
│  - usePermissions (permission checks)                   │
│  - useCompany (company context)                         │
├─────────────────────────────────────────────────────────┤
│  Service Layer (Supabase Client)                        │
│  - Authentication (Supabase Auth)                       │
│  - Database Queries (Supabase Client)                  │
│  - RLS Enforcement (Database Level)                     │
├─────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL)                                │
│  - users table                                          │
│  - companies table                                      │
│  - branches table                                       │
│  - RLS Policies                                         │
└─────────────────────────────────────────────────────────┘
```

## Authorization Architecture

### Role Hierarchy

```
admin_master (System Owner)
    ├── admin_company (Company Admin)
    │   └── staff (Company Staff)
    └── staff (System Staff)
```

### Permission Matrix

| Permission | Admin Master | Admin Company | Staff |
|------------|--------------|---------------|-------|
| **User Management** |
| Create users (any role) | ✅ | ❌ | ❌ |
| Create users (Staff only) | ✅ | ✅ (max 2) | ❌ |
| Modify users (any role) | ✅ | ✅ (Staff in company) | ❌ |
| Modify users (own profile) | ✅ | ✅ | ✅ |
| Delete users (any role) | ✅ | ✅ (Staff in company) | ❌ |
| Delete users (own account) | ❌ | ❌ | ❌ |
| **Company Management** |
| View all companies | ✅ | ❌ | ❌ |
| Create companies | ✅ | ❌ | ❌ |
| Modify companies | ✅ | ✅ (own company) | ❌ |
| Delete companies | ✅ | ❌ | ❌ |
| Switch companies | ✅ | ❌ | ❌ |
| **Branch Management** |
| View all branches | ✅ | ✅ (in company) | ✅ (own branch) |
| Create branches | ✅ | ✅ (in company) | ❌ |
| Modify branches | ✅ | ✅ (in company) | ❌ |
| Delete branches | ✅ | ✅ (in company) | ❌ |
| **Data Access** |
| View all company data | ✅ | ✅ (own company) | ✅ (own branch) |
| View all system data | ✅ | ❌ | ❌ |
| **Settings** |
| Manage system settings | ✅ | ❌ | ❌ |
| Manage company settings | ✅ | ✅ (own company) | ❌ |
| **Import/Export** |
| Import customers | ✅ | ✅ (if permission) | ✅ (if permission) |
| Import transactions | ✅ | ✅ (if permission) | ✅ (if permission) |
| Export data | ✅ | ✅ (if permission) | ✅ (if permission) |

### Permission Checking Flow

```
User Action
    ↓
Frontend Permission Check (usePermissions)
    ↓
API Request (with JWT)
    ↓
Backend Permission Check (Middleware)
    ↓
Database Query (with RLS)
    ↓
RLS Policy Enforcement
    ↓
Data Returned (or Access Denied)
```

### Permission Check Implementation

**TypeScript Type Definition:**

```typescript
export type UserRole = 'admin_master' | 'admin_company' | 'staff';

export interface Permission {
  resource: string;
  action: string;
  roles: UserRole[];
  companyScope?: boolean;
  branchScope?: boolean;
}

export const PERMISSIONS: Permission[] = [
  // User Management
  {
    resource: 'users',
    action: 'create',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  {
    resource: 'users',
    action: 'create_any_role',
    roles: ['admin_master'],
  },
  {
    resource: 'users',
    action: 'modify',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  {
    resource: 'users',
    action: 'delete',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  
  // Company Management
  {
    resource: 'companies',
    action: 'view_all',
    roles: ['admin_master'],
  },
  {
    resource: 'companies',
    action: 'create',
    roles: ['admin_master'],
  },
  {
    resource: 'companies',
    action: 'modify',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  
  // Branch Management
  {
    resource: 'branches',
    action: 'view_all',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  {
    resource: 'branches',
    action: 'create',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
  
  // Data Access
  {
    resource: 'data',
    action: 'view_all',
    roles: ['admin_master'],
  },
  {
    resource: 'data',
    action: 'view_company',
    roles: ['admin_master', 'admin_company', 'staff'],
    companyScope: true,
    branchScope: true,
  },
  
  // Settings
  {
    resource: 'settings',
    action: 'manage_system',
    roles: ['admin_master'],
  },
  {
    resource: 'settings',
    action: 'manage_company',
    roles: ['admin_master', 'admin_company'],
    companyScope: true,
  },
];
```

**Permission Check Function:**

```typescript
export const hasPermission = (
  userRole: UserRole,
  resource: string,
  action: string,
  userCompanyId?: string | null,
  targetCompanyId?: string | null,
  userBranchId?: string | null,
  targetBranchId?: string | null
): boolean => {
  const permission = PERMISSIONS.find(
    p => p.resource === resource && p.action === action
  );

  if (!permission) return false;

  // Check role
  if (!permission.roles.includes(userRole)) return false;

  // Check company scope
  if (permission.companyScope && userCompanyId && targetCompanyId) {
    if (userRole !== 'admin_master' && userCompanyId !== targetCompanyId) {
      return false;
    }
  }

  // Check branch scope
  if (permission.branchScope && userBranchId && targetBranchId) {
    if (userRole === 'staff' && userBranchId !== targetBranchId) {
      return false;
    }
  }

  return true;
};
```

## Company Relationship Model

### Entity Relationships

```
users (1) ──────── (*) companies
       │                   │
       │ company_id        │
       │                   │
       │         (1) ────── (*) branches
       │                   │
       │         branch_id │
       │                   │
       └───────────────────┘
```

### Data Model

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  position TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin_master', 'admin_company', 'staff')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  staff_permissions JSONB,
  avatar_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_by ON users(created_by);
```

**Companies Table:**
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);
```

**Branches Table:**
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- Indexes
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_branches_manager ON branches(manager_id);
CREATE INDEX idx_branches_active ON branches(is_active);
```

### Company Access Patterns

**Admin Master Access:**
```typescript
// No company filtering
const { data: companies } = await supabase
  .from('companies')
  .select('*');

const { data: users } = await supabase
  .from('users')
  .select('*, companies(*), branches(*)');
```

**Admin Company Access:**
```typescript
// Filter by own company
const { data: users } = await supabase
  .from('users')
  .select('*, companies(*), branches(*)')
  .eq('company_id', currentUser.company_id);

const { data: branches } = await supabase
  .from('branches')
  .select('*')
  .eq('company_id', currentUser.company_id);
```

**Staff Access:**
```typescript
// Filter by company and branch
const { data: customers } = await supabase
  .from('customers')
  .select('*')
  .eq('company_id', currentUser.company_id)
  .eq('branch_id', currentUser.branch_id);

const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('company_id', currentUser.company_id)
  .eq('branch_id', currentUser.branch_id);
```

## Permission System Design

### Staff Permissions Structure

```typescript
export interface StaffPermissions {
  import_customers?: boolean;
  import_transactions?: boolean;
  view_reports?: boolean;
  export_data?: boolean;
  [key: string]: boolean | undefined;
}
```

### Permission Inheritance

```typescript
export const getEffectivePermissions = (
  userRole: UserRole,
  staffPermissions?: StaffPermissions | null
): Permission[] => {
  const basePermissions = PERMISSIONS.filter(p => 
    p.roles.includes(userRole)
  );

  if (userRole === 'staff' && staffPermissions) {
    // Filter base permissions by staff_permissions
    return basePermissions.filter(p => {
      if (p.resource === 'import' && p.action === 'customers') {
        return staffPermissions.import_customers;
      }
      if (p.resource === 'import' && p.action === 'transactions') {
        return staffPermissions.import_transactions;
      }
      if (p.resource === 'reports' && p.action === 'view') {
        return staffPermissions.view_reports;
      }
      return true;
    });
  }

  return basePermissions;
};
```

### Staff Limit Enforcement

**Database Constraint:**

```sql
-- Function to check staff limit
CREATE OR REPLACE FUNCTION check_staff_limit()
RETURNS TRIGGER AS $$
DECLARE
  staff_count INTEGER;
BEGIN
  IF NEW.role = 'staff' THEN
    SELECT COUNT(*) INTO staff_count
    FROM users
    WHERE company_id = NEW.company_id
      AND role = 'staff'
      AND is_active = TRUE;
    
    IF staff_count >= 2 THEN
      RAISE EXCEPTION 'Staff limit reached (max 2 per company)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER enforce_staff_limit
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.role = 'staff' AND NEW.is_active = TRUE)
EXECUTE FUNCTION check_staff_limit();
```

**Application Validation:**

```typescript
export const canCreateStaff = async (
  companyId: string
): Promise<{ canCreate: boolean; currentCount: number; limit: number }> => {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('role', 'staff')
    .eq('is_active', true);

  if (error) {
    return { canCreate: false, currentCount: 0, limit: 2 };
  }

  const currentCount = count || 0;
  const limit = 2;

  return {
    canCreate: currentCount < limit,
    currentCount,
    limit
  };
};
```

## Data Access Patterns

### Query Builders

**Admin Master Query Builder:**

```typescript
export class AdminMasterQueryBuilder {
  static buildUsersQuery() {
    return supabase
      .from('users')
      .select('*, companies(*), branches(*)');
  }

  static buildCompaniesQuery() {
    return supabase
      .from('companies')
      .select('*, branches(*)');
  }

  static buildDataQuery(table: string) {
    return supabase
      .from(table)
      .select('*');
  }
}
```

**Admin Company Query Builder:**

```typescript
export class AdminCompanyQueryBuilder {
  static buildUsersQuery(companyId: string) {
    return supabase
      .from('users')
      .select('*, companies(*), branches(*)')
      .eq('company_id', companyId);
  }

  static buildBranchesQuery(companyId: string) {
    return supabase
      .from('branches')
      .select('*')
      .eq('company_id', companyId);
  }

  static buildDataQuery(table: string, companyId: string) {
    return supabase
      .from(table)
      .select('*')
      .eq('company_id', companyId);
  }
}
```

**Staff Query Builder:**

```typescript
export class StaffQueryBuilder {
  static buildDataQuery(table: string, companyId: string, branchId: string) {
    return supabase
      .from(table)
      .select('*')
      .eq('company_id', companyId)
      .eq('branch_id', branchId);
  }
}
```

### Query Factory

```typescript
export const getQueryBuilder = (user: User) => {
  switch (user.role) {
    case 'admin_master':
      return AdminMasterQueryBuilder;
    case 'admin_company':
      return new AdminCompanyQueryBuilder(user.company_id!);
    case 'staff':
      return new StaffQueryBuilder(user.company_id!, user.branch_id!);
    default:
      throw new Error('Unknown user role');
  }
};
```

## Security Architecture

### Authentication Flow

```
1. User enters credentials
    ↓
2. Supabase Auth validates credentials
    ↓
3. JWT token issued
    ↓
4. User record fetched from database
    ↓
5. Role and permissions loaded
    ↓
6. Company context established
    ↓
7. Session stored in context
```

### Authorization Layers

**Layer 1: Frontend Permission Check**
```typescript
const { hasPermission } = usePermissions();

if (!hasPermission('users', 'create')) {
  return <AccessDenied />;
}
```

**Layer 2: API Middleware**
```typescript
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!hasPermission(user.role, resource, action, user.company_id, req.body.company_id)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
};
```

**Layer 3: RLS Policies**
```sql
-- Admin Master: Full access
CREATE POLICY users_admin_master ON users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_master'
  )
);

-- Admin Company: Company access only
CREATE POLICY users_admin_company ON users
FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE id = auth.uid()::uuid AND role = 'admin_company'
  )
);

-- Staff: Own record only
CREATE POLICY users_staff ON users
FOR ALL TO authenticated
USING (
  id = auth.uid()::uuid AND role = 'staff'
);
```

### Audit Logging

```typescript
export const logAuditEvent = async (
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: any
) => {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    details,
    timestamp: new Date().toISOString(),
  });
};
```

## API Architecture

### Endpoint Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── GET /session
├── /profile
│   └── GET /me
├── /users
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   └── DELETE /:id
├── /companies
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── PUT /:id
└── /branches
    ├── GET /
    ├── POST /
    ├── GET /:id
    └── PUT /:id
```

### Request/Response Patterns

**Standard Response:**

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const errorResponse = (error: string): ApiResponse<null> => ({
  success: false,
  error,
});
```

**Paginated Response:**

```typescript
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### Error Handling

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

export const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return errorResponse(error.message);
  }
  
  if (error instanceof Error) {
    return errorResponse('An unexpected error occurred');
  }
  
  return errorResponse('Unknown error');
};
```

## State Management

### Auth Context

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### Permission Context

```typescript
interface PermissionContextType {
  userRole: UserRole;
  permissions: Permission[];
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean;
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);
```

### Company Context

```typescript
interface CompanyContextType {
  company: Company | null;
  setCompany: (company: Company) => void;
  companies: Company[];
  switchCompany: (companyId: string) => Promise<void>;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
```

## Migration Strategy

### Phase 1: Database Schema Migration

**Step 1: Add new columns to users table**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
```

**Step 2: Update role constraint**
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin_master', 'admin_company', 'staff'));
```

**Step 3: Create indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
```

**Step 4: Create RLS policies**
```sql
-- Drop existing policies
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Create new policies
CREATE POLICY users_admin_master_select ON users
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'admin_master'));

CREATE POLICY users_admin_company_select ON users
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()::uuid AND role = 'admin_company'));

CREATE POLICY users_staff_select ON users
FOR SELECT TO authenticated
USING (id = auth.uid()::uuid AND role = 'staff');

-- Similar policies for INSERT, UPDATE, DELETE
```

### Phase 2: Data Migration

**Step 1: Migrate existing roles**
```sql
UPDATE users SET role = 'admin_master' WHERE role = 'admin';
UPDATE users SET role = 'admin_company' WHERE role = 'branch_manager';
-- Staff role remains the same
```

**Step 2: Assign company_id based on branch_id**
```sql
UPDATE users u
SET company_id = b.company_id
FROM branches b
WHERE u.branch_id = b.id AND u.company_id IS NULL;
```

### Phase 3: Code Migration

**Step 1: Update TypeScript types**
```typescript
// Old
type UserRole = "admin" | "branch_manager" | "staff";

// New
type UserRole = "admin_master" | "admin_company" | "staff";
```

**Step 2: Update permission checks**
```typescript
// Update all permission checks to use new role names
// Update RBAC system to handle company/branch scoping
```

**Step 3: Update UI components**
```typescript
// Update role badges to show new role names
// Update user management to handle company assignment
```

### Phase 4: Rollback Plan

**If migration fails:**
1. Restore database from backup
2. Revert code changes
3. Re-enable old role values
4. Document rollback reasons

**Rollback SQL:**
```sql
UPDATE users SET role = 'admin' WHERE role = 'admin_master';
UPDATE users SET role = 'branch_manager' WHERE role = 'admin_company';
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'branch_manager', 'staff'));
```

## Summary

This architecture design provides:
- ✅ Clear authorization architecture with role hierarchy
- ✅ Company relationship model with proper foreign keys
- ✅ Permission system with granular control
- ✅ Data access patterns for each role
- ✅ Multi-layer security (frontend, API, database)
- ✅ Scalable API architecture
- ✅ State management patterns
- ✅ Migration strategy with rollback plan

---

**Next Steps:**
1. Database Guardian: Design schema for admin_master, admin_company roles and company relationships
2. Builder: Implement disabled public signup, multi-level auth, and profile page
