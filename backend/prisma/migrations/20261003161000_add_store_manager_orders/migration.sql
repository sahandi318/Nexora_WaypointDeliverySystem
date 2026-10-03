-- ============================================================
-- Nexora Waypoint Delivery System
-- Store Manager Orders Foundation
-- ============================================================

CREATE TABLE `products` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(40) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `category` VARCHAR(100) NULL,
  `unit_label` VARCHAR(40) NOT NULL DEFAULT 'unit',
  `source` VARCHAR(40) NOT NULL DEFAULT 'APPLICATION_DEMO',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `products_sku_key`(`sku`),
  INDEX `products_category_idx`(`category`),
  INDEX `products_is_active_idx`(`is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `store_orders` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `order_code` VARCHAR(40) NOT NULL,
  `outlet_id` INTEGER NOT NULL,
  `created_by_user_id` INTEGER NOT NULL,
  `status` ENUM('SUBMITTED', 'DEFERRED', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'SUBMITTED',
  `cutoff_decision` ENUM('ON_TIME', 'AFTER_CUTOFF') NOT NULL,
  `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `requested_dispatch_date` DATE NOT NULL,
  `effective_dispatch_date` DATE NOT NULL,
  `deferred_reason` TEXT NULL,
  `total_units` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `store_orders_order_code_key`(`order_code`),
  INDEX `store_orders_outlet_id_submitted_at_idx`(`outlet_id`, `submitted_at`),
  INDEX `store_orders_outlet_id_status_idx`(`outlet_id`, `status`),
  INDEX `store_orders_created_by_user_id_idx`(`created_by_user_id`),
  INDEX `store_orders_effective_dispatch_date_idx`(`effective_dispatch_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `store_order_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `order_id` INTEGER NOT NULL,
  `product_id` INTEGER NOT NULL,
  `quantity` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `store_order_items_order_id_product_id_key`(`order_id`, `product_id`),
  INDEX `store_order_items_product_id_idx`(`product_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `store_orders`
  ADD CONSTRAINT `store_orders_outlet_id_fkey`
  FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `store_orders`
  ADD CONSTRAINT `store_orders_created_by_user_id_fkey`
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `store_order_items`
  ADD CONSTRAINT `store_order_items_order_id_fkey`
  FOREIGN KEY (`order_id`) REFERENCES `store_orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `store_order_items`
  ADD CONSTRAINT `store_order_items_product_id_fkey`
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
