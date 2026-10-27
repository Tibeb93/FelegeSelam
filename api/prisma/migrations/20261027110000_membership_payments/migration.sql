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
    UNIQUE INDEX `membership_payments_method_referenceNo_key`(`method`, `referenceNo`),
    INDEX `membership_payments_memberId_idx`(`memberId`),
    INDEX `membership_payments_membershipYear_idx`(`membershipYear`),
    INDEX `membership_payments_status_idx`(`status`),
    INDEX `membership_payments_paidOn_idx`(`paidOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_payments` ADD CONSTRAINT `membership_payments_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
