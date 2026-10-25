# SharePoint ↔ HR pilot plan

Last updated: 2026-10-25

This is the reviewable implementation plan and progress checklist for the HR
SharePoint pilot. Update it whenever scope, status, dependencies, or verification
results change. During the testing phase, the target environment is `viet` / fixed
preview only. Production deployment and database migration are deferred.

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
- [x] Resolve a SharePoint sharing URL and download XLSX/XLS/CSV through Graph.
- [x] Detect sheets/headers, normalize aliases, preserve leading-zero employee codes,
  validate rows, and preview errors.
- [x] Scope reads and inserts to the company selected in the app.
- [x] Add parser tests; current result: 5/5 passing.
- [-] Deploy current commits to `https://hr-preview.appforyou.xyz` and verify the
  public entry screen.
- [!] Configure preview Entra application identifiers and exact redirect URI. No
  client secret is used. Owner: Microsoft tenant/app administrator.
- [ ] Upload `HR_Input_Wizard_v1.xlsx` to a test SharePoint library and populate only
  synthetic test rows.
- [ ] Run authenticated end-to-end import from SharePoint on preview: sign in, inspect,
  choose sheet, validate, import, and confirm the resulting employee rows.
- [ ] Exercise the same flow at desktop and iPhone viewport widths.
- [ ] Record pilot feedback and approve or revise the phase-B contract.

## Phase B — configurable forms and governed ingestion

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
