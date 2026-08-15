---
app: accounting
doc_type: FLOWS
generated: true
---

# accounting — User Flows

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Core flows

- **Assets** — route `Assets/Assets`
- **Login** — route `Auth/Login`
- **SignUp** — route `Auth/SignUp`
- **CashBook** — route `CashBook/CashBook`
- **ChartOfAccounts** — route `ChartOfAccounts/ChartOfAccounts`
- **CompanySelector** — route `CompanySelector/CompanySelector`
- **Dashboard** — route `Dashboard/Dashboard`
- **Invoices** — route `Invoices/Invoices`
- **Manual** — route `Manual/Manual`
- **Profile** — route `Profile/Profile`
- **Reports** — route `Reports/Reports`
- **Settings** — route `Settings/Settings`

## Generic CRUD flow

1. List view with search, sort, and filters.
2. Create / edit modal or page.
3. Validation (Vietnamese messages).
4. Submit to `*Service.ts` with `company_id`.
5. Toast confirmation; list refreshes.

## Approval flow (where applicable)

1. User creates a special outbound / return / adjustment record.
2. Record enters `pending` / `awaiting_approval`.
3. Approver with correct permission reviews and approves/rejects.
4. `approval_logs` records the action with `record_type`, `status`, `user_role`.

