# Inventory Operation System — Current State

> **Merged from:** `AI_CONTEXT.md` (Current Implementation Status section)

> **Source of truth for what is implemented, in progress, and planned.**
> Read this before starting any work on the inventory app.

## Implementation Status

### ? Phase 1: Infrastructure & Database Setup

| Item | Status | Notes |
|------|--------|-------|
| Supabase shared project configured | ? Done | Project: peslmsctejmvkwzyohke (shared with cashflow) |
| Migrations: app_permissions JSONB column | ? Done | Migration applied to shared `users` table |
| Migrations: multi-tenancy (company_id, branch_id) | ? Done | `012_inventory_multi_tenancy.sql` |
| Migrations: RLS policies | ? Done | Basic policies on inventory tables |
| Migrations: seed data | ? Done | `014_inventory_seed_data.sql` |
| Database types generated | ? Done | `src/types/database.types.ts` |
| Real Supabase client wired | ? Done | `src/lib/supabase.ts` — removed mock fallback |
| .env.example created | ? Done | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |

### ?? Phase 2: Authentication & Authorization

| Item | Status | Notes |
|------|--------|-------|
| useAuth hook | ? Done | With `app_permissions` checks |
| RBAC utilities (`rbac.ts`) | ? Done | Basic role checks |
| Trial mode | ? Done | Implemented |
| Role/permission alignment with cashflow | ?? In Progress | Need to match cashflow multi-level admin patterns |
| Profile page | ? Done | `ProfilePage.tsx` exists |

### ?? Phase 3: Data Entry & Validation

| Item | Status | Notes |
|------|--------|-------|
| Product catalog pages | ? Done | Multiple implementations: ProductCatalogPage, ProductCatalogPageEnhanced, ProductCatalogPageFull, ProductCatalogPageNew, ProductCatalogPageSimple |
| Product bulk import | ? Done | `ProductBulkImportComplete.tsx` |
| Inventory input page | ? Done | `InventoryInputPage.tsx` |
| Sales record page | ? Done | `SalesReportPage.tsx` |
| Special outbound page | ? Done | `SpecialOutboundPage.tsx` |
| Server-side validation | ?? In Progress | UI validation exists; need backend enforcement |
| Data import settings | ? Done | `DataImportSettingsPage.tsx`, `ImportSettingsPage.tsx` |

### ? Phase 4: Import / Export System

| Item | Status | Notes |
|------|--------|-------|
| Product import (CSV) | ? Done | `ProductImportPage.tsx` |
| Inventory import | ? Done | `InventoryImport.tsx` |
| Inventory export | ? Done | `InventoryExportPage.tsx` |
| Import templates | ? Done | `docs/import-templates/` |
| 200-row bulk limit | ? Done | Enforced in UI |

### ?? Phase 5: Reporting & Dashboard

| Item | Status | Notes |
|------|--------|-------|
| Dashboard page | ? Done | `DashboardPage.tsx`, `DashboardPageEnhanced.tsx` |
| Inventory variance report | ? Done | `InventoryVarianceReportPage.tsx` |
| Stock check print | ?? In Progress | `StockCheckPrintPage.tsx` (stub) |
| Advanced analytics | ? Planned | Phase 6 |

### ? Phase 6: Settings & Configuration

| Item | Status | Notes |
|------|--------|-------|
| Settings page | ?? In Progress | `SettingsPage.tsx` (stub, 257 bytes) |
| Product catalog settings | ? Done | `ProductCatalogSettingsPage.tsx` |
| Company/branch config | ? Planned | Needs multi-level admin UI |
| User management | ? Planned | Align with cashflow RBAC |

### ? Phase 7: Multi-branch Enhancements

| Item | Status | Notes |
|------|--------|-------|
| Branch-scoped inventory | ? Planned | Schema ready; UI pending |
| Branch-scoped sales | ? Planned | Schema ready; UI pending |
| Inter-branch transfer | ? Planned | Not yet designed |

## Known Issues

1. **Duplicate product codes** — No server-side unique constraint on `businessCode`
2. **RLS policies** — Need verification against shared Supabase project conflicts
3. **Settings page stub** — Only 257 bytes, needs full implementation
4. **Stock check print** — Stub page, needs implementation
5. **Inventory report page** — Only 329 bytes, needs implementation

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Shared project:** Same Supabase project as cashflow (`peslmsctejmvkwzyohke`)
- **App gating:** `app_permissions` JSONB on `users` table

## Critical Rules for This App

1. **Max bulk import: 200 rows** — Enforce in UI + service layer
2. **Server-side validation required** — Never rely on client-side alone
3. **RLS on all tables** — Database-level security is mandatory
4. **Product code uniqueness** — `businessCode` must be unique per company
5. **Inventory composite key** — `(productCode + date)` must be unique
6. **Quantities non-negative** — All stock quantities >= 0

## Cross-App Shared Components

| Component | Source | Used By |
|-----------|--------|---------|
| useAuth hook | `apps/cashflow/src/hooks/useAuth.ts` | Both apps |
| RBAC utilities | `apps/cashflow/src/utils/rbac.ts` | Both apps |
| Supabase client | Shared project | Both apps |
| Users table | Shared | Both apps |
| Companies/Branches | Shared | Both apps |