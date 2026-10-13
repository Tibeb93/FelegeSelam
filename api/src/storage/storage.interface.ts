export interface IStorageService {
  saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  savePhoto(file: Express.Multer.File): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFilePath(fileUrl: string): string;
}
