---
app: sales-operation
doc_type: PRD
generated: true
---

# sales-operation — Product Requirements (PRD)

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Problem

Sales orders + POS for F&B (fruit, dry goods, drinks): customers, sales orders, commissions, marketing costs, inventory, and special outbound.

## Goals

- Provide a focused, mobile-friendly UI for day-to-day operations.
- Stay consistent with the Superapp design system and shared auth/RBAC.
- Work online (Supabase cloud) and in trial/offline fallback mode where implemented.

## In scope

- Login
- SignUp
- CompanySelector
- CustomerManagement
- Dashboard
- DashboardEnhanced
- DataImportSettings
- DebugTest
- EditableGridDemo
- ExcelDataDemo
- Help
- ImportSettings
- InventoryBulkImport
- InventoryEntry
- InventoryExport
- InventoryImport
- InventoryInput
- InventoryRecords
- InventoryReport
- InventoryTransactionImport

## Out of scope

- Schema-per-tenant (project uses RLS + `company_id`).
- Backend logic outside `packages/api` / Supabase edge functions.

## User stories

- As an admin, I can switch companies and manage users/roles.
- As a staff user, I can view/create/edit records within my permission scope.
- As a manager, I can export reports and review approval history.

## Non-functional requirements

- Vietnamese-first UI labels; English code/enum names.
- All user-facing errors are friendly and in Vietnamese.
- Responsive: usable on phones and tablets.

