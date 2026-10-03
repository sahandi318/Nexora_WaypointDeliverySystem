-- ============================================================
-- Store Manager Order Note
-- ============================================================

ALTER TABLE `store_orders`
  ADD COLUMN `store_manager_note` VARCHAR(500) NULL
  AFTER `deferred_reason`;
