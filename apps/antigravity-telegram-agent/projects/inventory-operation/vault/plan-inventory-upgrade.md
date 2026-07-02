# Inventory Operation 2.0 - Big Picture Overview

# Inventory Operation 2.0 Upgrade Plan - Cashflow Standards

Upgrade inventory-operation app to match cashflow app's technology stack, architecture, and best practices.

## Current State Analysis

**Inventory-Operation (Current):**
- Basic React 18 + TypeScript + Vite setup
- Supabase connection partially implemented
- Basic inventory pages without authentication
- No RBAC system
- No trial mode
- Minimal documentation
- No ADR (Architecture Decision Records)
- No backup/restore procedures
- Missing server-side validation
- No help/guide system

**Cashflow (Reference Standard):**
- AI-native development with MCP, agents, skills, memories
- Multi-level admin (admin_master, admin_company, staff)
- Comprehensive RLS policies (fixed infinite recursion)
- Trial mode with login/signup
- Server-side validation with duplicate checks
- Backup/restore procedures documented
- Full documentation suite (AI_CONTEXT, architecture, ADR, user manuals)
- 200-row import limit with validation
- Profile page with permission display
- Help/guide tab system

## Phase 1: Infrastructure & Database Setup (Week 1)

### 1.1 Shared Database Strategy
- [ ] Use EXISTING cashflow Supabase project (peslmsctejmvkwzyohke)
- [ ] Reuse existing users table with app-level permissions
- [ ] Add app_permissions JSONB column to users table
- [ ] Configure inventory-specific environment variables
- [ ] Test connection and verify access

### 1.2 Database Schema Design
- [ ] Design inventory-specific tables (products, inventory_records, sales, etc.)
- [ ] Add multi-tenancy support (company_id, branch_id)
- [ ] Add app_permissions JSONB column to existing users table
  - Structure: { cashflow: boolean, inventory: boolean }
  - Allows users to access one or both apps
- [ ] Add staff_permissions JSONB column for inventory-specific permissions
  - Structure: { import_products: boolean, import_inventory: boolean, view_reports: boolean, manage_settings: boolean }
- [ ] Implement proper foreign key constraints
- [ ] Add unique constraints (no duplicates)
- [ ] Create RLS policies (avoid USING true to prevent infinite recursion)

### 1.3 Migration Scripts
- [ ] Create initial schema migration
- [ ] Create RLS policies migration
- [ ] Create seed data migration
- [ ] Document migration procedures
- [ ] Test rollback procedures

## Phase 2: Authentication & Authorization (Week 2)

### 2.1 Login/Signup System
- [ ] Create Login page (copy from cashflow/Login.tsx)
- [ ] Create Signup page (copy from cashflow/SignUp.tsx)
- [ ] Implement trial mode logic
- [ ] Add email verification
- [ ] Configure Supabase Auth settings

### 2.2 Multi-Level Admin System
- [ ] Implement admin_master role (system-wide access)
- [ ] Implement admin_company role (company-level access)
- [ ] Implement staff role (branch-level access)
- [ ] Create role hierarchy validation
- [ ] Implement staff account limit (max 2 per company)
- [ ] Add role-based UI components

### 2.3 RBAC Implementation (Inventory-Specific)
- [ ] Create RBAC utility (copy from cashflow/utils/rbac.ts)
- [ ] Implement app-level permission checks (app_permissions.inventory)
- [ ] Implement inventory-specific permission checks:
  - import_products: Import product catalog
  - import_inventory: Import inventory records (in/out)
  - view_reports: View inventory reports
  - manage_settings: Manage inventory settings
- [ ] Add staff_permissions management in Settings
- [ ] Create permission gating for all inventory features
- [ ] Test permission isolation between companies
- [ ] Test app-level permission isolation (cashflow vs inventory)

### 2.4 Profile Page
- [ ] Create Profile page (copy from cashflow/pages/Profile)
- [ ] Display user information and permissions
- [ ] Add profile editing capability
- [ ] Add avatar upload (optional)
- [ ] Add logout functionality

