# ADR 001 — Shared Supabase Project with App-Level Permissions

## Status

**Accepted** — Implemented in migration 011

## Context

Inventory Operation System needs backend infrastructure. Two options:

1. **Separate Supabase project** — dedicated database, clean isolation
2. **Shared project with cashflow** — reuse existing users/companies/branches tables

## Decision

**Option 2: Shared project with app-level permission gating**

Rationale:
- Users, companies, branches are shared entities across both apps
- Single sign-on experience for users accessing both apps
- Reduced infrastructure overhead (one project to manage)
- Unified RBAC base (roles: admin_master, admin_company, staff)

**App-level gating via `app_permissions` JSONB column:**
```json
{
  "cashflow": true,
  "inventory": true
}
```

Plus `has_app_access(app_name)` PostgreSQL function for RLS policies.

## Consequences

### Positive
- One auth system for both apps
- Shared company/branch data
- Reduced Supabase project count and cost
- Users can access both apps seamlessly

### Negative / Trade-offs
- Tighter coupling between apps
- Schema changes in shared tables affect both apps
- RLS policies must include app-level checks
- Risk of cross-app data leakage if policies misconfigured
- Need careful coordination when modifying shared tables

## Related

- Migration: `supabase/migrations/011_app_permissions.sql`
- `apps/inventory-operation/docs/AI_CONTEXT.md` — Key Technical Decisions
- `apps/cashflow/docs/adr/0001-transaction-type-single-source-of-truth.md`