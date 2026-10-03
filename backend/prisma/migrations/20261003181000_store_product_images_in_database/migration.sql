-- ============================================================
-- Store Product Images Directly in MySQL
-- ============================================================

ALTER TABLE `products`
  ADD COLUMN `image_data` LONGBLOB NULL,
  ADD COLUMN `image_mime_type` VARCHAR(100) NULL,
  DROP COLUMN `image_url`;