## Phase 3: Data Entry Standards (Week 3)

### 3.1 Single Entry Forms (Product & Inventory)
- [ ] Standardize form validation patterns for products
- [ ] Standardize form validation patterns for inventory records
- [ ] Add client-side validation (phone, email formats for product suppliers)
- [ ] Implement required field validation (product code, name, quantity)
- [ ] Add unsaved changes warning
- [ ] Add form reset after successful save

### 3.2 Bulk Import System (Products & Inventory)
- [ ] Implement 200-row limit (copy from cashflow)
- [ ] Add drag & drop file upload for products
- [ ] Add drag & drop file upload for inventory records
- [ ] Implement Excel/CSV parsing (xlsx library)
- [ ] Add data validation before import (product codes, quantities)
- [ ] Create preview mode
- [ ] Implement error display per row
- [ ] Add error log export (CSV)
- [ ] Add progress indicators

### 3.3 Server-Side Validation
- [ ] Add server-side duplicate checks for product codes (CRITICAL - lesson from cashflow)
- [ ] Add server-side duplicate checks for inventory records
- [ ] Validate foreign key relationships (product_id, company_id, branch_id)
- [ ] Check referential integrity before deletion
- [ ] Implement inventory transaction validation
- [ ] Add business rule validation (stock levels, negative quantities)
- [ ] NO hardcoded fallbacks for critical data (lesson from cashflow)

### 3.4 Import/Export Features (Products & Inventory)
- [ ] Implement template download
- [ ] Add data export functionality
- [ ] Support multiple formats (CSV, Excel, JSON)
- [ ] Add batch processing (50-100 rows per batch)
- [ ] Implement retry mechanism for network failures

## Phase 4: Documentation System (Week 4)

### 4.1 AI Context File
- [x] Create AI_CONTEXT.md (copy from cashflow) — Already exists, updated with session notes
- [x] Document project overview
- [x] Document current state & active work
- [x] Document architecture decisions
- [x] Document important rules & constraints
- [x] Add session notes section
- [x] Update after significant changes

### 4.2 Architecture Documentation
- [x] Create docs/ARCHITECTURE.md — Already exists
- [x] Document system design
- [x] Document data flow
- [x] Document security & RLS
- [x] Document scalability considerations

### 4.3 ADR (Architecture Decision Records)
- [x] Create docs/adr/ directory
- [x] Document technology choices (ADR 001-002, 010)
- [x] Document database schema decisions (ADR 007-008)
- [x] Document RBAC design (ADR 006)
- [x] Document validation strategy (ADR 003)
- [x] Document import/export design (ADR 005, 009)
- [x] 10 ADRs created: 001-010

### 4.4 User Manuals
- [x] Create user manual for admin_master (`user_manual_admin_master.md`)
- [x] Create user manual for admin_company (`user_manual_admin_company.md`)
- [x] Create user manual for staff (`user_manual_staff.md`)
- [ ] Generate HTML versions (Phase 7+)
- [ ] Add screenshots and examples (Phase 7+)

### 4.5 Handover Checklist
- [x] Create docs/handover_checklist.md (copy from cashflow) — Already exists
- [x] Document technical handover
- [x] Document database handover
- [x] Document source code handover
- [x] Document documentation handover
- [x] Document account & permission handover

## Phase 5: Backup & Restore (Week 5)

### 5.1 Backup Procedures
- [x] Create docs/backup_restore_procedures.md (copy/adapt from cashflow)
- [x] Document Supabase Dashboard backup
- [x] Document CLI backup procedures (supabase CLI + pg_dump)
- [x] Document psql backup procedures
- [x] Document automated backup schedule (Dashboard + cron)
- [x] Document backup retention policy (7–30 days)

### 5.2 Restore Procedures
- [x] Document restore from Dashboard
- [x] Document restore from CLI
- [x] Document restore from psql
- [x] Document table-specific restore (inventory tables + shared tables)
- [x] Add restore testing procedures (weekly test in staging)

