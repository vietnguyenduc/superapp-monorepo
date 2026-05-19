# ADR 004 — Row-Level Security (RLS) Policies

## Status

**Accepted** — Migration 013 created

## Context

Cashflow app experienced **infinite recursion** in RLS policies due to `USING (true)` on `users` table. This completely blocked database access.

## Decision

**RLS policies must use direct comparison (`auth.uid()::uuid = id`) and NEVER use `USING (true)` or `WITH CHECK (true)`.**

Inventory-specific RLS patterns:
- Products: `company_id = current_setting('app.current_company')::uuid`
- Inventory records: `branch_id = current_setting('app.current_branch')::uuid`
- Sales records: scoped by company and branch
- Users: `auth.uid()::uuid = id` (shared table, user sees own record)

## Consequences

### Positive
- Database-level security that cannot be bypassed
- Multi-tenancy enforced at the database layer
- Prevents accidental cross-company data exposure

### Negative
- More complex query construction (need to set `app.current_company`)
- Slightly more complex RLS policy management
- Must test policies thoroughly before deployment

## Related

- Migration: `supabase/migrations/013_inventory_rls_policies.sql`
- Cashflow lesson: `memory/70c4502c-aecb-4a92-be11-9c75de7637e1` — RLS infinite recursion