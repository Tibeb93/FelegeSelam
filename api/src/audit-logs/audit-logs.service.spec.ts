import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let prisma: PrismaService;

  const mockLogs = [
    {
      id: '1',
      action: 'LOGIN_SUCCESS',
      entity: 'user',
      entityId: 'u1',
      ip: '127.0.0.1',
      oldValue: null,
      newValue: { status: 'success' },
      createdAt: new Date(),
      user: {
        id: 'u1',
        email: 'admin@aemade.org',
        phone: '+251911223344',
        role: { name: 'super_admin' },
        member: { firstName: 'Admin', fatherName: 'User' },
      },
    },
  ];

  const mockPrisma = {
    auditLog: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue(mockLogs),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all audit logs with pagination and filters', async () => {
    const res = await service.findAll({
      page: 1,
      limit: 20,
      search: 'LOGIN',
      action: 'LOGIN_SUCCESS',
      entity: 'user',
      fromDate: '2026-01-01',
      toDate: '2026-12-31',
    });

    expect(res).toHaveProperty('data');
    expect(res.data.length).toBe(1);
    expect(res.meta.total).toBe(1);
  });

  it('should export audit logs to excel buffer', async () => {
    const buffer = await service.exportToExcel({
      format: 'xlsx',
      search: 'LOGIN',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
