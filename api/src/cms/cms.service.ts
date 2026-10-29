import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus, MenuLocation, SectionAudience, MediaAssetKind, Prisma } from '@prisma/client';
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
import { validateSection, sanitizeHtml } from '@felegeselam/cms-registry';
import * as crypto from 'crypto';

export const RESERVED_SLUGS = new Set([
  'admin',
  'portal',
  'api',
  'login',
  'register',
  'logout',
  'auth',
  'settings',
  'dashboard',
]);

export const DEFAULT_THEME_TOKENS = {
  colors: {
    primary: '#0F4C81',
    primaryDark: '#0A2E52',
    primaryLight: '#1E78C8',
    secondary: '#1A365D',
    accent: '#F2B233',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    muted: '#F1F5F9',
    text: '#0F172A',
    border: '#E2E8F0',
  },
  typography: {
    fontAmharic: 'Noto Sans Ethiopic',
    fontEnglish: 'Inter',
    headingScale: 'default',
  },
  layout: {
    borderRadius: 'md', // sm, md, lg, full
    buttonVariant: 'solid', // solid, outline, rounded
    headerStyle: 'solid', // transparent, solid, blurred
    footerStyle: 'dark', // dark, light
    logoPosition: 'left', // left, center
  },
};

import { EventBusService } from '../realtime/event-bus.service';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  // -------------------------------------------------------------
  // PUBLIC CMS METHODS
  // -------------------------------------------------------------

  async findPublishedPageBySlug(slug: string, audience?: SectionAudience) {
    const now = new Date();
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        OR: [
          { status: PageStatus.published },
          {
            status: PageStatus.scheduled,
            publishAt: { lte: now },
          },
        ],
      },
      include: {
        sections: {
          where: { visible: true },
          orderBy: { orderNo: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with slug "${slug}" not found or not published`);
    }

    // Filter sections by audience if specified
    if (audience && audience !== SectionAudience.everyone) {
      page.sections = page.sections.filter(
        (s) => s.audience === SectionAudience.everyone || s.audience === audience,
      );
    }

    // Generate ETag based on page version, updatedAt and sections count
    const etagSource = `${page.id}-${page.version}-${page.updatedAt.getTime()}-${page.sections.length}`;
    const etag = `"${crypto.createHash('md5').update(etagSource).digest('hex')}"`;

    return { page, etag };
  }

  async findPageForPreview(slug: string, token?: string, userRole?: string) {
    // If not admin/content_manager and token not valid, reject
    const isValidToken = token && token === process.env.CMS_PREVIEW_SECRET;
    const isStaff = userRole && ['super_admin', 'admin', 'content_manager'].includes(userRole);

    if (!isValidToken && !isStaff) {
      throw new ForbiddenException('Invalid or expired preview access');
    }

    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { orderNo: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Page "${slug}" not found`);
    }

    return page;
  }

  async getMenus() {
    const menus = await this.prisma.menu.findMany();
    const header = menus.find((m) => m.location === MenuLocation.header) || {
      location: MenuLocation.header,
      items: [],
    };
    const footer = menus.find((m) => m.location === MenuLocation.footer) || {
      location: MenuLocation.footer,
      items: [],
    };

    return { header, footer };
  }

  async getUiStrings() {
    const strings = await this.prisma.uiString.findMany();
    const am: Record<string, string> = {};
    const en: Record<string, string> = {};

    for (const item of strings) {
      am[item.key] = item.am;
      en[item.key] = item.en;
    }

    return { am, en, count: strings.length };
  }

  async getTheme() {
    const setting = await this.prisma.setting.findUnique({
      where: { settingKey: 'cms:theme' },
    });

    if (!setting) {
      return DEFAULT_THEME_TOKENS;
    }

    return setting.settingValue as Record<string, any>;
  }

  // -------------------------------------------------------------
  // ADMIN CMS METHODS
  // -------------------------------------------------------------

  async findAllPages(query: QueryPagesDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PageWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { slug: { contains: term } },
        { titleAm: { contains: term } },
        { titleEn: { contains: term } },
      ];
    }

    if (query.status && Object.values(PageStatus).includes(query.status as PageStatus)) {
      where.status = query.status as PageStatus;
    }

    const [total, pages] = await Promise.all([
      this.prisma.page.count({ where }),
      this.prisma.page.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { sections: true, versions: true },
          },
        },
      }),
    ]);

    return {
      data: pages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPageById(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { orderNo: 'asc' },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with id "${id}" not found`);
    }

    return page;
  }

  async createPage(dto: CreatePageDto, userId: string, userRole?: string) {
    const slug = dto.slug.toLowerCase().trim();

    if (RESERVED_SLUGS.has(slug)) {
      throw new BadRequestException(`Slug "${slug}" is a reserved system route`);
    }

    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`A page with slug "${slug}" already exists`);
    }

    // Validate sections and sanitize rich text/HTML
    const sanitizedSections = this.processAndValidateSections(dto.sections || [], userRole);

    return this.prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          slug,
          titleAm: dto.titleAm,
          titleEn: dto.titleEn,
          status: dto.status || PageStatus.draft,
          publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
          seo: dto.seo ? (dto.seo as Prisma.InputJsonValue) : Prisma.JsonNull,
          isSystem: dto.isSystem ?? false,
          version: 1,
          createdBy: userId,
          updatedBy: userId,
          sections: {
            create: sanitizedSections.map((sec, idx) => ({
              type: sec.type,
              orderNo: sec.orderNo ?? idx,
              visible: sec.visible ?? true,
              content: sec.content as Prisma.InputJsonValue,
              config: sec.config as Prisma.InputJsonValue,
              style: (sec.style || {}) as Prisma.InputJsonValue,
              audience: sec.audience || SectionAudience.everyone,
            })),
          },
        },
        include: {
          sections: {
            orderBy: { orderNo: 'asc' },
          },
        },
      });

      // Create initial version snapshot
      await tx.pageVersion.create({
        data: {
          pageId: page.id,
          version: 1,
          note: 'Initial page creation',
          snapshot: page as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'Page',
          entityId: page.id,
          newValue: { slug: page.slug, titleEn: page.titleEn },
        },
      });

      return page;
    });
  }

  async updatePage(id: string, dto: UpdatePageDto, userId: string, userRole?: string) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
      include: { sections: true },
    });

    if (!existing) {
      throw new NotFoundException(`Page with id "${id}" not found`);
    }

    // Optimistic locking check to prevent concurrent overwrites
    if (dto.expectedVersion !== undefined && existing.version !== dto.expectedVersion) {
      throw new ConflictException(
        `Concurrency conflict: Page has been updated by another user (current version: ${existing.version}, expected: ${dto.expectedVersion}). Please reload and retry.`,
      );
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slug = dto.slug.toLowerCase().trim();
      if (RESERVED_SLUGS.has(slug)) {
        throw new BadRequestException(`Slug "${slug}" is a reserved system route`);
      }
      const duplicateSlug = await this.prisma.page.findUnique({ where: { slug } });
      if (duplicateSlug) {
        throw new ConflictException(`Slug "${slug}" already in use by another page`);
      }
    }

    const sanitizedSections = dto.sections
      ? this.processAndValidateSections(dto.sections, userRole)
      : null;

    return this.prisma.$transaction(async (tx) => {
      // If sections are provided, replace them
      if (sanitizedSections) {
        await tx.pageSection.deleteMany({ where: { pageId: id } });
        await tx.pageSection.createMany({
          data: sanitizedSections.map((sec, idx) => ({
            pageId: id,
            type: sec.type,
            orderNo: sec.orderNo ?? idx,
            visible: sec.visible ?? true,
            content: sec.content as Prisma.InputJsonValue,
            config: sec.config as Prisma.InputJsonValue,
            style: (sec.style || {}) as Prisma.InputJsonValue,
            audience: sec.audience || SectionAudience.everyone,
          })),
        });
      }

      const updatedPage = await tx.page.update({
        where: { id },
        data: {
          slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
          titleAm: dto.titleAm,
          titleEn: dto.titleEn,
          status: dto.status,
          publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
          seo: dto.seo !== undefined ? (dto.seo as Prisma.InputJsonValue) : undefined,
          version: { increment: 1 },
          updatedBy: userId,
        },
        include: {
          sections: {
            orderBy: { orderNo: 'asc' },
          },
        },
      });

      // Save version snapshot
      await tx.pageVersion.create({
        data: {
          pageId: updatedPage.id,
          version: updatedPage.version,
          note: 'Page update',
          snapshot: updatedPage as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          entity: 'Page',
          entityId: updatedPage.id,
          newValue: { slug: updatedPage.slug, version: updatedPage.version },
        },
      });

      return updatedPage;
    });
  }

  async duplicatePage(id: string, userId: string) {
    const original = await this.findPageById(id);
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

    return this.createPage(
      {
        slug: newSlug,
        titleAm: `${original.titleAm} (ቅጂ)`,
        titleEn: `${original.titleEn} (Copy)`,
        status: PageStatus.draft,
        seo: (original.seo as Record<string, any>) || undefined,
        sections: original.sections.map((s) => ({
          type: s.type,
          orderNo: s.orderNo,
          visible: s.visible,
          content: s.content as any,
          config: s.config as any,
          style: s.style as any,
          audience: s.audience,
        })),
      },
      userId,
    );
  }

  async deletePage(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with id "${id}" not found`);
    }

    if (page.isSystem) {
      throw new BadRequestException('System pages cannot be deleted');
    }

    await this.prisma.page.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Page',
        entityId: id,
        newValue: { slug: page.slug, titleEn: page.titleEn },
      },
    });

    return { message: 'Page deleted successfully', id };
  }

  async publishPage(id: string, dto: PublishPageDto, userId: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with id "${id}" not found`);
    }

    const isScheduling = !!dto.publishAt && new Date(dto.publishAt) > new Date();
    const newStatus = isScheduling ? PageStatus.scheduled : PageStatus.published;
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.page.update({
        where: { id },
        data: {
          status: newStatus,
          publishAt,
          version: { increment: 1 },
          updatedBy: userId,
        },
        include: {
          sections: { orderBy: { orderNo: 'asc' } },
        },
      });

      await tx.pageVersion.create({
        data: {
          pageId: id,
          version: p.version,
          note: dto.note || (isScheduling ? 'Scheduled publish' : 'Published'),
          snapshot: p as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: isScheduling ? 'SCHEDULE' : 'PUBLISH',
          entity: 'Page',
          entityId: id,
          newValue: { status: newStatus, publishAt },
        },
      });

      return p;
    });

    this.eventBusService.emit({
      type: 'cms.published',
      target: { isPublic: true },
      data: {
        pageId: updated.id,
        slug: updated.slug,
        title: updated.titleAm,
      },
    });

    return updated;
  }

  async unpublishPage(id: string, userId: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with id "${id}" not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.page.update({
        where: { id },
        data: {
          status: PageStatus.draft,
          version: { increment: 1 },
          updatedBy: userId,
        },
        include: {
          sections: { orderBy: { orderNo: 'asc' } },
        },
      });

      await tx.pageVersion.create({
        data: {
          pageId: id,
          version: p.version,
          note: 'Unpublished (reverted to draft)',
          snapshot: p as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UNPUBLISH',
          entity: 'Page',
          entityId: id,
          newValue: { status: PageStatus.draft },
        },
      });

      return p;
    });

    return updated;
  }

  async getVersionHistory(pageId: string) {
    const versions = await this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'desc' },
    });

    return versions;
  }

  async restoreVersion(pageId: string, versionId: string, userId: string) {
    const version = await this.prisma.pageVersion.findFirst({
      where: { id: versionId, pageId },
    });

    if (!version) {
      throw new NotFoundException(`Version with id "${versionId}" not found for page "${pageId}"`);
    }

    const snapshot = version.snapshot as Record<string, any>;
    const sections = snapshot.sections || [];

    return this.prisma.$transaction(async (tx) => {
      // Replace sections
      await tx.pageSection.deleteMany({ where: { pageId } });
      if (sections.length > 0) {
        await tx.pageSection.createMany({
          data: sections.map((sec: any, idx: number) => ({
            pageId,
            type: sec.type,
            orderNo: sec.orderNo ?? idx,
            visible: sec.visible ?? true,
            content: sec.content as Prisma.InputJsonValue,
            config: sec.config as Prisma.InputJsonValue,
            style: (sec.style || {}) as Prisma.InputJsonValue,
            audience: sec.audience || SectionAudience.everyone,
          })),
        });
      }

      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: {
          titleAm: snapshot.titleAm,
          titleEn: snapshot.titleEn,
          seo: snapshot.seo as Prisma.InputJsonValue,
          version: { increment: 1 },
          updatedBy: userId,
        },
        include: {
          sections: { orderBy: { orderNo: 'asc' } },
        },
      });

      await tx.pageVersion.create({
        data: {
          pageId,
          version: updatedPage.version,
          note: `Restored from version ${version.version}`,
          snapshot: updatedPage as unknown as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'RESTORE_VERSION',
          entity: 'Page',
          entityId: pageId,
          newValue: { restoredVersion: version.version },
        },
      });

      return updatedPage;
    });
  }

  // -------------------------------------------------------------
  // MENUS MANAGEMENT
  // -------------------------------------------------------------

  async updateMenu(dto: UpsertMenuDto, userId: string) {
    const menu = await this.prisma.menu.upsert({
      where: { location: dto.location },
      create: {
        location: dto.location,
        items: dto.items as Prisma.InputJsonValue,
      },
      update: {
        items: dto.items as Prisma.InputJsonValue,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_MENU',
        entity: 'Menu',
        entityId: menu.id,
        newValue: { location: dto.location, itemsCount: dto.items.length },
      },
    });

    return menu;
  }

  // -------------------------------------------------------------
  // UI STRINGS MANAGEMENT
  // -------------------------------------------------------------

  async getAdminUiStrings(query?: { group?: string; search?: string }) {
    const where: Prisma.UiStringWhereInput = {};

    if (query?.group) {
      where.group = query.group;
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { key: { contains: term } },
        { am: { contains: term } },
        { en: { contains: term } },
      ];
    }

    return this.prisma.uiString.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async upsertUiString(dto: UpsertUiStringDto, userId: string) {
    const item = await this.prisma.uiString.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        group: dto.group || 'general',
        am: dto.am,
        en: dto.en,
      },
      update: {
        group: dto.group || undefined,
        am: dto.am,
        en: dto.en,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPSERT_UI_STRING',
        entity: 'UiString',
        entityId: item.key,
        newValue: { key: item.key, group: item.group },
      },
    });

    return item;
  }

  async deleteUiString(key: string, userId: string) {
    const existing = await this.prisma.uiString.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException(`UiString with key "${key}" not found`);
    }

    await this.prisma.uiString.delete({ where: { key } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_UI_STRING',
        entity: 'UiString',
        entityId: key,
        newValue: { key },
      },
    });

    return { message: 'UI String override removed (reverted to default)', key };
  }

  async resetUiStrings(userId: string) {
    const count = await this.prisma.uiString.deleteMany();

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESET_UI_STRINGS',
        entity: 'UiString',
        newValue: { deletedCount: count.count },
      },
    });

    return { message: 'All UI strings reset to default', count: count.count };
  }

  // -------------------------------------------------------------
  // THEME MANAGEMENT
  // -------------------------------------------------------------

  async updateTheme(dto: UpdateThemeDto, userId: string) {
    const setting = await this.prisma.setting.upsert({
      where: { settingKey: 'cms:theme' },
      create: {
        settingKey: 'cms:theme',
        settingValue: dto.tokens as Prisma.InputJsonValue,
      },
      update: {
        settingValue: dto.tokens as Prisma.InputJsonValue,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_THEME',
        entity: 'Setting',
        entityId: 'cms:theme',
        newValue: dto.tokens,
      },
    });

    return setting.settingValue;
  }

  async resetTheme(userId: string) {
    await this.prisma.setting.deleteMany({
      where: { settingKey: 'cms:theme' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESET_THEME',
        entity: 'Setting',
        entityId: 'cms:theme',
        newValue: { message: 'Theme reset to default system tokens' },
      },
    });

    return DEFAULT_THEME_TOKENS;
  }

  // -------------------------------------------------------------
  // MEDIA ASSETS MANAGEMENT
  // -------------------------------------------------------------

  async getMediaAssets(query: QueryMediaDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const skip = (page - 1) * limit;

    const where: Prisma.MediaAssetWhereInput = {};

    if (query.folder) {
      where.folder = query.folder;
    }

    if (query.kind) {
      where.kind = query.kind;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { url: { contains: term } },
        { altAm: { contains: term } },
        { altEn: { contains: term } },
      ];
    }

    const [total, assets] = await Promise.all([
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: assets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMediaAsset(dto: CreateMediaDto, userId: string) {
    const asset = await this.prisma.mediaAsset.create({
      data: {
        url: dto.url,
        kind: dto.kind || MediaAssetKind.image,
        altAm: dto.altAm,
        altEn: dto.altEn,
        width: dto.width,
        height: dto.height,
        sizeBytes: dto.sizeBytes ?? 0,
        folder: dto.folder || 'general',
        uploadedBy: userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPLOAD_MEDIA',
        entity: 'MediaAsset',
        entityId: asset.id,
        newValue: { url: asset.url, kind: asset.kind },
      },
    });

    return asset;
  }

  async updateMediaAsset(id: string, dto: UpdateMediaDto, userId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Media asset "${id}" not found`);
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        altAm: dto.altAm,
        altEn: dto.altEn,
        folder: dto.folder,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_MEDIA',
        entity: 'MediaAsset',
        entityId: id,
        newValue: { altAm: dto.altAm, altEn: dto.altEn },
      },
    });

    return updated;
  }

  async deleteMediaAsset(id: string, userId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Media asset "${id}" not found`);
    }

    // Check if the asset URL is referenced in any page sections
    const allSections = await this.prisma.pageSection.findMany({
      select: {
        id: true,
        content: true,
        style: true,
        page: { select: { slug: true, titleEn: true } },
      },
    });

    const referencingSections = allSections.filter((s) => {
      const contentStr = JSON.stringify(s.content || '');
      const styleStr = JSON.stringify(s.style || '');
      return contentStr.includes(asset.url) || styleStr.includes(asset.url);
    });

    if (referencingSections.length > 0) {
      const pageNames = Array.from(new Set(referencingSections.map((s) => s.page.slug))).join(', ');
      throw new BadRequestException(
        `Cannot delete media asset because it is currently used on pages: ${pageNames}`,
      );
    }

    await this.prisma.mediaAsset.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_MEDIA',
        entity: 'MediaAsset',
        entityId: id,
        newValue: { url: asset.url },
      },
    });

    return { message: 'Media asset deleted successfully', id };
  }

  // -------------------------------------------------------------
  // HELPER METHODS
  // -------------------------------------------------------------

  private processAndValidateSections(sections: any[], userRole?: string): any[] {
    const result: any[] = [];

    for (const [index, sec] of sections.entries()) {
      if (!sec.type) {
        throw new BadRequestException(`Section at index ${index} is missing type`);
      }

      // Check role restriction for customHtml
      if (sec.type === 'customHtml' && userRole !== 'super_admin') {
        throw new ForbiddenException(
          'Adding or modifying "customHtml" sections is restricted to super administrators only',
        );
      }

      // Validate against section registry
      const validation = validateSection({
        type: sec.type,
        content: sec.content,
        config: sec.config,
        style: sec.style,
      });

      if (!validation.success) {
        throw new BadRequestException(
          `Validation failed for section #${index + 1} (${sec.type}): ${validation.errors?.join('; ')}`,
        );
      }

      // Sanitize rich text / html in content
      const sanitizedContent = this.sanitizeSectionContent(sec.type, sec.content);

      result.push({
        ...sec,
        orderNo: sec.orderNo !== undefined ? sec.orderNo : index,
        content: sanitizedContent,
      });
    }

    return result;
  }

  private sanitizeSectionContent(type: string, content: any): any {
    if (!content || typeof content !== 'object') return content;

    const copy = JSON.parse(JSON.stringify(content));

    for (const lang of ['am', 'en']) {
      if (!copy[lang]) continue;

      if (copy[lang].html && typeof copy[lang].html === 'string') {
        copy[lang].html = sanitizeHtml(copy[lang].html);
      }
      if (copy[lang].bodyHtml && typeof copy[lang].bodyHtml === 'string') {
        copy[lang].bodyHtml = sanitizeHtml(copy[lang].bodyHtml);
      }
      if (copy[lang].answerHtml && typeof copy[lang].answerHtml === 'string') {
        copy[lang].answerHtml = sanitizeHtml(copy[lang].answerHtml);
      }

      if (Array.isArray(copy[lang].items)) {
        for (const it of copy[lang].items) {
          if (it.answerHtml && typeof it.answerHtml === 'string') {
            it.answerHtml = sanitizeHtml(it.answerHtml);
          }
        }
      }
    }

    return copy;
  }
}
