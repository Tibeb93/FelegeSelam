import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
import { BatchUpdateSettingsDto, UpdateRolesMatrixDto, DangerActionDto } from './dto/settings.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly storageService: StorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // PUBLIC ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('public')
  @Public()
  @ApiOperation({
    summary: 'Public read-only settings for website branding, appearance, and content',
  })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get('calendar')
  @Public()
  @ApiOperation({
    summary: 'Public Ethiopian calendar data with fasting seasons and feasts',
  })
  async getCalendarData() {
    return this.settingsService.getCalendarSettings();
  }

  // ---------------------------------------------------------------------------
  // ROLES & PERMISSIONS MATRIX (Super Admin / site:write)
  // ---------------------------------------------------------------------------

  @Get('roles-matrix')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Get current role permission matrix definition (Super Admin)' })
  async getRolesMatrix() {
    return this.settingsService.getRolesMatrix();
  }

  @Put('roles-matrix')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Update role permissions matrix (Super Admin)' })
  async updateRolesMatrix(@Body() dto: UpdateRolesMatrixDto, @CurrentUser('id') userId?: string) {
    return this.settingsService.updateRolesMatrix(dto.matrix, userId);
  }

  // ---------------------------------------------------------------------------
  // DANGER ZONE (Super Admin / site:write)
  // ---------------------------------------------------------------------------

  @Get('danger/stats')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Get danger zone metrics and statistics' })
  async getDangerStats() {
    return this.settingsService.getDangerStats();
  }

  @Post('danger/restore-members')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Restore soft-deleted members with typed confirmation RESTORE' })
  async restoreSoftDeletedMembers(
    @Body() dto: DangerActionDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.settingsService.restoreSoftDeletedMembers(dto.confirmation, userId);
  }

  @Post('danger/purge-audit-logs')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Purge old audit logs with typed confirmation PURGE' })
  async purgeAuditLogs(@Body() dto: DangerActionDto, @CurrentUser('id') userId?: string) {
    return this.settingsService.purgeAuditLogs(dto.confirmation, dto.days, userId);
  }

  @Post('danger/backup')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Generate system backup with typed confirmation BACKUP' })
  async generateBackup(@Body() dto: DangerActionDto, @CurrentUser('id') userId?: string) {
    return this.settingsService.generateBackup(dto.confirmation, userId);
  }

  // ---------------------------------------------------------------------------
  // BRANDING UPLOADS (Super Admin / site:write)
  // ---------------------------------------------------------------------------

  @Post('upload-branding')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string', enum: ['logo', 'favicon', 'hero'] },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload branding image: logo (max 2MB), favicon (max 1MB), hero (max 5MB)',
  })
  async uploadBranding(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') queryType?: 'logo' | 'favicon' | 'hero',
    @Body('type') bodyType?: 'logo' | 'favicon' | 'hero',
  ) {
    const type = queryType || bodyType || 'logo';
    const fileUrl = await this.storageService.saveBrandingImage(file, type);
    return {
      fileUrl,
      type,
      success: true,
      message: 'Branding asset uploaded and processed successfully',
    };
  }

  // ---------------------------------------------------------------------------
  // VERSION HISTORY & RESTORE (Super Admin / site:write)
  // ---------------------------------------------------------------------------

  @Get('versions/:key')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiParam({ name: 'key', example: 'site_identity' })
  @ApiOperation({ summary: 'Get version history for setting' })
  async getVersions(@Param('key') key: string) {
    return this.settingsService.getVersions(key);
  }

  @Post('restore/:key/:versionId')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiParam({ name: 'key', example: 'site_identity' })
  @ApiParam({ name: 'versionId', example: 'uuid' })
  @ApiOperation({ summary: 'Restore historical version for setting' })
  async restoreVersion(
    @Param('key') key: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.settingsService.restoreVersion(key, versionId, userId);
  }

  @Post('reset/:key')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiParam({ name: 'key', example: 'site_identity' })
  @ApiOperation({ summary: 'Reset setting to system defaults' })
  async resetToDefault(@Param('key') key: string, @CurrentUser('id') userId?: string) {
    return this.settingsService.resetToDefault(key, userId);
  }

  // ---------------------------------------------------------------------------
  // GENERAL SETTINGS CRUD (Super Admin / site:write)
  // ---------------------------------------------------------------------------

  @Put('calendar')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Update Ethiopian calendar data (Super Admin)' })
  async updateCalendarData(@Body() body: Record<string, any>, @CurrentUser('id') userId?: string) {
    const value = body.settingValue !== undefined ? body.settingValue : body;
    return this.settingsService.upsertSetting(
      'ethiopian_calendar',
      value,
      userId,
      'Updated Ethiopian calendar',
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'List all settings (Super Admin)' })
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiParam({ name: 'key', example: 'site_identity' })
  @ApiOperation({ summary: 'Get single setting value by key' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Put(':key')
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiParam({ name: 'key', example: 'site_identity' })
  @ApiOperation({ summary: 'Update or insert setting by key' })
  async updateSetting(
    @Param('key') key: string,
    @Body() body: Record<string, any>,
    @CurrentUser('id') userId?: string,
  ) {
    const value = body.settingValue !== undefined ? body.settingValue : body;
    const reason = body.changeReason || `Updated ${key} via Site Settings`;
    return this.settingsService.upsertSetting(key, value, userId, reason);
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions('site:write')
  @ApiOperation({ summary: 'Batch update multiple settings' })
  async batchUpdate(@Body() dto: BatchUpdateSettingsDto, @CurrentUser('id') userId?: string) {
    return this.settingsService.batchUpdate(dto.settings, userId, dto.changeReason);
  }
}
