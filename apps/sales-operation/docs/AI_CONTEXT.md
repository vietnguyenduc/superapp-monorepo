# AI Context - Inventory Operation System

## Project Overview

**Project Name:** Inventory Operation System  
**Version:** 2.0  
**Status:** Active Development  
**Last Updated:** 2026-05-03

### Purpose
A comprehensive inventory management system for food and beverage (F&B) businesses, enabling:
- Product catalog management with conversion ratios
- Inventory tracking across multiple stock types (raw materials, processed goods, finished products)
- Sales record tracking and reporting
- Stock check and variance detection
- Multi-branch support with role-based access control

### Technology Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Build Tool:** Vite
- **Package Manager:** npm
- **Deployment:** Vercel (frontend), Supabase (backend)

### Project Structure
```
apps/inventory-operation/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # Business logic & API calls
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── lib/           # External library configurations
│   └── hooks/         # Custom React hooks
├── docs/              # Documentation
├── public/            # Static assets
└── supabase/          # Database migrations & functions
```

## Architecture

### Data Flow
```
UI Components
    ↓
Service Layer (databaseService.ts)
    ↓
Supabase Client
    ↓
Supabase Database (PostgreSQL)
```

### Key Services
- **databaseService.ts:** Main service layer for all database operations
  - Product CRUD operations
  - Inventory record CRUD operations
  - Sales record operations
  - Variance report generation
  - Server-side validation
  - Bulk import/export

### Database Schema
**Tables:**
- `products` - Product catalog with conversion details
- `inventory_records` - Stock tracking records
- `sales_records` - Sales transactions
- `special_outbound_records` - Non-sales stock movements
- `inventory_variance_reports` - Stock check variance reports
- `users` - User accounts with RBAC
- `branches` - Branch/Location management
- `companies` - Multi-tenancy support

### Authentication & Authorization
- **Provider:** Supabase Auth
- **Roles:** admin, branch_manager, staff
- **Permissions:** Role-based access control (RBAC)
- **Security:** Row-Level Security (RLS) policies on all tables

## Critical Rules for AI Agents

### 1. Code Quality Standards
- **TypeScript Strict Mode:** All code must be type-safe
- **No `any` Types:** Use proper TypeScript types
- **Error Handling:** All async operations must have try-catch
- **Null Safety:** Always check for null/undefined before accessing properties

### 2. Database Operations
- **Server-Side Validation:** Never trust client-side validation alone
- **Duplicate Checks:** Always check for duplicates before insert
- **Foreign Key Validation:** Validate references before creating dependent records
- **Transaction Safety:** Use database transactions for multi-table operations
- **Bulk Operations:** Maximum 200 rows per bulk operation (MAX_BULK_ROWS)

### 3. Data Integrity Rules
- **Product Codes:** Must be unique (businessCode field)
- **Inventory Records:** Unique combination of (productCode + date)
- **Foreign Keys:** inventory_records.productCode must exist in products.businessCode
- **Quantities:** All stock quantities must be non-negative numbers
- **Dates:** All dates must be valid Date objects or ISO strings

### 4. Import/Export Standards
- **CSV Format:** Use UTF-8 encoding
- **Validation:** Validate all data before import
- **Error Handling:** Reject entire batch if any row fails validation
- **Templates:** Provide downloadable templates for users
- **Export:** Support CSV export for all major entities

### 5. UI/UX Patterns
- **Loading States:** Show loading indicators during async operations
- **Error Messages:** Display clear, actionable error messages
- **Form Validation:** Real-time validation with visual feedback
- **Responsive Design:** Mobile-first approach using Tailwind
- **Accessibility:** Use semantic HTML and ARIA labels

### 6. Security Best Practices
- **RLS Policies:** All tables must have RLS policies
- **Permission Checks:** Verify user permissions before allowing actions
- **Audit Logging:** Log all critical operations
- **Input Sanitization:** Never trust user input without validation
- **Secret Management:** Never commit secrets to git

### 7. Testing Requirements
- **Unit Tests:** Test all service methods independently
- **Integration Tests:** Test database operations with real Supabase
- **E2E Tests:** Test critical user flows
- **Manual Testing:** Required for all new features before deployment

### 8. Documentation Standards
- **Code Comments:** Comment complex logic and business rules
- **API Documentation:** Document all service methods
- **Type Definitions:** Document all custom types
- **Change Log:** Update documentation for all breaking changes

## Anti-Patterns to Avoid

### 1. Hardcoded Data
❌ **Don't:** Hardcode transaction types, product categories, or other reference data
✅ **Do:** Load from database with proper fallback handling

### 2. Dual Data Sources
❌ **Don't:** Use different data sources for the same display logic
✅ **Do:** Use single source of truth with proper caching

