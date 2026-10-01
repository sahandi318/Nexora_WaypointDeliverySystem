-- CreateTable
CREATE TABLE `depots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `district` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `depots_code_key`(`code`),
    UNIQUE INDEX `depots_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outlets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `outletCode` VARCHAR(30) NOT NULL,
    `brand` VARCHAR(120) NOT NULL,
    `district` VARCHAR(100) NOT NULL,
    `depotId` INTEGER NULL,
    `dockType` VARCHAR(100) NULL,
    `parkingConstraint` TEXT NULL,
    `mallWindow` VARCHAR(100) NULL,
    `windowOpenTime` VARCHAR(20) NULL,
    `windowCloseTime` VARCHAR(20) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `outlets_outletCode_key`(`outletCode`),
    INDEX `outlets_depotId_idx`(`depotId`),
    INDEX `outlets_district_idx`(`district`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(50) NOT NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `email` VARCHAR(180) NULL,
    `phone` VARCHAR(30) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'STORE_MANAGER', 'DISPATCHER', 'LOADER', 'DRIVER') NOT NULL,
    `outletId` INTEGER NULL,
    `depotId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_userId_key`(`userId`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_outletId_idx`(`outletId`),
    INDEX `users_depotId_idx`(`depotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `outlets` ADD CONSTRAINT `outlets_depotId_fkey` FOREIGN KEY (`depotId`) REFERENCES `depots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_outletId_fkey` FOREIGN KEY (`outletId`) REFERENCES `outlets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_depotId_fkey` FOREIGN KEY (`depotId`) REFERENCES `depots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
