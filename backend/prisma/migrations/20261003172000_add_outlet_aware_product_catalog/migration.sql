-- ============================================================
-- Outlet-aware Product Catalog + Product Images
-- ============================================================

ALTER TABLE `products`
  ADD COLUMN `image_url` VARCHAR(500) NULL;

CREATE TABLE `product_brand_assignments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NOT NULL,
  `brand` VARCHAR(120) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `product_brand_assignments_product_id_brand_key`(`product_id`, `brand`),
  INDEX `product_brand_assignments_brand_is_active_idx`(`brand`, `is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_brand_assignments`
  ADD CONSTRAINT `product_brand_assignments_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
