import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermissions, CurrentUser } from '../common/decorators/auth.decorator';
import {
  CreatePageDto,
  UpdatePageDto,
  PublishPageDto,
  QueryPagesDto,
  UpsertMenuDto,
  UpsertUiStringDto,
  UpdateThemeDto,
  QueryMediaDto,
  CreateMediaDto,
  UpdateMediaDto,
} from './dto/cms.dto';

@Controller('admin/cms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminCmsController {
  constructor(private readonly cmsService: CmsService) {}

  // -------------------------------------------------------------
  // PAGES
  // -------------------------------------------------------------

  @Get('pages')
  @RequirePermissions('cms:read')
  async listPages(@Query() query: QueryPagesDto) {
    return this.cmsService.findAllPages(query);
  }

  @Get('pages/:id')
  @RequirePermissions('cms:read')
  async getPage(@Param('id') id: string) {
    return this.cmsService.findPageById(id);
  }

  @Post('pages')
  @RequirePermissions('cms:write')
  async createPage(
    @Body() dto: CreatePageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cmsService.createPage(dto, userId, userRole);
  }

  @Put('pages/:id')
  @RequirePermissions('cms:write')
  async updatePage(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cmsService.updatePage(id, dto, userId, userRole);
  }

  @Post('pages/:id/duplicate')
  @RequirePermissions('cms:write')
  async duplicatePage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cmsService.duplicatePage(id, userId);
  }

  @Delete('pages/:id')
  @RequirePermissions('cms:write')
  async deletePage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cmsService.deletePage(id, userId);
  }

  @Post('pages/:id/publish')
  @RequirePermissions('cms:publish')
  @HttpCode(HttpStatus.OK)
  async publishPage(
    @Param('id') id: string,
    @Body() dto: PublishPageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cmsService.publishPage(id, dto, userId);
  }

  @Post('pages/:id/unpublish')
  @RequirePermissions('cms:publish')
  @HttpCode(HttpStatus.OK)
  async unpublishPage(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cmsService.unpublishPage(id, userId);
  }

  @Get('pages/:id/versions')
  @RequirePermissions('cms:read')
  async getVersionHistory(@Param('id') id: string) {
    return this.cmsService.getVersionHistory(id);
  }

  @Post('pages/:id/restore/:versionId')
  @RequirePermissions('cms:write')
  @HttpCode(HttpStatus.OK)
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cmsService.restoreVersion(id, versionId, userId);
  }

  // -------------------------------------------------------------
  // MENUS
  // -------------------------------------------------------------

  @Get('menus')
  @RequirePermissions('cms:read')
  async getMenus() {
    return this.cmsService.getMenus();
  }

  @Put('menus')
  @RequirePermissions('cms:write')
  async updateMenu(@Body() dto: UpsertMenuDto, @CurrentUser('id') userId: string) {
    return this.cmsService.updateMenu(dto, userId);
  }

  // -------------------------------------------------------------
  // UI STRINGS
  // -------------------------------------------------------------

  @Get('ui-strings')
  @RequirePermissions('cms:read')
  async getUiStrings(@Query() query: { group?: string; search?: string }) {
    return this.cmsService.getAdminUiStrings(query);
  }

  @Post('ui-strings')
  @RequirePermissions('cms:write')
  async upsertUiString(@Body() dto: UpsertUiStringDto, @CurrentUser('id') userId: string) {
    return this.cmsService.upsertUiString(dto, userId);
  }

  @Delete('ui-strings/:key')
  @RequirePermissions('cms:write')
  async deleteUiString(@Param('key') key: string, @CurrentUser('id') userId: string) {
    return this.cmsService.deleteUiString(key, userId);
  }

  @Post('ui-strings/reset')
  @RequirePermissions('cms:write')
  @HttpCode(HttpStatus.OK)
  async resetUiStrings(@CurrentUser('id') userId: string) {
    return this.cmsService.resetUiStrings(userId);
  }

  // -------------------------------------------------------------
  // THEME
  // -------------------------------------------------------------

  @Get('theme')
  @RequirePermissions('cms:read')
  async getTheme() {
    return this.cmsService.getTheme();
  }

  @Put('theme')
  @RequirePermissions('cms:write')
  async updateTheme(@Body() dto: UpdateThemeDto, @CurrentUser('id') userId: string) {
    return this.cmsService.updateTheme(dto, userId);
  }

  @Post('theme/reset')
  @RequirePermissions('cms:write')
  @HttpCode(HttpStatus.OK)
  async resetTheme(@CurrentUser('id') userId: string) {
    return this.cmsService.resetTheme(userId);
  }

  // -------------------------------------------------------------
  // MEDIA ASSETS
  // -------------------------------------------------------------

  @Get('media')
  @RequirePermissions('cms:read')
  async getMedia(@Query() query: QueryMediaDto) {
    return this.cmsService.getMediaAssets(query);
  }

  @Post('media')
  @RequirePermissions('cms:write')
  async createMedia(@Body() dto: CreateMediaDto, @CurrentUser('id') userId: string) {
    return this.cmsService.createMediaAsset(dto, userId);
  }

  @Put('media/:id')
  @RequirePermissions('cms:write')
  async updateMedia(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cmsService.updateMediaAsset(id, dto, userId);
  }

  @Delete('media/:id')
  @RequirePermissions('cms:write')
  async deleteMedia(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.cmsService.deleteMediaAsset(id, userId);
  }
}
