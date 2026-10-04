-- CreateTable
CREATE TABLE `loader_trip_states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `live_trip_id` INTEGER NOT NULL,
    `loader_user_id` INTEGER NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'NOT_STARTED',
    `dock` VARCHAR(60) NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loader_trip_states_live_trip_id_key`(`live_trip_id`),
    INDEX `loader_trip_states_loader_user_id_idx`(`loader_user_id`),
    INDEX `loader_trip_states_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loading_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loader_trip_id` INTEGER NOT NULL,
    `store_order_item_id` INTEGER NULL,
    `stop_code` VARCHAR(50) NOT NULL,
    `item_code` VARCHAR(80) NOT NULL,
    `item_name` VARCHAR(180) NOT NULL,
    `expected_qty` INTEGER NOT NULL,
    `loaded_qty` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(40) NOT NULL DEFAULT 'units',
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `loaded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `loading_items_store_order_item_id_idx`(`store_order_item_id`),
    INDEX `loading_items_stop_code_idx`(`stop_code`),
    UNIQUE INDEX `loading_items_loader_trip_id_item_code_key`(`loader_trip_id`, `item_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loading_issues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loading_item_id` INTEGER NOT NULL,
    `loader_user_id` INTEGER NOT NULL,
    `issue_type` VARCHAR(40) NOT NULL,
    `expected_qty` INTEGER NOT NULL,
    `usable_qty` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `resolution` TEXT NULL,
    `resolved_by_user_id` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `loading_issues_status_idx`(`status`),
    INDEX `loading_issues_loader_user_id_idx`(`loader_user_id`),
    INDEX `loading_issues_resolved_by_user_id_idx`(`resolved_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loading_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loader_trip_id` INTEGER NOT NULL,
    `count_verified` BOOLEAN NOT NULL DEFAULT false,
    `secure_verified` BOOLEAN NOT NULL DEFAULT false,
    `temperature_verified` BOOLEAN NOT NULL DEFAULT false,
    `docs_verified` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loading_verifications_loader_trip_id_key`(`loader_trip_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_handovers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loader_trip_id` INTEGER NOT NULL,
    `loader_user_id` INTEGER NOT NULL,
    `driver_user_id` INTEGER NULL,
    `seal_number` VARCHAR(80) NULL,
    `handover_code` VARCHAR(40) NULL,
    `handed_over_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `driver_handovers_loader_trip_id_key`(`loader_trip_id`),
    INDEX `driver_handovers_loader_user_id_idx`(`loader_user_id`),
    INDEX `driver_handovers_driver_user_id_idx`(`driver_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `loader_trip_states` ADD CONSTRAINT `loader_trip_states_live_trip_id_fkey` FOREIGN KEY (`live_trip_id`) REFERENCES `live_trips`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loader_trip_states` ADD CONSTRAINT `loader_trip_states_loader_user_id_fkey` FOREIGN KEY (`loader_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_items` ADD CONSTRAINT `loading_items_loader_trip_id_fkey` FOREIGN KEY (`loader_trip_id`) REFERENCES `loader_trip_states`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_items` ADD CONSTRAINT `loading_items_store_order_item_id_fkey` FOREIGN KEY (`store_order_item_id`) REFERENCES `store_order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_issues` ADD CONSTRAINT `loading_issues_loading_item_id_fkey` FOREIGN KEY (`loading_item_id`) REFERENCES `loading_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_issues` ADD CONSTRAINT `loading_issues_loader_user_id_fkey` FOREIGN KEY (`loader_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_issues` ADD CONSTRAINT `loading_issues_resolved_by_user_id_fkey` FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loading_verifications` ADD CONSTRAINT `loading_verifications_loader_trip_id_fkey` FOREIGN KEY (`loader_trip_id`) REFERENCES `loader_trip_states`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_handovers` ADD CONSTRAINT `driver_handovers_loader_trip_id_fkey` FOREIGN KEY (`loader_trip_id`) REFERENCES `loader_trip_states`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_handovers` ADD CONSTRAINT `driver_handovers_loader_user_id_fkey` FOREIGN KEY (`loader_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_handovers` ADD CONSTRAINT `driver_handovers_driver_user_id_fkey` FOREIGN KEY (`driver_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
