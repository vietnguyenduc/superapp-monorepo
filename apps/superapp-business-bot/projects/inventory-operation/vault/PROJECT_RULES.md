# PROJECT RULES — Inventory Operation System

---

## GENERAL RULES

Agents must read:

- `CURRENT_STATE.md`
- `ARCHITECTURE.md`
- `AI_CONTEXT.md`

before working on this app.

---

## DEVELOPMENT RULES

1. Every feature must start with a feature spec.
2. All UI text must be in Vietnamese (target audience is F&B businesses in Vietnam).
3. Use TypeScript strict mode — no `any` types.
4. Reusable components go in `src/components/UI/`.
5. Page-level components go in `src/pages/`.

---

## DATABASE RULES

1. Schema changes require migration in `supabase/migrations/`.
2. All inventory tables must have RLS policies.
3. `businessCode` must be unique per company (enforce in service layer until DB constraint added).
4. `inventory_records` composite key: `(productCode + date)` per branch.
5. All quantities must be non-negative.

---

## IMPORT / EXPORT RULES

1. Maximum 200 rows per bulk operation (`MAX_BULK_ROWS`).
2. Validate all data server-side before database write.
3. Reject entire batch if any row fails validation.
4. Provide downloadable CSV templates for all import types.

---

## TESTING RULES

1. New features must include test scenarios.
2. Test with both valid and invalid data.
3. Verify quantities never go negative after any operation.

---

## DEPLOYMENT RULES

1. Only deploy when QA passes.
2. Verify RLS policies after any deployment.
3. Monitor shared Supabase project for conflicts with cashflow app.