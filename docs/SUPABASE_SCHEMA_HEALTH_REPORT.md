# Supabase Schema Health Report

Generated: 2026-08-15
Total public tables: 90
All 90 tables have RLS enabled.
Tables missing `company_id` column: 27

## Tables missing company_id

- **accounting_transaction_lines** (2 policies)
- **approval_logs** (2 policies)
- **color_settings** (2 policies)
- **companies** (0 policies)
- **employee_kpis** (2 policies)
- **employee_shifts** (2 policies)
- **fm_blocks** (2 policies)
- **fm_phases** (2 policies)
- **fm_step_responses** (1 policies)
- **fm_steps** (2 policies)
- **fm_streaks** (1 policies)
- **fm_user_progress** (1 policies)
- **fm_user_template** (1 policies)
- **goods_receipt_items** (1 policies)
- **key_results** (2 policies)
- **operation_chat_members** (2 policies)
- **operation_chat_messages** (2 policies)
- **operation_training_materials** (2 policies)
- **operation_training_progress** (3 policies)
- **operation_training_questions** (2 policies)
- **payroll_items** (2 policies)
- **po_items** (1 policies)
- **product_column_presets** (1 policies)
- **product_conversions** (1 policies)
- **sales_order_items** (3 policies)
- **stock_check_items** (2 policies)
- **user_preferences** (3 policies)

## Actions taken (2026-08-13)

- **`approval_logs`**: added `company_id` column with trigger backfill from `special_outbound_records`/`users`, added FK to `companies`, and replaced unscoped policies with tenant-scoped SELECT/INSERT/UPDATE/DELETE policies. App code in `sales-operation` and `inventory-operation` now provides required fields (`record_type`, `status`, `user_role`) when inserting logs.
  - Migration: `supabase/migrations/20260804000001_approval_logs_company_id_and_rls.sql`
- **Child tables missing `company_id`**: created CRUD parent-join RLS policies for 15 high-risk child tables so mutations are now scoped to the parent record's `company_id`. Also added `company_id` to operation portal parent/child tables that were missing it (`operation_chat_groups`, `operation_training_courses`, `operation_training_materials`, `operation_training_questions`, `operation_training_progress`) and backfilled from the creator/parent record.
  - Migration: `supabase/migrations/20260804000002_child_table_rls_policies.sql`
  - Covered tables: `accounting_transaction_lines`, `employee_kpis`, `employee_shifts`, `goods_receipt_items`, `key_results`, `operation_chat_members`, `operation_chat_messages`, `operation_training_materials`, `operation_training_progress`, `operation_training_questions`, `payroll_items`, `po_items`, `product_conversions`, `sales_order_items`, `stock_check_items`.
- **`special_outbound_records`**: added `notes` and `reason_detail` columns the UI already collects, and aligned the `createRecord`/`updateRecord`/`approveRecord`/`rejectRecord` payloads with the actual table columns (`requested_by`, `approved_by`, `approved_at`, `rejection_reason`, `company_id`, `branch_id`).
  - Migration: `supabase/migrations/20260804000003_special_outbound_records_notes_and_reason_detail.sql`
  - Code changes: `apps/sales-operation/src/services/specialOutboundService.ts`, `apps/inventory-operation/src/services/specialOutboundService.ts`, `apps/sales-operation/src/lib/supabase.ts`, `apps/inventory-operation/src/lib/supabase.ts`.
- **Balance recalculation trigger**: added `recalculate_customer_balance()` / `recalculate_bank_balance()` functions and triggers on `transactions` so that `customers.total_balance` / `bank_accounts.current_balance` are recomputed from `opening_balance + Σ(amount × math_factor)` on insert/update/delete/backfill. Applied to production and backfilled all existing balances.
  - Migration: `supabase/migrations/20260804000004_balance_recalc_trigger.sql`
  - Code changes: `apps/cashflow/src/services/transactionService.ts`, `apps/cashflow/src/services/businessLogic/balanceMath.ts`.
- Excluded from this pass (per project scope): `companies`, `color_settings`, `product_column_presets`, `user_preferences`, and all `fm_*` (framework-method) tables.

## Remaining recommendations

1. `fm_*` tables (framework-method) are excluded from audit per user request.
2. `color_settings`, `product_column_presets`, `companies`, and `user_preferences` remain global/user-scoped by design.
3. The 2026-08-13/15 migrations (`20260804000001`–`20260804000004`) were applied to the production Supabase project after temporary migration-history repair; local migration file names still do not fully match remote for historical versions `007`, `008`, `034`–`036`, `045`–`047`.