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

Start with `docs/SHAREPOINT-PROJECT-HUB.md` for the Project/BA/DA/DE artifact map and
`docs/SHAREPOINT-DATA-DICTIONARY.md` for the current logical data structure.
Target architecture and sample-source findings are in
`docs/SHAREPOINT-INGESTION-ARCHITECTURE.md`. Do not hard-code the reviewed workbook
layouts as the long-term contract; phase B uses versioned forms and mappings.
Current work status and remaining acceptance steps are tracked in
`docs/SHAREPOINT-PILOT-PLAN.md`; update its checklist before reporting completion.
For a restarted session or contributor handoff, read `docs/CURRENT_STATUS.md` for the
latest requirements, data assessment, environment state, blockers, and next actions.
For the customer-viewable app-first flow, two operating paths, capability gaps, and
implementation phases, read `docs/HR-DATA-OPERATING-PLAN.md`.
HR is the system of work: approved SharePoint input feeds canonical HR modules, and
versioned report definitions export that app data to new or managed existing XLSX
destinations on SharePoint.

- `EmployeeDirectory` exposes **Nhập dữ liệu**. The user chooses a local Excel/CSV file
  or signs in to Microsoft and uses a SharePoint link, reviews validation results, then imports only new
  valid employee codes into the current company. Device upload is the default route;
  SharePoint uses the same parser and review flow.
- **Thêm nhân viên** is the file-free path for one record. It validates the employee
  code and core fields, can create a missing department explicitly, and stores position
  catalog references so the directory and organization view stay consistent.
- HR requires Supabase login outside trial mode. Provisioned users may use their full
  email or AppForYou short username. Auth users marked `must_change_password` remain at
  the password setup gate until `supabase.auth.updateUser()` succeeds.
- Trial mode has a tenant-scoped browser-local demo dataset and never sends imported
  sample personal data to Supabase. `OrganizationChart` visualizes unit hierarchy,
  unit owners, positions, members, and manager reporting lines from the same data.
- Microsoft authentication uses MSAL Browser authorization-code flow with PKCE and
  delegated `Files.Read`. Tokens use browser `sessionStorage`; there is no client secret.
- Required build variable: `VITE_MICROSOFT_CLIENT_ID`. AppForYou owns one multitenant
  Entra application and signs work/school users in through the `organizations`
  authority; customer users never create application IDs. Register local, fixed
  preview, and production redirect pages as SPA redirect URIs in Microsoft Entra.
- Parser aliases, row validation, and duplicate handling live in
  `src/services/employeeImportService.ts`. Existing employee codes are skipped rather
  than overwritten. Department names match existing departments; the user can explicitly
  create missing departments during import or leave those employees unassigned.
- No database migration is needed. Inserts continue through `hrService`, include the
  company selected in `CompanyProvider`, and remain subject to Supabase RLS. Employee
  and department reads on this page use that same selected company so `admin_master`
  does not accidentally import into its profile company.
- The phase-A Excel form is `docs/templates/HR_Input_Wizard_v1.xlsx`; generation is
  reproducible through `scripts/generate_hr_input_workbook.py`. The pipeline contract
  uses the stable tables `tbl_hr_employee_profile` and
  `tbl_hr_employment_assignment`, not worksheet coordinates.

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
