import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { BackupsService } from './backups.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Admin Backups')
@Controller('admin')
@UseGuards(RolesGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('backup')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'Trigger an immediate database backup into /backups (super_admin only)',
  })
  @ApiResponse({ status: 201, description: 'Backup successfully created' })
  async createBackup(@CurrentUser('id') userId?: string) {
    return this.backupsService.performBackup(userId);
  }

  @Post('backups')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create backup alias for POST /admin/backup' })
  async createBackupAlias(@CurrentUser('id') userId?: string) {
    return this.backupsService.performBackup(userId);
  }

  @Get('backups')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiOperation({
    summary: 'List all database backup files in /backups (retains up to 30 files)',
  })
  async listBackups() {
    return this.backupsService.listBackups();
  }

  @Get('backups/:filename')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiParam({ name: 'filename', example: 'backup-aemade-selam-2026-10-13-11-00-00.sql' })
  @ApiOperation({ summary: 'Download a database SQL backup file' })
  async downloadBackup(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer } = this.backupsService.getBackupFile(filename);

    res.set({
      'Content-Type': 'application/sql',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Delete('backups/:filename')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin')
  @ApiParam({ name: 'filename' })
  @ApiOperation({ summary: 'Delete a backup file' })
  async deleteBackup(@Param('filename') filename: string) {
    return this.backupsService.deleteBackup(filename);
  }
}
