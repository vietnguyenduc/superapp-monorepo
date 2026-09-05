-- Add missing product_category enum values
-- The ProductCategory TypeScript enum has beverage, tobacco, other
-- but the DB enum only had fruit, dry_goods, processed, finished.
-- This caused 500 Internal Server Error on product upsert.
-- See: apps/inventory-operation/src/types/Product.ts

ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'beverage';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'tobacco';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'other';
