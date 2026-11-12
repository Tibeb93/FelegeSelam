import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as sharpModule from 'sharp';
const sharp = (sharpModule as any).default || sharpModule;
import { IStorageService, AudioPresignedUploadResult, AudioHealthResult } from './storage.interface';
import { S3SignerConfig, generateS3PresignedUrl, getS3PublicUrl } from './s3-signer.util';
import { extractAudioMetadata } from '../common/utils/audio-metadata.util';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.resolve(process.cwd(), 'uploads');
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

  private get cloudinaryConfig() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (cloudName && apiKey && apiSecret) {
      return { cloudName, apiKey, apiSecret };
    }
    return null;
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
    originalFilename?: string,
  ): Promise<string | null> {
    const config = this.cloudinaryConfig;
    if (!config) return null;

    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const formData = new FormData();
      const ext = originalFilename ? path.extname(originalFilename) : '';
      const filename = `${crypto.randomUUID()}${ext}`;
      formData.append('file', new Blob([new Uint8Array(buffer)]), filename);
      formData.append('api_key', config.apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
      formData.append('folder', folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.warn(
          `Cloudinary upload returned ${response.status}: ${errorText}. Falling back to local storage.`,
        );
        return null;
      }

      const data = (await response.json()) as { secure_url?: string };
      if (data?.secure_url) {
        this.logger.log(`File uploaded to Cloudinary successfully: ${data.secure_url}`);
        return data.secure_url;
      }
      return null;
    } catch (err: any) {
      this.logger.error(`Error uploading to Cloudinary: ${err.message}`, err.stack);
      return null;
    }
  }

  private get s3Config(): S3SignerConfig | null {
    const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET;
    const accessKeyId =
      process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.R2_SECRET_ACCESS_KEY;
    if (bucket && accessKeyId && secretAccessKey) {
      return {
        bucket,
        accessKeyId,
        secretAccessKey,
        endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT,
        region: process.env.S3_REGION || process.env.AWS_DEFAULT_REGION || 'auto',
        publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL,
      };
    }
    return null;
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string | null> {
    const config = this.s3Config;
    if (!config) return null;
    try {
      const putUrl = generateS3PresignedUrl(config, 'PUT', key, 900, mimeType);
      const res = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: new Blob([new Uint8Array(buffer)]),
      });
      if (res.ok) {
        return getS3PublicUrl(config, key);
      }
      const errText = await res.text();
      this.logger.warn(`S3 upload returned ${res.status}: ${errText}`);
      return null;
    } catch (err: any) {
      this.logger.error(`Error uploading to S3: ${err.message}`, err.stack);
      return null;
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

    try {
      const optimizedBuffer = await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toBuffer();

      const cloudUrl = await this.uploadToCloudinary(
        optimizedBuffer,
        'felegeselam/photos',
        'image',
        randomName,
      );
      if (cloudUrl) {
        return cloudUrl;
      }

      const destinationPath = path.join(this.baseUploadDir, 'photos', randomName);
      await fs.promises.writeFile(destinationPath, optimizedBuffer);
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

    try {
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      const cloudUrl = await this.uploadToCloudinary(
        optimizedBuffer,
        'felegeselam/posts',
        'image',
        randomName,
      );
      if (cloudUrl) {
        return cloudUrl;
      }

      const destinationPath = path.join(this.baseUploadDir, 'posts', randomName);
      await fs.promises.writeFile(destinationPath, optimizedBuffer);

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

    if (type === 'audio') {
      const saved = await this.saveMezmurAudioBuffer(file.buffer, file.originalname, true);
      return saved.fileUrl;
    }

    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const isVideoExt = /\.(mp4|webm|ogg|mov)$/i.test(file.originalname || '');
    if (!videoTypes.includes(file.mimetype) && !isVideoExt) {
      throw new BadRequestException(
        `Invalid video type (${file.mimetype}). Allowed types: MP4, WebM, OGG, MOV`,
      );
    }

    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const limitMb = maxSizeBytes / (1024 * 1024);
      throw new BadRequestException(
        `Mezmur video size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds ${limitMb} MB maximum limit`,
      );
    }

    const defaultExt = path.extname(file.originalname) || '.mp4';
    const safeName = `${crypto.randomUUID()}${defaultExt}`;

    // Try Cloudinary if configured
    const cloudUrl = await this.uploadToCloudinary(
      file.buffer,
      'felegeselam/mezmurs/video',
      'video',
      file.originalname,
    );
    if (cloudUrl) {
      return cloudUrl;
    }

    const destinationPath = path.join(this.baseUploadDir, 'mezmurs', 'video', safeName);

    try {
      await fs.promises.writeFile(destinationPath, file.buffer);
      this.logger.log(`Mezmur video saved successfully: ${safeName}`);
      return `/uploads/mezmurs/video/${safeName}`;
    } catch (err: any) {
      this.logger.error(`Error saving mezmur video: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to save mezmur video file`);
    }
  }

  async saveMezmurAudioBuffer(
    buffer: Buffer,
    originalFilename: string,
    isPublic: boolean = true,
  ): Promise<{
    storageKey: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
    provider: 's3' | 'r2' | 'cloudinary' | 'local';
  }> {
    const meta = extractAudioMetadata(buffer, originalFilename);
    const ext = path.extname(originalFilename) || `.${meta.format}`;
    const storageKey = `mezmurs/audio/${crypto.randomUUID()}${ext}`;

    // 1. Try S3 / R2 if configured
    if (this.s3Config) {
      const s3Url = await this.uploadToS3(buffer, storageKey, meta.mimeType);
      if (s3Url) {
        const fileUrl = isPublic
          ? getS3PublicUrl(this.s3Config, storageKey)
          : await this.getAudioPlaybackUrl(storageKey, false);
        return {
          storageKey,
          fileUrl,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes,
          durationSeconds: meta.durationSeconds,
          provider: process.env.R2_BUCKET ? 'r2' : 's3',
        };
      }
    }

    // 2. Try Cloudinary if configured
    if (this.cloudinaryConfig) {
      const cloudUrl = await this.uploadToCloudinary(
        buffer,
        'felegeselam/mezmurs/audio',
        'video',
        originalFilename,
      );
      if (cloudUrl) {
        return {
          storageKey,
          fileUrl: cloudUrl,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes,
          durationSeconds: meta.durationSeconds,
          provider: 'cloudinary',
        };
      }
    }

    // 3. Fallback to Local Persistent Disk / Volume
    const destPath = path.join(this.baseUploadDir, storageKey);
    this.ensureDirectoryExists(path.dirname(destPath));
    await fs.promises.writeFile(destPath, buffer);
    this.logger.log(`Audio saved to local persistent storage: ${storageKey}`);

    const fileUrl = isPublic
      ? `/api/v1/mezmurs/stream/${encodeURIComponent(storageKey)}`
      : `/api/v1/mezmurs/stream/${encodeURIComponent(storageKey)}?token=${this.createStreamToken(storageKey, 3600)}`;

    return {
      storageKey,
      fileUrl,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      durationSeconds: meta.durationSeconds,
      provider: 'local',
    };
  }

  async getPresignedAudioUpload(
    filename: string,
    mimeType: string,
    isPublic: boolean = true,
  ): Promise<AudioPresignedUploadResult> {
    const ext = (path.extname(filename) || '').toLowerCase() || '.mp3';
    const allowedExts = ['.mp3', '.m4a', '.ogg', '.wav', '.aac'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Only MP3, M4A, OGG, and WAV audio formats are supported.');
    }

    const storageKey = `mezmurs/audio/${crypto.randomUUID()}${ext}`;

    // S3 / R2 Presigned PUT
    if (this.s3Config) {
      const uploadUrl = generateS3PresignedUrl(this.s3Config, 'PUT', storageKey, 900, mimeType);
      return {
        uploadUrl,
        storageKey,
        provider: process.env.R2_BUCKET ? 'r2' : 's3',
        publicUrl: isPublic ? getS3PublicUrl(this.s3Config, storageKey) : undefined,
        headers: {
          'Content-Type': mimeType,
        },
      };
    }

    // Cloudinary Direct Upload
    if (this.cloudinaryConfig) {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'felegeselam/mezmurs/audio';
      const paramsToSign = `folder=${folder}&public_id=${storageKey}&timestamp=${timestamp}${this.cloudinaryConfig.apiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      return {
        uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloudName}/video/upload`,
        storageKey,
        provider: 'cloudinary',
        fields: {
          api_key: this.cloudinaryConfig.apiKey,
          timestamp: String(timestamp),
          signature,
          folder,
          public_id: storageKey,
        },
      };
    }

    // Local API direct upload fallback
    return {
      uploadUrl: '/api/v1/mezmurs/upload-direct',
      storageKey,
      provider: 'local',
      headers: {
        'X-Storage-Key': storageKey,
      },
    };
  }

  async getAudioPlaybackUrl(
    storageKey?: string | null,
    isPublic: boolean = true,
    fallbackUrl?: string | null,
  ): Promise<string> {
    if (!storageKey) {
      return fallbackUrl || '';
    }

    // S3 / R2
    if (this.s3Config) {
      if (isPublic) {
        return getS3PublicUrl(this.s3Config, storageKey);
      }
      return generateS3PresignedUrl(this.s3Config, 'GET', storageKey, 3600);
    }

    // Cloudinary
    if (this.cloudinaryConfig && (fallbackUrl?.includes('cloudinary.com') || storageKey.startsWith('felegeselam/'))) {
      if (fallbackUrl) return fallbackUrl;
      return `https://res.cloudinary.com/${this.cloudinaryConfig.cloudName}/video/upload/${storageKey}`;
    }

    // Local stream with range support
    if (isPublic) {
      return `/api/v1/mezmurs/stream/${encodeURIComponent(storageKey)}`;
    }
    const token = this.createStreamToken(storageKey, 3600);
    return `/api/v1/mezmurs/stream/${encodeURIComponent(storageKey)}?token=${token}`;
  }

  async checkAudioHealth(
    storageKey?: string | null,
    fallbackUrl?: string | null,
  ): Promise<AudioHealthResult> {
    if (!storageKey && !fallbackUrl) {
      return { available: false, status: 'missing', provider: 'unknown' };
    }

    // If local or starts with /uploads/ or storageKey without http
    const targetKey = storageKey || (fallbackUrl?.startsWith('/uploads/') ? fallbackUrl : null);
    if (targetKey && !targetKey.startsWith('http://') && !targetKey.startsWith('https://')) {
      const diskPath = this.getFilePath(targetKey);
      if (fs.existsSync(diskPath)) {
        const stat = fs.statSync(diskPath);
        if (stat.size > 0) {
          return { available: true, status: 'available', provider: 'local', sizeBytes: stat.size };
        }
      }
      // Check if sample audio
      if (targetKey.includes('sample-orthodox-chime.wav')) {
        const samplePath = path.join(this.baseUploadDir, 'mezmurs', 'audio', 'sample-orthodox-chime.wav');
        if (fs.existsSync(samplePath)) {
          return { available: true, status: 'available', provider: 'local', sizeBytes: fs.statSync(samplePath).size };
        }
      }
      return { available: false, status: 'missing', provider: 'local' };
    }

    // Remote HTTP / S3 / Cloudinary
    const checkUrl = fallbackUrl || (this.s3Config ? getS3PublicUrl(this.s3Config, storageKey!) : null);
    if (checkUrl && (checkUrl.startsWith('http://') || checkUrl.startsWith('https://'))) {
      try {
        const res = await fetch(checkUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const length = res.headers.get('content-length');
          return {
            available: true,
            status: 'available',
            provider: checkUrl.includes('cloudinary') ? 'cloudinary' : 's3',
            sizeBytes: length ? parseInt(length, 10) : undefined,
          };
        }
      } catch {
        // Fall through to missing
      }
      return {
        available: false,
        status: 'missing',
        provider: checkUrl.includes('cloudinary') ? 'cloudinary' : 's3',
      };
    }

    return { available: false, status: 'missing', provider: 'unknown' };
  }

  createStreamToken(storageKey: string, expiresInSeconds: number = 3600): string {
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_audio_stream_secret_key_32_chars';
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${storageKey}:${expiresAt}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `${expiresAt}.${sig}`;
  }

  verifyStreamToken(storageKey: string, token: string): boolean {
    if (!token || !token.includes('.')) return false;
    const [expStr, sig] = token.split('.');
    const expiresAt = parseInt(expStr, 10);
    if (isNaN(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
      return false;
    }
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_audio_stream_secret_key_32_chars';
    const payload = `${storageKey}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return sig === expectedSig;
  }

  getStreamableFile(storageKey: string): { exists: boolean; fullPath: string; size: number; mimeType: string } {
    const cleanKey = storageKey.replace(/^\/+/, '').replace(/^uploads\//, '');
    const fullPath = path.join(this.baseUploadDir, cleanKey);
    if (!fs.existsSync(fullPath)) {
      // Check if sample audio
      if (cleanKey.includes('sample-orthodox-chime.wav')) {
        const samplePath = path.join(this.baseUploadDir, 'mezmurs', 'audio', 'sample-orthodox-chime.wav');
        if (fs.existsSync(samplePath)) {
          const stat = fs.statSync(samplePath);
          return { exists: true, fullPath: samplePath, size: stat.size, mimeType: 'audio/wav' };
        }
      }
      return { exists: false, fullPath, size: 0, mimeType: 'application/octet-stream' };
    }
    const stat = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.aac': 'audio/aac',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac',
    };
    return {
      exists: true,
      fullPath,
      size: stat.size,
      mimeType: mimeMap[ext] || 'audio/mpeg',
    };
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

    // Try Cloudinary if configured
    const cloudUrl = await this.uploadToCloudinary(
      file.buffer,
      `felegeselam/branding/${type}`,
      'image',
      file.originalname,
    );
    if (cloudUrl) {
      return cloudUrl;
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
