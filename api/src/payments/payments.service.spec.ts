import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PaymentsReceiptService } from './payments-receipt.service';
import { PaymentsExportService } from './payments-export.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let storage: any;
  let receipt: any;
  let exportSvc: any;

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    memberNo: 'MS-2018-001',
    firstName: 'ዮናስ',
    fatherName: 'ተስፋዬ',
    grandfatherName: 'ኃይሌ',
    phone: '0911223344',
    email: 'yonas@example.com',
    status: 'active',
    department: { id: 1, nameAm: 'ትምህርት ክፍል', nameEn: 'Education' },
  };

  const mockPayment = {
    id: 'pay-1',
    memberId: 'member-1',
    membershipYear: 2019,
    amount: 600,
    currency: 'ETB',
    method: PaymentMethod.telebirr,
    referenceNo: 'TXN123456',
    paidOn: new Date('2026-10-20'),
    proofUrl: '/uploads/payments/proof-1.jpg',
    status: PaymentStatus.pending,
    receiptNo: null,
    reviewNote: null,
    member: mockMember,
  };

  beforeEach(async () => {
    prisma = {
      setting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      member: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      membershipPayment: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    storage = {
      savePaymentProof: jest.fn().mockResolvedValue('/uploads/payments/proof-saved.jpg'),
    };

    receipt = {
      generateReceiptPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-receipt')),
      formatPaymentMethod: jest.fn().mockReturnValue('ቴሌብር (Telebirr)'),
    };

    exportSvc = {
      generatePaymentsExcel: jest.fn().mockResolvedValue(Buffer.from('excel-bytes')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        ManualPaymentProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: PaymentsReceiptService, useValue: receipt },
        { provide: PaymentsExportService, useValue: exportSvc },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('getPaymentConfig', () => {
    it('returns default membership fee and accounts when none configured in DB', async () => {
      prisma.setting.findUnique.mockResolvedValue(null);
      const config = await service.getPaymentConfig();

      expect(config.fee.amount).toBe(600);
      expect(config.fee.currency).toBe('ETB');
      expect(config.accounts.length).toBeGreaterThanOrEqual(2);
    });

    it('returns configured settings when stored in DB', async () => {
      prisma.setting.findUnique.mockImplementation(({ where }: any) => {
        if (where.settingKey === 'membership.fee') {
          return Promise.resolve({
            settingValue: {
              amount: 800,
              currency: 'ETB',
              year: 2019,
              yearLabel: '2019 ዓ.ም.',
              deadline: '2027-01-01',
            },
          });
        }
        if (where.settingKey === 'payment.accounts') {
          return Promise.resolve({
            settingValue: [
              {
                id: '1',
                type: 'cbe',
                bankName: 'CBE',
                accountName: 'School',
                accountNumber: '123',
                active: true,
              },
            ],
          });
        }
        return Promise.resolve(null);
      });

      const config = await service.getPaymentConfig();
      expect(config.fee.amount).toBe(800);
      expect(config.fee.year).toBe(2019);
      expect(config.accounts[0].accountNumber).toBe('123');
    });
  });

  describe('getMyPaymentStatus', () => {
    it('throws NotFoundException when current user has no member record', async () => {
      prisma.member.findFirst.mockResolvedValue(null);
      await expect(service.getMyPaymentStatus('missing-user')).rejects.toThrow(NotFoundException);
    });

    it('returns paid status when approved payment exists for target year', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findMany
        .mockResolvedValueOnce([
          { ...mockPayment, status: PaymentStatus.approved, receiptNo: 'REC-001' },
        ]) // currentPayments
        .mockResolvedValueOnce([{ ...mockPayment, status: PaymentStatus.approved }]); // allHistory

      const result = await service.getMyPaymentStatus('user-1');
      expect(result.status).toBe('paid');
      expect(result.currentPayment?.receiptNo).toBe('REC-001');
    });

    it('returns pending status when payment is under review', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findMany
        .mockResolvedValueOnce([{ ...mockPayment, status: PaymentStatus.pending }])
        .mockResolvedValueOnce([{ ...mockPayment }]);

      const result = await service.getMyPaymentStatus('user-1');
      expect(result.status).toBe('pending');
    });

    it('returns not_paid when no payment has been made', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await service.getMyPaymentStatus('user-1');
      expect(result.status).toBe('not_paid');
    });
  });

  describe('submitPayment', () => {
    it('throws BadRequestException if payment is already approved for that year', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findFirst.mockResolvedValueOnce({
        id: 'existing-approved',
        status: PaymentStatus.approved,
      });

      await expect(
        service.submitPayment('user-1', {
          method: PaymentMethod.telebirr,
          referenceNo: 'TXN111',
          paidOn: '2026-10-20',
          amount: 600,
          membershipYear: 2019,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if transaction reference number is a duplicate', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      // No approved payment for year
      prisma.membershipPayment.findFirst
        .mockResolvedValueOnce(null) // approved check
        .mockResolvedValueOnce({ id: 'existing-duplicate-ref' }); // duplicate ref check

      await expect(
        service.submitPayment('user-1', {
          method: PaymentMethod.telebirr,
          referenceNo: 'TXN-DUPLICATE',
          paidOn: '2026-10-20',
          amount: 600,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully creates pending payment and writes audit log', async () => {
      prisma.member.findFirst.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findFirst.mockResolvedValue(null);
      prisma.membershipPayment.create.mockResolvedValue(mockPayment);

      const fakeFile = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        size: 1024,
      } as any;

      const result = await service.submitPayment(
        'user-1',
        {
          method: PaymentMethod.telebirr,
          referenceNo: 'TXN-NEW',
          paidOn: '2026-10-20',
          amount: 600,
        },
        fakeFile,
        '127.0.0.1',
      );

      expect(result.id).toBe('pay-1');
      expect(storage.savePaymentProof).toHaveBeenCalledWith(fakeFile);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('reviewPayment', () => {
    it('approves payment, generates receipt number, notifies member, and logs audit', async () => {
      prisma.membershipPayment.findUnique.mockResolvedValue(mockPayment);
      prisma.membershipPayment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.approved,
        receiptNo: 'REC-2019-999',
      });

      const updated = await service.reviewPayment('admin-1', 'pay-1', {
        status: PaymentStatus.approved,
      });

      expect(updated.status).toBe(PaymentStatus.approved);
      expect(prisma.membershipPayment.update).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'membership_payment.approved' }),
        }),
      );
    });

    it('rejects without reviewNote throws BadRequestException', async () => {
      prisma.membershipPayment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        service.reviewPayment('admin-1', 'pay-1', {
          status: PaymentStatus.rejected,
          reviewNote: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects with reviewNote updates status and notifies member', async () => {
      prisma.membershipPayment.findUnique.mockResolvedValue(mockPayment);
      prisma.membershipPayment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.rejected,
        reviewNote: 'የባንክ ደረሰኝ አይነበብም',
      });

      const updated = await service.reviewPayment('admin-1', 'pay-1', {
        status: PaymentStatus.rejected,
        reviewNote: 'የባንክ ደረሰኝ አይነበብም',
      });

      expect(updated.status).toBe(PaymentStatus.rejected);
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'membership_payment.rejected' }),
        }),
      );
    });
  });

  describe('recordCashPayment', () => {
    it('records cash payment directly with auto-approval and unique receipt number', async () => {
      prisma.member.findUnique.mockResolvedValue(mockMember);
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.membershipPayment.findFirst.mockResolvedValue(null);
      prisma.membershipPayment.create.mockResolvedValue({
        ...mockPayment,
        method: PaymentMethod.cash,
        status: PaymentStatus.approved,
        receiptNo: 'REC-2019-CASH-001',
      });

      const payment = await service.recordCashPayment('admin-1', {
        memberId: 'member-1',
        amount: 600,
        paidOn: '2026-10-21',
        note: 'ቀጥታ ጥሬ ገንዘብ ተከፍሏል',
      });

      expect(payment.status).toBe(PaymentStatus.approved);
      expect(payment.receiptNo).toBeDefined();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'membership_payment.cash_recorded' }),
        }),
      );
    });
  });
});
