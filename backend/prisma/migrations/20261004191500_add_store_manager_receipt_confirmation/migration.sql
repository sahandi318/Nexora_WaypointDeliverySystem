-- ============================================================
-- Nexora Waypoint Delivery System
-- Store Manager delivery receipt confirmation
-- ============================================================

ALTER TABLE `delivery_allocations`
  ADD COLUMN `received_confirmed_at` DATETIME(3) NULL,
  ADD COLUMN `received_confirmed_by_user_id` INTEGER NULL,
  ADD COLUMN `received_confirmation_note` VARCHAR(500) NULL;

CREATE INDEX `delivery_allocations_received_confirmed_by_user_id_idx`
  ON `delivery_allocations`(`received_confirmed_by_user_id`);

ALTER TABLE `delivery_allocations`
  ADD CONSTRAINT `delivery_allocations_received_confirmed_by_user_id_fkey`
  FOREIGN KEY (`received_confirmed_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
