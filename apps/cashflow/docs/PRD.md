---
app: cashflow
doc_type: PRD
generated: true
---

# cashflow — Product Requirements (PRD)

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Problem

Cash-flow management: customers, transactions, bank accounts, transaction types, branches, reports, and opening balance.

## Goals

- Provide a focused, mobile-friendly UI for day-to-day operations.
- Stay consistent with the Superapp design system and shared auth/RBAC.
- Work online (Supabase cloud) and in trial/offline fallback mode where implemented.

## In scope

- Approvals
- Login
- ResetPassword
- SignUp
- CompanySelector
- CustomerDetail
- CustomerList
- OpeningBalanceExport
- Dashboard
- CustomerImport
- TransactionImport
- Manual
- Profile
- Reports
- Settings
- SettingsContext
- TransactionList

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

