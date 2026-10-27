import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { gregorianToEthiopian } from '../common/ethiopian-calendar';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsAutomationService {
  private readonly logger = new Logger(PaymentsAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMembershipJob() {
    this.logger.log('Running daily membership payments automation job...');
    await this.checkMembershipSchedule();
  }

  async checkMembershipSchedule(now: Date = new Date()): Promise<{
    yearTransitioned: boolean;
    remindersSent: number;
    currentEthYear: number;
  }> {
    const ethDate = gregorianToEthiopian(now);
    let yearTransitioned = false;
    let remindersSent = 0;

    // 1. Check for Meskerem 1 (Ethiopian New Year)
    if (ethDate.month === 1 && ethDate.day === 1) {
      this.logger.log(`Happy Ethiopian New Year! Today is Meskerem 1, ${ethDate.year} E.C.`);
      yearTransitioned = await this.startNewMembershipYear(ethDate.year);
    }

    // 2. Check for 30-day and 7-day deadline reminders
    remindersSent = await this.sendDeadlineReminders(ethDate.year, now);

    return {
      yearTransitioned,
      remindersSent,
      currentEthYear: ethDate.year,
    };
  }

  private async startNewMembershipYear(newEthYear: number): Promise<boolean> {
    const feeSetting = await this.prisma.setting.findUnique({
      where: { settingKey: 'membership.fee' },
    });

    const currentFee =
      feeSetting?.settingValue && typeof feeSetting.settingValue === 'object'
        ? (feeSetting.settingValue as any)
        : { amount: 600, currency: 'ETB', yearLabel: `${newEthYear - 1} ዓ.ም.` };

    // Update yearLabel if it hasn't advanced yet
    if (currentFee.year !== newEthYear) {
      const updatedConfig = {
        ...currentFee,
        year: newEthYear,
        yearLabel: `${newEthYear} ዓ.ም.`,
        // Default deadline: End of Tikimt (approx 2 months into the year)
        deadline: `${nowDatePlusMonths(2).toISOString().split('T')[0]}`,
      };

      await this.prisma.setting.upsert({
        where: { settingKey: 'membership.fee' },
        create: {
          settingKey: 'membership.fee',
          settingValue: updatedConfig,
        },
        update: {
          settingValue: updatedConfig,
        },
      });

      this.logger.log(`Advanced membership year setting to ${newEthYear} E.C.`);
      return true;
    }

    return false;
  }

  private async sendDeadlineReminders(currentYear: number, now: Date): Promise<number> {
    const feeSetting = await this.prisma.setting.findUnique({
      where: { settingKey: 'membership.fee' },
    });

    if (!feeSetting?.settingValue || typeof feeSetting.settingValue !== 'object') {
      return 0;
    }

    const config = feeSetting.settingValue as any;
    if (!config.deadline) return 0;

    const deadlineDate = new Date(config.deadline);
    if (isNaN(deadlineDate.getTime())) return 0;

    // Difference in days normalized to midnight
    const diffTime = deadlineDate.setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 30 || diffDays === 7) {
      this.logger.log(
        `Deadline reminder triggered: ${diffDays} day(s) remaining for membership fee payment (Year ${currentYear})`,
      );

      // Find active members who have not paid for currentYear
      const unpaidMembersWithUsers = await this.prisma.member.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          userId: { not: null },
          membershipPayments: {
            none: {
              membershipYear: currentYear,
              status: 'approved',
            },
          },
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          memberNo: true,
        },
      });

      const userIds = unpaidMembersWithUsers
        .map((m) => m.userId)
        .filter((uid): uid is string => Boolean(uid));

      if (userIds.length === 0) {
        return 0;
      }

      const urgencyText = diffDays === 7 ? 'አስቸኳይ፦ 7 ቀናት ብቻ ቀርተዋል' : '30 ቀናት ቀርተዋል';
      const title = `የዓመታዊ የአባልነት ክፍያ ማስታወሻ (${urgencyText})`;
      const body = `ውድ አባል፣ የ${config.yearLabel || `${currentYear} ዓ.ም.`} ዓመታዊ የአባልነት ክፍያዎን (${config.amount || 600} ${config.currency || 'ETB'}) በወቅቱ እንዲፈጽሙ እናሳስባለን። የመጨረሻው ቀን፦ ${config.deadline}`;

      const nowTime = new Date();
      await this.prisma.notification.createMany({
        data: userIds.map((uid) => ({
          userId: uid,
          title,
          body,
          data: {
            type: 'membership_fee_reminder',
            daysRemaining: diffDays,
            deadline: config.deadline,
            amount: config.amount,
            year: currentYear,
          },
          sentAt: nowTime,
        })),
      });

      this.logger.log(
        `Dispatched ${diffDays}-day fee reminder to ${userIds.length} unpaid members.`,
      );
      return userIds.length;
    }

    return 0;
  }
}

function nowDatePlusMonths(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
