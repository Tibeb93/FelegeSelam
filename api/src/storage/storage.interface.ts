export interface AudioPresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  provider: 's3' | 'r2' | 'cloudinary' | 'local';
  publicUrl?: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
}

export interface AudioHealthResult {
  available: boolean;
  status: 'available' | 'missing';
  provider: string;
  sizeBytes?: number;
}

export interface IStorageService {
  saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  savePhoto(file: Express.Multer.File): Promise<string>;
  savePostImage(file: Express.Multer.File): Promise<string>;
  saveLessonMedia(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; mediaType: 'pdf' | 'audio' | 'video' }>;
  saveMezmurMedia(file: Express.Multer.File, type: 'audio' | 'video'): Promise<string>;
  saveMezmurAudioBuffer(
    buffer: Buffer,
    originalFilename: string,
    isPublic: boolean,
  ): Promise<{
    storageKey: string;
    fileUrl: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
    provider: 's3' | 'r2' | 'cloudinary' | 'local';
  }>;
  getPresignedAudioUpload(
    filename: string,
    mimeType: string,
    isPublic: boolean,
  ): Promise<AudioPresignedUploadResult>;
  getAudioPlaybackUrl(
    storageKey?: string | null,
    isPublic?: boolean,
    fallbackUrl?: string | null,
  ): Promise<string>;
  checkAudioHealth(
    storageKey?: string | null,
    fallbackUrl?: string | null,
  ): Promise<AudioHealthResult>;
  saveFormFieldFile(
    file: Express.Multer.File,
    options?: { allowedMimeTypes?: string[]; maxSizeBytes?: number },
  ): Promise<{ fileUrl: string; originalName: string; size: number; mimeType: string }>;
  saveBrandingImage(file: Express.Multer.File, type: 'logo' | 'favicon' | 'hero'): Promise<string>;
  savePaymentProof(file: Express.Multer.File): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFilePath(fileUrl: string): string;
  createStreamToken(storageKey: string, expiresInSeconds?: number): string;
  verifyStreamToken(storageKey: string, token: string): boolean;
}
