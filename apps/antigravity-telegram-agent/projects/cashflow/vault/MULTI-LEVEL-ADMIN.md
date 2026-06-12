# Multi-Level Admin System

> **Merged from:** `multi-level-admin-architecture.md`, `multi-level-admin-spec.md`, `multi-level-admin-flows.md`, `multi-level-admin-ui-ux.md`, `multi-level-admin-database.md`

> **Implementation Note:** `audit_logs` was implemented as `backup_history` table.

## Overview

Hierarchical permission system with three tiers:
- **Admin Master (Owner)** — system-wide access
- **Admin Company** — company-scoped access
- **Staff** — limited, granular permissions

Public registration is disabled. Only Admin Master can create accounts.

## Role Hierarchy

```
Admin Master (Owner)
    +-- Admin Company
    ¦   +-- Staff
    +-- Staff
```

## Capabilities by Role

| Capability | Admin Master | Admin Company | Staff |
|------------|:-----------:|:-------------:|:-----:|
| Access all companies | ? | ? (own only) | ? (own only) |
| Create companies | ? | ? | ? |
| Create Admin Company | ? | ? | ? |
| Create Staff | ? | ? | ? |
| Assign permissions | ? | ? (own company) | ? |
| Delete users | ? | ? (own company) | ? |
| View all data | ? | ? (own company) | ? (scoped) |
| Manage settings | ? | ? (own company) | ? |

## Architecture Layers

```
Presentation Layer (React)
    ?
Business Logic Layer (Hooks/Context: useAuth, usePermissions, useCompany)
    ?
Service Layer (Supabase Client: Auth, DB Queries, RLS)
    ?
Data Layer (PostgreSQL: users, companies, branches, RLS Policies)
```

## Key Flows

### Admin Master Creates Admin Company
1. Navigate to User Management ? "Create User"
2. Select role: "Admin Company"
3. Fill: email, full_name, company (dropdown)
4. System validates ? creates auth user ? inserts `public.users` record
5. Sends welcome email ? refreshes user list

### Admin Company Creates Staff
1. Select role: "Staff"
2. Assign: company, branch, permissions (JSONB)
3. Granular flags: `import_customers`, `import_transactions`, `view_reports`, etc.

### Staff Uses System
1. Login with credentials
2. Access scoped to assigned `company_id` + `branch_id`
3. Permissions checked via `users.staff_permissions` JSONB

## Database Schema

- `users.role`: `admin_master` | `admin_company` | `staff` | `branch_manager`
- `users.company_id`: FK ? `companies`
- `users.branch_id`: FK ? `branches` (optional)
- `users.staff_permissions`: JSONB (granular flags)
- `users.created_by`: FK ? `users` (who created this account)

## RLS Policies

- Users see only their own profile: `auth.uid()::uuid = id`
- Admin Master: bypass all restrictions
- Admin Company: scoped to `company_id`
- Staff: scoped to `company_id` + `branch_id`

## Profile Page

- View own account details and permissions
- Edit personal info (name, phone, email)
- Cannot change role or permissions (Admin Master only)
