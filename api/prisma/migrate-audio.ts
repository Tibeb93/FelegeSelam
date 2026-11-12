import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { extractAudioMetadata } from '../src/common/utils/audio-metadata.util';
import { ensureMezmurAudioColumns } from '../src/prisma/schema-migration.util';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Migrating and Verifying Audio Files in Database ---');
  await ensureMezmurAudioColumns(prisma);

  const baseUploadDir = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.resolve(__dirname, '..', 'uploads');

  const mezmurs = await prisma.mezmur.findMany();
  console.log(`Found ${mezmurs.length} total mezmurs.`);

  let updatedCount = 0;
  let missingCount = 0;

  for (const m of mezmurs) {
    if (!m.audioUrl && !m.audioStorageKey) {
      continue;
    }

    const currentUrlOrKey = m.audioStorageKey || m.audioUrl || '';
    let diskPath = '';

    if (currentUrlOrKey.startsWith('/uploads/')) {
      diskPath = path.join(baseUploadDir, currentUrlOrKey.replace(/^\/+uploads\//, ''));
    } else if (currentUrlOrKey.startsWith('mezmurs/')) {
      diskPath = path.join(baseUploadDir, currentUrlOrKey);
    } else if (currentUrlOrKey.includes('sample-orthodox-chime.wav')) {
      diskPath = path.join(baseUploadDir, 'mezmurs', 'audio', 'sample-orthodox-chime.wav');
    }

    if (diskPath && fs.existsSync(diskPath)) {
      const buffer = fs.readFileSync(diskPath);
      const meta = extractAudioMetadata(buffer, path.basename(diskPath));
      const storageKey = m.audioStorageKey || (currentUrlOrKey.startsWith('/uploads/') ? currentUrlOrKey.replace(/^\/+uploads\//, '') : currentUrlOrKey);

      await prisma.mezmur.update({
        where: { id: m.id },
        data: {
          audioStorageKey: storageKey,
          audioMimeType: meta.mimeType,
          audioSizeBytes: meta.sizeBytes,
          audioDurationSeconds: meta.durationSeconds,
          audioStorageProvider: 'local',
          audioStatus: 'available',
        },
      });
      console.log(`✓ [Available] ${m.title} (${meta.durationSeconds}s, ${(meta.sizeBytes / 1024).toFixed(1)} KB)`);
      updatedCount++;
    } else if (currentUrlOrKey.startsWith('http://') || currentUrlOrKey.startsWith('https://')) {
      // Remote URL
      console.log(`ℹ [Remote URL] ${m.title}: ${currentUrlOrKey}`);
      await prisma.mezmur.update({
        where: { id: m.id },
        data: {
          audioStorageProvider: currentUrlOrKey.includes('cloudinary') ? 'cloudinary' : 's3',
          audioStatus: 'available',
        },
      });
      updatedCount++;
    } else {
      console.warn(`⚠ [Missing] ${m.title} (Key/Url: ${currentUrlOrKey})`);
      await prisma.mezmur.update({
        where: { id: m.id },
        data: {
          audioStatus: 'missing',
        },
      });
      missingCount++;
    }
  }

  console.log(`Migration Complete. Verified/Updated: ${updatedCount}, Missing: ${missingCount}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

