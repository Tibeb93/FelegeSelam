import { Test, TestingModule } from '@nestjs/testing';
import { ContributionsService } from './contributions.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionsReceiptService } from './contributions-receipt.service';

describe('ContributionsService', () => {
  let service: ContributionsService;

  const mockContribution = {
    id: 'c1',
    receiptNo: 'REC-2026-0001',
    memberId: 'm1',
    amount: 500,
    type: 'monthly',
    paymentMethod: 'telebirr',
    reference: 'REF123',
    date: new Date(),
    recordedById: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
    member: { id: 'm1', memberNo: 'AS-0001', firstName: 'John' },
  };

  const mockPrisma = {
    contribution: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockContribution),
      findMany: jest.fn().mockResolvedValue([mockContribution]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockImplementation(async ({ where }: any) => {
        if (where?.receiptNo) return null;
        return mockContribution;
      }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 5000 }, _count: { id: 10 } }),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ type: 'monthly', _sum: { amount: 5000 }, _count: { id: 10 } }]),
    },
    member: {
      findUnique: jest.fn().mockResolvedValue({ id: 'm1', firstName: 'John' }),
      findFirst: jest.fn().mockResolvedValue({ id: 'm1', firstName: 'John' }),
    },
  };

  const mockReceiptService = {
    generateReceiptPdf: jest
      .fn()
      .mockResolvedValue({ buffer: Buffer.from('pdf'), filename: 'receipt.pdf' }),
    exportContributionsExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ContributionsReceiptService, useValue: mockReceiptService },
      ],
    }).compile();

    service = module.get<ContributionsService>(ContributionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate receipt number', async () => {
    const no = await service.generateReceiptNumber();
    expect(no).toMatch(/^REC-\d{4}-0001$/);
  });

  it('should create contribution', async () => {
    const res = await service.createContribution(
      {
        memberId: 'm1',
        amount: 500,
        type: 'monthly',
        paymentMethod: 'telebirr',
      } as any,
      'u1',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.contribution.create).toHaveBeenCalled();
  });

  it('should find all contributions with pagination', async () => {
    const res = await service.findAll({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one contribution', async () => {
    const res = await service.findOne('c1');
    expect(res).toHaveProperty('id', 'c1');
  });

  it('should get school summary', async () => {
    const res = await service.getSchoolSummary({} as any);
    expect(res).toHaveProperty('totalAmount');
    expect(res).toHaveProperty('totalCount');
  });
});
