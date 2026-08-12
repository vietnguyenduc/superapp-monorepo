# Supabase Schema Health Report

Generated: 2026-08-04
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

## Recommendations

1. Migration history is out of sync with remote. Run `supabase migration repair` or reconcile local file names.
2. Child tables without `company_id` should either add `company_id` denormalized column for performance/RLS simplicity or verify parent-join policies cover all CRUD.
3. `approval_logs` currently does not scope by company_id in RLS; review for multi-tenant leakage.
4. `goods_receipt_items` only has a SELECT policy; INSERT/UPDATE/DELETE will be denied for non-owner roles.
5. `fm_*` tables (framework-method) are excluded from audit per user request.