import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { BadRequestException } from '@nestjs/common';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;
  let service: AuditLogsService;

  const mockAuditLogsService = {
    findAll: jest.fn().mockResolvedValue({
      data: [{ id: '1', action: 'LOGIN_SUCCESS', entity: 'user' }],
      meta: { total: 1, page: 1, limit: 20 },
    }),
    exportToExcel: jest.fn().mockResolvedValue(Buffer.from('excel-data')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    service = module.get<AuditLogsService>(AuditLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list audit logs', async () => {
    const res = await controller.findAll({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should export audit logs to excel', async () => {
    const mockRes: any = { set: jest.fn() };
    const stream = await controller.exportToExcel({ format: 'xlsx' } as any, mockRes);
    expect(stream).toBeDefined();
    expect(service.exportToExcel).toHaveBeenCalled();
  });

  it('should reject invalid format', async () => {
    const mockRes: any = { set: jest.fn() };
    await expect(
      controller.exportToExcel({ format: 'pdf' } as any, mockRes),
    ).rejects.toThrow(BadRequestException);
  });
});
