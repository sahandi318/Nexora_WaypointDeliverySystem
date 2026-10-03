-- CreateTable
CREATE TABLE `translation_cache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cacheKey` VARCHAR(64) NOT NULL,
    `sourceLanguage` VARCHAR(10) NOT NULL,
    `targetLanguage` VARCHAR(10) NOT NULL,
    `sourceText` TEXT NOT NULL,
    `translatedText` TEXT NOT NULL,
    `provider` VARCHAR(40) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `translation_cache_cacheKey_key`(`cacheKey`),
    INDEX `translation_cache_sourceLanguage_targetLanguage_idx`(`sourceLanguage`, `targetLanguage`),
    INDEX `translation_cache_targetLanguage_idx`(`targetLanguage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