### 3. Client-Side Only Validation
❌ **Don't:** Rely only on client-side validation
✅ **Do:** Always validate server-side before database operations

### 4. Race Conditions
❌ **Don't:** Load data at function start and use later without re-checking
✅ **Do:** Check for duplicates at the moment of insert/update

### 5. Silent Failures
❌ **Don't:** Catch errors and do nothing
✅ **Do:** Log errors and provide user feedback

## Current Implementation Status

### ✅ Completed Features
- Phase 1: Infrastructure & Database Setup (IMPLEMENTED)
  - Migrations created: app_permissions column, multi-tenancy, RLS policies, seed data
  - Supabase client configured for shared project (peslmsctejmvkwzyohke)
  - Database types created for inventory + shared tables
  - Real Supabase client wired up (removed mock fallback)

### 🔄 In Progress
- Phase 2: Authentication & Authorization
  - useAuth hook implemented with app_permissions checks
  - RBAC utilities exist but need alignment with cashflow patterns
  - Trial mode implemented

### ⏳ Planned
- Phase 3: Data Entry & Validation (UI code exists but needs server-side validation enforcement)
- Phase 4: Documentation System
- Phase 5: Backup & Restore
- Phase 6: Advanced Reporting
- Phase 7: Multi-branch Enhancements

## Key Technical Decisions

### 1. Supabase as Backend (Shared Project)
- **Project:** peslmsctejmvkwzyohke (shared with cashflow app)
- **Rationale:** Single source of truth for users, companies, branches across apps
- **Trade-offs:** Tighter coupling vs. unified user management
- **Decision:** Share project with app_permissions JSONB gating access per app
- **Status:** ✅ Environment configured, migrations ready for execution

### 2. TypeScript Strict Mode
- **Rationale:** Catch errors at compile time
- **Trade-offs:** Slower initial development vs. long-term stability
- **Decision:** Enforce strict typing for production quality

### 3. Server-Side Validation
- **Rationale:** Prevent data corruption and security issues
- **Trade-offs:** More complex code vs. data integrity
- **Decision:** Always validate server-side, client-side is UX only

### 4. Row-Level Security (RLS)
- **Rationale:** Database-level security is most robust
- **Trade-offs:** More complex queries vs. security guarantees
- **Decision:** Use RLS for all tables with user data

### 5. Bulk Import Limit (200 rows)
- **Rationale:** Prevent performance issues and timeouts
- **Trade-offs:** User inconvenience vs. system stability
- **Decision:** Enforce 200-row limit with clear error messages

## Common Tasks

### Adding a New Feature
1. Define TypeScript types in `src/types/`
2. Add service methods in `src/services/databaseService.ts`
3. Create UI component in `src/pages/` or `src/components/`
4. Add server-side validation
5. Test with both valid and invalid data
6. Update documentation

### Fixing a Bug
1. Reproduce the issue
2. Identify root cause
3. Fix with minimal changes
4. Add regression test
5. Update documentation if needed
6. Verify fix doesn't break existing functionality

### Database Schema Changes
1. Create migration in `supabase/migrations/`
2. Test migration on staging
3. Update TypeScript types in `src/types/database.types.ts`
4. Update service layer if needed
5. Deploy to production
6. Monitor for issues

## Contact & Support

- **Project Lead:** [Contact info]
- **Database Admin:** [Contact info]
- **DevOps:** [Contact info]
- **Documentation:** See `/docs` directory

## Session Notes

> **AI agents: append a brief note here after each significant session.**

| Date | Agent | Action | Key Changes |
|------|-------|--------|-------------|
| 2026-05-01 | Multiple | Phase 1 complete | Shared Supabase project, migrations 011-014, real client wired |
| 2026-05-03 | Cascade | Phase 4 docs | Added ADR 001-010, user manuals (admin_master, admin_company, staff), CURRENT_STATE.md, PROJECT_RULES.md, DATA_FLOW_MAP.md |
| 2026-05-03 | Cascade | Phase 5 docs | Added BACKUP_RESTORE_PROCEDURES.md (adapted from cashflow) |
| 2026-05-03 | Cascade | Phase 7 docs | Added CODEBASE_OPTIMIZATION.md (ESLint/Prettier config, TS strict, caching, pagination, lazy loading, RLS audit, security headers) |
| 2026-05-04 | Cascade | Phase 9 docs | Added DEPLOYMENT_CHECKLIST.md (pre-deploy checklist, DB migration, Vercel deploy, post-deploy smoke tests, rollback plan) |

## Version History

- **2.0** (2026-05-01): Phase 1 Infrastructure complete - Shared Supabase project configured, migrations created, real client wired, database types added
- **1.0** (2026-03-15): Initial MVP release