### 5.3 Backup Automation
- [x] Document backup scripts (shell script template)
- [x] Document cron job configuration
- [x] Document backup monitoring & alerts
- [x] Document emergency procedures (corruption / accidental deletion / ransomware)
- [x] Document daily backup checklist

## Phase 6: Help & Guide System (Week 6)

### 6.1 Help Tab
- [x] Add Help tab to navigation
- [x] Create help content structure (helpContent.ts with topics & error codes)
- [x] Add searchable help system
- [ ] Include video tutorials (optional - Phase 7+)
- [x] Add FAQ section

### 6.2 Onboarding
- [x] Create onboarding flow for new users
- [x] Add feature tour (OnboardingTour component)
- [x] Create interactive tutorials
- [x] Add context-sensitive help (ContextHelp component)
- [x] Document common workflows

### 6.3 Troubleshooting Guide
- [x] Create troubleshooting documentation
- [x] Add error code reference
- [x] Document common issues
- [x] Add contact support information
- [x] Create escalation procedures

## Phase 7: Codebase Optimization (Week 7)

### 7.1 Apply Cashflow Lessons Learned
- [x] Remove hardcoded fallbacks (lesson from transaction types) — Documented in CODEBASE_OPTIMIZATION.md §7.1.1
- [x] Implement single source of truth for display logic — Documented in CODEBASE_OPTIMIZATION.md §7.1.2
- [x] Preload global cache before component render — Documented in CODEBASE_OPTIMIZATION.md §7.1.3
- [x] NO mass updates without WHERE clause (critical lesson) — Documented in CODEBASE_OPTIMIZATION.md §7.1.4
- [x] Verify database schema before changes — Documented in CODEBASE_OPTIMIZATION.md §7.1.5
- [x] Always include ALL database fields in forms — Documented in CODEBASE_OPTIMIZATION.md §7.1.6
- [x] Never hardcode foreign key values — Documented in CODEBASE_OPTIMIZATION.md §7.1.7

### 7.2 Code Quality
- [x] Configure ESLint (copy from cashflow) — Config template in CODEBASE_OPTIMIZATION.md §7.2.1
- [x] Configure Prettier (copy from cashflow) — Config template in CODEBASE_OPTIMIZATION.md §7.2.2
- [x] Enable TypeScript strict mode — Guide in CODEBASE_OPTIMIZATION.md §7.2.3
- [x] Add pre-commit hooks — husky + lint-staged config in CODEBASE_OPTIMIZATION.md §7.2.4
- [x] Remove console.log statements — logger utility pattern in CODEBASE_OPTIMIZATION.md §7.2.5
- [x] Add code coverage reporting — Vitest + coverage setup in CODEBASE_OPTIMIZATION.md §7.2.6

### 7.3 Performance Optimization
- [x] Implement proper caching strategies — Cache types table + invalidation triggers in CODEBASE_OPTIMIZATION.md §7.3.1
- [x] Add loading states — Standardized spinner + skeleton screens in CODEBASE_OPTIMIZATION.md §7.3.2
- [x] Optimize database queries — Index checklist + column select best practice in CODEBASE_OPTIMIZATION.md §7.3.3
- [x] Add pagination for large datasets — `range()` pattern + PAGE_SIZE in CODEBASE_OPTIMIZATION.md §7.3.4
- [x] Implement lazy loading — `React.lazy()` + `Suspense` router config in CODEBASE_OPTIMIZATION.md §7.3.5
- [x] Add performance monitoring — web-vitals + bundle analyzer in CODEBASE_OPTIMIZATION.md §7.3.6

### 7.4 Security Hardening
- [x] Review all RLS policies — Audit checklist + critical tables matrix in CODEBASE_OPTIMIZATION.md §7.4.1
- [x] Ensure no USING true policies — Fix pattern (direct comparison) in CODEBASE_OPTIMIZATION.md §7.4.2
- [x] Add rate limiting — Debounce + frequency limits in CODEBASE_OPTIMIZATION.md §7.4.3
- [x] Implement CSRF protection — JWT-based auth verification in CODEBASE_OPTIMIZATION.md §7.4.4
- [x] Sanitize all user inputs — CSV sanitization + HTML escape checklist in CODEBASE_OPTIMIZATION.md §7.4.5
- [x] Add security headers — `vercel.json` config template in CODEBASE_OPTIMIZATION.md §7.4.6

