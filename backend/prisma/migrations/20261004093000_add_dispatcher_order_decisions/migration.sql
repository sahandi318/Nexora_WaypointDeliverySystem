-- CreateTable
CREATE TABLE `store_order_decisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `store_order_id` INTEGER NOT NULL,
    `decided_by_user_id` INTEGER NULL,
    `decision` ENUM('CONFIRMED', 'DEFERRED') NOT NULL,
    `previous_status` ENUM('SUBMITTED', 'DEFERRED', 'CONFIRMED', 'CANCELLED') NOT NULL,
    `resulting_status` ENUM('SUBMITTED', 'DEFERRED', 'CONFIRMED', 'CANCELLED') NOT NULL,
    `reason` VARCHAR(500) NULL,
    `effective_dispatch_date` DATE NOT NULL,
    `decided_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `store_order_decisions_store_order_id_decided_at_idx`(`store_order_id`, `decided_at`),
    INDEX `store_order_decisions_decided_by_user_id_idx`(`decided_by_user_id`),
    INDEX `store_order_decisions_decision_decided_at_idx`(`decision`, `decided_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `store_order_decisions`
ADD CONSTRAINT `store_order_decisions_store_order_id_fkey`
FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `store_order_decisions`
ADD CONSTRAINT `store_order_decisions_decided_by_user_id_fkey`
FOREIGN KEY (`decided_by_user_id`) REFERENCES `users`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
