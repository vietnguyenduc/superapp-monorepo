---
app: inventory-operation
doc_type: DATA-FLOW
generated: true
---

# inventory-operation — Data Flow

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## End-to-end flow

1. User opens `inventory.appforyou.xyz` and logs in via `@superapp/iam`.
2. `CompanyProvider` resolves `company_id` / `branch_id`.
3. Components call local service modules:
   - `appSettingsService` builds Supabase queries scoped by tenant.
   - `authService` builds Supabase queries scoped by tenant.
   - `baseService` builds Supabase queries scoped by tenant.
   - `cashflowIntegrationService` builds Supabase queries scoped by tenant.
   - `columnConfigService` builds Supabase queries scoped by tenant.
   - `columnSettingsService` builds Supabase queries scoped by tenant.
   - `databaseService` builds Supabase queries scoped by tenant.
   - `excelImportService` builds Supabase queries scoped by tenant.
4. `createApiClient` routes to local InsForge API (`localhost:3001`) if reachable, else Supabase cloud.
5. RLS policies enforce `company_id` / `branch_id` on every query.
6. Result is normalized and rendered; errors are logged via Sentry and shown with toast/inline messages in Vietnamese.

## Import / export flow

- Export: UI table view → `xlsx` / CSV with Vietnamese headers.
- Import: file → parser → validation → `bulkInsert` with `company_id` + duplicate check.

## Offline / trial mode

- Some apps use `trialMockStore.ts` and localStorage flags (`superapp_trial_mode`).
- Trial data is local-only and resets on cache clear.

## Inventory analytics

- Canonical movement ledger: `inventory_records`.
- Product balance: `Σ input_quantity − Σ output_quantity`, including approved stock-count adjustments.
- Period identity: opening + inbound − outbound = closing.
- Dashboard and MRP share `src/utils/inventoryLedger.ts`; legacy snapshot fields are not a current-balance source.
- Bulk input/output history is reconstructed from the server ledger by grouping `inventory_records.reference_id` for `source_type=bulk_import`; it therefore follows the same source as XNT and survives device changes.
- Quantity totals are shown only within one unit. Cross-unit overview uses product counts rather than adding quantities.
