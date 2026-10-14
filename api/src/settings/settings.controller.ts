import { Controller, Get, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { BatchUpdateSettingsDto } from './dto/settings.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public } from '../common/decorators/auth.decorator';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @Public()
  @ApiOperation({
    summary: 'Public read-only settings for website branding and contact info',
  })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'List all settings (Admin)' })
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'key', example: 'school_profile' })
  @ApiOperation({ summary: 'Get single setting value by key' })
  async findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Put(':key')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'key', example: 'school_profile' })
  @ApiOperation({ summary: 'Update or insert setting by key' })
  async updateSetting(@Param('key') key: string, @Body() body: Record<string, any>) {
    const value = body.settingValue !== undefined ? body.settingValue : body;
    return this.settingsService.upsertSetting(key, value);
  }

  @Patch()
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Batch update multiple settings' })
  async batchUpdate(@Body() dto: BatchUpdateSettingsDto) {
    return this.settingsService.batchUpdate(dto.settings);
  }
}
