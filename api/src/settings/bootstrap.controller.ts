import { Controller, Get, Req, Res, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/auth.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Bootstrap')
@Controller('bootstrap')
export class BootstrapController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Consolidated application bootstrap data (settings, navigation menus, theme, user session)',
  })
  async getBootstrap(
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Headers('authorization') authHeader: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let currentUser: any = null;
    let authHeaderValue = authHeader || (req.headers.authorization as string | undefined);

    if (authHeaderValue && authHeaderValue.startsWith('Bearer ')) {
      const token = authHeaderValue.slice(7).trim();
      try {
        currentUser = this.jwtService.verify(token);
      } catch {
        // Unauthenticated or expired token
      }
    }

    const publicSettings = await this.settingsService.getPublicSettings();

    const payload = {
      settings: publicSettings,
      menus: [
        { id: 'hero', labelAm: 'ዋና ገጽ', labelEn: 'Home', href: '/#hero', type: 'section' },
        { id: 'about', labelAm: 'ስለ እኛ', labelEn: 'About', href: '/#about', type: 'section' },
        { id: 'courses', labelAm: 'ትምህርቶች', labelEn: 'Courses', href: '/courses', type: 'page' },
        { id: 'mezmur', labelAm: 'መዝሙራት', labelEn: 'Mezmur', href: '/mezmur', type: 'page' },
        { id: 'calendar', labelAm: 'ቀን መቁጠሪያ', labelEn: 'Calendar', href: '/#calendar', type: 'section' },
        { id: 'contact', labelAm: 'ያግኙን', labelEn: 'Contact', href: '/#contact', type: 'section' },
      ],
      theme: publicSettings.appearance,
      user: currentUser
        ? {
            id: currentUser.sub || currentUser.id,
            email: currentUser.email,
            role: currentUser.role?.name || currentUser.role,
          }
        : null,
      generatedAt: new Date().toISOString(),
    };

    // Calculate ETag from the settings and menu content (excluding transient timestamp)
    const contentHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ settings: payload.settings, menus: payload.menus, theme: payload.theme, user: payload.user }))
      .digest('hex');
    const etag = `W/"${contentHash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === contentHash)) {
      return res.status(304).end();
    }

    return res.status(200).json(payload);
  }
}
