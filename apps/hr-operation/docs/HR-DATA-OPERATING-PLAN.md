# HR data operating plan — app flow and SharePoint flow

Last updated: 2026-10-25
Status: local demo phase; no new production schema or deployment

## Goal

Let a customer see realistic HR data inside the app and understand how daily work will
operate before Microsoft integration is ready. Direct app use and SharePoint use share
one ingestion contract; they differ only in how the workbook arrives and where reports
are delivered.

## Two supported operating paths

### 1. Full app flow

1. HR can add one employee inline with validation, or create and edit employees,
   organization units, positions, reporting lines, and
   effective assignments in the app.
2. A user can upload XLSX/CSV from their device for bulk work.
3. The app detects the sheet/header, normalizes codes, validates rows, and shows a
   review preview.
4. The user resolves blocked rows, chooses whether missing departments may be created,
   and confirms the import.
5. Published data appears in the employee directory and organization view, then feeds
   attendance, leave, payroll, performance, and reporting.
6. Reports download as XLSX when no SharePoint connection is available.

### 2. SharePoint-integrated flow

1. The authorized HR user connects their own Microsoft account.
2. They select or link a workbook their account can access.
3. The same detection, validation, review, and publish steps run as in the app flow.
4. HR remains the system of work after publish.
5. A report can download locally or be written to an approved new/existing SharePoint
   destination when delegated write permission is enabled.

Microsoft login must never create HR authorization or company membership. SharePoint
is a source/destination adapter around the common pipeline.

## Shared pipeline

`Choose source → Snapshot → Detect contract → Map → Validate → Review changes →
Approve → Publish tenant data → Operate in HR → Preview report → Download/SharePoint`

The local demo currently implements choose source, workbook detection, validation,
preview, controlled creation of missing departments, publish into browser-local demo
data, employee display, and organization display. It does not write sample personal
data to Supabase.

## Functional coverage and gaps

| Capability | Current local demo | Required next state |
|---|---|---|
| Employee directory | Seed data plus device/SharePoint workbook preview and new-row import | Detail/edit form, field permissions, change history |
| Inline entry | Create one employee, choose/create department, position, status, join date and salary | Employee detail/edit and transfer history |
| Organization chart | Unit hierarchy, owner, members, position and reporting-line views | Edit hierarchy, assign manager, cycle validation, effective dates |
| Department catalog | Seeded; missing names can be created with explicit import option | Merge/rename rules, stable code, duplicate review |
| Position/job catalog | Position text displayed | Bilingual catalog, grade/level, job family and effective versions |
| Employment assignment | Current department/position represented on employee | Effective-dated assignments and transfers separated from profile |
| Job-title workbook | Assignment parser and change review classify insert/update/unchanged/conflict; local demo applies department, position, salary and resolved manager | Field-level before/after diff, effective dates and governed cloud publish |
| Org-design workbook | Findings documented; no unsafe row import | Dedicated product-line/responsibility design form and mapping |
| Import governance | Row errors/warnings and explicit confirmation | Persistent runs, diff, approvals, idempotency, rollback and lineage |
| Downstream HR modules | Existing screens available; several still use mock UI data | Replace page-local mocks with canonical employee/assignment data |
| Reporting/export | Architecture defined | Versioned XLSX reports, local download, then SharePoint new/update modes |

## Delivery phases

### Phase A — customer-viewable local data

- [x] Add browser-local tenant-scoped demo store with connected employee, department,
  position, and manager examples.
- [x] Make device upload the default import route and retain SharePoint as the second
  source route.
- [x] Preview and validate the supplied employee master without cloud writes.
- [x] Offer explicit creation of missing departments before publish.
- [x] Add organization unit and reporting-line views for desktop and mobile.
- [x] Add a no-file inline employee form with validation and immediate list refresh.
- [x] Exercise the master import end to end: 208 publishable rows, 1 blocked row,
  11 missing departments created, 222 employees and 15 organization units after the
  local import (14 employees and 6 units were the clean demo seed).

### Phase B — assignments and organization editing

- [x] Parse the `Database` table in the job-title workbook as assignment/enrichment
  records rather than duplicate employee inserts.
- [-] Show insert/update/unchanged/conflict counts before apply; field-level before/after
  diff is the remaining part.
- [-] Resolve exact manager names to employee records and block ambiguous matches,
  self-reference, and duplicate employee codes; full graph cycle detection remains.
- [ ] Add department hierarchy and manager editing with effective dates.
- [ ] Add bilingual position catalog with grade, level, team, department, and branch.
- [ ] Add employee detail/edit drawer and transfer workflow.

### Phase C — governed canonical publish

- [ ] Finalize physical profile, assignment, org-unit, position, ingestion-run, and
  lineage schemas.
- [ ] Prepare migration, RLS, indexes, security review, and transactional publish RPC.
- [ ] Apply only after explicit migration approval.
- [ ] Replace downstream page-local mock data with the approved canonical records.

### Phase D — Microsoft adapter and export

- [ ] Complete the AppForYou multitenant Entra registration and authenticated E2E test.
- [ ] Add Microsoft file selection; keep link input as a fallback.
- [ ] Add versioned XLSX download reports.
- [ ] Add progressive delegated write consent for new-file and controlled existing-file
  SharePoint export.

## Demo safety

- Trial/demo records live only in the current browser and company-scoped storage.
- Supplied workbooks are read in the browser; sample personal data is not committed.
- Real authenticated imports still use the selected `company_id` and Supabase RLS.
- Prepared migrations remain unapplied until separately approved.

## Latest sample verification

- Employee master: 208 publishable rows, 1 blocked row, 11 missing departments.
- Job-title `Database`: 10 insert, 203 update, 0 unchanged, 2 conflict; 213 changes
  applied successfully inside an isolated trial browser session.
- Org-design workbook: remains a responsibility/product-line matrix. The current Org
  chart visualizes canonical units and reporting lines; a dedicated responsibility
  matrix editor/import is still planned and must not be inferred as employee hierarchy.
