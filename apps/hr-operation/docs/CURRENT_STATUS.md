# HR Operation — current status

Last updated: 2026-10-25
Active workstream: app-first HR data demo, organization model, then SharePoint adapter
Target environment: local first; `viet` preview only at a substantial review milestone

This file is the fast handoff for a restarted session or another contributor. Read it
after `AI-CONTEXT.md`, then use `SHAREPOINT-PILOT-PLAN.md` for the detailed checklist
and `SHAREPOINT-INGESTION-ARCHITECTURE.md` for design decisions. Update this file at
every meaningful checkpoint. Do not put credentials, access tokens, personal employee
rows, or copied production data here.

Role-based Project/BA/DA/DE navigation is in `SHAREPOINT-PROJECT-HUB.md`; proposed
entities and fields are in `SHAREPOINT-DATA-DICTIONARY.md`.
The current two-path operating model and implementation backlog are in
`HR-DATA-OPERATING-PLAN.md`.

## User requirements and accepted decisions

- Work is in a testing phase. Use preview links for user review and minimize production
  work.
- Work and verify locally first. Keep small experiments and documentation checkpoints
  local; batch them into Git only for a substantial change or a useful review milestone.
- Do not apply the prepared Supabase migration or merge `viet` into `main` without a
  separate explicit approval.
- HR is the system of work. Users must be able to review, visualize, and edit data in
  the HR app after ingestion.
- SharePoint is both an inbound source and a future XLSX reporting destination.
- Source workbooks are examples for learning the data, not fixed layouts to hard-code.
  The planned pipeline uses versioned forms and configurable mappings.
- Future output must support creating a new workbook or updating a controlled Excel
  Table/named range in an existing SharePoint workbook.
- The Excel input experience should feel app-like and use strict validation to protect
  data quality.
- Microsoft is an integration connection for SharePoint import/export, not the primary
  HR-app login. Supabase Auth continues to own app identity, company membership, and
  roles. An authorized app user connects their own Microsoft account only when they
  need SharePoint data; the experience should remain a simple connect/reconnect button.
- The pilot uses an interactive, user-delegated Microsoft connection scoped by both
  `company_id` and the current app user. It must never turn Microsoft email/domain into
  HR authorization or silently map a person to a company.
- AppForYou owns one multitenant Entra registration. Customer users sign in through
  the Microsoft `organizations` authority with their own work/school account and never
  create Client IDs or configure the HR app. Delegated Graph access remains limited to
  files their Microsoft account can access.
- A customer's Entra policy can still block third-party user consent. The guaranteed
  no-IT route is first-class local XLSX/CSV upload and XLSX download; Microsoft import
  and export are convenience routes when the tenant permits consent.
- Keep a visible plan, checklist, and current-status handoff so later sessions and
  collaborators can resume without reconstructing context.
- The user approved promoting the checked HR pilot through preview to production.

## Current implementation

- Trial mode now loads a tenant-scoped browser-local dataset with 14 connected demo
  employees, 6 organization units, positions, unit owners, and reporting lines. It
  never sends imported sample personal data to Supabase.
- **Nhập dữ liệu** defaults to device XLSX/CSV upload; SharePoint is a second source
  tab using the same workbook parser, validation preview, and publish action.
- The import review can explicitly create missing departments before publishing rows.
- **Cơ cấu tổ chức** shows unit hierarchy, owners, membership, positions, summary
  coverage, and a searchable reporting-line view on desktop and mobile.
- **Cập nhật phân công** reads the job-title workbook `Database` sheet, compares
  canonical employee codes, reports insert/update/unchanged/conflict counts, and in
  local demo mode applies department, position, fixed salary, and resolvable manager
  relationships. It intentionally does not write assignments to cloud yet.
- Microsoft sign-in uses browser-based MSAL authorization code + PKCE with delegated
  `Files.Read`; no client secret is used by the frontend.
- HR settings now has a Microsoft 365/SharePoint connection card with unconfigured,
  disconnected, reconnect-required, connected, and error states plus explicit
  reconnect/account-change and disconnect actions.
- Pilot connection metadata is kept in browser `sessionStorage` and isolated by both
  current HR app user and selected company. The stored record contains only account
  metadata and scope; MSAL owns the token cache.
- A user can paste a SharePoint file link, inspect workbook sheets, preview parsed
  employee rows and validation issues, then import new valid employees for the selected
  company.
- **Thêm nhân viên** provides a file-free inline flow with required-field,
  duplicate-code, and salary validation. It can select an existing department or create
  a new one and persists the position catalog used by the directory.
- HR now has its own Supabase login gate. A short username such as `duongquach` maps to
  the managed AppForYou login email; provisioned users marked
  `must_change_password` must set a private password before company data renders.
- Employee code normalization preserves leading zeros for display and treats numeric
  equivalents consistently when checking duplicates.
- The employee directory no longer fills an empty backend response with mock people.
- The phase-A workbook is `docs/templates/HR_Input_Wizard_v1.xlsx` and can be rebuilt
  with `scripts/generate_hr_input_workbook.py`.
- Stable workbook contracts are `tbl_hr_employee_profile` and
  `tbl_hr_employment_assignment`. Formulas, validation lists, protected cells, and
  `SYS_META` support the intake flow.
- A selected-company RLS migration exists at
  `supabase/migrations/20261025003000_hr_selected_company_admin_access.sql`; it is
  prepared only and has not been applied.

