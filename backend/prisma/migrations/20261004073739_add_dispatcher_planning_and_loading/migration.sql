-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_code` VARCHAR(50) NOT NULL,
    `vehicle_type` VARCHAR(120) NOT NULL,
    `depotId` INTEGER NOT NULL,
    `capacity_weight_kg` DECIMAL(12, 3) NOT NULL,
    `capacity_volume_m3` DECIMAL(14, 6) NOT NULL,
    `refrigerated` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_vehicle_code_key`(`vehicle_code`),
    INDEX `vehicles_depotId_idx`(`depotId`),
    INDEX `vehicles_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_date` DATE NOT NULL,
    `depotId` INTEGER NOT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    `created_by_user_id` INTEGER NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `delivery_plans_status_idx`(`status`),
    UNIQUE INDEX `delivery_plans_delivery_date_depotId_key`(`delivery_date`, `depotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planned_trips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trip_code` VARCHAR(50) NOT NULL,
    `planId` INTEGER NOT NULL,
    `vehicleId` INTEGER NOT NULL,
    `trip_number` INTEGER NOT NULL,
    `planned_departure` VARCHAR(20) NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PLANNED',
    `total_weight_kg` DECIMAL(12, 3) NOT NULL DEFAULT 0.000,
    `total_volume_m3` DECIMAL(14, 6) NOT NULL DEFAULT 0.000000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `planned_trips_trip_code_key`(`trip_code`),
    INDEX `planned_trips_planId_idx`(`planId`),
    INDEX `planned_trips_vehicleId_idx`(`vehicleId`),
    UNIQUE INDEX `planned_trips_planId_vehicleId_trip_number_key`(`planId`, `vehicleId`, `trip_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trip_order_allocations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planned_trip_id` INTEGER NOT NULL,
    `store_order_id` INTEGER NOT NULL,
    `stop_sequence` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trip_order_allocations_store_order_id_idx`(`store_order_id`),
    UNIQUE INDEX `trip_order_allocations_planned_trip_id_store_order_id_key`(`planned_trip_id`, `store_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loading_exceptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exception_code` VARCHAR(50) NOT NULL,
    `live_trip_id` INTEGER NULL,
    `store_order_id` INTEGER NULL,
    `exception_type` VARCHAR(60) NOT NULL,
    `item_name` VARCHAR(160) NULL,
    `expected_quantity` INTEGER NULL,
    `available_quantity` INTEGER NULL,
    `loader_name` VARCHAR(150) NULL,
    `loader_note` TEXT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    `resolution_action` VARCHAR(100) NULL,
    `resolution_note` TEXT NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loading_exceptions_exception_code_key`(`exception_code`),
    INDEX `loading_exceptions_live_trip_id_idx`(`live_trip_id`),
    INDEX `loading_exceptions_store_order_id_idx`(`store_order_id`),
    INDEX `loading_exceptions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_depotId_fkey` FOREIGN KEY (`depotId`) REFERENCES `depots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_plans` ADD CONSTRAINT `delivery_plans_depotId_fkey` FOREIGN KEY (`depotId`) REFERENCES `depots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_plans` ADD CONSTRAINT `delivery_plans_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_trips` ADD CONSTRAINT `planned_trips_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `delivery_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planned_trips` ADD CONSTRAINT `planned_trips_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_order_allocations` ADD CONSTRAINT `trip_order_allocations_planned_trip_id_fkey` FOREIGN KEY (`planned_trip_id`) REFERENCES `planned_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trip_order_allocations` ADD CONSTRAINT `trip_order_allocations_store_order_id_fkey` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_exceptions` ADD CONSTRAINT `loading_exceptions_live_trip_id_fkey` FOREIGN KEY (`live_trip_id`) REFERENCES `live_trips`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_exceptions` ADD CONSTRAINT `loading_exceptions_store_order_id_fkey` FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
