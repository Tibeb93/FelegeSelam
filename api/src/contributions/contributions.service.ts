import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContributionsReceiptService } from './contributions-receipt.service';
import {
  CreateContributionDto,
  UpdateContributionDto,
  QueryContributionDto,
  ExportContributionDto,
} from './dto/contribution.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptService: ContributionsReceiptService,
  ) {}

  /**
   * Generates a sequential, formatted receipt number (REC-YYYY-0001)
   */
  async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;

    const latest = await this.prisma.contribution.findFirst({
      where: {
        receiptNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNo: 'desc',
      },
    });

    let nextNumber = 1;
    if (latest && latest.receiptNo) {
      const parts = latest.receiptNo.split('-');
      const seqStr = parts[parts.length - 1];
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  private async logAudit(data: {
    action: string;
    entity: string;
    entityId?: string;
    userId?: string;
    oldValue?: any;
    newValue?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId ? String(data.entityId) : null,
          userId: data.userId || null,
          oldValue: data.oldValue || null,
          newValue: data.newValue || null,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write audit log: ${err.message}`);
    }
  }

  /**
   * Record a new contribution
   */
  async createContribution(dto: CreateContributionDto, userId?: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${dto.memberId}" was not found`);
    }

    const receiptNo = dto.receiptNo ? dto.receiptNo.trim() : await this.generateReceiptNumber();

    const existingReceipt = await this.prisma.contribution.findUnique({
      where: { receiptNo },
    });
    if (existingReceipt) {
      throw new ConflictException(`Receipt number "${receiptNo}" already exists in the system`);
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const contribution = await this.prisma.contribution.create({
      data: {
        memberId: dto.memberId,
        amount: new Prisma.Decimal(dto.amount),
        type: dto.type,
        paymentMethod: dto.paymentMethod || 'cash',
        period: dto.period || null,
        receiptNo,
        notes: dto.notes || null,
        paidAt,
        recordedBy: userId || null,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    await this.logAudit({
      action: 'create',
      entity: 'contribution',
      entityId: contribution.id,
      userId,
      newValue: {
        receiptNo: contribution.receiptNo,
        amount: Number(contribution.amount),
        memberNo: member.memberNo,
      },
    });

    return contribution;
  }

  private buildWhereClause(query: QueryContributionDto): Prisma.ContributionWhereInput {
    const where: Prisma.ContributionWhereInput = {};

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.period) {
      where.period = query.period;
    }

    if (query.fromDate || query.toDate) {
      where.paidAt = {};
      if (query.fromDate) {
        where.paidAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        const toD = new Date(query.toDate);
        toD.setHours(23, 59, 59, 999);
        where.paidAt.lte = toD;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { receiptNo: { contains: term } },
        { notes: { contains: term } },
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

    return where;
  }

  /**
   * List contributions with filters and pagination
   */
  async findAll(query: QueryContributionDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const [total, contributions, aggregateSum] = await Promise.all([
      this.prisma.contribution.count({ where }),
      this.prisma.contribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              phone: true,
              email: true,
              parish: true,
            },
          },
        },
      }),
      this.prisma.contribution.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      data: contributions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        totalAmount: Number(aggregateSum._sum.amount || 0),
      },
    };
  }

  /**
   * Get single contribution
   */
  async findOne(id: string) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    if (!contribution) {
      throw new NotFoundException(`Contribution with ID "${id}" was not found`);
    }

    return contribution;
  }

  /**
   * Update contribution
   */
  async update(id: string, dto: UpdateContributionDto, userId?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.contribution.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount),
        }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.paymentMethod !== undefined && {
          paymentMethod: dto.paymentMethod,
        }),
        ...(dto.period !== undefined && { period: dto.period }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.paidAt !== undefined && { paidAt: new Date(dto.paidAt) }),
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    await this.logAudit({
      action: 'update',
      entity: 'contribution',
      entityId: id,
      userId,
      oldValue: {
        amount: Number(existing.amount),
        type: existing.type,
      },
      newValue: {
        amount: Number(updated.amount),
        type: updated.type,
      },
    });

    return updated;
  }

  /**
   * Delete contribution
   */
  async delete(id: string, userId?: string) {
    const existing = await this.findOne(id);

    await this.prisma.contribution.delete({
      where: { id },
    });

    await this.logAudit({
      action: 'delete',
      entity: 'contribution',
      entityId: id,
      userId,
      oldValue: {
        receiptNo: existing.receiptNo,
        amount: Number(existing.amount),
      },
    });

    return {
      success: true,
      message: `Contribution receipt ${existing.receiptNo} deleted`,
    };
  }

  /**
   * School-wide monthly summary of contributions
   */
  async getSchoolSummary(query?: QueryContributionDto) {
    const where = query ? this.buildWhereClause(query) : {};

    const [allContributions, totalAgg] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        select: {
          amount: true,
          type: true,
          paidAt: true,
          period: true,
        },
      }),
      this.prisma.contribution.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalAmount = Number(totalAgg._sum.amount || 0);
    const totalCount = totalAgg._count.id;

    // Breakdown by type
    const typeMap = new Map<string, { amount: number; count: number }>();
    for (const c of allContributions) {
      const entry = typeMap.get(c.type) || { amount: 0, count: 0 };
      entry.amount += Number(c.amount);
      entry.count += 1;
      typeMap.set(c.type, entry);
    }

    const byType = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      totalAmount: stats.amount,
      count: stats.count,
    }));

    // Breakdown by month (last 12 months)
    const now = new Date();
    const byMonth: Array<{ period: string; totalAmount: number; count: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const periodKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const monthlyRecords = allContributions.filter((c) => c.paidAt >= start && c.paidAt <= end);
      const mAmount = monthlyRecords.reduce((sum, cur) => sum + Number(cur.amount), 0);

      byMonth.push({
        period: periodKey,
        totalAmount: mAmount,
        count: monthlyRecords.length,
      });
    }

    return {
      totalAmount,
      totalCount,
      byType,
      byMonth,
    };
  }

  /**
   * Monthly summary per member
   */
  async getMemberSummary(memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, deletedAt: null },
      select: { id: true, memberNo: true, firstName: true, fatherName: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${memberId}" was not found`);
    }

    const contributions = await this.prisma.contribution.findMany({
      where: { memberId },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        amount: true,
        type: true,
        period: true,
        paidAt: true,
        receiptNo: true,
      },
    });

    const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalCount = contributions.length;

    const byTypeMap = new Map<string, { amount: number; count: number }>();
    for (const c of contributions) {
      const entry = byTypeMap.get(c.type) || { amount: 0, count: 0 };
      entry.amount += Number(c.amount);
      entry.count += 1;
      byTypeMap.set(c.type, entry);
    }

    const byType = Array.from(byTypeMap.entries()).map(([type, stats]) => ({
      type,
      totalAmount: stats.amount,
      count: stats.count,
    }));

    return {
      member,
      totalAmount,
      totalCount,
      byType,
      recentContributions: contributions,
    };
  }

  /**
   * Generate official receipt voucher PDF
   */
  async generateReceiptPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const contribution = await this.findOne(id);
    const buffer = await this.receiptService.generateReceiptPdf(contribution as any);
    return {
      buffer,
      filename: `Receipt_${contribution.receiptNo}.pdf`,
    };
  }

  /**
   * Export contributions to Excel
   */
  async exportToExcel(
    query: ExportContributionDto,
    userId?: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const where = this.buildWhereClause(query);

    const contributions = await this.prisma.contribution.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      take: 5000,
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            phone: true,
            email: true,
            parish: true,
          },
        },
      },
    });

    const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

    const buffer = await this.receiptService.generateContributionsExcel(contributions as any, {
      totalAmount,
      totalCount: contributions.length,
    });

    await this.logAudit({
      action: 'export',
      entity: 'contributions',
      userId,
      newValue: {
        count: contributions.length,
        totalAmount,
      },
    });

    const filename = `Contributions_${new Date().toISOString().split('T')[0]}.xlsx`;
    return { buffer, filename };
  }
}
