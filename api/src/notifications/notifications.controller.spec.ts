import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    findMyNotifications: jest.fn().mockResolvedValue({ data: [], unreadCount: 0 }),
    findNotificationHistory: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    markAllAsRead: jest.fn().mockResolvedValue({ updated: 2 }),
    markAsRead: jest.fn().mockResolvedValue({ id: 'n1', readAt: new Date() }),
    sendNotification: jest.fn().mockResolvedValue({ sentCount: 5 }),
    registerDeviceToken: jest.fn().mockResolvedValue({ id: 'd1' }),
    deleteDeviceToken: jest.fn().mockResolvedValue({ message: 'Removed' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get my notifications', async () => {
    const res = await controller.findMyNotifications('u1', {} as any);
    expect(res).toHaveProperty('unreadCount', 0);
    expect(service.findMyNotifications).toHaveBeenCalledWith('u1', {});
  });

  it('should mark all as read', async () => {
    const res = await controller.markAllAsRead('u1');
    expect(res).toEqual({ updated: 2 });
    expect(service.markAllAsRead).toHaveBeenCalledWith('u1');
  });

  it('should send notification', async () => {
    const res = await controller.sendNotification({ title: 'Alert', audience: 'all' } as any);
    expect(res).toHaveProperty('sentCount', 5);
    expect(service.sendNotification).toHaveBeenCalled();
  });
});
