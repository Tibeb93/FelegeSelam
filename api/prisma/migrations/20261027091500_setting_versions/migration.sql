-- CreateTable
CREATE TABLE `setting_versions` (
    `id` CHAR(36) NOT NULL,
    `settingKey` VARCHAR(100) NOT NULL,
    `settingValue` JSON NOT NULL,
    `changedBy` CHAR(36) NULL,
    `changeReason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `setting_versions_settingKey_createdAt_idx`(`settingKey`, `createdAt`),
    INDEX `setting_versions_changedBy_idx`(`changedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `setting_versions` ADD CONSTRAINT `setting_versions_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
