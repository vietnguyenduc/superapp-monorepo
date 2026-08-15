---
app: inventory-operation
doc_type: ROLES-PERMISSIONS
generated: true
---

# inventory-operation — Roles & Permissions

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## User roles

- `ADMIN_MASTER` (`admin_master`)
- `ADMIN_COMPANY` (`admin_company`)
- `WAREHOUSE_ACCOUNTANT` (`warehouse_accountant`)
- `WAREHOUSE_KEEPER` (`warehouse_keeper`)
- `STAFF` (`staff`)

## Permissions

- `INVENTORY_INPUT_VIEW` (`inventory_input_view`)
- `INVENTORY_INPUT_CREATE` (`inventory_input_create`)
- `INVENTORY_INPUT_EDIT` (`inventory_input_edit`)
- `INVENTORY_INPUT_DELETE` (`inventory_input_delete`)
- `PRODUCT_CATALOG_VIEW` (`product_catalog_view`)
- `PRODUCT_CATALOG_CREATE` (`product_catalog_create`)
- `PRODUCT_CATALOG_EDIT` (`product_catalog_edit`)
- `PRODUCT_CATALOG_DELETE` (`product_catalog_delete`)
- `SALES_REPORT_VIEW` (`sales_report_view`)
- `SALES_REPORT_CREATE` (`sales_report_create`)
- `SALES_REPORT_EDIT` (`sales_report_edit`)
- `SALES_REPORT_DELETE` (`sales_report_delete`)
- `SPECIAL_OUTBOUND_VIEW` (`special_outbound_view`)
- `SPECIAL_OUTBOUND_CREATE` (`special_outbound_create`)
- `SPECIAL_OUTBOUND_APPROVE` (`special_outbound_approve`)
- `SPECIAL_OUTBOUND_REJECT` (`special_outbound_reject`)
- `INVENTORY_REPORT_VIEW` (`inventory_report_view`)
- `INVENTORY_REPORT_EXPORT` (`inventory_report_export`)
- `STOCK_CHECK_PRINT` (`stock_check_print`)
- `STOCK_CHECK_EXPORT` (`stock_check_export`)
- `DASHBOARD_VIEW` (`dashboard_view`)
- `DASHBOARD_ANALYTICS` (`dashboard_analytics`)
- `SETTINGS_VIEW` (`settings_view`)
- `SETTINGS_EDIT` (`settings_edit`)
- `USER_MANAGEMENT` (`user_management`)
- `SYSTEM_ADMIN` (`system_admin`)
- `AUDIT_LOG_VIEW` (`audit_log_view`)

## Role → permission mapping

Mapping defined in `apps/inventory-operation/src/types/UserRole.ts`.
Mapping defined in `apps/inventory-operation/src/utils/rbac.ts`.

## Enforcement

- Use `hasPermission(user, Permission.XXX)` before enabling UI actions.
- Route guards and menu items hide options the user cannot perform.
- RLS is the final guard in Supabase; app-side checks are for UX only.

