import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;
  let storage: StorageService;

  const mockSettingsService = {
    getPublicSettings: jest.fn().mockResolvedValue({ siteIdentity: { nameAm: 'አዕማደ ሰላም' } }),
    getCalendarSettings: jest.fn().mockResolvedValue({ fastingSeasons: [], majorFeasts: [] }),
    upsertSetting: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
    findAll: jest.fn().mockResolvedValue([{ settingKey: 'k', settingValue: {} }]),
    findOne: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
    batchUpdate: jest.fn().mockResolvedValue([{ settingKey: 'k', settingValue: {} }]),
    getRolesMatrix: jest.fn().mockResolvedValue({ modules: [], roles: [] }),
    updateRolesMatrix: jest.fn().mockResolvedValue([]),
    getDangerStats: jest.fn().mockResolvedValue({ softDeletedMembers: 0, totalAuditLogs: 10 }),
    restoreSoftDeletedMembers: jest.fn().mockResolvedValue({ restoredCount: 0 }),
    purgeAuditLogs: jest.fn().mockResolvedValue({ purgedCount: 5 }),
    generateBackup: jest.fn().mockResolvedValue({ metadata: {}, data: {} }),
    getVersions: jest.fn().mockResolvedValue([]),
    restoreVersion: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
    resetToDefault: jest.fn().mockResolvedValue({ settingKey: 'k', settingValue: {} }),
  };

  const mockStorageService = {
    saveBrandingImage: jest.fn().mockResolvedValue('/uploads/branding/logo.png'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
    storage = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return public settings', async () => {
    const result = await controller.getPublicSettings();
    expect(result).toHaveProperty('siteIdentity');
    expect(service.getPublicSettings).toHaveBeenCalled();
  });

  it('should get and update roles matrix', async () => {
    await controller.getRolesMatrix();
    expect(service.getRolesMatrix).toHaveBeenCalled();

    await controller.updateRolesMatrix({ matrix: [{ roleId: 1, permissions: ['*'] }] }, 'admin-1');
    expect(service.updateRolesMatrix).toHaveBeenCalledWith(
      [{ roleId: 1, permissions: ['*'] }],
      'admin-1',
    );
  });

  it('should handle danger zone operations', async () => {
    await controller.getDangerStats();
    expect(service.getDangerStats).toHaveBeenCalled();

    await controller.restoreSoftDeletedMembers({ confirmation: 'RESTORE' }, 'admin-1');
    expect(service.restoreSoftDeletedMembers).toHaveBeenCalledWith('RESTORE', 'admin-1');

    await controller.purgeAuditLogs({ confirmation: 'PURGE', days: 30 }, 'admin-1');
    expect(service.purgeAuditLogs).toHaveBeenCalledWith('PURGE', 30, 'admin-1');

    await controller.generateBackup({ confirmation: 'BACKUP' }, 'admin-1');
    expect(service.generateBackup).toHaveBeenCalledWith('BACKUP', 'admin-1');
  });

  it('should upload branding image via StorageService', async () => {
    const fakeFile = {
      buffer: Buffer.from('test'),
      mimetype: 'image/png',
      size: 100,
    } as any;

    const res = await controller.uploadBranding(fakeFile, 'logo');
    expect(res).toHaveProperty('fileUrl', '/uploads/branding/logo.png');
    expect(storage.saveBrandingImage).toHaveBeenCalledWith(fakeFile, 'logo');
  });

  it('should get versions and restore version', async () => {
    await controller.getVersions('site_identity');
    expect(service.getVersions).toHaveBeenCalledWith('site_identity');

    await controller.restoreVersion('site_identity', 'ver-1', 'admin-1');
    expect(service.restoreVersion).toHaveBeenCalledWith('site_identity', 'ver-1', 'admin-1');
  });
});