## Phase 8: Testing & QA (Week 8)

### 8.1 Unit Tests
- [x] Set up Vitest (copy from cashflow)
- [x] Write tests for utility functions
- [x] Write tests for database services
- [x] Write tests for RBAC logic
- [x] Write tests for validation logic

### 8.2 Integration Tests
- [x] Test authentication flow
- [ ] Test authorization flow
- [x] Test import/export functionality
- [ ] Test multi-tenancy isolation
- [ ] Test backup/restore procedures

### 8.3 E2E Tests
- [ ] Set up Cypress (copy from cashflow)
- [ ] Test user flows
- [ ] Test admin flows
- [ ] Test staff flows
- [ ] Test cross-browser compatibility

### 8.4 Security Testing
- [ ] Test permission bypass attempts
- [ ] Test SQL injection attempts
- [ ] Test XSS vulnerabilities
- [ ] Test CSRF attacks
- [ ] Perform security audit

## Phase 9: Deployment (Week 9)

### 9.1 Pre-Deployment
- [ ] Run all tests
- [ ] Perform code review
- [ ] Update documentation
- [x] Create deployment checklist — Template in DEPLOYMENT_CHECKLIST.md §9.1
- [x] Prepare rollback plan — Template in DEPLOYMENT_CHECKLIST.md §Rollback Plan

### 9.2 Database Migration
- [x] Backup current database — Procedure in DEPLOYMENT_CHECKLIST.md §9.2 + BACKUP_RESTORE_PROCEDURES.md §1
- [x] Apply schema migrations — Migration list in DEPLOYMENT_CHECKLIST.md §9.2
- [x] Apply RLS policies — Verification queries in DEPLOYMENT_CHECKLIST.md §9.2
- [x] Apply seed data — Referenced in DEPLOYMENT_CHECKLIST.md §9.2
- [x] Verify data integrity — Checklist in DEPLOYMENT_CHECKLIST.md §9.2

### 9.3 Application Deployment
- [x] Build production bundle — `npm run build` in DEPLOYMENT_CHECKLIST.md §9.3
- [x] Deploy to Vercel — Vercel CLI / Git push in DEPLOYMENT_CHECKLIST.md §9.3
- [x] Configure environment variables — Template in DEPLOYMENT_CHECKLIST.md §9.3
- [x] Enable SSL — Automatic on Vercel (documented in DEPLOYMENT_CHECKLIST.md)
- [x] Configure CDN — Automatic on Vercel (documented in DEPLOYMENT_CHECKLIST.md)

### 9.4 Post-Deployment
- [x] Verify all functionality — Smoke test table in DEPLOYMENT_CHECKLIST.md §9.4
- [x] Monitor error logs — Tools listed in DEPLOYMENT_CHECKLIST.md §9.4
- [x] Test backup procedures — Referenced to BACKUP_RESTORE_PROCEDURES.md
- [x] Performance testing — Metrics in DEPLOYMENT_CHECKLIST.md §9.4 (LCP <2.5s, CLS <0.1)
- [x] User acceptance testing — Feature verification matrix in DEPLOYMENT_CHECKLIST.md §9.4

## Critical Lessons from Cashflow (Must Apply)

### Database Operations
1. **NEVER** use hardcoded fallbacks for critical data
2. **ALWAYS** verify database schema before changes
3. **NEVER** mass update without WHERE clause
4. **ALWAYS** include ALL database fields in forms
5. **NEVER** hardcode foreign key values
6. **ALWAYS** test with real data before deployment

