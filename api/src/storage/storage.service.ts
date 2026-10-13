import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharpModule from 'sharp';
const sharp = (sharpModule as any).default || sharpModule;
import { IStorageService } from './storage.interface';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.baseUploadDir);
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'photos'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'documents'));
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async savePhoto(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid photo type (${file.mimetype}). Allowed types: JPEG, PNG, WebP`,
      );
    }

    const maxSizeBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `Photo size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 2 MB maximum limit`,
      );
    }

    const randomName = `${crypto.randomUUID()}.webp`;
    const destinationPath = path.join(this.baseUploadDir, 'photos', randomName);

    try {
      await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(destinationPath);

      this.logger.log(`Photo saved successfully: ${randomName}`);
      return `/uploads/photos/${randomName}`;
    } catch (err: any) {
      this.logger.error(`Error processing photo with sharp: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to process and optimize photo');
    }
  }

  async saveFile(buffer: Buffer, filename: string, _mimeType: string): Promise<string> {
    const ext = path.extname(filename) || '.bin';
    const safeName = `${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(this.baseUploadDir, 'documents', safeName);

    try {
      await fs.promises.writeFile(destinationPath, buffer);
      return `/uploads/documents/${safeName}`;
    } catch (err: any) {
      this.logger.error(`Error saving file: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to save file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      const diskPath = this.getFilePath(fileUrl);
      if (fs.existsSync(diskPath)) {
        await fs.promises.unlink(diskPath);
        this.logger.log(`Deleted file: ${diskPath}`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to delete file (${fileUrl}): ${err.message}`);
    }
  }

  getFilePath(fileUrl: string): string {
    const cleanUrl = fileUrl.replace(/^\/+/, '');
    const relativePart = cleanUrl.startsWith('uploads/')
      ? cleanUrl.replace(/^uploads\//, '')
      : cleanUrl;
    return path.join(this.baseUploadDir, relativePart);
  }
}
