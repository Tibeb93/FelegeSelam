-- DropIndex
DROP INDEX `attendances_memberId_courseId_sessionDate_key` ON `attendances`;

-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `notes` VARCHAR(255) NULL,
    ADD COLUMN `sessionId` CHAR(36) NULL,
    MODIFY `courseId` CHAR(36) NULL;

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

-- Data Migration: Create AttendanceSession for existing attendance rows grouped by sessionDate and courseId
INSERT INTO `attendance_sessions` (`id`, `sessionDate`, `title`, `courseId`, `status`, `openedBy`, `closedAt`, `createdAt`, `updatedAt`)
SELECT 
    UUID() AS `id`,
    a.`sessionDate`,
    CONCAT(COALESCE(c.`titleAm`, 'የሰንበት መርሐ-ግብር'), ' (', DATE_FORMAT(a.`sessionDate`, '%Y-%m-%d'), ')') AS `title`,
    a.`courseId`,
    'closed' AS `status`,
    COALESCE(MAX(a.`markedBy`), (SELECT `id` FROM `users` WHERE `email` = 'admin@aemade.org' LIMIT 1), 'system-migrated') AS `openedBy`,
    CURRENT_TIMESTAMP(3) AS `closedAt`,
    CURRENT_TIMESTAMP(3) AS `createdAt`,
    CURRENT_TIMESTAMP(3) AS `updatedAt`
FROM `attendances` a
LEFT JOIN `courses` c ON c.`id` = a.`courseId`
WHERE a.`sessionId` IS NULL
GROUP BY a.`sessionDate`, a.`courseId`, c.`titleAm`;

-- Update existing attendances with their new sessionId
UPDATE `attendances` a
JOIN `attendance_sessions` s ON s.`sessionDate` = a.`sessionDate` 
    AND ((a.`courseId` IS NOT NULL AND s.`courseId` = a.`courseId`) OR (a.`courseId` IS NULL AND s.`courseId` IS NULL))
SET a.`sessionId` = s.`id`
WHERE a.`sessionId` IS NULL;

-- CreateIndex
CREATE INDEX `attendances_sessionId_idx` ON `attendances`(`sessionId`);

-- CreateIndex
CREATE UNIQUE INDEX `attendances_sessionId_memberId_key` ON `attendances`(`sessionId`, `memberId`);

-- AddForeignKey
ALTER TABLE `attendance_sessions` ADD CONSTRAINT `attendance_sessions_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `attendance_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
