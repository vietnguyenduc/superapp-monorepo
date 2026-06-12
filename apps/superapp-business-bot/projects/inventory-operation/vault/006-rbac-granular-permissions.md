# ADR 006 — RBAC with Granular Permissions

## Status

**Accepted**

## Context

Inventory app needs role-based access control aligned with cashflow app. Three roles: admin_master (system-wide), admin_company (company-wide), staff (branch-specific).

Additionally, inventory-specific staff permissions needed: import_products, import_inventory, view_reports, manage_settings.

## Decision

**Reuse cashflow RBAC hierarchy with inventory-specific granular permissions via `staff_permissions` JSONB column.**

Role hierarchy:
```
admin_master
  +-- admin_company
        +-- staff (with specific permissions)
```

Staff permissions structure:
```json
{
  "import_products": true,
  "import_inventory": true,
  "view_reports": true,
  "manage_settings": false
}
```

Permission checks in UI and service layer before any restricted action.

## Consequences

### Positive
- Consistent with cashflow RBAC model
- Flexible permission assignment per staff member
- Easy to add new permissions without schema migration
- UI can show/hide features based on permissions

### Negative
- JSONB queries are slightly slower than boolean columns
- Need to validate permission keys in code
- UI must handle missing/null permissions gracefully

## Related

- Cashflow RBAC: `apps/cashflow/docs/MULTI-LEVEL-ADMIN.md`
- `apps/inventory-operation/docs/AI_CONTEXT.md` — Authentication & Authorization