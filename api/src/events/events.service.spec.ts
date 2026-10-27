import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;

  const mockEvent = {
    id: 'e1',
    titleAm: 'የአብነት ጉባኤ',
    titleEn: 'Spiritual Conference',
    descriptionAm: 'ዓመታዊ የሰንበት ትምህርት ቤት ጉባኤ',
    startDate: new Date('2026-12-01T09:00:00Z'),
    endDate: new Date('2026-12-01T17:00:00Z'),
    location: 'ፈለገ ሰላም አዳራሽ',
    capacity: 200,
    isPublished: true,
    createdById: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
    rsvps: [],
  };

  const mockPrisma = {
    event: {
      create: jest.fn().mockResolvedValue(mockEvent),
      findMany: jest.fn().mockResolvedValue([mockEvent]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(mockEvent),
      update: jest.fn().mockResolvedValue(mockEvent),
      delete: jest.fn().mockResolvedValue(mockEvent),
    },
    eventRsvp: {
      count: jest.fn().mockResolvedValue(10),
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'r1', eventId: 'e1', status: 'going' }),
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 'r1', status: 'going', member: { firstName: 'John' } }]),
    },
    member: {
      findFirst: jest.fn().mockResolvedValue({ id: 'm1' }),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create event', async () => {
    const res = await service.createEvent(
      {
        titleAm: 'የአብነት ጉባኤ',
        startDate: '2026-12-01T09:00:00Z',
        endDate: '2026-12-01T17:00:00Z',
        location: 'ፈለገ ሰላም አዳራሽ',
      } as any,
      'u1',
    );
    expect(res).toBeDefined();
    expect(mockPrisma.event.create).toHaveBeenCalled();
  });

  it('should find all events with pagination', async () => {
    const res = await service.findAllEvents({ page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });

  it('should find one event', async () => {
    const res = await service.findOneEvent('e1');
    expect(res).toHaveProperty('id', 'e1');
  });

  it('should throw NotFoundException if event not found', async () => {
    mockPrisma.event.findUnique.mockResolvedValueOnce(null);
    await expect(service.findOneEvent('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should RSVP to event', async () => {
    const res = await service.rsvpToEvent('e1', { status: 'going' } as any, {
      id: 'u1',
      memberId: 'm1',
    });
    expect(res).toBeDefined();
    expect(mockPrisma.eventRsvp.upsert).toHaveBeenCalled();
  });

  it('should list attendees', async () => {
    const res = await service.findEventAttendees('e1', { page: 1, limit: 10 } as any);
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('meta');
  });
});
