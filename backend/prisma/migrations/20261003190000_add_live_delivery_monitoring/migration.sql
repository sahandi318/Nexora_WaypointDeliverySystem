-- Live delivery monitoring tables for Dispatcher <-> Driver visibility.

CREATE TABLE `live_trips` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tripCode` VARCHAR(50) NOT NULL,
  `deliveryDate` DATE NOT NULL,
  `depotId` INTEGER NULL,
  `vehicleCode` VARCHAR(50) NOT NULL,
  `vehicleType` VARCHAR(120) NULL,
  `temperature` VARCHAR(120) NULL,
  `driverUserId` INTEGER NULL,
  `driverName` VARCHAR(150) NOT NULL,
  `status` VARCHAR(40) NOT NULL DEFAULT 'PLANNED',
  `progressCompleted` INTEGER NOT NULL DEFAULT 0,
  `progressTotal` INTEGER NOT NULL DEFAULT 0,
  `nextDestination` VARCHAR(120) NULL,
  `eta` VARCHAR(40) NULL,
  `isDriverOnline` BOOLEAN NOT NULL DEFAULT true,
  `currentLat` DOUBLE NULL,
  `currentLng` DOUBLE NULL,
  `lastSynchronized` DATETIME(3) NULL,
  `latestDriverUpdate` TEXT NULL,
  `latestDriverUpdateAt` DATETIME(3) NULL,
  `routeUpdatedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `live_trips_tripCode_key`(`tripCode`),
  INDEX `live_trips_deliveryDate_idx`(`deliveryDate`),
  INDEX `live_trips_depotId_deliveryDate_idx`(`depotId`, `deliveryDate`),
  INDEX `live_trips_driverUserId_idx`(`driverUserId`),
  INDEX `live_trips_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `live_trip_stops` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `stopCode` VARCHAR(50) NOT NULL,
  `liveTripId` INTEGER NOT NULL,
  `sequence` INTEGER NOT NULL,
  `outletCode` VARCHAR(50) NOT NULL,
  `outletName` VARCHAR(150) NULL,
  `district` VARCHAR(100) NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `plannedEta` VARCHAR(40) NULL,
  `actualArrival` VARCHAR(40) NULL,
  `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  `outcome` VARCHAR(60) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `live_trip_stops_stopCode_key`(`stopCode`),
  INDEX `live_trip_stops_liveTripId_sequence_idx`(`liveTripId`, `sequence`),
  INDEX `live_trip_stops_outletCode_idx`(`outletCode`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `live_trip_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `liveTripId` INTEGER NOT NULL,
  `type` VARCHAR(60) NOT NULL,
  `message` TEXT NOT NULL,
  `payload` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `live_trip_events_liveTripId_createdAt_idx`(`liveTripId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `live_trips`
  ADD CONSTRAINT `live_trips_depotId_fkey`
  FOREIGN KEY (`depotId`) REFERENCES `depots`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `live_trips`
  ADD CONSTRAINT `live_trips_driverUserId_fkey`
  FOREIGN KEY (`driverUserId`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `live_trip_stops`
  ADD CONSTRAINT `live_trip_stops_liveTripId_fkey`
  FOREIGN KEY (`liveTripId`) REFERENCES `live_trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `live_trip_events`
  ADD CONSTRAINT `live_trip_events_liveTripId_fkey`
  FOREIGN KEY (`liveTripId`) REFERENCES `live_trips`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