## Source-data assessment

Three supplied workbooks were inspected read-only:

- Employee master: wide sheets, title/header rows before records, more than 100
  columns, and employee codes that can contain leading zeros.
- Job-title/assignment source: 215 parser-valid assignment rows; some rows lack a
  position or fixed salary.
- Organization-chart source: merged and presentation-oriented layout; it needs a
  dedicated organization-design form rather than direct row import.
- Normalized cross-source comparison found 203 matching employee codes, 6 active-master
  codes without an assignment, 10 assignment codes outside the active master, and 2
  duplicate normalized assignment codes.

These are aggregate profiling results. The workbooks remain examples and the counts
must be recalculated when SharePoint source versions change.

## Verification evidence

- HR import unit tests: 5/5 passing; local demo-store tests cover seeded relationships,
  persistence, imported positions, and company isolation.
- Microsoft connection-store tests: 3/3 passing, including company/user isolation,
  corrupt-state cleanup, last-use updates, and explicit removal.
- HR type-check, lint, and build passed for the feature implementation; build retains
  the existing bundle-size warning.
- Local browser checks passed on 1440×900 and 390×844 viewports: settings connection
  action and import modal render, actions enable when public Microsoft IDs exist, and
  no page/dialog horizontal overflow remains. A pre-existing flex min-width issue was
  fixed for mobile tables and modals.
- The multitenant client change was rechecked locally at 1440×900 and 390×844 with a
  non-secret placeholder Client ID: the Microsoft connect action renders, the import
  dialog has no horizontal overflow, and no browser runtime error occurs. A real Graph
  login remains pending the real AppForYou Client ID.
- Inline employee creation passed at 1440×900 and 390×844: required-field messages,
  new-department creation, employee persistence, list refresh, no runtime error, and no
  horizontal overflow.
- The cloud Supabase project was resumed from its inactivity pause. Tenant `Midomax`
  contains 481 unique employee profiles, 18 top-level units, 43 team nodes, and 125
  positions derived from the supplied workbooks. The assignment source had 215 rows;
  213 were applied and two duplicate-code conflicts remain excluded.
- Provisioned test user `duongquach` is an active Midomax staff user with HR app access.
  Authenticated E2E passed through login, mandatory initial password change, Midomax
  company selection, and display of all 481 employees. The first-login flag and a fresh
  temporary password were restored after testing; credentials exist only in the local
  mode-0600 file `/home/dev/.config/appforyou/midomax-duongquach-credentials.txt`.
- Device upload was exercised with the supplied employee master: 209 parsed rows,
  208 publishable and 1 blocked. The confirmed local import created 11 missing
  departments and resulted in 222 employees across 15 units in that isolated browser
  session. The import dialog and organization page had no horizontal overflow or
  browser runtime errors at desktop and iPhone widths.
- The supplied job-title workbook was then applied in the same isolated session: 10
  insert, 203 update, 0 unchanged, and 2 duplicate-code conflicts. All 213 applicable
  changes completed and the reporting-line view rendered without horizontal overflow
  or runtime errors.
- Generated XLSX reopens successfully and contains 6 expected sheets, 2 stable Excel
  Tables, 16 validation groups, a very-hidden metadata sheet, and no external links.
- Commit `63b8f81c` is pushed to `origin/viet` and its deployment workflow succeeded.
  Browser checks at desktop and iPhone sizes reached Vercel Authentication instead of
  the HR app, so app-level preview verification remains blocked until preview access is
  granted or deployment protection is removed for the fixed alias.
- Local configuration currently has no `VITE_MICROSOFT_CLIENT_ID`; authenticated
  SharePoint testing cannot start yet.

## External dependency

Authenticated SharePoint testing requires the preview environment to contain the
public AppForYou multitenant Entra application ID, with
`https://hr-preview.appforyou.xyz/redirect.html` registered as an exact SPA redirect
URI. Local testing uses `http://localhost:5177/redirect.html`. The user or the
AppForYou application administrator configures this value once. Customer users never
configure it. Never request or store a client secret for this browser flow.

## Next actions

1. Promote the checked HR change through fixed preview and production, then verify both
   deployed URLs with the changed feature.
2. Add field-level before/after diff to assignment review plus full reporting-cycle
   detection.
3. Add organization hierarchy/owner editing and an employee detail/transfer flow.
4. Add the bilingual position catalog with grade, level, team, department, and branch.
5. Build a dedicated product-line/responsibility matrix for the org-design workbook;
   do not treat its merged narrative cells as employee hierarchy.
6. Prepare the governed physical schema and migration for review; do not apply it
   without explicit approval.
7. Complete Entra configuration and authenticated SharePoint E2E after the app-first
   data workflow is accepted.

## Repository checkpoint

- Working branch: `codex/hr-sharepoint-pilot`
- Preview integration branch: `viet`
- Production branch: `main` — intentionally unchanged for this testing phase
- Detailed progress: `docs/SHAREPOINT-PILOT-PLAN.md`
- Architecture: `docs/SHAREPOINT-INGESTION-ARCHITECTURE.md`
- Template instructions: `docs/templates/README.md`
- Project/BA/DA/DE hub: `docs/SHAREPOINT-PROJECT-HUB.md`
- Logical data dictionary: `docs/SHAREPOINT-DATA-DICTIONARY.md`
