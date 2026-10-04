-- DropForeignKey
ALTER TABLE `delivery_allocations` DROP FOREIGN KEY `delivery_allocations_live_trip_stop_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_allocations` DROP FOREIGN KEY `delivery_allocations_store_order_fkey`;

-- AddForeignKey
ALTER TABLE `delivery_allocations` ADD CONSTRAINT `delivery_allocations_store_order_id_fkey` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_allocations` ADD CONSTRAINT `delivery_allocations_live_trip_stop_id_fkey` FOREIGN KEY (`live_trip_stop_id`) REFERENCES `live_trip_stops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `delivery_allocations` RENAME INDEX `delivery_allocations_store_order_status_idx` TO `delivery_allocations_store_order_id_status_idx`;

-- RenameIndex
ALTER TABLE `delivery_allocations` RENAME INDEX `delivery_allocations_store_order_stop_key` TO `delivery_allocations_store_order_id_live_trip_stop_id_key`;

-- RenameIndex
ALTER TABLE `delivery_allocations` RENAME INDEX `delivery_allocations_trip_stop_status_idx` TO `delivery_allocations_live_trip_stop_id_status_idx`;
