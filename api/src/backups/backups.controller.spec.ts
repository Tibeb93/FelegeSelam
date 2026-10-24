import { Test, TestingModule } from '@nestjs/testing';
import { BackupsController } from './backups.controller';
import { BackupsService } from './backups.service';

describe('BackupsController', () => {
  let controller: BackupsController;
  let service: BackupsService;

  const mockBackupsService = {
    performBackup: jest.fn().mockResolvedValue({ filename: 'backup.sql.gz', size: 1024 }),
    listBackups: jest.fn().mockResolvedValue([{ filename: 'backup.sql.gz', size: 1024 }]),
    getBackupStream: jest.fn().mockReturnValue({ stream: 'stream', filename: 'backup.sql.gz' }),
    deleteBackup: jest.fn().mockResolvedValue({ message: 'Deleted' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackupsController],
      providers: [
        {
          provide: BackupsService,
          useValue: mockBackupsService,
        },
      ],
    }).compile();

    controller = module.get<BackupsController>(BackupsController);
    service = module.get<BackupsService>(BackupsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should trigger backup', async () => {
    const res = await controller.createBackup('admin-id');
    expect(res).toHaveProperty('filename');
    expect(service.performBackup).toHaveBeenCalledWith('admin-id');
  });

  it('should list backups', async () => {
    const res = await controller.listBackups();
    expect(Array.isArray(res)).toBe(true);
    expect(service.listBackups).toHaveBeenCalled();
  });

  it('should delete backup', async () => {
    const res = await controller.deleteBackup('backup.sql.gz');
    expect(res).toEqual({ message: 'Deleted' });
    expect(service.deleteBackup).toHaveBeenCalledWith('backup.sql.gz');
  });
});
