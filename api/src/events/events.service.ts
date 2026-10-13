import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, EventRsvpStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEventDto,
  UpdateEventDto,
  QueryEventDto,
  RsvpEventDto,
  QueryAttendeesDto,
} from './dto/event.dto';
import { paginate } from '../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async enrichEventCounts(event: any) {
    const [goingCount, maybeCount, notGoingCount] = await Promise.all([
      this.prisma.eventRsvp.count({
        where: { eventId: event.id, status: EventRsvpStatus.going },
      }),
      this.prisma.eventRsvp.count({
        where: { eventId: event.id, status: EventRsvpStatus.maybe },
      }),
      this.prisma.eventRsvp.count({
        where: { eventId: event.id, status: EventRsvpStatus.not_going },
      }),
    ]);

    return {
      ...event,
      rsvpSummary: {
        goingCount,
        maybeCount,
        notGoingCount,
        remainingCapacity:
          event.capacity !== null && event.capacity !== undefined
            ? Math.max(0, event.capacity - goingCount)
            : null,
      },
    };
  }

  // =========================================================================
  // 1. EVENTS CRUD
  // =========================================================================

  async createEvent(dto: CreateEventDto, createdBy?: string) {
    const startAt = new Date(dto.startAt);
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (endAt && endAt <= startAt) {
      throw new BadRequestException('endAt must be later than startAt');
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        location: dto.location ?? null,
        startAt,
        endAt,
        capacity: dto.capacity ?? null,
        createdBy: createdBy ?? null,
      },
    });

    this.logger.log(`Event created: ${event.id} (${event.title})`);
    return this.enrichEventCounts(event);
  }

  async findAllEvents(query: QueryEventDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    if (query.upcomingOnly) {
      where.startAt = { gte: new Date() };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { location: { contains: term } },
      ];
    }

    let orderBy: Prisma.EventOrderByWithRelationInput = { startAt: 'asc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['startAt', 'createdAt', 'title'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.event.count({ where }),
    ]);

    const enriched = await Promise.all(events.map((ev) => this.enrichEventCounts(ev)));
    return paginate(enriched, total, page, limit);
  }

  async findOneEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.enrichEventCounts(event);
  }

  async updateEvent(id: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    const nextStart = dto.startAt ? new Date(dto.startAt) : new Date(existing.startAt);
    const nextEnd =
      dto.endAt !== undefined ? (dto.endAt ? new Date(dto.endAt) : null) : existing.endAt;

    if (nextEnd && nextEnd <= nextStart) {
      throw new BadRequestException('endAt must be later than startAt');
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startAt: dto.startAt ? nextStart : undefined,
        endAt: dto.endAt !== undefined ? nextEnd : undefined,
        capacity: dto.capacity,
      },
    });

    return this.enrichEventCounts(updated);
  }

  async deleteEvent(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    await this.prisma.event.delete({ where: { id } });
    return { id, deleted: true };
  }

  // =========================================================================
  // 2. RSVP WITH CAPACITY CHECK & ATTENDEES LIST
  // =========================================================================

  async rsvpToEvent(eventId: string, dto: RsvpEventDto, user: any) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    let memberId = dto.memberId;
    if (!memberId) {
      if (user?.member?.id) {
        memberId = user.member.id;
      } else {
        const linkedMember = await this.prisma.member.findFirst({
          where: { userId: user?.id, deletedAt: null },
        });
        if (!linkedMember) {
          throw new BadRequestException(
            'No member profile linked to current user. Provide memberId or link member profile.',
          );
        }
        memberId = linkedMember.id;
      }
    } else {
      const memberExists = await this.prisma.member.findFirst({
        where: { id: memberId, deletedAt: null },
      });
      if (!memberExists) {
        throw new NotFoundException(`Member ${memberId} not found`);
      }
    }

    // Check event capacity if RSVP status is 'going'
    if (
      dto.status === EventRsvpStatus.going &&
      event.capacity !== null &&
      event.capacity !== undefined
    ) {
      const currentGoingCount = await this.prisma.eventRsvp.count({
        where: {
          eventId,
          status: EventRsvpStatus.going,
          memberId: { not: memberId },
        },
      });

      if (currentGoingCount >= event.capacity) {
        throw new BadRequestException(
          `Event has reached its maximum capacity of ${event.capacity} attendees`,
        );
      }
    }

    const rsvp = await this.prisma.eventRsvp.upsert({
      where: {
        eventId_memberId: {
          eventId,
          memberId: memberId!,
        },
      },
      update: {
        status: dto.status,
      },
      create: {
        eventId,
        memberId: memberId!,
        status: dto.status,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            phone: true,
          },
        },
      },
    });

    return rsvp;
  }

  async findEventAttendees(eventId: string, query: QueryAttendeesDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EventRsvpWhereInput = { eventId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.member = {
        OR: [
          { memberNo: { contains: term } },
          { firstName: { contains: term } },
          { fatherName: { contains: term } },
          { phone: { contains: term } },
        ],
      };
    }

    const [rsvps, total] = await Promise.all([
      this.prisma.eventRsvp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
              sex: true,
              phone: true,
              department: {
                select: {
                  id: true,
                  nameAm: true,
                  nameEn: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.eventRsvp.count({ where }),
    ]);

    return paginate(rsvps, total, page, limit);
  }
}
