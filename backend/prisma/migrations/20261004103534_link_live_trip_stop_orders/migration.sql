-- AlterTable
ALTER TABLE `live_trip_stops` ADD COLUMN `store_order_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `live_trip_stops` ADD CONSTRAINT `live_trip_stops_store_order_id_fkey` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