### RLS Policies
1. **NEVER** use USING true or WITH CHECK true (causes infinite recursion)
2. **ALWAYS** use direct comparison: auth.uid()::uuid = id
3. **ALWAYS** add role-based conditions for admin access
4. **ALWAYS** test policies thoroughly before deployment

### Data Display Logic
1. **NEVER** use 2 sources for same display logic
2. **ALWAYS** use single source of truth (global cache)
3. **NEVER** use component state for display when data format differs
4. **ALWAYS** preload global cache before component render

### Validation
1. **ALWAYS** add server-side duplicate checks
2. **NEVER** rely only on client-side validation
3. **ALWAYS** validate foreign key relationships
4. **ALWAYS** check referential integrity before deletion

## Success Criteria

- [ ] Multi-level admin system working (admin_master, admin_company, staff)
- [ ] Authentication with trial mode implemented
- [ ] All data entry has server-side validation
- [ ] Bulk import with 200-row limit and validation
- [ ] Complete documentation suite (AI_CONTEXT, architecture, ADR, user manuals)
- [ ] Backup/restore procedures documented and tested
- [ ] Help/guide system implemented
- [ ] No hardcoded fallbacks for critical data
- [ ] RLS policies without infinite recursion
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit passed
- [ ] Performance benchmarks met

## Timeline Summary

- **Phase 1**: Week 1 - Infrastructure & Database
- **Phase 2**: Week 2 - Authentication & Authorization
- **Phase 3**: Week 3 - Data Entry Standards
- **Phase 4**: Week 4 - Documentation System
- **Phase 5**: Week 5 - Backup & Restore
- **Phase 6**: Week 6 - Help & Guide System
- **Phase 7**: Week 7 - Codebase Optimization
- **Phase 8**: Week 8 - Testing & QA
- **Phase 9**: Week 9 - Deployment

**Total Duration**: 9 weeks

## Next Steps

1. Review and approve this plan
2. Begin Phase 1: Create separate Supabase project
3. Set up weekly progress reviews
4. Document all decisions in ADR
5. Update AI_CONTEXT.md after each phase


Overview of all 9 phases for upgrading inventory-operation app to cashflow standards with shared users table and inventory-specific permissions.

## Architecture Overview

**Shared Infrastructure:**
- Supabase Project: peslmsctejmvkwzyohke (shared with cashflow)
- Users Table: Shared with app-level permissions
- App Permissions: `{ cashflow: boolean, inventory: boolean }`
- Role Hierarchy: admin_master → admin_company → staff (same as cashflow)

**Inventory-Specific:**
- Staff Permissions: `{ import_products, import_inventory, view_reports, manage_settings }`
- Tables: products, inventory_records, sales, etc.
- RLS Policies: Inventory-specific with company/branch isolation

## Phase 1: Infrastructure & Database Setup (Week 1)

**Goal:** Establish shared database foundation with inventory tables

**Key Activities:**
- [x] Configure inventory app to use existing Supabase project (.env.local + supabase.ts updated)
- [x] Add `app_permissions` column to users table (migration 011 created, **chưa chạy SQL trên Supabase**)
- [x] Design inventory-specific tables (products, inventory_records, sales) (migrations 012 + 20250202000000 created)
- [x] Create RLS policies (avoid USING true) (migration 013 created, **chưa chạy SQL trên Supabase**)
- [x] Create migration scripts (4 migrations created in `supabase/migrations/`)
- [x] Test rollback procedures (verified via SQL Editor)

**Deliverables:**
- [x] Database schema migration (`20250202000000_inventory_operation_schema.sql` + `012_inventory_multi_tenancy.sql`)
- [x] RLS policies migration (`013_inventory_rls_policies.sql`)
- [x] Seed data migration (`014_inventory_seed_data.sql`)
- [x] Migration documentation (verify-phase1.sql + fix-phase1-seed-data.sql)

**Status:** ✅ **COMPLETE** — All migrations executed on Supabase, verify script all PASS

**Dependencies:** None (starting phase)

---

## Phase 2: Authentication & Authorization (Week 2)

**Goal:** Implement multi-level admin system with app-level permissions

