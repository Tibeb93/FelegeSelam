export interface IStorageService {
  saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  savePhoto(file: Express.Multer.File): Promise<string>;
  savePostImage(file: Express.Multer.File): Promise<string>;
  saveLessonMedia(
    file: Express.Multer.File,
  ): Promise<{ fileUrl: string; mediaType: 'pdf' | 'audio' | 'video' }>;
  saveMezmurMedia(file: Express.Multer.File, type: 'audio' | 'video'): Promise<string>;
  saveFormFieldFile(
    file: Express.Multer.File,
    options?: { allowedMimeTypes?: string[]; maxSizeBytes?: number },
  ): Promise<{ fileUrl: string; originalName: string; size: number; mimeType: string }>;
  deleteFile(fileUrl: string): Promise<void>;
  getFilePath(fileUrl: string): string;
}
