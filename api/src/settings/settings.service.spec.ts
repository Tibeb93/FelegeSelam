import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService, DEFAULT_SITE_SETTINGS } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrisma = {
    setting: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    settingVersion: {
      create: jest.fn().mockResolvedValue({ id: 'v1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      count: jest.fn().mockResolvedValue(5),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'a1' }),
      count: jest.fn().mockResolvedValue(12),
      deleteMany: jest.fn().mockResolvedValue({ count: 12 }),
    },
    role: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'super_admin', permissions: ['*'] },
        { id: 2, name: 'admin', permissions: ['members:read'] },
      ]),
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where.id === 1) return { id: 1, name: 'super_admin', permissions: ['*'] };
        return { id: 2, name: 'admin', permissions: ['members:read'] };
      }),
      update: jest.fn().mockImplementation(async ({ where, data }: any) => ({
        id: where.id,
        name: where.id === 1 ? 'super_admin' : 'admin',
        permissions: data.permissions,
      })),
    },
    member: {
      count: jest.fn().mockResolvedValue(100),
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, nameAm: 'ትምህርት' }]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.setting.findMany.mockResolvedValue([
      { settingKey: 'site_identity', settingValue: DEFAULT_SITE_SETTINGS.site_identity },
      { settingKey: 'appearance', settingValue: DEFAULT_SITE_SETTINGS.appearance },
    ]);
    mockPrisma.setting.findUnique.mockImplementation(
      async ({ where }: { where: { settingKey: string } }) => {
        return {
          settingKey: where.settingKey,
          settingValue: (DEFAULT_SITE_SETTINGS as any)[where.settingKey] || null,
        };
      },
    );
    mockPrisma.setting.upsert.mockImplementation(async ({ where, update, create }: any) => ({
      settingKey: where.settingKey,
      settingValue: update?.settingValue || create?.settingValue,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get public settings with siteIdentity, appearance, and homeContent', async () => {
    const pub = await service.getPublicSettings();
    expect(pub).toHaveProperty('siteIdentity');
    expect(pub).toHaveProperty('appearance');
    expect(pub).toHaveProperty('homeContent');
    expect(pub).toHaveProperty('aboutContact');
    expect(pub).toHaveProperty('systemConfig');
  });

  it('should upsert setting and record version history if existing', async () => {
    const res = await service.upsertSetting(
      'site_identity',
      { nameAm: 'አዲስ ስም' },
      'user-1',
      'Name change',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.settingVersion.create).toHaveBeenCalled();
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });

  it('should restore version when valid versionId provided', async () => {
    mockPrisma.settingVersion.findUnique.mockResolvedValueOnce({
      id: 'v-123',
      settingKey: 'site_identity',
      settingValue: { nameAm: 'የቀድሞ ስም' },
      createdAt: new Date(),
    });

    const res = await service.restoreVersion('site_identity', 'v-123', 'admin-1');
    expect(res).toBeDefined();
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { settingKey: 'site_identity' },
      }),
    );
  });

  it('should throw NotFoundException on restoring non-existent version', async () => {
    mockPrisma.settingVersion.findUnique.mockResolvedValueOnce(null);
    await expect(service.restoreVersion('site_identity', 'bad-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should reset setting to system default', async () => {
    const res = await service.resetToDefault('site_identity', 'user-1');
    expect(res.settingValue).toEqual(DEFAULT_SITE_SETTINGS.site_identity);
  });

  it('should get roles matrix with available modules', async () => {
    const matrix = await service.getRolesMatrix();
    expect(matrix).toHaveProperty('modules');
    expect(matrix).toHaveProperty('roles');
    expect(matrix.modules.some((m) => m.id === 'site_settings')).toBe(true);
  });

  it('should ensure super_admin never loses wildcard permission in updateRolesMatrix', async () => {
    await service.updateRolesMatrix([
      { roleId: 1, permissions: ['members:read'] }, // attempting to strip '*'
      { roleId: 2, permissions: ['members:read', 'site:write'] },
    ]);

    expect(mockPrisma.role.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { permissions: expect.arrayContaining(['*']) },
      }),
    );
  });

  it('should require exact "RESTORE" confirmation in restoreSoftDeletedMembers', async () => {
    await expect(service.restoreSoftDeletedMembers('WRONG')).rejects.toThrow(BadRequestException);
    const success = await service.restoreSoftDeletedMembers('RESTORE');
    expect(success).toHaveProperty('restoredCount');
    expect(mockPrisma.member.updateMany).toHaveBeenCalled();
  });

  it('should require exact "PURGE" confirmation in purgeAuditLogs', async () => {
    await expect(service.purgeAuditLogs('WRONG')).rejects.toThrow(BadRequestException);
    const success = await service.purgeAuditLogs('PURGE', 30);
    expect(success).toHaveProperty('purgedCount');
    expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalled();
  });

  it('should require exact "BACKUP" confirmation in generateBackup', async () => {
    await expect(service.generateBackup('NOPE')).rejects.toThrow(BadRequestException);
    const backup = await service.generateBackup('BACKUP');
    expect(backup).toHaveProperty('metadata');
    expect(backup).toHaveProperty('data');
  });
});
