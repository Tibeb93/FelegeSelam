import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { MembershipPaymentWithMember, PaymentsReceiptService } from './payments-receipt.service';
import { DEFAULT_SITE_IDENTITY } from '../common/site-identity';
import { gregorianToEthiopian } from '../common/ethiopian-calendar';

@Injectable()
export class PaymentsExportService {
  constructor(private readonly receiptService: PaymentsReceiptService) {}

  async generatePaymentsExcel(
    payments: MembershipPaymentWithMember[],
    summary: {
      totalCollected: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      year?: number;
    },
  ): Promise<Buffer> {
    const ethDate = gregorianToEthiopian(new Date());
    const ethDateStr = `${ethDate.day} ${ethDate.monthNameAm} ${ethDate.year} ዓ.ም.`;
    const gregDateStr = new Date().toISOString().split('T')[0];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = `${DEFAULT_SITE_IDENTITY.school.nameAm} - ${DEFAULT_SITE_IDENTITY.church.nameAm}`;
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Membership Payments', {
      views: [{ showGridLines: true }],
    });

    // Title banner
    worksheet.mergeCells('A1', 'K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${DEFAULT_SITE_IDENTITY.church.nameAm} • ${DEFAULT_SITE_IDENTITY.school.nameAm} (${DEFAULT_SITE_IDENTITY.location.combinedAm}) — ዓመታዊ የአባልነት ክፍያ መዝገብ`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F4C81' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // Subtitle & Statistics
    worksheet.mergeCells('A2', 'K2');
    const subCell = worksheet.getCell('A2');
    const yearText = summary.year ? `የ${summary.year} ዓ.ም.` : 'ሁሉም ዓመታት';
    subCell.value = `ካቴድራል፦ ${DEFAULT_SITE_IDENTITY.church.nameAm}  |  ${yearText}  |  ቀን (Eth / Greg)፦ ${ethDateStr} (${gregDateStr})  |  የተሰበሰበ ጠቅላላ፦ ${summary.totalCollected.toLocaleString()} ETB  |  የፀደቁ፦ ${summary.approvedCount}  |  በመጠባበቅ ላይ፦ ${summary.pendingCount}`;
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0A2E52' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F1FB' },
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 24;

    worksheet.getRow(3).height = 10;

    // Headers
    const headers = [
      '#',
      'የደረሰኝ ቁጥር (Receipt No)',
      'የአባል ቁጥር (Member No)',
      'የአባል ሙሉ ስም (Member Name)',
      'ስልክ (Phone)',
      'ዓ.ም (Year)',
      'የክፍያ ዘዴ (Method)',
      'ማመሳከሪያ (Ref No)',
      'የተከፈለበት ቀን (Paid Date)',
      'ሁኔታ (Status)',
      'መጠን በብር (Amount ETB)',
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F4C81' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0A2E52' } },
        bottom: { style: 'medium', color: { argb: 'FF0A2E52' } },
      };
    });

    // Populate rows
    let rowIdx = 5;
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      const memberName = [p.member.firstName, p.member.fatherName, p.member.grandfatherName]
        .filter(Boolean)
        .join(' ');
      const amountNum = Number(p.amount);
      const paidDateStr = p.paidOn ? new Date(p.paidOn).toISOString().split('T')[0] : '-';

      const statusAm =
        p.status === 'approved'
          ? 'የፀደቀ (Approved)'
          : p.status === 'pending'
            ? 'በመጠባበቅ ላይ (Pending)'
            : 'ውድቅ የተደረገ (Rejected)';

      const rowValues = [
        i + 1,
        p.receiptNo || '-',
        p.member.memberNo,
        memberName,
        p.member.phone || '-',
        p.membershipYear,
        this.receiptService.formatPaymentMethod(p.method),
        p.referenceNo,
        paidDateStr,
        statusAm,
        amountNum,
      ];

      const row = worksheet.getRow(rowIdx);
      row.values = rowValues;
      row.height = 20;

      const isEven = i % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal:
            colNumber === 1 ||
            colNumber === 3 ||
            colNumber === 6 ||
            colNumber === 9 ||
            colNumber === 10
              ? 'center'
              : colNumber === 11
                ? 'right'
                : 'left',
        };
        if (colNumber === 11) {
          cell.numFmt = '#,##0.00';
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F4C81' } };
        }
        if (colNumber === 10) {
          if (p.status === 'approved') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0E7044' } };
          } else if (p.status === 'rejected') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFBA1A1A' } };
          } else {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
          }
        }
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F8FC' },
          };
        }
      });

      rowIdx++;
    }

    // Summary Total Row
    const totalRow = worksheet.getRow(rowIdx);
    totalRow.values = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'ጠቅላላ የፀደቀ ገቢ (TOTAL):',
      summary.totalCollected,
    ];
    totalRow.height = 26;
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F4C81' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F1FB' },
      };
      if (colNumber === 11) {
        cell.numFmt = '#,##0.00';
      }
    });

    // Auto-fit column widths
    worksheet.columns.forEach((col) => {
      let maxLen = 12;
      col?.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 36);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
