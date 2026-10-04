-- ============================================================
-- Nexora Waypoint Delivery System
-- Stage 10.1 - Store Order <-> Live Trip Stop Integration Bridge
-- ============================================================

CREATE TABLE `delivery_allocations` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `store_order_id` INTEGER NOT NULL,
  `live_trip_stop_id` INTEGER NOT NULL,
  `status` ENUM('ALLOCATED', 'PUBLISHED', 'CANCELLED') NOT NULL DEFAULT 'ALLOCATED',
  `allocated_units` INTEGER NOT NULL,
  `allocated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `published_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `cancellation_reason` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `delivery_allocations_store_order_stop_key`(`store_order_id`, `live_trip_stop_id`),
  INDEX `delivery_allocations_store_order_status_idx`(`store_order_id`, `status`),
  INDEX `delivery_allocations_trip_stop_status_idx`(`live_trip_stop_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `delivery_allocations`
  ADD CONSTRAINT `delivery_allocations_store_order_fkey`
  FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `delivery_allocations`
  ADD CONSTRAINT `delivery_allocations_live_trip_stop_fkey`
  FOREIGN KEY (`live_trip_stop_id`) REFERENCES `live_trip_stops`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
