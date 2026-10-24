---
app: hr-operation
doc_type: AI-CONTEXT
generated: true
---

# hr-operation — AI Context

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## One-line summary

HR & Payroll 3P (Position-Person-Performance): employees, departments, contracts, shifts, attendance, leave, payroll, KPIs.

## Read this first

- `apps/hr-operation/docs/OVERVIEW.md` — what the app does
- `apps/hr-operation/docs/DATA-MODEL.md` — tables and tenant scoping
- `apps/hr-operation/docs/ROLES-PERMISSIONS.md` — who can do what
- `apps/hr-operation/docs/CHANGELOG.md` — recent changes and gotchas

## Common tasks

| Task | Start here |
|------|------------|
| Add a new page | `src/pages/` + route in `App.tsx` |
| Add a new service | `src/services/<feature>Service.ts` |
| Change a DB query | `src/services/<feature>Service.ts` and `supabase/migrations/` |
| Add a permission | `src/types/UserRole.ts` + route/component guards |
| Fix Vietnamese label | `src/i18n/` or hardcoded JSX; update test snapshots |
| Add import/export | `src/services/excelImportService.ts` / `exportService.ts` patterns |

## SharePoint employee import pilot

Target architecture and sample-source findings are in
`docs/SHAREPOINT-INGESTION-ARCHITECTURE.md`. Do not hard-code the reviewed workbook
layouts as the long-term contract; phase B uses versioned forms and mappings.
HR is the system of work: approved SharePoint input feeds canonical HR modules, and
versioned report definitions export that app data to new or managed existing XLSX
destinations on SharePoint.

- `EmployeeDirectory` exposes **Nhập từ SharePoint**. The user signs in to Microsoft,
  pastes a sharing link to an Excel/CSV file, reviews validation results, then imports
  only new valid employee codes into the current company.
- Microsoft authentication uses MSAL Browser authorization-code flow with PKCE and
  delegated `Files.Read`. Tokens use browser `sessionStorage`; there is no client secret.
- Required build variables: `VITE_MICROSOFT_CLIENT_ID` and
  `VITE_MICROSOFT_TENANT_ID`. Register local, fixed preview, and production origins as
  SPA redirect URIs in Microsoft Entra.
- Parser aliases, row validation, and duplicate handling live in
  `src/services/employeeImportService.ts`. Existing employee codes are skipped rather
  than overwritten. Department names match existing departments; an unknown name is
  imported without a department and shown as a warning.
- No database migration is needed. Inserts continue through `hrService`, include the
  company selected in `CompanyProvider`, and remain subject to Supabase RLS. Employee
  and department reads on this page use that same selected company so `admin_master`
  does not accidentally import into its profile company.

## Key gotchas

- `id` columns (`customers`, `transactions`, `bank_accounts`, `branches`, etc.) are `text` containing v4 UUID strings, not `uuid` type.
- Always include `company_id` in mutations. Use `maybeSingle()` for reads that may return zero rows.
- Never store Microsoft passwords or access tokens in Supabase or local configuration.
- Do **not** use `.single()` on RLS-scoped selects unless the row is guaranteed to exist and the user has access.
- Do **not** build schema-per-tenant; this project uses `company_id` + RLS.
- Cashflow sign convention: positive amount = increase, negative = decrease; math factor is `+1` or `-1`. Use `getCustomerBalanceDelta()` rather than `Math.abs()` when deciding whether a transaction reduces debt.

## Useful source files

- `src/pages/AttendancePage`
- `src/pages/EmployeeDirectory`
- `src/pages/HRSettings`
- `src/pages/LeaveManagement`
- `src/pages/Manual/Manual`
- `src/pages/PayrollManagement`
- `src/pages/PerformanceDashboard`
- `src/pages/ShiftManagement`
- `src/services/hrService`

## Tables this app touches

- `attendance_logs`
- `branches`
- `companies`
- `departments`
- `employee_kpis`
- `employee_shifts`
- `employees`
- `hr_settings`
- `key_results`
- `kpi_cycles`
- `leave_requests`
- `objectives`
- `payroll_items`
- `payrolls`
- `positions`
- `shifts`
- `users`
