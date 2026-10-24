import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    createEvent: jest.fn().mockResolvedValue({ id: 'e1', title: 'Event' }),
    findAllEvents: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    findOneEvent: jest.fn().mockResolvedValue({ id: 'e1', title: 'Event' }),
    updateEvent: jest.fn().mockResolvedValue({ id: 'e1', title: 'Updated' }),
    deleteEvent: jest.fn().mockResolvedValue({ message: 'Deleted' }),
    rsvpToEvent: jest.fn().mockResolvedValue({ status: 'going' }),
    findAttendees: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create event', async () => {
    const res = await controller.createEvent({ title: 'Event' } as any, 'u1');
    expect(res).toHaveProperty('id', 'e1');
    expect(service.createEvent).toHaveBeenCalled();
  });

  it('should find all events', async () => {
    const res = await controller.findAllEvents({} as any);
    expect(res).toHaveProperty('data');
    expect(service.findAllEvents).toHaveBeenCalled();
  });

  it('should find one event', async () => {
    const res = await controller.findOneEvent('e1');
    expect(res).toHaveProperty('id', 'e1');
    expect(service.findOneEvent).toHaveBeenCalledWith('e1');
  });

  it('should RSVP to event', async () => {
    const res = await controller.rsvpToEvent('e1', { status: 'going' } as any, { id: 'u1' });
    expect(res).toHaveProperty('status', 'going');
    expect(service.rsvpToEvent).toHaveBeenCalled();
  });
});
