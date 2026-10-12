import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/auth.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check API and Database Health' })
  @ApiResponse({
    status: 200,
    description: 'API and database are healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-10-12T10:00:00.000Z',
        uptime: 12.5,
        services: {
          database: {
            status: 'up',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service or database is unhealthy',
  })
  async checkHealth(@Res() res: Response) {
    const isDbHealthy = await this.prisma.isHealthy();
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    const responsePayload = {
      status: isDbHealthy ? 'ok' : 'error',
      timestamp,
      uptime,
      services: {
        database: {
          status: isDbHealthy ? 'up' : 'down',
        },
      },
    };

    if (isDbHealthy) {
      return res.status(HttpStatus.OK).json(responsePayload);
    } else {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(responsePayload);
    }
  }
}
