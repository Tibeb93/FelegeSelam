import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, PostType, Post } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostDto, UpdatePostDto, QueryPostDto } from './dto/post.dto';
import { paginate } from '../common/dto/pagination.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private enrichPostLifecycle(post: Post, now: Date = new Date()) {
    let lifecycleStatus: 'scheduled' | 'published' | 'expired' = 'published';
    if (post.expiresAt && new Date(post.expiresAt) <= now) {
      lifecycleStatus = 'expired';
    } else if (new Date(post.publishAt) > now) {
      lifecycleStatus = 'scheduled';
    }

    return {
      ...post,
      lifecycleStatus,
    };
  }

  // =========================================================================
  // 1. SCHEDULED JOB (@nestjs/schedule) FOR PUBLISHING & EXPIRY
  // =========================================================================

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.processScheduledAndExpiredPosts();
  }

  async processScheduledAndExpiredPosts(referenceTime: Date = new Date()) {
    const activeFilter: Prisma.PostWhereInput = {
      publishAt: { lte: referenceTime },
      OR: [{ expiresAt: null }, { expiresAt: { gt: referenceTime } }],
    };

    const [activePublishedCount, expiredCount, activeUrgentPosts] = await Promise.all([
      this.prisma.post.count({ where: activeFilter }),
      this.prisma.post.count({
        where: {
          expiresAt: { lte: referenceTime },
        },
      }),
      this.prisma.post.findMany({
        where: {
          ...activeFilter,
          isUrgent: true,
        },
      }),
    ]);

    let newlyNotifiedUrgentCount = 0;
    for (const urgentPost of activeUrgentPosts) {
      const notifiedUsers = await this.notificationsService.notifyUrgentPost(urgentPost);
      if (notifiedUsers > 0) {
        newlyNotifiedUrgentCount++;
      }
    }

    return {
      processedAt: referenceTime.toISOString(),
      activePublishedCount,
      expiredCount,
      newlyNotifiedUrgentCount,
    };
  }

  private validateAndSanitizeHtml(content: string): string {
    if (!content) return '';
    const unsafeRegex = /<script\b|<iframe\b|<object\b|<embed\b|<applet\b|javascript:\s*|\son\w+\s*=/i;
    if (unsafeRegex.test(content)) {
      throw new BadRequestException('Unsafe HTML detected: script, iframe, and inline event handlers are prohibited');
    }
    return content;
  }

  // =========================================================================
  // 2. POSTS CRUD, SCHEDULING, IMAGE UPLOAD & TODAY FEED
  // =========================================================================

  async createPost(dto: CreatePostDto, authorId?: string) {
    const now = new Date();
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : now;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (expiresAt && expiresAt <= publishAt) {
      throw new BadRequestException('expiresAt must be later than publishAt');
    }

    const sanitizedBody = this.validateAndSanitizeHtml(dto.body);
    const isUrgent = dto.type === PostType.urgent ? true : (dto.isUrgent ?? false);

    const post = await this.prisma.post.create({
      data: {
        type: dto.type,
        title: dto.title,
        body: sanitizedBody,
        imageUrl: dto.imageUrl ?? null,
        isUrgent,
        publishAt,
        expiresAt,
        authorId: authorId ?? null,
      },
    });

    // If post is urgent and already live (not scheduled for future and not expired), notify members immediately
    if (isUrgent && publishAt <= now && (!expiresAt || expiresAt > now)) {
      await this.notificationsService.notifyUrgentPost(post);
    }

    this.logger.log(`Post created: ${post.id} (${post.type} - ${post.title})`);
    return this.enrichPostLifecycle(post, now);
  }

  /**
   * GET /posts/today: Active published posts (urgent first, then latest publishAt)
   */
  async findTodayPosts() {
    const now = new Date();

    const posts = await this.prisma.post.findMany({
      where: {
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ isUrgent: 'desc' }, { publishAt: 'desc' }],
    });

    return posts.map((p) => this.enrichPostLifecycle(p, now));
  }

  /**
   * Public paginated list of active published posts (excludes future scheduled and expired posts)
   */
  async findPublicPosts(query: QueryPostDto) {
    const now = new Date();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const andConditions: Prisma.PostWhereInput[] = [
      { publishAt: { lte: now } },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    ];

    if (query.type) {
      andConditions.push({ type: query.type });
    }
    if (query.isUrgent !== undefined) {
      andConditions.push({ isUrgent: query.isUrgent });
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      andConditions.push({
        OR: [{ title: { contains: term } }, { body: { contains: term } }],
      });
    }

    const where: Prisma.PostWhereInput = { AND: andConditions };

    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = [
      { isUrgent: 'desc' },
      { publishAt: 'desc' },
    ];

    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['publishAt', 'createdAt', 'title', 'type'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.post.count({ where }),
    ]);

    const enriched = posts.map((p) => this.enrichPostLifecycle(p, now));
    return paginate(enriched, total, page, limit);
  }

  /**
   * Admin / Content Manager list (includes scheduled future posts and expired posts)
   */
  async findAllForManagement(query: QueryPostDto) {
    const now = new Date();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.isUrgent !== undefined) where.isUrgent = query.isUrgent;

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { body: { contains: term } }];
    }

    let orderBy: Prisma.PostOrderByWithRelationInput = { publishAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['publishAt', 'createdAt', 'title', 'type'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.post.count({ where }),
    ]);

    const enriched = posts.map((p) => this.enrichPostLifecycle(p, now));
    return paginate(enriched, total, page, limit);
  }

  async findOnePost(id: string, publicOnly: boolean = false) {
    const now = new Date();
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (publicOnly) {
      const isPublished = new Date(post.publishAt) <= now;
      const isNotExpired = !post.expiresAt || new Date(post.expiresAt) > now;
      if (!isPublished || !isNotExpired) {
        throw new NotFoundException(`Post with ID ${id} is not currently published`);
      }
    }

    return this.enrichPostLifecycle(post, now);
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const nextPublishAt = dto.publishAt ? new Date(dto.publishAt) : new Date(existing.publishAt);
    const nextExpiresAt =
      dto.expiresAt !== undefined
        ? dto.expiresAt
          ? new Date(dto.expiresAt)
          : null
        : existing.expiresAt;

    if (nextExpiresAt && nextExpiresAt <= nextPublishAt) {
      throw new BadRequestException('expiresAt must be later than publishAt');
    }

    const nextType = dto.type ?? existing.type;
    const nextUrgent = nextType === PostType.urgent ? true : (dto.isUrgent ?? existing.isUrgent);
    const sanitizedBody =
      dto.body !== undefined ? this.validateAndSanitizeHtml(dto.body) : undefined;

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        body: sanitizedBody,
        imageUrl: dto.imageUrl,
        isUrgent: nextUrgent,
        publishAt: dto.publishAt ? nextPublishAt : undefined,
        expiresAt: dto.expiresAt !== undefined ? nextExpiresAt : undefined,
      },
    });

    const now = new Date();
    if (
      updated.isUrgent &&
      new Date(updated.publishAt) <= now &&
      (!updated.expiresAt || new Date(updated.expiresAt) > now)
    ) {
      await this.notificationsService.notifyUrgentPost(updated);
    }

    return this.enrichPostLifecycle(updated, now);
  }

  async uploadPostImage(id: string, file: Express.Multer.File) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const imageUrl = await this.storageService.savePostImage(file);

    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(existing.imageUrl);
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { imageUrl },
    });

    return this.enrichPostLifecycle(updated);
  }

  async deletePost(id: string) {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(existing.imageUrl);
    }

    await this.prisma.post.delete({ where: { id } });
    return { id, deleted: true };
  }
}
