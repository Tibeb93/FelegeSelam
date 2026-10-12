import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { HttpStatus } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            isHealthy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 200 when database is healthy', async () => {
    jest.spyOn(prismaService, 'isHealthy').mockResolvedValue(true);
    const res = mockResponse();

    await controller.checkHealth(res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        services: {
          database: {
            status: 'up',
          },
        },
      }),
    );
  });

  it('should return 503 when database is unhealthy', async () => {
    jest.spyOn(prismaService, 'isHealthy').mockResolvedValue(false);
    const res = mockResponse();

    await controller.checkHealth(res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        services: {
          database: {
            status: 'down',
          },
        },
      }),
    );
  });
});
