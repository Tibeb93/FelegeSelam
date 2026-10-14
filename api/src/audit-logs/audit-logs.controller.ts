import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogDto, ExportAuditLogDto } from './dto/audit-log.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/auth.decorator';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'List system audit logs with filters (super_admin only)',
  })
  @ApiResponse({ status: 200, description: 'Paginated audit log entries' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogsService.findAll(query);
  }

  @Get('export')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Export system audit trail to Excel (.xlsx) (super_admin only)',
  })
  async exportToExcel(
    @Query() query: ExportAuditLogDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (query.format !== 'xlsx') {
      throw new BadRequestException('Format must be "xlsx"');
    }

    const buffer = await this.auditLogsService.exportToExcel(query);

    const filename = `AuditLog_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
