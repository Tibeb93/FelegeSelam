import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PaymentsReceiptService, MembershipPaymentWithMember } from './payments-receipt.service';
import { PaymentsExportService } from './payments-export.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import {
  SubmitMembershipPaymentDto,
  ReviewMembershipPaymentDto,
  RecordCashPaymentDto,
  QueryMembershipPaymentsDto,
  SendPaymentRemindersDto,
} from './dto/payment.dto';
import { gregorianToEthiopian } from '../common/ethiopian-calendar';

export interface MembershipFeeConfig {
  amount: number;
  currency: string;
  year: number;
  yearLabel: string;
  deadline?: string;
}

export interface PaymentAccountConfig {
  id?: string;
  type: string;
  bankName: string;
  accountName: string;
  accountNumber?: string;
  telebirrNumber?: string;
  qrImageUrl?: string;
  active: boolean;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly receiptService: PaymentsReceiptService,
    private readonly exportService: PaymentsExportService,
    private readonly manualProvider: ManualPaymentProvider,
  ) {}

  /**
   * Returns current membership fee configuration & payment accounts
   */
  async getPaymentConfig(): Promise<{
    fee: MembershipFeeConfig;
    accounts: PaymentAccountConfig[];
  }> {
    const currentEthYear = gregorianToEthiopian(new Date()).year;

    const [feeSetting, accountsSetting] = await Promise.all([
      this.prisma.setting.findUnique({ where: { settingKey: 'membership.fee' } }),
      this.prisma.setting.findUnique({ where: { settingKey: 'payment.accounts' } }),
    ]);

    const fee: MembershipFeeConfig =
      feeSetting?.settingValue && typeof feeSetting.settingValue === 'object'
        ? {
            amount: Number((feeSetting.settingValue as any).amount) || 600,
            currency: (feeSetting.settingValue as any).currency || 'ETB',
            year: Number((feeSetting.settingValue as any).year) || currentEthYear,
            yearLabel: (feeSetting.settingValue as any).yearLabel || `${currentEthYear} ዓ.ም.`,
            deadline:
              (feeSetting.settingValue as any).deadline || `${new Date().getFullYear()}-12-31`,
          }
        : {
            amount: 600,
            currency: 'ETB',
            year: currentEthYear,
            yearLabel: `${currentEthYear} ዓ.ም.`,
            deadline: `${new Date().getFullYear()}-12-31`,
          };

    const accounts: PaymentAccountConfig[] =
      accountsSetting?.settingValue && Array.isArray(accountsSetting.settingValue)
        ? (accountsSetting.settingValue as unknown as PaymentAccountConfig[])
        : [
            {
              id: 'cbe-1',
              type: 'cbe',
              bankName: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
              accountName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
              accountNumber: '1000123456789',
              active: true,
            },
            {
              id: 'telebirr-1',
              type: 'telebirr',
              bankName: 'ቴሌብር (Telebirr)',
              accountName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
              telebirrNumber: '0911223344',
              active: true,
            },
            {
              id: 'abyssinia-1',
              type: 'abyssinia',
              bankName: 'አቢሲኒያ ባንክ (Bank of Abyssinia)',
              accountName: 'አዕማደ ሰላም ሰ/ት/ቤት',
              accountNumber: '8899001122',
              active: true,
            },
          ];

    return { fee, accounts };
  }

  /**
   * Helper to fetch school identity for receipts
   */
  private async getSchoolInfo(): Promise<{ nameAmharic: string; nameEnglish: string }> {
    const setting = await this.prisma.setting.findUnique({
      where: { settingKey: 'site.identity' },
    });
    if (setting?.settingValue && typeof setting.settingValue === 'object') {
      const v = setting.settingValue as any;
      return {
        nameAmharic: v.nameAmharic || 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
        nameEnglish: v.nameEnglish || 'Aemade Selam Sunday School',
      };
    }
    return {
      nameAmharic: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      nameEnglish: 'Aemade Selam Sunday School',
    };
  }

  /**
   * Resolves Member entity linked to the logged-in User
   */
  async getMemberByUserId(userId: string) {
    const member = await this.prisma.member.findFirst({
      where: { userId, deletedAt: null },
      include: { department: true },
    });
    if (!member) {
      throw new NotFoundException('የአባል መረጃ አልተገኘም (Member profile not found for current user)');
    }
    return member;
  }

  /**
   * Member portal: Get current member's status and payment history
   */
  async getMyPaymentStatus(userId: string, yearQuery?: number) {
    const member = await this.getMemberByUserId(userId);
    const { fee, accounts } = await this.getPaymentConfig();
    const targetYear = yearQuery ? Number(yearQuery) : fee.year;

    const [currentPayments, allHistory] = await Promise.all([
      this.prisma.membershipPayment.findMany({
        where: { memberId: member.id, membershipYear: targetYear },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.membershipPayment.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Determine status for targetYear
    const approvedPayment = currentPayments.find((p) => p.status === PaymentStatus.approved);
    const pendingPayment = currentPayments.find((p) => p.status === PaymentStatus.pending);
    const rejectedPayment = currentPayments.find((p) => p.status === PaymentStatus.rejected);

    let status: 'paid' | 'pending' | 'rejected' | 'not_paid' = 'not_paid';
    if (approvedPayment) {
      status = 'paid';
    } else if (pendingPayment) {
      status = 'pending';
    } else if (rejectedPayment) {
      status = 'rejected';
    }

    const latestPayment = currentPayments[0] || null;

    return {
      member: {
        id: member.id,
        memberNo: member.memberNo,
        fullName: `${member.firstName} ${member.fatherName}`,
        phone: member.phone,
        email: member.email,
        department: member.department ? member.department.nameAm : undefined,
      },
      membershipYear: targetYear,
      fee,
      status,
      currentPayment: latestPayment,
      approvedPayment: approvedPayment || null,
      history: allHistory,
      accounts: accounts.filter((a) => a.active),
    };
  }

  /**
   * Member portal: Submit payment proof (Bank transfer / Telebirr)
   */
  async submitPayment(
    userId: string,
    dto: SubmitMembershipPaymentDto,
    proofFile?: Express.Multer.File,
    ip?: string,
  ) {
    const member = await this.getMemberByUserId(userId);
    const { fee } = await this.getPaymentConfig();
    const membershipYear = dto.membershipYear ? Number(dto.membershipYear) : fee.year;

    // Check if member already has an approved payment for this year
    const existingApproved = await this.prisma.membershipPayment.findFirst({
      where: {
        memberId: member.id,
        membershipYear,
        status: PaymentStatus.approved,
      },
    });
    if (existingApproved) {
      throw new BadRequestException(
        `ለ${membershipYear} ዓ.ም. ክፍያዎ አስቀድሞ ፀድቋል (Payment already approved for year ${membershipYear})`,
      );
    }

    // Check unique constraint for (method, referenceNo)
    const duplicateRef = await this.prisma.membershipPayment.findFirst({
      where: {
        method: dto.method,
        referenceNo: dto.referenceNo.trim(),
      },
    });
    if (duplicateRef) {
      throw new ConflictException(
        `ይህ የማመሳከሪያ ቁጥር (${dto.referenceNo}) ቀደም ሲል ጥቅም ላይ ውሏል (This transaction reference has already been registered)`,
      );
    }

    let proofUrl = dto.proofUrl;
    if (proofFile) {
      proofUrl = await this.storageService.savePaymentProof(proofFile);
    }

    if (!proofUrl && dto.method !== PaymentMethod.cash) {
      throw new BadRequestException(
        'የክፍያ ማረጋገጫ ፋይል ወይም ደረሰኝ ማስገባት ግዴታ ነው (Proof of payment file is required)',
      );
    }

    const payment = await this.prisma.membershipPayment.create({
      data: {
        memberId: member.id,
        membershipYear,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'ETB',
        method: dto.method,
        referenceNo: dto.referenceNo.trim(),
        paidOn: new Date(dto.paidOn),
        proofUrl,
        reviewNote: dto.note || null,
        status: PaymentStatus.pending,
      },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'membership_payment.submitted',
        entity: 'MembershipPayment',
        entityId: payment.id,
        newValue: {
          memberId: member.id,
          memberNo: member.memberNo,
          amount: Number(payment.amount),
          membershipYear,
          method: payment.method,
          referenceNo: payment.referenceNo,
        },
        ip: ip || null,
      },
    });

    return payment;
  }

  /**
   * Member portal: Download receipt PDF for approved payment
   */
  async getMyReceiptPdf(userId: string, paymentId: string): Promise<Buffer> {
    const member = await this.getMemberByUserId(userId);

    const payment = await this.prisma.membershipPayment.findFirst({
      where: { id: paymentId, memberId: member.id },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('ክፍያው አልተገኘም (Payment record not found)');
    }

    if (payment.status !== PaymentStatus.approved) {
      throw new BadRequestException(
        'ደረሰኝ ማውረድ የሚቻለው ክፍያው ሲጸድቅ ብቻ ነው (Receipt is only available for approved payments)',
      );
    }

    const schoolInfo = await this.getSchoolInfo();
    return await this.receiptService.generateReceiptPdf(
      payment as unknown as MembershipPaymentWithMember,
      schoolInfo,
    );
  }

  /**
   * Admin: Get all payments with filters, search, and method breakdown totals
   */
  async getAdminPayments(query: QueryMembershipPaymentsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.MembershipPaymentWhereInput = {};

    if (query.year) {
      where.membershipYear = Number(query.year);
    }
    if (query.method) {
      where.method = query.method;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { referenceNo: { contains: term } },
        { receiptNo: { contains: term } },
        {
          member: {
            OR: [
              { memberNo: { contains: term } },
              { firstName: { contains: term } },
              { fatherName: { contains: term } },
              { phone: { contains: term } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.membershipPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
              phone: true,
              email: true,
              parish: true,
              department: { select: { id: true, nameAm: true, nameEn: true } },
            },
          },
          reviewer: {
            select: { id: true, email: true, phone: true },
          },
        },
      }),
      this.prisma.membershipPayment.count({ where }),
    ]);

    // Method breakdown for approved payments
    const methodTotalsRaw = await this.prisma.membershipPayment.groupBy({
      by: ['method'],
      where: {
        ...where,
        status: PaymentStatus.approved,
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const methodTotals = methodTotalsRaw.map((m) => ({
      method: m.method,
      totalAmount: Number(m._sum.amount || 0),
      count: m._count.id,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      methodTotals,
    };
  }

  /**
   * Admin: Get dashboard summary metrics (collected this year, pending review, paid vs unpaid)
   */
  async getAdminSummary(yearQuery?: number) {
    const { fee } = await this.getPaymentConfig();
    const year = yearQuery ? Number(yearQuery) : fee.year;

    const [approvedSum, pendingCount, approvedCount, rejectedCount, totalActiveMembers] =
      await Promise.all([
        this.prisma.membershipPayment.aggregate({
          where: { membershipYear: year, status: PaymentStatus.approved },
          _sum: { amount: true },
        }),
        this.prisma.membershipPayment.count({
          where: { membershipYear: year, status: PaymentStatus.pending },
        }),
        this.prisma.membershipPayment.count({
          where: { membershipYear: year, status: PaymentStatus.approved },
        }),
        this.prisma.membershipPayment.count({
          where: { membershipYear: year, status: PaymentStatus.rejected },
        }),
        this.prisma.member.count({
          where: { status: 'active', deletedAt: null },
        }),
      ]);

    // Members who have paid for this year
    const paidMembersCount = await this.prisma.member.count({
      where: {
        status: 'active',
        deletedAt: null,
        membershipPayments: {
          some: { membershipYear: year, status: PaymentStatus.approved },
        },
      },
    });

    const unpaidCount = Math.max(0, totalActiveMembers - paidMembersCount);
    const collectionRate =
      totalActiveMembers > 0 ? Math.round((paidMembersCount / totalActiveMembers) * 100) : 0;

    return {
      year,
      fee,
      totalCollected: Number(approvedSum._sum.amount || 0),
      pendingCount,
      approvedCount,
      rejectedCount,
      totalActiveMembers,
      paidMembersCount,
      unpaidCount,
      collectionRate,
    };
  }

  /**
   * Admin: Approve or Reject a payment
   */
  async reviewPayment(
    adminUserId: string,
    paymentId: string,
    dto: ReviewMembershipPaymentDto,
    ip?: string,
  ) {
    const payment = await this.prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          select: {
            id: true,
            userId: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('ክፍያው አልተገኘም (Payment not found)');
    }

    const now = new Date();

    if (dto.status === PaymentStatus.approved) {
      // Generate receipt number if not exists
      const receiptNo =
        payment.receiptNo ||
        `REC-${payment.membershipYear}-${String(Date.now()).slice(-5)}-${payment.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`;

      const updated = await this.prisma.membershipPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.approved,
          receiptNo,
          reviewedBy: adminUserId,
          reviewedAt: now,
          reviewNote: null,
        },
      });

      // Send in-app notification to member
      if (payment.member?.userId) {
        await this.prisma.notification.create({
          data: {
            userId: payment.member.userId,
            title: 'የአባልነት ክፍያዎ ፀድቋል! (Membership Payment Approved)',
            body: `የ${payment.membershipYear} ዓ.ም. ዓመታዊ የአባልነት ክፍያዎ (${payment.amount} ETB) ፀድቋል። የደረሰኝ ቁጥር፦ ${receiptNo}`,
            data: {
              type: 'membership_payment_approved',
              paymentId: payment.id,
              receiptNo,
              year: payment.membershipYear,
            },
            sentAt: now,
          },
        });
      }

      // Write audit log
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'membership_payment.approved',
          entity: 'MembershipPayment',
          entityId: payment.id,
          oldValue: { status: payment.status },
          newValue: { status: 'approved', receiptNo },
          ip: ip || null,
        },
      });

      return updated;
    } else {
      // Rejected
      if (!dto.reviewNote || !dto.reviewNote.trim()) {
        throw new BadRequestException(
          'ክፍያውን ውድቅ ለማድረግ ምክንያቱን ማስገባት ግዴታ ነው (Rejection reason is mandatory)',
        );
      }

      const updated = await this.prisma.membershipPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.rejected,
          reviewedBy: adminUserId,
          reviewedAt: now,
          reviewNote: dto.reviewNote.trim(),
        },
      });

      // Send in-app notification to member
      if (payment.member?.userId) {
        await this.prisma.notification.create({
          data: {
            userId: payment.member.userId,
            title: 'የአባልነት ክፍያ ማስታወቂያ (Payment Rejected)',
            body: `የ${payment.membershipYear} ዓ.ም. ዓመታዊ የአባልነት ክፍያዎ ውድቅ ተደርጓል። ምክንያት፦ ${dto.reviewNote.trim()}`,
            data: {
              type: 'membership_payment_rejected',
              paymentId: payment.id,
              reason: dto.reviewNote.trim(),
              year: payment.membershipYear,
            },
            sentAt: now,
          },
        });
      }

      // Write audit log
      await this.prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'membership_payment.rejected',
          entity: 'MembershipPayment',
          entityId: payment.id,
          oldValue: { status: payment.status },
          newValue: { status: 'rejected', reviewNote: dto.reviewNote },
          ip: ip || null,
        },
      });

      return updated;
    }
  }

  /**
   * Admin: Record direct cash payment for a member (auto-approved with receipt)
   */
  async recordCashPayment(adminUserId: string, dto: RecordCashPaymentDto, ip?: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });

    if (!member) {
      throw new NotFoundException('አባል አልተገኘም (Member not found)');
    }

    const { fee } = await this.getPaymentConfig();
    const membershipYear = dto.membershipYear ? Number(dto.membershipYear) : fee.year;

    // Check if member already has approved payment for this year
    const existing = await this.prisma.membershipPayment.findFirst({
      where: {
        memberId: member.id,
        membershipYear,
        status: PaymentStatus.approved,
      },
    });
    if (existing) {
      throw new BadRequestException(`ለዚህ አባል የ${membershipYear} ዓ.ም. ክፍያ ቀድሞውኑ ፀድቋል`);
    }

    const refNo =
      dto.referenceNo && dto.referenceNo.trim()
        ? dto.referenceNo.trim()
        : `CASH-${membershipYear}-${Date.now().toString().slice(-6)}`;

    // Check unique reference for cash
    const duplicate = await this.prisma.membershipPayment.findFirst({
      where: { method: PaymentMethod.cash, referenceNo: refNo },
    });
    if (duplicate) {
      throw new ConflictException(`የማመሳከሪያ ቁጥር '${refNo}' ቀደም ሲል ተመዝግቧል`);
    }

    const receiptNo = `REC-${membershipYear}-${String(Date.now()).slice(-5)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const payment = await this.prisma.membershipPayment.create({
      data: {
        memberId: member.id,
        membershipYear,
        amount: new Prisma.Decimal(dto.amount),
        currency: 'ETB',
        method: PaymentMethod.cash,
        referenceNo: refNo,
        paidOn: new Date(dto.paidOn),
        receiptNo,
        status: PaymentStatus.approved,
        reviewedBy: adminUserId,
        reviewedAt: now,
        reviewNote: dto.note || 'ጥሬ ገንዘብ ክፍያ (Direct Cash Payment)',
      },
    });

    // Notify member if linked to user
    if (member.userId) {
      await this.prisma.notification.create({
        data: {
          userId: member.userId,
          title: 'የጥሬ ገንዘብ ክፍያ ተመዝግቧል! (Cash Payment Recorded)',
          body: `የ${membershipYear} ዓ.ም. ዓመታዊ የአባልነት ክፍያዎ (${dto.amount} ETB) በጥሬ ገንዘብ ተቀብሎ ፀድቋል። የደረሰኝ ቁጥር፦ ${receiptNo}`,
          data: {
            type: 'membership_cash_payment_recorded',
            paymentId: payment.id,
            receiptNo,
            year: membershipYear,
          },
          sentAt: now,
        },
      });
    }

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'membership_payment.cash_recorded',
        entity: 'MembershipPayment',
        entityId: payment.id,
        newValue: {
          memberId: member.id,
          memberNo: member.memberNo,
          amount: Number(payment.amount),
          membershipYear,
          receiptNo,
        },
        ip: ip || null,
      },
    });

    return payment;
  }

  /**
   * Admin: List unpaid active members for the specified year
   */
  async getUnpaidMembers(yearQuery?: number) {
    const { fee } = await this.getPaymentConfig();
    const year = yearQuery ? Number(yearQuery) : fee.year;

    const unpaidMembers = await this.prisma.member.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        membershipPayments: {
          none: {
            membershipYear: year,
            status: PaymentStatus.approved,
          },
        },
      },
      select: {
        id: true,
        memberNo: true,
        firstName: true,
        fatherName: true,
        grandfatherName: true,
        phone: true,
        email: true,
        department: { select: { id: true, nameAm: true, nameEn: true } },
        membershipPayments: {
          where: { membershipYear: year },
          select: { id: true, status: true, referenceNo: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ firstName: 'asc' }, { fatherName: 'asc' }],
    });

    return {
      year,
      fee,
      count: unpaidMembers.length,
      members: unpaidMembers.map((m) => ({
        id: m.id,
        memberNo: m.memberNo,
        firstName: m.firstName,
        fatherName: m.fatherName,
        grandfatherName: m.grandfatherName,
        phone: m.phone,
        email: m.email,
        department: m.department,
        latestAttempt: m.membershipPayments[0] || null,
      })),
    };
  }

  /**
   * Admin: Send payment reminders to unpaid active members
   */
  async sendReminders(adminUserId: string, dto: SendPaymentRemindersDto, ip?: string) {
    const { fee } = await this.getPaymentConfig();
    const year = dto.year ? Number(dto.year) : fee.year;

    const unpaidMembers = await this.prisma.member.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        userId: { not: null },
        membershipPayments: {
          none: {
            membershipYear: year,
            status: PaymentStatus.approved,
          },
        },
      },
      select: { id: true, userId: true, firstName: true },
    });

    const userIds = unpaidMembers.map((m) => m.userId).filter((uid): uid is string => Boolean(uid));

    if (userIds.length === 0) {
      return { sentCount: 0, year };
    }

    const title = `የ${year} ዓ.ም. ዓመታዊ የአባልነት ክፍያ ማስታወሻ`;
    const defaultBody = `ውድ አባል፣ የ${fee.yearLabel} ዓመታዊ የአባልነት ክፍያዎን (${fee.amount} ${fee.currency}) በወቅቱ እንዲፈጽሙ በትህትና እናሳስባለን። የመጨረሻ ቀን፦ ${fee.deadline || 'ያልተወሰነ'}`;
    const body = dto.customMessage?.trim() || defaultBody;

    const now = new Date();
    await this.prisma.notification.createMany({
      data: userIds.map((uid) => ({
        userId: uid,
        title,
        body,
        data: {
          type: 'membership_payment_reminder',
          year,
          amount: fee.amount,
        },
        sentAt: now,
      })),
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'membership_payment.reminders_sent',
        entity: 'MembershipPayment',
        newValue: {
          year,
          targetCount: userIds.length,
        },
        ip: ip || null,
      },
    });

    return { sentCount: userIds.length, year };
  }

  /**
   * Admin: Download receipt PDF for any approved payment
   */
  async getReceiptPdfForAdmin(paymentId: string): Promise<Buffer> {
    const payment = await this.prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('ክፍያው አልተገኘም (Payment not found)');
    }

    if (payment.status !== PaymentStatus.approved) {
      throw new BadRequestException('ደረሰኝ የሚዘጋጀው ለፀደቁ ክፍያዎች ብቻ ነው');
    }

    const schoolInfo = await this.getSchoolInfo();
    return await this.receiptService.generateReceiptPdf(
      payment as unknown as MembershipPaymentWithMember,
      schoolInfo,
    );
  }

  /**
   * Admin: Export payments list to styled Excel sheet
   */
  async exportPaymentsExcel(query: QueryMembershipPaymentsDto): Promise<Buffer> {
    const where: Prisma.MembershipPaymentWhereInput = {};

    if (query.year) where.membershipYear = Number(query.year);
    if (query.method) where.method = query.method;
    if (query.status) where.status = query.status;

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { referenceNo: { contains: term } },
        { receiptNo: { contains: term } },
        {
          member: {
            OR: [
              { memberNo: { contains: term } },
              { firstName: { contains: term } },
              { fatherName: { contains: term } },
              { phone: { contains: term } },
            ],
          },
        },
      ];
    }

    const [payments, summary] = await Promise.all([
      this.prisma.membershipPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
              phone: true,
              email: true,
              parish: true,
            },
          },
        },
      }),
      this.getAdminSummary(query.year),
    ]);

    return await this.exportService.generatePaymentsExcel(
      payments as unknown as MembershipPaymentWithMember[],
      {
        totalCollected: summary.totalCollected,
        approvedCount: summary.approvedCount,
        pendingCount: summary.pendingCount,
        rejectedCount: summary.rejectedCount,
        year: query.year,
      },
    );
  }
}
