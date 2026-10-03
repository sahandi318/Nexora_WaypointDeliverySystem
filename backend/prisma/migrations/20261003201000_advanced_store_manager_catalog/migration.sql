-- ============================================================
-- Advanced Store Manager Catalog / Order Type / Logistics Totals
-- ============================================================

ALTER TABLE `products`
  ADD COLUMN `manufacturer_brand` VARCHAR(120) NOT NULL DEFAULT 'Nexora Demo',
  ADD COLUMN `product_type` VARCHAR(100) NOT NULL DEFAULT 'General',
  ADD COLUMN `handling_type` ENUM('AMBIENT_DRY', 'CHILLED') NOT NULL DEFAULT 'AMBIENT_DRY',
  ADD COLUMN `unit_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0.100,
  ADD COLUMN `unit_volume_m3` DECIMAL(12,6) NOT NULL DEFAULT 0.000100;

CREATE INDEX `products_handling_type_idx`
  ON `products`(`handling_type`);

CREATE INDEX `products_manufacturer_brand_idx`
  ON `products`(`manufacturer_brand`);

CREATE INDEX `products_product_type_idx`
  ON `products`(`product_type`);

ALTER TABLE `store_orders`
  ADD COLUMN `order_type` ENUM('AMBIENT_DRY', 'CHILLED') NOT NULL DEFAULT 'AMBIENT_DRY',
  ADD COLUMN `estimated_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  ADD COLUMN `estimated_volume_m3` DECIMAL(14,6) NOT NULL DEFAULT 0.000000;

CREATE INDEX `store_orders_outlet_id_order_type_idx`
  ON `store_orders`(`outlet_id`, `order_type`);
