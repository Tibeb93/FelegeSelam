-- AlterTable
ALTER TABLE `members` ADD COLUMN `customFields` JSON NULL;

-- CreateTable
CREATE TABLE `cms_pages` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `titleAm` VARCHAR(255) NOT NULL,
    `titleEn` VARCHAR(255) NOT NULL,
    `status` ENUM('draft', 'scheduled', 'published') NOT NULL DEFAULT 'draft',
    `publishAt` DATETIME(3) NULL,
    `seo` JSON NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdBy` CHAR(36) NULL,
    `updatedBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_pages_slug_key`(`slug`),
    INDEX `cms_pages_status_publishAt_idx`(`status`, `publishAt`),
    INDEX `cms_pages_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_page_sections` (
    `id` CHAR(36) NOT NULL,
    `pageId` CHAR(36) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 0,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `content` JSON NOT NULL,
    `config` JSON NOT NULL,
    `style` JSON NOT NULL,
    `audience` ENUM('everyone', 'guests', 'members', 'staff') NOT NULL DEFAULT 'everyone',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cms_page_sections_pageId_orderNo_idx`(`pageId`, `orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_page_versions` (
    `id` CHAR(36) NOT NULL,
    `pageId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `snapshot` JSON NOT NULL,
    `note` VARCHAR(255) NULL,
    `createdBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cms_page_versions_pageId_createdAt_idx`(`pageId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_menus` (
    `id` CHAR(36) NOT NULL,
    `location` ENUM('header', 'footer') NOT NULL,
    `items` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_menus_location_key`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_media_assets` (
    `id` CHAR(36) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `kind` ENUM('image', 'audio', 'video', 'pdf') NOT NULL DEFAULT 'image',
    `altAm` VARCHAR(255) NOT NULL DEFAULT '',
    `altEn` VARCHAR(255) NOT NULL DEFAULT '',
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `sizeBytes` INTEGER NOT NULL DEFAULT 0,
    `folder` VARCHAR(100) NOT NULL DEFAULT 'general',
    `mimeType` VARCHAR(100) NULL,
    `uploadedBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cms_media_assets_folder_idx`(`folder`),
    INDEX `cms_media_assets_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_ui_strings` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `group` VARCHAR(100) NOT NULL,
    `am` TEXT NOT NULL,
    `en` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_ui_strings_key_key`(`key`),
    INDEX `cms_ui_strings_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cms_form_configs` (
    `id` CHAR(36) NOT NULL,
    `formKey` VARCHAR(100) NOT NULL,
    `titleAm` VARCHAR(255) NULL,
    `titleEn` VARCHAR(255) NULL,
    `fields` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_form_configs_formKey_key`(`formKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cms_pages` ADD CONSTRAINT `cms_pages_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_pages` ADD CONSTRAINT `cms_pages_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_page_sections` ADD CONSTRAINT `cms_page_sections_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `cms_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_page_versions` ADD CONSTRAINT `cms_page_versions_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `cms_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_page_versions` ADD CONSTRAINT `cms_page_versions_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cms_media_assets` ADD CONSTRAINT `cms_media_assets_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
