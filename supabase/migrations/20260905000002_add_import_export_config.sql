-- Add import_export_config to inventory_settings
-- Stores per-company import/export preferences:
--   productMatchField: 'business_code' | 'name' | 'both'
--   inventoryMatchField: 'business_code' | 'name' | 'both'
--   salesMatchField: 'business_code' | 'name' | 'both'
--   exportColumns: { products: [...], inventory: [...], sales: [...] }

ALTER TABLE inventory_settings
  ADD COLUMN IF NOT EXISTS import_export_config jsonb
  DEFAULT '{"productMatchField":"business_code","inventoryMatchField":"business_code","salesMatchField":"business_code","exportColumns":{"products":["business_code","name","category","input_unit","output_unit","status"],"inventory":["date","product_code","product_name","input_quantity","raw_material_stock","processed_stock","finished_product_stock"],"sales":["date","product_code","product_name","quantity","unit_price","total_amount"]}}'::jsonb;