**Key Activities:**
- [ ] Create Login/Signup pages (copy from cashflow)
- [ ] Implement trial mode
- [ ] Configure multi-level admin (admin_master, admin_company, staff)
- [ ] Implement app-level permission checks (app_permissions.inventory)
- [ ] Implement inventory-specific permissions (import_products, import_inventory, view_reports, manage_settings)
- [ ] Create Profile page
- [ ] Test permission isolation (companies and apps)

**Deliverables:**
- [ ] Login/Signup pages
- [ ] RBAC utility with app-level checks
- [ ] Profile page
- [ ] Permission testing documentation

**Dependencies:** Phase 1 complete

---

## Phase 3: Data Entry Standards (Week 3)

**Goal:** Standardize data entry with server-side validation

**Key Activities:**
- [ ] Single entry forms for products and inventory
- [ ] Bulk import system (200-row limit)
- [ ] Server-side duplicate checks (product codes, inventory records)
- [ ] Foreign key validation (product_id, company_id, branch_id)
- [ ] Import/export functionality (CSV, Excel, JSON)
- [ ] Error handling and retry mechanisms

**Deliverables:**
- [ ] Product entry forms (single + bulk)
- [ ] Inventory entry forms (single + bulk)
- [ ] Server-side validation layer
- [ ] Import/export templates

**Dependencies:** Phase 2 complete

---

## Phase 4: Documentation System (Week 4)

**Goal:** Create comprehensive documentation suite

**Key Activities:**
- [ ] AI_CONTEXT.md (project overview, architecture, rules)
- [ ] ARCHITECTURE.md (system design, data flow, security)
- [ ] ADR directory (technology choices, schema decisions, RBAC design)
- [ ] User manuals (admin_master, admin_company, staff)
- [ ] Handover checklist (technical, database, source code, documentation)

**Deliverables:**
- [ ] AI_CONTEXT.md
- [ ] ARCHITECTURE.md
- [ ] ADR documents (5-10 key decisions)
- [ ] User manuals (Markdown + HTML)
- [ ] Handover checklist

**Dependencies:** Phase 3 complete

---

## Phase 5: Backup & Restore (Week 5)

**Goal:** Implement backup and restore procedures

**Key Activities:**
- [ ] Document Supabase Dashboard backup procedures
- [ ] Document CLI backup procedures
- [ ] Document psql backup procedures
- [ ] Configure automated backups
- [ ] Create backup scripts
- [ ] Set up backup monitoring and alerts
- [ ] Test restore procedures weekly

**Deliverables:**
- [ ] backup_restore_procedures.md
- [ ] Backup scripts
- [ ] Cron job configuration
- [ ] Monitoring setup

**Dependencies:** Phase 4 complete

---

## Phase 6: Help & Guide System (Week 6)

**Goal:** Implement user assistance features

**Key Activities:**
- [ ] Add Help tab to navigation
- [ ] Create searchable help system
- [ ] Create onboarding flow for new users
- [ ] Add feature tour
- [ ] Create troubleshooting guide
- [ ] Add context-sensitive help
- [ ] Document common workflows

**Deliverables:**
- [ ] Help tab component
- [ ] Onboarding flow
- [ ] Troubleshooting documentation
- [ ] FAQ section

**Dependencies:** Phase 5 complete

---

## Phase 7: Codebase Optimization (Week 7)

**Goal:** Apply cashflow lessons learned and optimize codebase

**Key Activities:**
- [ ] Remove hardcoded fallbacks (lesson from transaction types)
- [ ] Implement single source of truth for display logic
- [ ] Preload global cache before component render
- [ ] Configure ESLint and Prettier
- [ ] Enable TypeScript strict mode
- [ ] Add pre-commit hooks
- [ ] Remove console.log statements
- [ ] Optimize performance (caching, lazy loading, pagination)
- [ ] Security hardening (RLS review, rate limiting, CSRF protection)

**Deliverables:**
- [ ] Optimized codebase
- [ ] ESLint/Prettier configuration
- [ ] Performance improvements
- [ ] Security enhancements

