-- Add missing indexes for foreign keys to improve query performance

-- backup_history
CREATE INDEX IF NOT EXISTS idx_backup_history_last_restored_by ON public.backup_history(last_restored_by);

-- commission_settings
CREATE INDEX IF NOT EXISTS idx_commission_settings_company_id ON public.commission_settings(company_id);

-- export_logs
CREATE INDEX IF NOT EXISTS idx_export_logs_branch_id ON public.export_logs(branch_id);

-- inventory_balance_snapshots
CREATE INDEX IF NOT EXISTS idx_inv_bal_snapshots_branch_id ON public.inventory_balance_snapshots(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_bal_snapshots_created_by ON public.inventory_balance_snapshots(created_by);
CREATE INDEX IF NOT EXISTS idx_inv_bal_snapshots_updated_by ON public.inventory_balance_snapshots(updated_by);

-- inventory_movements
CREATE INDEX IF NOT EXISTS idx_inv_movements_branch_id ON public.inventory_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_created_by ON public.inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_inv_movements_updated_by ON public.inventory_movements(updated_by);

-- inventory_records
CREATE INDEX IF NOT EXISTS idx_inventory_records_supplier_id ON public.inventory_records(supplier_id);

-- inventory_variance_reports
CREATE INDEX IF NOT EXISTS idx_inv_var_reports_created_by ON public.inventory_variance_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_inv_var_reports_updated_by ON public.inventory_variance_reports(updated_by);

-- marketing_costs
CREATE INDEX IF NOT EXISTS idx_marketing_costs_branch_id ON public.marketing_costs(branch_id);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_company_id ON public.marketing_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_created_by ON public.marketing_costs(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_costs_customer_id ON public.marketing_costs(customer_id);

-- product_column_settings
CREATE INDEX IF NOT EXISTS idx_prod_col_settings_created_by ON public.product_column_settings(created_by);
CREATE INDEX IF NOT EXISTS idx_prod_col_settings_updated_by ON public.product_column_settings(updated_by);

-- sales_channels
CREATE INDEX IF NOT EXISTS idx_sales_channels_company_id ON public.sales_channels(company_id);

-- sales_order_items
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON public.sales_order_items(product_id);

-- sales_orders
CREATE INDEX IF NOT EXISTS idx_sales_orders_branch_id ON public.sales_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_channel_id ON public.sales_orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_commission_setting_id ON public.sales_orders(commission_setting_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_id ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by ON public.sales_orders(created_by);

-- sales_records
CREATE INDEX IF NOT EXISTS idx_sales_records_customer_id ON public.sales_records(customer_id);

-- sales_targets
CREATE INDEX IF NOT EXISTS idx_sales_targets_branch_id ON public.sales_targets(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_company_id ON public.sales_targets(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_targets_created_by ON public.sales_targets(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_targets_user_id ON public.sales_targets(user_id);

-- special_outbound_records
CREATE INDEX IF NOT EXISTS idx_spec_outbound_records_product_id ON public.special_outbound_records(product_id);

-- stock_count_entries
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_branch_id ON public.stock_count_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_created_by ON public.stock_count_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_reconciled_by ON public.stock_count_entries(reconciled_by);
CREATE INDEX IF NOT EXISTS idx_stock_count_entries_updated_by ON public.stock_count_entries(updated_by);
