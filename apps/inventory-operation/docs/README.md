# Inventory Operation System Documentation

> **Master index for Inventory Operation System app-specific documentation.**
> This app is built alongside the Cashflow Management System in a shared monorepo.

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [CURRENT_STATE.md](./CURRENT_STATE.md) | **Source of truth** — what's implemented, in progress, planned | All |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, tech stack, data flow | Devs, Architects |
| [AI_CONTEXT.md](./AI_CONTEXT.md) | AI agent context, coding rules, anti-patterns | AI Agents |
| [AI_WORKFLOW.md](./AI_WORKFLOW.md) | Multi-agent development workflow (10-agent system) | AI Agents |
| [PROJECT_RULES.md](./PROJECT_RULES.md) | Coding rules specific to inventory app | All |
| [DATA_FLOW_MAP.md](./DATA_FLOW_MAP.md) | Product / inventory / sales data flow & anti-patterns | Devs |
| [CODEBASE_OPTIMIZATION.md](./CODEBASE_OPTIMIZATION.md) | Phase 7 guide: ESLint, Prettier, TS strict, perf, security | Devs |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Phase 9: Pre-deploy, migration, deploy, rollback plan | DevOps |
| [BACKUP_RESTORE_PROCEDURES.md](./BACKUP_RESTORE_PROCEDURES.md) | Database backup & restore procedures (Supabase) | DevOps, Admins |
| [HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md) | Complete handover checklist for new team members | All |
| [USER_GUIDE.md](./USER_GUIDE.md) | End-user guide for inventory operations | End Users |

## Architecture Decision Records (ADR)

| Document | Decision | Status |
|----------|----------|--------|
| [ADR 001 — Shared Supabase Project](./adr/001-shared-supabase.md) | Share Supabase project with cashflow, gate via `app_permissions` | ✅ Accepted |
| [ADR 002 — TypeScript Strict Mode](./adr/002-typescript-strict.md) | Enable strict mode, refactor `any` types gradually | ✅ Accepted |
| [ADR 003 — Server-Side Validation](./adr/003-server-side-validation.md) | All mutations must pass service-layer validation | ✅ Accepted |
| [ADR 004 — RLS Policies](./adr/004-rls-policies.md) | Never use `USING (true)`; direct `auth.uid()` comparison | ✅ Accepted |
| [ADR 005 — Bulk Import Limit (200 rows)](./adr/005-bulk-import-limit.md) | Max 200 rows per bulk operation | ✅ Accepted |
| [ADR 006 — RBAC with Granular Permissions](./adr/006-rbac-granular-permissions.md) | Reuse cashflow hierarchy + inventory-specific `staff_permissions` | ✅ Accepted |
| [ADR 007 — Product Code Uniqueness](./adr/007-product-code-uniqueness.md) | `businessCode` unique per company (service layer → DB constraint) | ✅ Accepted |
| [ADR 008 — Inventory Composite Key](./adr/008-inventory-composite-key.md) | `(productCode + date + branch_id)` unique per record | ✅ Accepted |
| [ADR 009 — CSV-Only Import/Export](./adr/009-csv-only-import.md) | CSV primary; Excel via conversion | ✅ Accepted |
| [ADR 010 — React + Vite Frontend](./adr/010-react-vite-frontend.md) | React 18 + Vite + TypeScript + Tailwind | ✅ Accepted |

## User Manuals (by Role)

| Document | Role | Language |
|----------|------|----------|
| [user_manual_admin_master.md](./user_manual_admin_master.md) | System Admin (`admin_master`) | Vietnamese |
| [user_manual_admin_company.md](./user_manual_admin_company.md) | Company Admin (`admin_company`) | Vietnamese |
| [user_manual_staff.md](./user_manual_staff.md) | Staff (`staff`) | Vietnamese |

## Root Docs (Cross-App)

See [`../../docs/README.md`](../../docs/README.md) for consolidated cross-app documentation.

Key consolidated docs:
- [Architecture](../../docs/ARCHITECTURE.md)
- [Design System](../../docs/DESIGN-SYSTEM.md)
- [Development](../../docs/DEVELOPMENT.md)
- [Database](../../docs/DATABASE.md)
- [Testing](../../docs/TESTING.md)
- [API](../../docs/API.md)
- [Deployment](../../docs/DEPLOYMENT.md)