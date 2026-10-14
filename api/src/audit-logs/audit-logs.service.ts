import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogDto, ExportAuditLogDto } from './dto/audit-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(query: QueryAuditLogDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        const toD = new Date(query.toDate);
        toD.setHours(23, 59, 59, 999);
        where.createdAt.lte = toD;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { action: { contains: term } },
        { entity: { contains: term } },
        { entityId: { contains: term } },
        { ip: { contains: term } },
        {
          user: {
            email: { contains: term },
          },
        },
      ];
    }

    return where;
  }

  async findAll(query: QueryAuditLogDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportToExcel(query: ExportAuditLogDto): Promise<Buffer> {
    const where = this.buildWhereClause(query);

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000, // Export up to 5000 rows
      include: {
        user: {
          select: {
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'አዕማደ ሰላም ሰንበት ትምህርት ቤት';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('AuditLogs', {
      views: [{ showGridLines: true }],
    });

    // Title Row
    worksheet.mergeCells('A1', 'I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'አዕማደ ሰላም ሰንበት ት/ቤት - የስርዓት ክትትልና ኦዲት መዝገብ (System Audit Trail)';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B5E20' }, // Brand Green
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // Subtitle
    worksheet.mergeCells('A2', 'I2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `የወጣበት ቀን፦ ${new Date().toISOString().replace('T', ' ').slice(0, 19)} | ጠቅላላ የተመዘገቡ ተግባራት፦ ${logs.length}`;
    subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF2B1D0E' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFAF6EB' },
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 22;

    // Header Row
    const headers = [
      '#',
      'ቀንና ሰዓት (Timestamp)',
      'የተጠቃሚ ኢሜይል (User Email)',
      'ሚና (Role)',
      'ተግባር (Action)',
      'ክፍል (Entity)',
      'የመረጃ መለያ (Entity ID)',
      'አይ ፒ (IP Address)',
      'ዝርዝር መረጃ (Details/Payload)',
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B5E20' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFC9A227' } },
        bottom: { style: 'medium', color: { argb: 'FFC9A227' } },
      };
    });

    // Data rows
    let rowIdx = 5;
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const details = log.newValue
        ? JSON.stringify(log.newValue).slice(0, 300)
        : log.oldValue
          ? JSON.stringify(log.oldValue).slice(0, 300)
          : '-';

      const rowValues = [
        i + 1,
        new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19),
        log.user?.email || 'System / Unauth',
        log.user?.role?.name || '-',
        log.action,
        log.entity,
        log.entityId || '-',
        log.ip || '-',
        details,
      ];

      const row = worksheet.getRow(rowIdx);
      row.values = rowValues;
      row.height = 20;

      const isEven = i % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDFBF7' },
          };
        }
      });

      rowIdx++;
    }

    // Auto fit widths
    worksheet.columns.forEach((col) => {
      let maxLen = 12;
      col?.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 45);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
