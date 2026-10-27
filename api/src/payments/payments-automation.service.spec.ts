import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsAutomationService } from './payments-automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PaymentsAutomationService', () => {
  let service: PaymentsAutomationService;
  let prisma: any;
  let notifications: any;

  beforeEach(async () => {
    prisma = {
      setting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      member: {
        findMany: jest.fn(),
      },
      notification: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    notifications = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsAutomationService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<PaymentsAutomationService>(PaymentsAutomationService);
  });

  it('detects Meskerem 1 and advances membership year in settings', async () => {
    // 2026-09-11 is Meskerem 1, 2019 E.C.
    const meskerem1 = new Date('2026-09-11T00:00:00Z');

    prisma.setting.findUnique.mockResolvedValue({
      settingKey: 'membership.fee',
      settingValue: { amount: 600, currency: 'ETB', year: 2018, yearLabel: '2018 ዓ.ም.' },
    });
    prisma.setting.upsert.mockResolvedValue({});

    const result = await service.checkMembershipSchedule(meskerem1);

    expect(result.currentEthYear).toBe(2019);
    expect(result.yearTransitioned).toBe(true);
    expect(prisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { settingKey: 'membership.fee' },
        create: expect.objectContaining({ settingKey: 'membership.fee' }),
      }),
    );
  });

  it('sends reminder notifications when deadline is exactly 30 or 7 days away', async () => {
    const today = new Date('2026-10-01T00:00:00Z');
    // Deadline is 30 days away: 2026-10-31
    const deadline = new Date('2026-10-31T00:00:00Z').toISOString().split('T')[0];

    prisma.setting.findUnique.mockResolvedValue({
      settingKey: 'membership.fee',
      settingValue: { amount: 600, currency: 'ETB', year: 2019, yearLabel: '2019 ዓ.ም.', deadline },
    });

    prisma.member.findMany.mockResolvedValue([
      { id: 'm1', userId: 'u1', firstName: 'Abebe', memberNo: '001' },
      { id: 'm2', userId: 'u2', firstName: 'Kebede', memberNo: '002' },
    ]);

    const result = await service.checkMembershipSchedule(today);

    expect(result.remindersSent).toBe(2);
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'u1', title: expect.stringContaining('30 ቀናት ቀርተዋል') }),
        ]),
      }),
    );
  });
});
