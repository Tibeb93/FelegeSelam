import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService, DEFAULT_SETTINGS } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockPrisma = {
    setting: {
      findMany: jest.fn().mockResolvedValue([
        { settingKey: 'school_profile', settingValue: DEFAULT_SETTINGS.school_profile },
        { settingKey: 'contact_details', settingValue: DEFAULT_SETTINGS.contact_details },
      ]),
      findUnique: jest.fn().mockResolvedValue({
        settingKey: 'school_profile',
        settingValue: DEFAULT_SETTINGS.school_profile,
      }),
      upsert: jest.fn().mockResolvedValue({
        settingKey: 'school_profile',
        settingValue: DEFAULT_SETTINGS.school_profile,
      }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.setting.findMany.mockResolvedValue([
      { settingKey: 'school_profile', settingValue: DEFAULT_SETTINGS.school_profile },
      { settingKey: 'contact_details', settingValue: DEFAULT_SETTINGS.contact_details },
    ]);
    mockPrisma.setting.findUnique.mockImplementation(async ({ where }: { where: { settingKey: string } }) => {
      return {
        settingKey: where.settingKey,
        settingValue: (DEFAULT_SETTINGS as any)[where.settingKey] || null,
      };
    });

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
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get public settings with school_profile and contact_details', async () => {
    const pub = await service.getPublicSettings();
    expect(pub).toHaveProperty('schoolProfile');
    expect(pub).toHaveProperty('contactDetails');
  });

  it('should get calendar settings', async () => {
    const cal = await service.getCalendarSettings();
    expect(cal).toHaveProperty('fastingSeasons');
  });

  it('should findAll settings and fill defaults', async () => {
    const all = await service.findAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should findOne setting or default', async () => {
    const s = await service.findOne('school_profile');
    expect(s).toHaveProperty('settingKey', 'school_profile');
  });

  it('should upsert setting', async () => {
    const res = await service.upsertSetting('school_profile', { custom: true });
    expect(res).toBeDefined();
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
  });
});
