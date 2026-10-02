-- Add an optional processed profile image for user accounts.
ALTER TABLE `users`
ADD COLUMN `profilePhotoData` LONGTEXT NULL;
