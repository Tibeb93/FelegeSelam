import { PrismaClient } from '@prisma/client';

export async function ensureMezmurAudioColumns(prisma: PrismaClient): Promise<void> {
  try {
    const columns = (await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND LOWER(TABLE_NAME) = 'mezmurs'
    `)) as Array<{ COLUMN_NAME: string }>;

    if (!columns || columns.length === 0) {
      return;
    }

    const existingCols = new Set(columns.map((c) => c.COLUMN_NAME.toLowerCase()));

    const requiredColumns = [
      { name: 'audiostoragekey', ddl: 'ADD COLUMN `audioStorageKey` VARCHAR(500) NULL' },
      { name: 'audiomimetype', ddl: 'ADD COLUMN `audioMimeType` VARCHAR(100) NULL' },
      { name: 'audiosizebytes', ddl: 'ADD COLUMN `audioSizeBytes` INT NULL' },
      { name: 'audiodurationseconds', ddl: 'ADD COLUMN `audioDurationSeconds` DOUBLE NULL' },
      { name: 'audiostatus', ddl: "ADD COLUMN `audioStatus` VARCHAR(50) NOT NULL DEFAULT 'available'" },
      { name: 'audiostorageprovider', ddl: 'ADD COLUMN `audioStorageProvider` VARCHAR(50) NULL' },
    ];

    for (const col of requiredColumns) {
      if (!existingCols.has(col.name)) {
        console.log(`[Schema Migration] Adding missing column mezmurs.${col.name}...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE \`mezmurs\` ${col.ddl}`);
        console.log(`✓ Added column mezmurs.${col.name}`);
      }
    }
  } catch (error) {
    console.warn('[Schema Migration] Note while verifying mezmurs schema:', error);
  }
}

