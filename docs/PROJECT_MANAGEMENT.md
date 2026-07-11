# Project Management - Cashflow Application

Single source of truth for task tracking, milestones, and decisions.

## Completed Tasks

| Date | Task | Commit | Notes |
|------|------|--------|-------|
| 2026-04-27 | Cleanup junk files (73 files deleted) | `48cc56b` | Removed temp test scripts, SQL fix scripts, deploy scripts, empty files. Build verified. |

## Active Decisions

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-27 | Keep `scripts/`, `tests/test_scenarios.md`, `db/schema.sql` | Reusable utilities + official schema + non-empty test doc |

## Next Priorities

1. [ ] Review deploy scripts (`scripts/deploy-cashflow.sh`, `scripts/deploy-cashflow-vercel.sh`) for reuse
2. [ ] Consolidate duplicate documentation across `docs/` root and `apps/cashflow/docs/`
3. [ ] Verify `supabase/migrations/` are all applied to production DB
4. [ ] Add automated cleanup guard (e.g. `.gitignore` or pre-commit hook) to prevent temp scripts from being committed

## Supabase Production Status

- **Project:** peslmsctejmvkwzyohke
- **Status:** ACTIVE_HEALTHY
- **Tables:** 11 (branches, users, bank_accounts, customers, transactions, companies, user_preferences, customer_fields, transaction_types, color_settings, backup_history)
- **RLS:** Enabled on all tables
