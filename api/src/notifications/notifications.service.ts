import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, UserStatus, DevicePlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SendNotificationDto,
  NotificationTarget,
  RegisterDeviceTokenDto,
  QueryNotificationDto,
} from './dto/notification.dto';
import { paginate } from '../common/dto/pagination.dto';
import { EventBusService } from '../realtime/event-bus.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBusService: EventBusService,
  ) {}

  // =========================================================================
  // 1. IN-APP NOTIFICATIONS (LIST, MARK READ, MARK ALL READ)
  // =========================================================================

  async findMyNotifications(userId: string, query: QueryNotificationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    if (query.unreadOnly) {
      where.readAt = null;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { body: { contains: term } }];
    }

    let orderBy: Prisma.NotificationOrderByWithRelationInput = { sentAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['sentAt', 'readAt', 'title'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    const paginated = paginate(items, total, page, limit);
    return {
      ...paginated,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (notification.readAt) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    this.eventBusService.emit({
      type: 'notification.read',
      target: { userId },
      data: { notificationId },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const now = new Date();
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });

    this.eventBusService.emit({
      type: 'notification.read',
      target: { userId },
      data: { all: true },
    });

    return {
      updatedCount: result.count,
      readAt: now,
    };
  }

  // =========================================================================
  // 2. ADMIN BROADCAST / TARGETED SEND (ALL, DEPARTMENT, USER)
  // =========================================================================

  async sendNotification(dto: SendNotificationDto) {
    let targetUserIds: string[] = [];

    if (dto.target === NotificationTarget.USER) {
      if (!dto.userId) {
        throw new BadRequestException('userId is required when target is "user"');
      }
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) {
        throw new NotFoundException(`User ${dto.userId} not found`);
      }
      targetUserIds = [user.id];
    } else if (dto.target === NotificationTarget.DEPARTMENT) {
      if (!dto.departmentId) {
        throw new BadRequestException('departmentId is required when target is "department"');
      }
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new NotFoundException(`Department ${dto.departmentId} not found`);
      }

      const membersWithUsers = await this.prisma.member.findMany({
        where: {
          departmentId: dto.departmentId,
          deletedAt: null,
          userId: { not: null },
        },
        select: { userId: true },
      });

      targetUserIds = Array.from(new Set(membersWithUsers.map((m) => m.userId!).filter(Boolean)));
    } else if (dto.target === NotificationTarget.ALL) {
      const users = await this.prisma.user.findMany({
        where: { status: UserStatus.active },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return {
        target: dto.target,
        sentCount: 0,
      };
    }

    const now = new Date();
    await this.prisma.notification.createMany({
      data: targetUserIds.map((uid) => ({
        userId: uid,
        title: dto.title,
        body: dto.body ?? null,
        data: dto.data ? (dto.data as Prisma.InputJsonValue) : Prisma.JsonNull,
        sentAt: now,
      })),
    });

    for (const uid of targetUserIds) {
      this.eventBusService.emit({
        type: 'notification.created',
        target: { userId: uid },
        data: { title: dto.title, body: dto.body },
      });
    }

    this.logger.log(
      `Sent notification "${dto.title}" to ${targetUserIds.length} user(s) [target=${dto.target}]`,
    );

    return {
      target: dto.target,
      sentCount: targetUserIds.length,
    };
  }

  async findNotificationHistory(query: QueryNotificationDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { body: { contains: term } }];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              member: {
                select: {
                  firstName: true,
                  fatherName: true,
                  memberNo: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  /**
   * Automatically create notifications for all active users when an urgent post goes live.
   * Ensures idempotency so a post only triggers notifications once.
   */
  async notifyUrgentPost(post: {
    id: string;
    title: string;
    body: string;
    type: string;
  }): Promise<number> {
    // Check if we already sent notifications for this postId
    const existing = await this.prisma.notification.findFirst({
      where: {
        title: `🚨 አስቸኳይ፡ ${post.title}`,
      },
      orderBy: { sentAt: 'desc' },
    });

    if (
      existing &&
      existing.data &&
      typeof existing.data === 'object' &&
      (existing.data as any).postId === post.id
    ) {
      return 0;
    }

    const activeUsers = await this.prisma.user.findMany({
      where: { status: UserStatus.active },
      select: { id: true },
    });

    if (activeUsers.length === 0) return 0;

    const now = new Date();
    const previewBody = post.body.length > 220 ? `${post.body.slice(0, 220)}...` : post.body;

    await this.prisma.notification.createMany({
      data: activeUsers.map((u) => ({
        userId: u.id,
        title: `🚨 አስቸኳይ፡ ${post.title}`,
        body: previewBody,
        data: {
          postId: post.id,
          postType: post.type,
          isUrgent: true,
        },
        sentAt: now,
      })),
    });

    for (const u of activeUsers) {
      this.eventBusService.emit({
        type: 'notification.created',
        target: { userId: u.id },
        data: {
          title: `🚨 አስቸኳይ፡ ${post.title}`,
          body: previewBody,
          postId: post.id,
          isUrgent: true,
        },
      });
    }

    this.logger.log(
      `Urgent post "${post.title}" (${post.id}) notified ${activeUsers.length} active user(s)`,
    );
    return activeUsers.length;
  }

  // =========================================================================
  // 3. DEVICE TOKEN REGISTRATION (FOR MOBILE/WEB PUSH)
  // =========================================================================

  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    const platform = dto.platform ?? DevicePlatform.web;

    const deviceToken = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform,
      },
      create: {
        userId,
        token: dto.token,
        platform,
      },
    });

    this.logger.log(`Registered device token for user ${userId} (${platform})`);
    return deviceToken;
  }

  async removeDeviceToken(userId: string, token: string) {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
    });

    if (!existing) {
      throw new NotFoundException('Device token not found for current user');
    }

    await this.prisma.deviceToken.delete({ where: { id: existing.id } });
    return { token, deleted: true };
  }

  async listMyDeviceTokens(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
