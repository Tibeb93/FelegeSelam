import { Test, TestingModule } from '@nestjs/testing';
import { MembersExportService } from './members-export.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SITE_IDENTITY } from '../common/site-identity';

describe('MembersExportService - Church Identity Everywhere', () => {
  let service: MembersExportService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      setting: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.settingKey === 'site_identity') {
            return Promise.resolve({
              settingKey: 'site_identity',
              settingValue: {
                nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
                nameEn: 'Aemade Selam Sunday School',
                churchName: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
                churchNameEn: 'Felegeselam Kidus Giyorgis Cathedral',
              },
            });
          }
          if (where.settingKey === 'identity.church') {
            return Promise.resolve({
              settingKey: 'identity.church',
              settingValue: {
                nameAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
                nameEn: 'Felegeselam Kidus Giyorgis Cathedral',
              },
            });
          }
          if (where.settingKey === 'identity.location') {
            return Promise.resolve({
              settingKey: 'identity.location',
              settingValue: {
                townAm: 'ፍኖተ ሰላም',
                townEn: 'Finote Selam',
                zoneAm: 'ምዕራብ ጎጃም ዞን',
                zoneEn: 'West Gojjam Zone',
                combinedAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
                combinedEn: 'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam',
              },
            });
          }
          return Promise.resolve(null);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersExportService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MembersExportService>(MembersExportService);
  });

  it('should return default Felegeselam Kidus Giyorgis Cathedral branding when database has default identity', async () => {
    const branding = await service.getBranding();

    expect(branding.churchName).toBe('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል');
    expect(branding.churchNameEn).toBe('Felegeselam Kidus Giyorgis Cathedral');
    expect(branding.town).toBe('ፍኖተ ሰላም');
    expect(branding.locationLine).toContain('ፍኖተ ሰላም');
    expect(branding.locationLine).toContain('ምዕራብ ጎጃም');
    expect(branding.locationLineEn).toBe(
      'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam',
    );
    expect(branding.nameAm).toBe('አዕማደ ሰላም ሰንበት ትምህርት ቤት');
    expect(branding.nameEn).toBe('Aemade Selam Sunday School');
  });

  it('should fall back to DEFAULT_SITE_IDENTITY if prisma service is unavailable or throws', async () => {
    const serviceWithoutDb = new MembersExportService(undefined);
    const branding = await serviceWithoutDb.getBranding();

    expect(branding.churchName).toBe(DEFAULT_SITE_IDENTITY.church.nameAm);
    expect(branding.churchNameEn).toBe(DEFAULT_SITE_IDENTITY.church.nameEn);
    expect(branding.locationLine).toBe(DEFAULT_SITE_IDENTITY.location.combinedAm);
    expect(branding.locationLineEn).toBe(DEFAULT_SITE_IDENTITY.location.combinedEn);
    expect(branding.town).toBe('ፍኖተ ሰላም');
  });

  it('should dynamically adapt when church name or town is updated in settings without code change', async () => {
    mockPrisma.setting.findUnique.mockImplementation(({ where }: any) => {
      if (where.settingKey === 'identity.church') {
        return Promise.resolve({
          settingKey: 'identity.church',
          settingValue: {
            nameAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (የተሻሻለ)',
            nameEn: 'Felegeselam Kidus Giyorgis Cathedral (Updated)',
          },
        });
      }
      if (where.settingKey === 'identity.location') {
        return Promise.resolve({
          settingKey: 'identity.location',
          settingValue: {
            townAm: 'ፍኖተ ሰላም',
            townEn: 'Finote Selam',
            combinedAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (የተሻሻለ)፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
            combinedEn: 'Felegeselam Kidus Giyorgis Cathedral (Updated), Finote Selam, West Gojjam',
          },
        });
      }
      return Promise.resolve(null);
    });

    const branding = await service.getBranding();
    expect(branding.churchName).toBe('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (የተሻሻለ)');
    expect(branding.churchNameEn).toBe('Felegeselam Kidus Giyorgis Cathedral (Updated)');
    expect(branding.locationLine).toContain('ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (የተሻሻለ)');
  });
});
