-- AlterTable
ALTER TABLE `mezmurs` ADD COLUMN `audioStorageKey` VARCHAR(500) NULL,
    ADD COLUMN `audioMimeType` VARCHAR(100) NULL,
    ADD COLUMN `audioSizeBytes` INT NULL,
    ADD COLUMN `audioDurationSeconds` DOUBLE NULL,
    ADD COLUMN `audioStatus` VARCHAR(50) NOT NULL DEFAULT 'available',
    ADD COLUMN `audioStorageProvider` VARCHAR(50) NULL;