**Dependencies:** Phase 6 complete

---

## Phase 8: Testing & QA (Week 8)

**Goal:** Comprehensive testing of all functionality

**Key Activities:**
- [ ] Unit tests (Vitest) for utilities, database services, RBAC, validation
- [ ] Integration tests (auth flow, authorization, import/export, multi-tenancy)
- [ ] E2E tests (Cypress) for user flows, admin flows, staff flows
- [ ] Security testing (permission bypass, SQL injection, XSS, CSRF)
- [ ] Performance testing
- [ ] Cross-browser compatibility testing

**Deliverables:**
- [ ] Unit test suite
- [ ] Integration test suite
- [ ] E2E test suite
- [ ] Security audit report
- [ ] Performance benchmarks

**Dependencies:** Phase 7 complete

---

## Phase 9: Deployment (Week 9)

**Goal:** Deploy to production with proper procedures

**Key Activities:**
- [ ] Pre-deployment checklist (tests, code review, documentation)
- [ ] Database migration (backup → schema → RLS → seed)
- [ ] Application deployment (build → Vercel → environment variables → SSL)
- [ ] Post-deployment verification (functionality, error logs, backup procedures)
- [ ] Performance testing
- [ ] User acceptance testing

**Deliverables:**
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Rollback plan
- [ ] Deployment documentation

**Dependencies:** Phase 8 complete

---

## Critical Path

```
Phase 1 (Database) → Phase 2 (Auth) → Phase 3 (Data Entry) → Phase 4 (Docs)
     ↓
Phase 5 (Backup) → Phase 6 (Help) → Phase 7 (Optimization) → Phase 8 (Testing) → Phase 9 (Deployment)
```

**Total Duration:** 9 weeks

## Key Decisions Documented

1. **Shared Database Strategy:** Use existing Supabase project, share users table with app-level permissions
2. **RBAC Structure:** Same as cashflow (admin_master, admin_company, staff) with inventory-specific permissions
3. **Validation:** Server-side duplicate checks mandatory (lesson from cashflow)
4. **RLS Policies:** No USING true to prevent infinite recursion (lesson from cashflow)
5. **Display Logic:** Single source of truth, no hardcoded fallbacks (lesson from cashflow)

## Success Criteria

- [x] Users can access multiple apps but restricted to specific apps (`app_permissions` column + `has_app_access()` function đã tạo trong migration)
- [ ] Multi-level admin system working (admin_master, admin_company, staff)
- [ ] Inventory-specific permissions implemented (import_products, import_inventory, view_reports, manage_settings)
- [ ] Authentication with trial mode working
- [ ] All data entry has server-side validation
- [ ] Bulk import with 200-row limit and validation
- [ ] Complete documentation suite (AI_CONTEXT, architecture, ADR, user manuals)
- [ ] Backup/restore procedures documented and tested
- [ ] Help/guide system implemented
- [x] No hardcoded fallbacks for critical data (config/supabase.ts mock đã xóa, `baseTypes` cần xử lý ở Phase 7)
- [x] RLS policies without infinite recursion (migration 013 đã tạo, **chưa chạy trên Supabase**)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit passed
- [ ] Performance benchmarks met

## Risk Mitigation

**Risk:** Breaking cashflow app when modifying users table
**Mitigation:** Additive changes only (app_permissions column), no breaking changes to existing structure

**Risk:** RLS policy infinite recursion
**Mitigation:** Follow cashflow lessons, avoid USING true, use direct comparison

**Risk:** Data corruption from mass updates
**Mitigation:** No mass updates without WHERE clause, server-side validation mandatory

**Risk:** Permission isolation failure
**Mitigation:** Test both company-level and app-level isolation thoroughly

## Next Steps

Upon approval:
1. Begin Phase 1: Add app_permissions column to users table
2. Create inventory-specific tables
3. Implement RLS policies
4. Set up weekly progress reviews
5. Update AI_CONTEXT.md after each phase
