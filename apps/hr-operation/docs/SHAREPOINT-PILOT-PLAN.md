# SharePoint ↔ HR pilot plan

Last updated: 2026-10-25

This is the reviewable implementation plan and progress checklist for the HR
SharePoint pilot. Update it whenever scope, status, dependencies, or verification
results change. During the testing phase, the target environment is `viet` / fixed
preview only. Production deployment and database migration are deferred.
Develop and verify locally first; batch Git pushes around substantial, reviewable
changes instead of publishing every small documentation or experiment update.

## Project navigation

- Start at `SHAREPOINT-PROJECT-HUB.md` for the Project/BA/DA/DE view and artifact map.
- Read `SHAREPOINT-DATA-DICTIONARY.md` for proposed entities, fields, keys,
  sensitivity, and source coverage.
- Read `SHAREPOINT-INGESTION-ARCHITECTURE.md` for the end-to-end pipeline and design
  decisions.
- Read `CURRENT_STATUS.md` for the latest handoff, blockers, and exact next actions.
- Read `HR-DATA-OPERATING-PLAN.md` for the app-first customer demo, the shared device
  upload/SharePoint operating model, feature-gap matrix, and implementation phases.

## Workstream deliverables

### Project / Product

- [x] Define pilot goal, testing-only environment policy, major scope boundaries, and
  definition of pilot done.
- [-] Maintain decision log, blocker/status handoff, and review milestones.
- [ ] Record pilot feedback and decide phase-B scope.

### Business Analysis

- [x] Define actors and target import/review/approve/export workflow at architecture
  level.
- [x] Record critical business rules and unresolved authority questions.
- [ ] Confirm field-level source authority, employee-code policy, approval roles,
  retention, and effective-date behavior with business owners.

### Data Analysis

- [x] Profile the three sample workbooks and document grain/shape risks.
- [x] Produce cross-source match, missing, duplicate, position, and salary baselines.
- [x] Draft quality controls and source-to-domain coverage.
- [ ] Re-run the profile on the real SharePoint snapshot and publish reproducible
  row-level issue outputs without copying personal data into project docs.

### Data Engineering

- [x] Define snapshot → mapping → validation → staging → publish → export layers.
- [x] Draft canonical HR and integration/report control-plane entities.
- [x] Implement and browser-test user-and-company-scoped interactive Microsoft
  connection locally.
- [ ] Convert the approved logical dictionary into physical schema, RLS, indexes,
  lineage, idempotency, and publish transaction design.

## Status legend

- `[x]` Complete and verified at the stated level
- `[-]` In progress
- `[ ]` Not started
- `[!]` Blocked by an external dependency or decision

## Phase A — source understanding and input contract

- [x] Profile the three supplied source workbooks without treating them as fixed
  schemas.
- [x] Record cross-source quality findings and target pipeline architecture.
- [x] Define HR as the system of work and SharePoint as an inbound source/outbound
  reporting destination.
- [x] Create a macro-free Excel input wizard with stable named tables, strict
  validation, quality summary, protected formulas, and editable catalogs.
- [x] Add a reproducible workbook generator and pinned dependency.
- [x] Validate workbook package integrity, tables, validations, hidden metadata, and
  absence of external links.

## Pilot — interactive SharePoint import

- [x] Add Microsoft SPA/PKCE sign-in and delegated `Files.Read` access.
- [x] Convert client configuration to one AppForYou-owned multitenant Entra app using
  the `organizations` authority; customer users no longer supply a Tenant ID or create
  an application registration.
- [x] Add the MSAL Browser v5 redirect bridge as a separate Vite build entry at
  `/redirect.html` for reliable popup completion.
- [x] Resolve a SharePoint sharing URL and download XLSX/XLS/CSV through Graph.
- [x] Detect sheets/headers, normalize aliases, preserve leading-zero employee codes,
  validate rows, and preview errors.
- [x] Scope reads and inserts to the company selected in the app.
- [x] Add parser and connection-scope tests; current result: 8/8 passing.
- [x] Add local connection management states and actions in HR settings, scoped to the
  current HR user plus selected company.
- [x] Verify the settings card and import modal locally at desktop and iPhone sizes
  without horizontal overflow.
- [!] Commit `63b8f81c` deployed successfully, but desktop and iPhone browser checks at
  `https://hr-preview.appforyou.xyz` reach Vercel Authentication. App-level preview
  verification needs preview access or a public fixed alias.
- [!] Configure the preview AppForYou multitenant Entra application ID and exact
  redirect URI. No client secret is used. Owner: AppForYou application administrator.
- [ ] Make local XLSX/CSV upload and XLSX download first-class fallback actions for
  tenants that block third-party user consent; direct Microsoft access remains the
  preferred connected experience.
- [ ] Upload `HR_Input_Wizard_v1.xlsx` to a test SharePoint library and populate only
  synthetic test rows.
- [ ] Run authenticated end-to-end import from SharePoint on preview: sign in, inspect,
  choose sheet, validate, import, and confirm the resulting employee rows.
- [ ] Exercise the same flow at desktop and iPhone viewport widths.
- [ ] Record pilot feedback and approve or revise the phase-B contract.

## Phase B — configurable forms and governed ingestion

- [x] Keep Supabase as HR-app authentication; use Microsoft only as a SharePoint
  import/export integration.
- [x] Design and implement the pilot company-and-user-scoped session record,
  connect/reconnect/disconnect UX, and progressive SharePoint consent without using
  Microsoft identity for HR authorization.
- [ ] Store versioned form definitions, source mappings, ingestion runs, row-level
  results, approvals, and source identity links.
- [ ] Build a visual mapping/review flow so new workbook layouts do not require code
  changes.
- [ ] Add idempotency, immutable source snapshots, approval rules, and an auditable
  promotion into canonical HR records.
- [ ] Add role/permission UX and tenant-scoped RLS policies for the new integration
  tables.

## Phase C — HR workflows and reporting export

- [ ] Connect approved records to the existing employee, organization, job, payroll,
  and reporting views.
- [ ] Create versioned report definitions and XLSX renderer.
- [ ] Export a new XLSX file to a configured SharePoint folder.
- [ ] Update a managed Excel Table/named range in an existing workbook with workbook
  sessions and conflict protection.

## Deferred during testing

- [ ] Review and explicitly approve the prepared Supabase migration before applying
  it to any shared database.
- [ ] Merge `viet` into `main` only after preview acceptance.
- [ ] Verify `https://hr.appforyou.xyz` after a separately approved production release.

## Definition of pilot done

The pilot is done when the latest `viet` commit is live on the fixed preview URL, a
real authorized Microsoft user can import synthetic rows from the supplied wizard,
validation failures are understandable, the resulting HR rows remain tenant-scoped,
and both desktop and iPhone flows have been exercised. A successful build alone does
not close the pilot.
