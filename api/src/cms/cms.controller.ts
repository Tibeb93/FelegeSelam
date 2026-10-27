import { Controller, Get, Param, Query, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CmsService } from './cms.service';
import { Public, CurrentUser } from '../common/decorators/auth.decorator';
import { SectionAudience } from '@prisma/client';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('pages/:slug')
  async getPage(
    @Param('slug') slug: string,
    @Query('audience') audience: SectionAudience,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { page, etag } = await this.cmsService.findPublishedPageBySlug(slug, audience);

    // ETag caching check (HTTP 304 Not Modified)
    const clientEtag = req.headers['if-none-match'];
    if (
      clientEtag &&
      (clientEtag === etag ||
        clientEtag.replace(/^"|"$/g, '') === etag.replace(/^"|"$/g, ''))
    ) {
      return res.status(HttpStatus.NOT_MODIFIED).send();
    }

    res.setHeader('ETag', etag);
    res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    );
    return res.status(HttpStatus.OK).json(page);
  }

  @Public()
  @Get('preview/:slug')
  async getPagePreview(
    @Param('slug') slug: string,
    @Query('token') token?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.cmsService.findPageForPreview(slug, token, userRole);
  }

  @Public()
  @Get('menus')
  async getMenus(@Res() res: Response) {
    const menus = await this.cmsService.getMenus();
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=3600');
    return res.status(HttpStatus.OK).json(menus);
  }

  @Public()
  @Get('ui-strings')
  async getUiStrings(@Res() res: Response) {
    const strings = await this.cmsService.getUiStrings();
    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=3600');
    return res.status(HttpStatus.OK).json(strings);
  }

  @Public()
  @Get('theme')
  async getTheme(@Res() res: Response) {
    const theme = await this.cmsService.getTheme();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.status(HttpStatus.OK).json(theme);
  }
}
