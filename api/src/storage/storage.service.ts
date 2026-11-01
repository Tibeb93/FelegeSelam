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
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'posts'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'documents'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'lessons', 'pdf'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'lessons', 'audio'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'lessons', 'video'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'mezmurs', 'audio'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'mezmurs', 'video'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'forms'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'branding'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'payments'));
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

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/pjpeg',
      'image/jfif',
      'image/x-png',
    ];
    const isImageExt = /\.(jpe?g|png|webp|jfif)$/i.test(file.originalname || '');
    if (!allowedMimeTypes.includes(file.mimetype) && !isImageExt) {
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

  async savePostImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/pjpeg',
      'image/jfif',
      'image/x-png',
    ];
    const isImageExt = /\.(jpe?g|png|webp|jfif)$/i.test(file.originalname || '');
    if (!allowedMimeTypes.includes(file.mimetype) && !isImageExt) {
      throw new BadRequestException(
        `Invalid image type (${file.mimetype}). Allowed types: JPEG, PNG, WebP`,
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `Image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB maximum limit`,
      );
    }

    const randomName = `${crypto.randomUUID()}.webp`;
    const destinationPath = path.join(this.baseUploadDir, 'posts', randomName);

    try {
      await sharp(file.buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(destinationPath);

      this.logger.log(`Post image saved successfully: ${randomName}`);
      return `/uploads/posts/${randomName}`;
    } catch (err: any) {
      this.logger.error(`Error processing post image with sharp: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to process and optimize post image');
    }
  }

  async saveLessonMedia(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; mediaType: 'pdf' | 'audio' | 'video' }> {
    if (!file) {
      throw new BadRequestException('No lesson media file provided');
    }

    const pdfTypes = [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'applications/vnd.pdf',
      'text/pdf',
    ];
    const audioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/webm',
    ];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    const isPdfExt = (file.originalname || '').toLowerCase().endsWith('.pdf');
    const isAudioExt = /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.originalname || '');
    const isVideoExt = /\.(mp4|webm|ogg|mov)$/i.test(file.originalname || '');

    let mediaType: 'pdf' | 'audio' | 'video';
    let maxSizeBytes: number;
    let defaultExt: string;

    if (pdfTypes.includes(file.mimetype) || isPdfExt) {
      mediaType = 'pdf';
      maxSizeBytes = 15 * 1024 * 1024; // 15 MB
      defaultExt = '.pdf';
    } else if (audioTypes.includes(file.mimetype) || isAudioExt) {
      mediaType = 'audio';
      maxSizeBytes = 25 * 1024 * 1024; // 25 MB
      defaultExt = path.extname(file.originalname) || '.mp3';
    } else if (videoTypes.includes(file.mimetype) || isVideoExt) {
      mediaType = 'video';
      maxSizeBytes = 50 * 1024 * 1024; // 50 MB
      defaultExt = path.extname(file.originalname) || '.mp4';
    } else {
      throw new BadRequestException(
        `Invalid lesson media type (${file.mimetype}). Allowed types: PDF, Audio (MP3/WAV/OGG/AAC), Video (MP4/WebM/OGG/MOV)`,
      );
    }

    if (file.size > maxSizeBytes) {
      const limitMb = maxSizeBytes / (1024 * 1024);
      throw new BadRequestException(
        `Lesson ${mediaType} size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds ${limitMb} MB maximum limit`,
      );
    }

    const safeName = `${crypto.randomUUID()}${defaultExt}`;
    const destinationPath = path.join(this.baseUploadDir, 'lessons', mediaType, safeName);

    try {
      await fs.promises.writeFile(destinationPath, file.buffer);
      this.logger.log(`Lesson ${mediaType} saved successfully: ${safeName}`);
      return {
        fileUrl: `/uploads/lessons/${mediaType}/${safeName}`,
        mediaType,
      };
    } catch (err: any) {
      this.logger.error(`Error saving lesson media: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to save lesson media file');
    }
  }

  async saveMezmurMedia(file: Express.Multer.File, type: 'audio' | 'video'): Promise<string> {
    if (!file) {
      throw new BadRequestException(`No mezmur ${type} file provided`);
    }

    const audioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/webm',
      'audio/x-m4a',
      'audio/m4a',
      'audio/flac',
      'audio/x-flac',
    ];
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

    const isAudioExt = /\.(mp3|wav|ogg|m4a|aac|webm|flac)$/i.test(file.originalname || '');
    if (type === 'audio' && !audioTypes.includes(file.mimetype) && !isAudioExt) {
      throw new BadRequestException(
        `Invalid audio type (${file.mimetype}). Allowed types: MP3, WAV, OGG, M4A, AAC, WebM`,
      );
    }
    if (type === 'video' && !videoTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video type (${file.mimetype}). Allowed types: MP4, WebM, OGG, MOV`,
      );
    }

    const maxSizeBytes = type === 'audio' ? 25 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const limitMb = maxSizeBytes / (1024 * 1024);
      throw new BadRequestException(
        `Mezmur ${type} size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds ${limitMb} MB maximum limit`,
      );
    }

    const defaultExt = path.extname(file.originalname) || (type === 'audio' ? '.mp3' : '.mp4');
    const safeName = `${crypto.randomUUID()}${defaultExt}`;
    const destinationPath = path.join(this.baseUploadDir, 'mezmurs', type, safeName);

    try {
      await fs.promises.writeFile(destinationPath, file.buffer);
      this.logger.log(`Mezmur ${type} saved successfully: ${safeName}`);
      return `/uploads/mezmurs/${type}/${safeName}`;
    } catch (err: any) {
      this.logger.error(`Error saving mezmur ${type}: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to save mezmur ${type} file`);
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

  async saveFormFieldFile(
    file: Express.Multer.File,
    options?: { allowedMimeTypes?: string[]; maxSizeBytes?: number },
  ): Promise<{ fileUrl: string; originalName: string; size: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }

    const defaultAllowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    const allowedMimes =
      options?.allowedMimeTypes && options.allowedMimeTypes.length > 0
        ? options.allowedMimeTypes
        : defaultAllowedMimes;

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type (${file.mimetype}). Allowed types: ${allowedMimes.join(', ')}`,
      );
    }

    const maxSizeBytes = options?.maxSizeBytes || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum limit of ${(
          maxSizeBytes /
          (1024 * 1024)
        ).toFixed(2)} MB`,
      );
    }

    const formsDir = path.join(this.baseUploadDir, 'forms');
    this.ensureDirectoryExists(formsDir);

    const ext = path.extname(file.originalname) || '';
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.bin';
    const randomName = `${crypto.randomUUID()}${safeExt}`;
    const destinationPath = path.join(formsDir, randomName);

    try {
      await fs.promises.writeFile(destinationPath, file.buffer);
      return {
        fileUrl: `/uploads/forms/${randomName}`,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (err: any) {
      this.logger.error(`Error saving form field file: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to save uploaded file');
    }
  }

  async saveBrandingImage(
    file: Express.Multer.File,
    type: 'logo' | 'favicon' | 'hero',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No branding image file provided');
    }

    if (type === 'logo') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid logo file type (${file.mimetype}). Allowed types: PNG, JPEG, WebP, SVG`,
        );
      }
      const maxSizeBytes = 2 * 1024 * 1024; // 2 MB
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `Logo file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 2 MB maximum limit`,
        );
      }

      const brandingDir = path.join(this.baseUploadDir, 'branding');
      this.ensureDirectoryExists(brandingDir);

      if (file.mimetype === 'image/svg+xml') {
        const randomName = `logo-${crypto.randomUUID()}.svg`;
        const dest = path.join(brandingDir, randomName);
        await fs.promises.writeFile(dest, file.buffer);
        this.logger.log(`Branding SVG logo saved: ${randomName}`);
        return `/uploads/branding/${randomName}`;
      } else {
        const randomName = `logo-${crypto.randomUUID()}.png`;
        const dest = path.join(brandingDir, randomName);
        try {
          await sharp(file.buffer)
            .resize(512, 512, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .png({ quality: 90 })
            .toFile(dest);
          this.logger.log(`Branding raster logo saved: ${randomName}`);
          return `/uploads/branding/${randomName}`;
        } catch (err: any) {
          this.logger.error(`Error resizing logo with sharp: ${err.message}`, err.stack);
          throw new BadRequestException('Failed to process and optimize logo image');
        }
      }
    } else if (type === 'favicon') {
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/svg+xml',
      ];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid favicon type (${file.mimetype}). Allowed: PNG, ICO, SVG, JPEG, WebP`,
        );
      }
      const maxSizeBytes = 1 * 1024 * 1024; // 1 MB
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `Favicon file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 1 MB limit`,
        );
      }

      const brandingDir = path.join(this.baseUploadDir, 'branding');
      this.ensureDirectoryExists(brandingDir);

      if (file.mimetype === 'image/svg+xml' || file.mimetype.includes('icon')) {
        const ext = file.mimetype === 'image/svg+xml' ? 'svg' : 'ico';
        const randomName = `favicon-${crypto.randomUUID()}.${ext}`;
        const dest = path.join(brandingDir, randomName);
        await fs.promises.writeFile(dest, file.buffer);
        return `/uploads/branding/${randomName}`;
      } else {
        const randomName = `favicon-${crypto.randomUUID()}.png`;
        const dest = path.join(brandingDir, randomName);
        await sharp(file.buffer).resize(64, 64, { fit: 'inside' }).png().toFile(dest);
        return `/uploads/branding/${randomName}`;
      }
    } else if (type === 'hero') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid hero image type (${file.mimetype}). Allowed: JPEG, PNG, WebP`,
        );
      }
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSizeBytes) {
        throw new BadRequestException(
          `Hero image size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB limit`,
        );
      }

      const brandingDir = path.join(this.baseUploadDir, 'branding');
      this.ensureDirectoryExists(brandingDir);

      const randomName = `hero-${crypto.randomUUID()}.webp`;
      const dest = path.join(brandingDir, randomName);
      try {
        await sharp(file.buffer)
          .resize(1920, 1080, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toFile(dest);
        return `/uploads/branding/${randomName}`;
      } catch (err: any) {
        this.logger.error(`Error resizing hero image: ${err.message}`, err.stack);
        throw new BadRequestException('Failed to process hero image');
      }
    }

    throw new BadRequestException(`Unknown branding image type: ${type}`);
  }

  async savePaymentProof(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No payment proof file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid proof file format (${file.mimetype}). Only JPEG, PNG, WebP, and PDF are allowed.`,
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `Proof file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5 MB maximum limit.`,
      );
    }

    const isPdf = file.mimetype === 'application/pdf';
    const ext = isPdf ? 'pdf' : file.mimetype === 'image/png' ? 'png' : 'webp';
    const randomName = `${crypto.randomUUID()}.${ext}`;
    const destinationPath = path.join(this.baseUploadDir, 'payments', randomName);

    if (isPdf) {
      await fs.promises.writeFile(destinationPath, file.buffer);
      this.logger.log(`Payment proof PDF saved: ${randomName}`);
      return `/uploads/payments/${randomName}`;
    }

    try {
      await sharp(file.buffer)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(destinationPath);

      this.logger.log(`Payment proof image processed and saved: ${randomName}`);
      return `/uploads/payments/${randomName}`;
    } catch (err: any) {
      this.logger.error(`Error processing proof image: ${err.message}`, err.stack);
      throw new BadRequestException('Failed to process payment proof image');
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
