-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `permissions` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(50) NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending',
    `twoFactorSecret` VARCHAR(255) NULL,
    `failedLogins` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    INDEX `users_roleId_idx`(`roleId`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nameAm` VARCHAR(100) NOT NULL,
    `nameEn` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_nameAm_key`(`nameAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` CHAR(36) NOT NULL,
    `memberNo` VARCHAR(50) NOT NULL,
    `userId` CHAR(36) NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `fatherName` VARCHAR(100) NOT NULL,
    `grandfatherName` VARCHAR(100) NULL,
    `baptismalName` VARCHAR(100) NULL,
    `sex` ENUM('male', 'female') NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(191) NULL,
    `region` VARCHAR(100) NULL,
    `zone` VARCHAR(100) NULL,
    `woreda` VARCHAR(100) NULL,
    `kebele` VARCHAR(100) NULL,
    `addressDetail` TEXT NULL,
    `parish` VARCHAR(191) NULL,
    `confessionFather` VARCHAR(191) NULL,
    `educationLevel` VARCHAR(100) NULL,
    `occupation` VARCHAR(100) NULL,
    `emergencyName` VARCHAR(100) NULL,
    `emergencyPhone` VARCHAR(50) NULL,
    `departmentId` INTEGER NULL,
    `photoUrl` VARCHAR(500) NULL,
    `status` ENUM('pending', 'active', 'inactive', 'graduated', 'transferred') NOT NULL DEFAULT 'active',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `customFields` JSON NULL,
    `createdBy` CHAR(36) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_memberNo_key`(`memberNo`),
    UNIQUE INDEX `members_userId_key`(`userId`),
    INDEX `members_departmentId_idx`(`departmentId`),
    INDEX `members_status_idx`(`status`),
    INDEX `members_phone_idx`(`phone`),
    INDEX `members_deletedAt_idx`(`deletedAt`),
    FULLTEXT INDEX `members_firstName_fatherName_grandfatherName_baptismalName_idx`(`firstName`, `fatherName`, `grandfatherName`, `baptismalName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` CHAR(36) NOT NULL,
    `titleAm` VARCHAR(200) NOT NULL,
    `titleEn` VARCHAR(200) NULL,
    `description` TEXT NULL,
    `level` VARCHAR(50) NULL,
    `teacherId` CHAR(36) NULL,
    `schedule` VARCHAR(200) NULL,
    `capacity` INTEGER NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `status` ENUM('draft', 'open', 'closed', 'archived') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `courses_status_idx`(`status`),
    INDEX `courses_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `id` CHAR(36) NOT NULL,
    `courseId` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NULL,
    `mediaType` ENUM('text', 'pdf', 'audio', 'video', 'link') NOT NULL DEFAULT 'text',
    `fileUrl` VARCHAR(500) NULL,
    `orderNo` INTEGER NOT NULL DEFAULT 1,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lessons_courseId_idx`(`courseId`),
    INDEX `lessons_orderNo_idx`(`orderNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `courseId` CHAR(36) NOT NULL,
    `status` ENUM('active', 'completed', 'dropped') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `enrollments_memberId_idx`(`memberId`),
    INDEX `enrollments_courseId_idx`(`courseId`),
    INDEX `enrollments_status_idx`(`status`),
    UNIQUE INDEX `enrollments_memberId_courseId_key`(`memberId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_sessions` (
    `id` CHAR(36) NOT NULL,
    `sessionDate` DATE NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `courseId` CHAR(36) NULL,
    `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
    `openedBy` CHAR(36) NOT NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendance_sessions_sessionDate_idx`(`sessionDate`),
    INDEX `attendance_sessions_courseId_idx`(`courseId`),
    INDEX `attendance_sessions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` CHAR(36) NOT NULL,
    `sessionId` CHAR(36) NULL,
    `memberId` CHAR(36) NOT NULL,
    `courseId` CHAR(36) NULL,
    `sessionDate` DATE NOT NULL,
    `status` ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'present',
    `markedBy` CHAR(36) NULL,
    `notes` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendances_sessionId_idx`(`sessionId`),
    INDEX `attendances_memberId_idx`(`memberId`),
    INDEX `attendances_courseId_idx`(`courseId`),
    INDEX `attendances_sessionDate_idx`(`sessionDate`),
    UNIQUE INDEX `attendances_sessionId_memberId_key`(`sessionId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grades` (
    `id` CHAR(36) NOT NULL,
    `enrollmentId` CHAR(36) NOT NULL,
    `assessment` VARCHAR(100) NOT NULL,
    `score` DOUBLE NOT NULL,
    `maxScore` DOUBLE NOT NULL DEFAULT 100,
    `remark` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `grades_enrollmentId_idx`(`enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificates` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `courseId` CHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `certificates_code_key`(`code`),
    INDEX `certificates_memberId_idx`(`memberId`),
    INDEX `certificates_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mezmur_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nameAm` VARCHAR(100) NOT NULL,
    `nameEn` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mezmur_categories_nameAm_key`(`nameAm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mezmurs` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `lyrics` LONGTEXT NULL,
    `categoryId` INTEGER NULL,
    `singer` VARCHAR(150) NULL,
    `audioUrl` VARCHAR(500) NULL,
    `videoUrl` VARCHAR(500) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mezmurs_categoryId_idx`(`categoryId`),
    INDEX `mezmurs_isPublic_idx`(`isPublic`),
    FULLTEXT INDEX `mezmurs_title_lyrics_idx`(`title`, `lyrics`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorites` (
    `memberId` CHAR(36) NOT NULL,
    `mezmurId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorites_memberId_idx`(`memberId`),
    INDEX `favorites_mezmurId_idx`(`mezmurId`),
    PRIMARY KEY (`memberId`, `mezmurId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('sinksar', 'bible_reading', 'saint_of_day', 'urgent', 'event', 'news', 'teaching') NOT NULL DEFAULT 'news',
    `title` VARCHAR(255) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `isUrgent` BOOLEAN NOT NULL DEFAULT false,
    `publishAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `authorId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `posts_type_idx`(`type`),
    INDEX `posts_isUrgent_idx`(`isUrgent`),
    INDEX `posts_publishAt_idx`(`publishAt`),
    INDEX `posts_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `location` VARCHAR(255) NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `capacity` INTEGER NULL,
    `createdBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `events_startAt_idx`(`startAt`),
    INDEX `events_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_rsvps` (
    `eventId` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `status` ENUM('going', 'maybe', 'not_going') NOT NULL DEFAULT 'going',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `event_rsvps_eventId_idx`(`eventId`),
    INDEX `event_rsvps_memberId_idx`(`memberId`),
    PRIMARY KEY (`eventId`, `memberId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `forms` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `formSchema` JSON NOT NULL,
    `status` ENUM('draft', 'open', 'closed') NOT NULL DEFAULT 'draft',
    `openUntil` DATETIME(3) NULL,
    `allowOneResponsePerMember` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `forms_status_idx`(`status`),
    INDEX `forms_openUntil_idx`(`openUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `form_responses` (
    `id` CHAR(36) NOT NULL,
    `formId` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NULL,
    `answers` JSON NOT NULL,
    `status` ENUM('submitted', 'approved', 'rejected') NOT NULL DEFAULT 'submitted',
    `reviewNote` TEXT NULL,
    `reviewedBy` CHAR(36) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `form_responses_formId_idx`(`formId`),
    INDEX `form_responses_memberId_idx`(`memberId`),
    INDEX `form_responses_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contributions` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `paymentMethod` VARCHAR(50) NULL,
    `period` VARCHAR(50) NULL,
    `receiptNo` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedBy` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `contributions_receiptNo_key`(`receiptNo`),
    INDEX `contributions_memberId_idx`(`memberId`),
    INDEX `contributions_type_idx`(`type`),
    INDEX `contributions_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `data` JSON NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_sentAt_idx`(`sentAt`),
    INDEX `notifications_readAt_idx`(`readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `platform` ENUM('android', 'ios', 'web') NOT NULL DEFAULT 'web',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `device_tokens_token_key`(`token`),
    INDEX `device_tokens_userId_idx`(`userId`),
    INDEX `device_tokens_platform_idx`(`platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(100) NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ip` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `settingKey` VARCHAR(100) NOT NULL,
    `settingValue` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`settingKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `membership_payments` (
    `id` CHAR(36) NOT NULL,
    `memberId` CHAR(36) NOT NULL,
    `membershipYear` INTEGER NOT NULL DEFAULT 2018,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB',
    `method` ENUM('telebirr', 'cbe', 'abyssinia', 'awash', 'dashen', 'other_bank', 'cash') NOT NULL,
    `referenceNo` VARCHAR(100) NOT NULL,
    `paidOn` DATETIME(3) NOT NULL,
    `proofUrl` VARCHAR(500) NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `reviewedBy` CHAR(36) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNote` TEXT NULL,
    `receiptNo` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `membership_payments_receiptNo_key`(`receiptNo`),
    INDEX `membership_payments_memberId_idx`(`memberId`),
    INDEX `membership_payments_membershipYear_idx`(`membershipYear`),
    INDEX `membership_payments_status_idx`(`status`),
    INDEX `membership_payments_paidOn_idx`(`paidOn`),
    UNIQUE INDEX `membership_payments_method_referenceNo_key`(`method`, `referenceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `attendance_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grades` ADD CONSTRAINT `grades_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mezmurs` ADD CONSTRAINT `mezmurs_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `mezmur_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_mezmurId_fkey` FOREIGN KEY (`mezmurId`) REFERENCES `mezmurs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rsvps` ADD CONSTRAINT `event_rsvps_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rsvps` ADD CONSTRAINT `event_rsvps_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_responses` ADD CONSTRAINT `form_responses_formId_fkey` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `form_responses` ADD CONSTRAINT `form_responses_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contributions` ADD CONSTRAINT `contributions_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting_versions` ADD CONSTRAINT `setting_versions_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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

