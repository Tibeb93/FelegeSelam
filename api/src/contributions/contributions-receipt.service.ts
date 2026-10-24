import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as QRCode from 'qrcode';
import type { Browser } from 'puppeteer';
import * as fs from 'fs';
import { Contribution, Member } from '@prisma/client';

export type ContributionWithMember = Contribution & {
  member: Pick<
    Member,
    'id' | 'memberNo' | 'firstName' | 'fatherName' | 'phone' | 'email' | 'parish'
  >;
};

@Injectable()
export class ContributionsReceiptService {
  private readonly logger = new Logger(ContributionsReceiptService.name);

  private readonly brandPrimary = '#0F4C81';
  private readonly brandNavy = '#0A2E52';
  private readonly brandGold = '#F2B233';
  private readonly brandSoftBlue = '#E8F1FB';
  private readonly brandDark = '#0F2438';

  /**
   * Helper to launch Puppeteer browser safely with auto-detected Chrome/Edge executable
   */
  private async getBrowser(): Promise<Browser> {
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (!executablePath) {
      const candidates = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          executablePath = candidate;
          break;
        }
      }
    }

    let launch: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const pptr = require('puppeteer');
      launch = pptr.launch || pptr.default?.launch;
    } catch {
      const pptr = await import('puppeteer');
      launch = pptr.launch;
    }

    return await launch({
      executablePath: executablePath || undefined,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  /**
   * Translates contribution type to human-readable Amharic
   */
  private formatContributionType(type: string): string {
    const types: Record<string, string> = {
      monthly_fee: 'ወርሃዊ መደበኛ መዋጮ',
      donation: 'የልማትና የበጎ አድራጎት ስጦታ',
      pledge: 'የስእለትና የቃል ኪዳን ክፍያ',
      special_event: 'የልዩ መርሐ ግብር ድጋፍ',
      feast: 'የበዓለ ንግሥ መስተንግዶ',
    };
    return types[type] || type;
  }

  /**
   * Generates official PDF Receipt Voucher with QR code
   */
  async generateReceiptPdf(contribution: ContributionWithMember): Promise<Buffer> {
    const qrData = JSON.stringify({
      receiptNo: contribution.receiptNo,
      memberNo: contribution.member.memberNo,
      amount: Number(contribution.amount),
      paidAt: contribution.paidAt,
      type: contribution.type,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 140,
      margin: 1,
      color: { dark: '#0F4C81', light: '#FFFFFF' },
    });

    const dateStr = new Date(contribution.paidAt).toISOString().replace('T', ' ').slice(0, 16);
    const amountFormatted = Number(contribution.amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const html = `
      <!DOCTYPE html>
      <html lang="am">
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${contribution.receiptNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap');
          
          @page {
            size: A5 landscape;
            margin: 8mm;
          }
          
          body {
            font-family: 'Noto Sans Ethiopic', 'Segoe UI', Tahoma, sans-serif;
            color: #0F2438;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 11px;
          }

          .receipt-border {
            border: 2px solid #0F4C81;
            border-radius: 6px;
            padding: 16px;
            background-color: #FFFFFF;
            position: relative;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0F4C81;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .header-left h1 {
            color: #0F4C81;
            font-size: 16px;
            margin: 0 0 4px 0;
            font-weight: 700;
          }

          .header-left h2 {
            color: #F2B233;
            font-size: 13px;
            margin: 0;
            font-weight: 600;
          }

          .receipt-badge {
            background-color: #E8F1FB;
            border: 1px solid #D7E3F1;
            border-radius: 4px;
            padding: 6px 12px;
            text-align: right;
          }

          .receipt-badge .num {
            font-size: 14px;
            font-weight: 700;
            color: #0F4C81;
          }

          .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 16px;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
          }

          .info-table td {
            padding: 5px 4px;
            border-bottom: 1px solid #D7E3F1;
            font-size: 11px;
          }

          .info-table td.label {
            color: #5B6B7C;
            width: 38%;
            font-weight: 600;
          }

          .info-table td.val {
            color: #0F2438;
            font-weight: 600;
          }

          .amount-box {
            background-color: #E8F1FB;
            border: 2px solid #0F4C81;
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            margin-top: 10px;
          }

          .amount-box .title {
            font-size: 10px;
            color: #5B6B7C;
            text-transform: uppercase;
          }

          .amount-box .val {
            font-size: 20px;
            font-weight: 700;
            color: #0F4C81;
            margin: 4px 0;
          }

          .qr-side {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }

          .qr-side img {
            width: 110px;
            height: 110px;
            border: 1px solid #D7E3F1;
            border-radius: 4px;
            padding: 2px;
            background: #fff;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px dashed #D7E3F1;
            font-size: 9px;
            color: #5B6B7C;
          }

          .sign-line {
            width: 140px;
            border-top: 1px solid #0F2438;
            margin-top: 25px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt-border">
          <div class="header">
            <div class="header-left">
              <h1>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h1>
              <h2>የገቢ ደረሰኝ ቫውቸር (Official Income Receipt)</h2>
            </div>
            <div class="receipt-badge">
              <div style="font-size: 10px; color: #666;">የደረሰኝ ቁጥር (Receipt No)</div>
              <div class="num">${contribution.receiptNo}</div>
              <div style="font-size: 9px; color: #888;">ቀን፦ ${dateStr}</div>
            </div>
          </div>

          <div class="content-grid">
            <div>
              <table class="info-table">
                <tr>
                  <td class="label">የከፋዩ ሙሉ ስም</td>
                  <td class="val">${contribution.member.firstName} ${contribution.member.fatherName}</td>
                </tr>
                <tr>
                  <td class="label">የአባል መለያ ቁጥር</td>
                  <td class="val"><code>${contribution.member.memberNo}</code></td>
                </tr>
                <tr>
                  <td class="label">ስልክ ቁጥር</td>
                  <td class="val">${contribution.member.phone || '-'}</td>
                </tr>
                <tr>
                  <td class="label">የክፍያው ዓይነት</td>
                  <td class="val">${this.formatContributionType(contribution.type)}</td>
                </tr>
                <tr>
                  <td class="label">የክፍያ ወቅት / ወር</td>
                  <td class="val">${contribution.period || '-'}</td>
                </tr>
                <tr>
                  <td class="label">የክፍያ ዘዴ</td>
                  <td class="val">${contribution.paymentMethod || 'ጥሬ ገንዘብ (Cash)'}</td>
                </tr>
                <tr>
                  <td class="label">ማስታወሻ</td>
                  <td class="val">${contribution.notes || '-'}</td>
                </tr>
              </table>

              <div class="amount-box">
                <div class="title">የተከፈለው የገንዘብ መጠን (Total Amount Paid)</div>
                <div class="val">${amountFormatted} ብር (ETB)</div>
              </div>
            </div>

            <div class="qr-side">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
              <div style="font-size: 8px; color: #666; margin-top: 6px;">
                በትክክለኛነቱ የተረጋገጠ ዲጂታል ደረሰኝ<br/>
                Official Verified Digital Receipt
              </div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sign-line">የገንዘብ ያዥ ፊርማ (Cashier)</div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
              የሰንበት ትምህርት ቤቱ ይፋዊ ማህተም (Official Stamp)
            </div>
            <div>
              <div class="sign-line">የከፋዩ ፊርማ (Payer)</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A5',
        landscape: true,
        printBackground: true,
        margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generates a styled Excel report of contributions
   */
  async generateContributionsExcel(
    contributions: ContributionWithMember[],
    summary: { totalAmount: number; totalCount: number },
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'አዕማደ ሰላም ሰንበት ትምህርት ቤት';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Contributions', {
      views: [{ showGridLines: true }],
    });

    // Title
    worksheet.mergeCells('A1', 'J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'አዕማደ ሰላም ሰንበት ት/ቤት - የገቢና የመዋጮ መዝገብ (Contributions Register)';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F4C81' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // Subtitle & Stats
    worksheet.mergeCells('A2', 'J2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `ጠቅላላ የተሰበሰበ ገቢ፦ ${summary.totalAmount.toLocaleString()} ብር  |  ጠቅላላ ደረሰኞች፦ ${summary.totalCount}  |  ቀን፦ ${new Date().toISOString().split('T')[0]}`;
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F2438' } };
    subCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F1FB' },
    };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 24;

    // Empty
    worksheet.getRow(3).height = 10;

    // Headers
    const headers = [
      '#',
      'የደረሰኝ ቁጥር (Receipt No)',
      'የተከፈለበት ቀን (Paid Date)',
      'የአባል ቁጥር (Member No)',
      'የአባል ሙሉ ስም (Member Name)',
      'ስልክ (Phone)',
      'ዓይነት (Type)',
      'የክፍያ ወቅት (Period)',
      'የክፍያ ዘዴ (Method)',
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

    // Populate data
    let rowIdx = 5;
    for (let i = 0; i < contributions.length; i++) {
      const c = contributions[i];
      const memberName = `${c.member.firstName} ${c.member.fatherName}`;
      const amountNum = Number(c.amount);

      const rowValues = [
        i + 1,
        c.receiptNo,
        new Date(c.paidAt).toISOString().split('T')[0],
        c.member.memberNo,
        memberName,
        c.member.phone || '-',
        this.formatContributionType(c.type),
        c.period || '-',
        c.paymentMethod || 'cash',
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
            colNumber === 1 || colNumber === 3 ? 'center' : colNumber === 10 ? 'right' : 'left',
        };
        if (colNumber === 10) {
          cell.numFmt = '#,##0.00';
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F4C81' } };
        }
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F6FC' },
          };
        }
      });

      rowIdx++;
    }

    // Total summary row
    const totalRow = worksheet.getRow(rowIdx);
    totalRow.values = ['', '', '', '', '', '', '', '', 'ድምር (TOTAL):', summary.totalAmount];
    totalRow.height = 24;
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F4C81' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F1FB' },
      };
      if (colNumber === 10) {
        cell.numFmt = '#,##0.00';
      }
    });

    // Auto fit widths
    worksheet.columns.forEach((col) => {
      let maxLen = 12;
      col?.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 35);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
