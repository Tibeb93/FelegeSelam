import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    member: {
      count: jest.fn().mockResolvedValue(10),
      findMany: jest.fn().mockResolvedValue([{ dateOfBirth: '2000-01-01' }, { dateOfBirth: null }]),
    },
    department: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 1, nameAm: 'መዝሙር', nameEn: 'Mezmur', _count: { members: 5 } }]),
    },
    course: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'c1',
          titleAm: 'ነገረ መለኮት',
          attendances: [{ status: 'present' }, { status: 'absent' }],
        },
      ]),
    },
    post: {
      count: jest.fn().mockResolvedValue(3),
    },
    form: {
      count: jest.fn().mockResolvedValue(2),
    },
    event: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: 'e1', title: 'ጉባኤ', location: 'አዳራሽ', startAt: new Date(), capacity: 100 },
        ]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate complete dashboard metrics', async () => {
    const dashboard = await service.getDashboard();
    expect(dashboard).toHaveProperty('summary');
    expect(dashboard.summary.totalMembers).toBe(10);
    expect(dashboard.membersPerMonth.length).toBe(12);
    expect(dashboard.membersByDepartment.length).toBeGreaterThan(0);
    expect(dashboard.membersByAgeGroup).toBeDefined();
    expect(dashboard.attendanceRatePerCourse.length).toBe(1);
    expect(dashboard.attendanceRatePerCourse[0].attendanceRate).toBe(50);
  });
});
