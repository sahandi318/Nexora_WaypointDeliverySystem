CREATE TABLE `store_manager_issues` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `issue_code` VARCHAR(50) NOT NULL,
  `store_order_id` INTEGER NOT NULL,
  `outlet_id` INTEGER NOT NULL,
  `reported_by_user_id` INTEGER NOT NULL,
  `category` ENUM('DELIVERY_SHORTFALL', 'DAMAGED_GOODS', 'LATE_DELIVERY', 'DELIVERY_EXCEPTION', 'ORDER_PROBLEM', 'OTHER') NOT NULL,
  `description` VARCHAR(1000) NOT NULL,
  `status` ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
  `reported_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolved_by_user_id` INTEGER NULL,
  `resolution_note` VARCHAR(1000) NULL,
  `resolved_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `store_manager_issues_issue_code_key`(`issue_code`),
  INDEX `store_manager_issues_outlet_id_status_reported_at_idx`(`outlet_id`, `status`, `reported_at`),
  INDEX `store_manager_issues_store_order_id_status_idx`(`store_order_id`, `status`),
  INDEX `store_manager_issues_reported_by_user_id_idx`(`reported_by_user_id`),
  INDEX `store_manager_issues_resolved_by_user_id_idx`(`resolved_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `store_manager_issues`
  ADD CONSTRAINT `store_manager_issues_store_order_id_fkey`
  FOREIGN KEY (`store_order_id`) REFERENCES `store_orders`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `store_manager_issues`
  ADD CONSTRAINT `store_manager_issues_outlet_id_fkey`
  FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `store_manager_issues`
  ADD CONSTRAINT `store_manager_issues_reported_by_user_id_fkey`
  FOREIGN KEY (`reported_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `store_manager_issues`
  ADD CONSTRAINT `store_manager_issues_resolved_by_user_id_fkey`
  FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
