import { Test, TestingModule } from '@nestjs/testing';
import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';

describe('ContributionsController', () => {
  let controller: ContributionsController;
  let service: ContributionsService;

  const mockContributionsService = {
    createContribution: jest.fn().mockResolvedValue({ id: 'c1', receiptNo: 'RCP-1001' }),
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    getSchoolSummary: jest.fn().mockResolvedValue({ totalAmount: 5000 }),
    getMemberSummary: jest.fn().mockResolvedValue({ memberId: 'm1', totalAmount: 500 }),
    findOne: jest.fn().mockResolvedValue({ id: 'c1', receiptNo: 'RCP-1001' }),
    update: jest.fn().mockResolvedValue({ id: 'c1', receiptNo: 'RCP-1001' }),
    delete: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    generateReceiptPdf: jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      filename: 'Receipt.pdf',
    }),
    exportToExcel: jest.fn().mockResolvedValue(Buffer.from('excel')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContributionsController],
      providers: [
        {
          provide: ContributionsService,
          useValue: mockContributionsService,
        },
      ],
    }).compile();

    controller = module.get<ContributionsController>(ContributionsController);
    service = module.get<ContributionsService>(ContributionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should record a contribution', async () => {
    const res = await controller.create({ amount: 100 } as any, 'u1');
    expect(res).toHaveProperty('receiptNo', 'RCP-1001');
    expect(service.createContribution).toHaveBeenCalled();
  });

  it('should list contributions', async () => {
    const res = await controller.findAll({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should get summary', async () => {
    const res = await controller.getSchoolSummary({} as any);
    expect(res).toHaveProperty('totalAmount', 5000);
    expect(service.getSchoolSummary).toHaveBeenCalled();
  });
});
