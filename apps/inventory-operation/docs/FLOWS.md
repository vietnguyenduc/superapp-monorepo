---
app: inventory-operation
doc_type: FLOWS
generated: true
---

# inventory-operation — User Flows

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Core flows

- **Login** — route `Auth/Login`
- **SignUp** — route `Auth/SignUp`
- **CompanySelector** — route `CompanySelector/CompanySelector`
- **Dashboard** — route `DashboardPage`
- **DashboardEnhanced** — route `DashboardPageEnhanced`
- **DataImportSettings** — route `DataImportSettingsPage`
- **DebugTest** — route `DebugTestPage`
- **EditableGridDemo** — route `EditableGridDemoPage`
- **ExcelDataDemo** — route `ExcelDataDemoPage`
- **GoodsReceipt** — route `GoodsReceiptPage`
- **Help** — route `HelpPage`
- **ImportSettings** — route `ImportSettingsPage`

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

## Stock-count reconciliation

1. Create a dated count session; the server first rejects mixed/noncanonical historical units, then snapshots book stock for every active product.
2. Enter physical quantities. Any variance requires an explanation before submission.
3. Submission locks counted quantities and sends the session for admin review.
4. Approval creates one idempotent inbound/outbound adjustment per variance and links it to the count line; rejection records the review reason without changing stock.
