import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  Packer,
} from 'docx';
import type { Browser } from 'puppeteer';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import { LetterType } from './dto/letter-member.dto';

@Injectable()
export class MembersExportService {
  private readonly logger = new Logger(MembersExportService.name);

  // Common styles
  private readonly brandGreen = '#1B5E20';
  private readonly brandGold = '#C9A227';
  private readonly brandCream = '#FAF6EB';
  private readonly brandDark = '#2B1D0E';

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

    // Use require for CommonJS / Jest VM, fallback to dynamic import
    let launch: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const pptr = require('puppeteer');
      launch = pptr.launch || pptr.default?.launch;
    } catch {
      const pptr = await (Function('return import("puppeteer")')() as any);
      launch = pptr.launch || pptr.default?.launch;
    }

    return launch({
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

  // =========================================================================
  // 1. EXCEL EXPORTS
  // =========================================================================

  async generateMembersExcel(members: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aemade Selam Sunday School';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Members Roster', {
      views: [{ showGridLines: true }],
    });

    // Title banner
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'አዕማደ ሰላም ሰንበት ትምህርት ቤት - የአባላት ዝርዝር (Aemade Selam Sunday School Members)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B5E20' }, // #1B5E20
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 36;

    // Subtitle
    sheet.mergeCells('A2:L2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `ሪፖርት የተዘጋጀበት ቀን: ${new Date().toISOString().split('T')[0]} | ጠቅላላ አባላት: ${members.length}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFAF6EB' } };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2B1D0E' },
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // Header row
    const headers = [
      'ተ.ቁ (No.)',
      'የአባል ቁጥር (Member No)',
      'ሙሉ ስም (Full Name)',
      'የክርስትና ስም (Baptismal Name)',
      'ጾታ (Sex)',
      'ስልክ (Phone)',
      'ኢሜይል (Email)',
      'ክፍል (Department)',
      'አጥቢያ (Parish)',
      'የንስሐ አባት (Confession Father)',
      'ሁኔታ (Status)',
      'የተመዘገበበት ቀን (Joined Date)',
    ];

    const headerRow = sheet.getRow(3);
    headerRow.values = headers;
    headerRow.height = 26;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B5E20' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium', color: { argb: 'FFC9A227' } },
        right: { style: 'thin' },
      };
    });

    // Populate data
    members.forEach((m, idx) => {
      const rowIdx = idx + 4;
      const fullName = `${m.firstName} ${m.fatherName} ${m.grandfatherName || ''}`.trim();
      const row = sheet.getRow(rowIdx);

      row.values = [
        idx + 1,
        m.memberNo,
        fullName,
        m.baptismalName || '-',
        m.sex === 'male' ? 'ወንድ (Male)' : 'ሴት (Female)',
        m.phone || '-',
        m.email || '-',
        m.department?.nameAm || '-',
        m.parish || '-',
        m.confessionFather || '-',
        m.status,
        m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : '-',
      ];

      row.height = 20;

      // Alternating background colors
      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFDFBF7' },
          };
        }
        if ([1, 2, 5, 11, 12].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle' };
        }
      });
    });

    // Column widths
    sheet.columns = [
      { width: 10 },
      { width: 18 },
      { width: 28 },
      { width: 22 },
      { width: 14 },
      { width: 18 },
      { width: 26 },
      { width: 20 },
      { width: 24 },
      { width: 24 },
      { width: 14 },
      { width: 18 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateSingleMemberExcel(member: any): Promise<Buffer> {
    return this.generateMembersExcel([member]);
  }

  async generateImportTemplateExcel(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Members Template');

    sheet.mergeCells('A1:R1');
    const banner = sheet.getCell('A1');
    banner.value = 'አዕማደ ሰላም ሰንበት ትምህርት ቤት - የአባላት መረጃ መሙያ ቅጽ (Members Import Template)';
    banner.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    banner.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B5E20' },
    };
    banner.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    const headers = [
      'FirstName *',
      'FatherName *',
      'GrandfatherName',
      'BaptismalName',
      'Sex * (male/female)',
      'DateOfBirth (YYYY-MM-DD)',
      'Phone',
      'Email',
      'Region',
      'Zone',
      'Woreda',
      'Kebele',
      'Parish',
      'ConfessionFather',
      'EducationLevel',
      'Occupation',
      'EmergencyName',
      'EmergencyPhone',
    ];

    const headerRow = sheet.getRow(2);
    headerRow.values = headers;
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2B1D0E' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Sample example row
    const sampleRow = sheet.getRow(3);
    sampleRow.values = [
      'ዮሐንስ',
      'ተክለ',
      'ኃይለማርያም',
      'ወልደ ጊዮርጊስ',
      'male',
      '1998-05-12',
      '+251911223344',
      'yohannes@example.com',
      'አዲስ አበባ',
      'አዲስ አበባ',
      'የካ',
      '08',
      'ደብረ ሰላም መድኃኔዓለም',
      'መልአከ ሰላም አስራት',
      'Degree',
      'Engineer',
      'ማርታ ተክለ',
      '+251922334455',
    ];
    sampleRow.height = 20;

    sheet.columns = headers.map(() => ({ width: 22 }));
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // =========================================================================
  // 2. WORD (DOCX) EXPORTS
  // =========================================================================

  async generateMembersDocx(members: any[]): Promise<Buffer> {
    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'ተ.ቁ', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'የአባል ቁጥር', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
          new TableCell({
            width: { size: 26, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'ሙሉ ስም', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'ጾታ', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'ስልክ', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'ክፍል', bold: true, color: 'FFFFFF' })],
              }),
            ],
            shading: { fill: '1B5E20' },
          }),
        ],
      }),
    );

    // Data rows
    members.forEach((m, idx) => {
      const fullName = `${m.firstName} ${m.fatherName} ${m.grandfatherName || ''}`.trim();
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(`${idx + 1}`)] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(m.memberNo)] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(fullName)] })],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun(m.sex === 'male' ? 'ወንድ' : 'ሴት')] }),
              ],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(m.phone || '-')] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun(m.department?.nameAm || '-')] })],
            }),
          ],
        }),
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: 'Aemade Selam Sunday School - Members Directory',
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `የአባላት ብዛት: ${members.length} | ቀን: ${new Date().toISOString().split('T')[0]}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  async generateSingleMemberDocx(member: any): Promise<Buffer> {
    const fullName =
      `${member.firstName} ${member.fatherName} ${member.grandfatherName || ''}`.trim();

    const details = [
      ['የአባል ቁጥር (Member No)', member.memberNo],
      ['ሙሉ ስም (Full Name)', fullName],
      ['የክርስትና ስም (Baptismal Name)', member.baptismalName || '-'],
      ['ጾታ (Sex)', member.sex === 'male' ? 'ወንድ (Male)' : 'ሴት (Female)'],
      [
        'የትውልድ ቀን (Date of Birth)',
        member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '-',
      ],
      ['ስልክ (Phone)', member.phone || '-'],
      ['ኢሜይል (Email)', member.email || '-'],
      ['ክፍል (Department)', member.department?.nameAm || '-'],
      ['የአጥቢያ ቤተክርስቲያን (Parish)', member.parish || '-'],
      ['የንስሐ አባት (Confession Father)', member.confessionFather || '-'],
      ['የትምህርት ደረጃ (Education)', member.educationLevel || '-'],
      ['የሥራ መስክ (Occupation)', member.occupation || '-'],
      [
        'የአደጋ ጊዜ ተጠሪ (Emergency Contact)',
        `${member.emergencyName || '-'} (${member.emergencyPhone || '-'})`,
      ],
      ['ሁኔታ (Status)', member.status],
      [
        'የተመዘገበበት ቀን (Joined Date)',
        member.joinedAt ? new Date(member.joinedAt).toISOString().split('T')[0] : '-',
      ],
    ];

    const rows = details.map(
      ([label, val]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
              shading: { fill: 'FAF6EB' },
            }),
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun(val || '-')] })],
            }),
          ],
        }),
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: 'Aemade Selam Sunday School - Member Profile',
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: '' }),
            new Table({
              rows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  // =========================================================================
  // 3. PDF EXPORTS (Puppeteer with Noto Sans Ethiopic and church styling)
  // =========================================================================

  private getHtmlWrapper(content: string, title: string = 'Aemade Selam'): string {
    return `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Ethiopic', 'Segoe UI', Arial, sans-serif;
      color: #2B1D0E;
      background: #FFFFFF;
      font-size: 13px;
      line-height: 1.5;
      padding: 24px;
    }
    .header {
      border-bottom: 3px double #C9A227;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cross-icon {
      font-size: 28px;
      color: #C9A227;
      line-height: 1;
    }
    .org-title {
      text-align: center;
      flex-grow: 1;
    }
    .org-title h1 {
      color: #1B5E20;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .org-title h2 {
      color: #2B1D0E;
      font-size: 13px;
      font-weight: 600;
    }
    .org-title p {
      color: #71583D;
      font-size: 11px;
    }
    .footer {
      position: fixed;
      bottom: 20px;
      left: 24px;
      right: 24px;
      border-top: 1px solid #C9A227;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #71583D;
    }
    ${content.includes('/* EXTRA_CSS */') ? '' : ''}
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  }

  async generateMembersPdf(members: any[]): Promise<Buffer> {
    const rowsHtml = members
      .map(
        (m, idx) => `
      <tr style="${idx % 2 === 1 ? 'background-color: #FAF6EB;' : ''}">
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #DDD;">${idx + 1}</td>
        <td style="font-weight: 600; padding: 6px 8px; border: 1px solid #DDD;">${m.memberNo}</td>
        <td style="padding: 6px 8px; border: 1px solid #DDD;">${m.firstName} ${m.fatherName} ${m.grandfatherName || ''}</td>
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #DDD;">${m.sex === 'male' ? 'ወንድ' : 'ሴት'}</td>
        <td style="padding: 6px 8px; border: 1px solid #DDD;">${m.phone || '-'}</td>
        <td style="padding: 6px 8px; border: 1px solid #DDD;">${m.department?.nameAm || '-'}</td>
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #DDD;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: ${
            m.status === 'active' ? '#E8F5E9; color: #1B5E20;' : '#FFF3E0; color: #E65100;'
          }">
            ${m.status}
          </span>
        </td>
      </tr>
    `,
      )
      .join('');

    const html = this.getHtmlWrapper(`
      <div class="header">
        <div class="cross-icon">✝</div>
        <div class="org-title">
          <h1>በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን</h1>
          <h2>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h2>
          <p>Aemade Selam Sunday School - Official Members Roster</p>
        </div>
        <div class="cross-icon">✝</div>
      </div>

      <div style="margin-bottom: 14px; display: flex; justify-content: space-between; font-size: 11px;">
        <div><strong>የአባላት ብዛት:</strong> ${members.length}</div>
        <div><strong>የሪፖርት ቀን:</strong> ${new Date().toISOString().split('T')[0]}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #1B5E20; color: #FFFFFF;">
            <th style="padding: 8px; border: 1px solid #1B5E20; width: 35px;">ተ.ቁ</th>
            <th style="padding: 8px; border: 1px solid #1B5E20; width: 110px;">የአባል ቁጥር</th>
            <th style="padding: 8px; border: 1px solid #1B5E20;">ሙሉ ስም</th>
            <th style="padding: 8px; border: 1px solid #1B5E20; width: 55px;">ጾታ</th>
            <th style="padding: 8px; border: 1px solid #1B5E20; width: 105px;">ስልክ</th>
            <th style="padding: 8px; border: 1px solid #1B5E20;">ክፍል</th>
            <th style="padding: 8px; border: 1px solid #1B5E20; width: 70px;">ሁኔታ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>አዕማደ ሰላም ሰንበት ትምህርት ቤት አስተዳደር</div>
        <div>ገጽ 1 / 1</div>
      </div>
    `);

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async generateSingleMemberPdf(member: any): Promise<Buffer> {
    const fullName =
      `${member.firstName} ${member.fatherName} ${member.grandfatherName || ''}`.trim();
    const photoTag = member.photoUrl
      ? `<img src="${member.photoUrl}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 2px solid #C9A227;" alt="Photo" />`
      : `<div style="width: 110px; height: 110px; background: #FAF6EB; border-radius: 8px; border: 2px dashed #C9A227; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #71583D; text-align: center; padding: 6px;">ፎቶ አልተጫነም</div>`;

    const qrDataUrl = await QRCode.toDataURL(member.memberNo, { margin: 1, width: 100 });

    const html = this.getHtmlWrapper(`
      <div class="header">
        <div class="cross-icon">✝</div>
        <div class="org-title">
          <h1>በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን</h1>
          <h2>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h2>
          <p>የአባል ሙሉ መረጃ (Member Official Profile)</p>
        </div>
        <div class="cross-icon">✝</div>
      </div>

      <div style="display: flex; gap: 20px; margin-bottom: 24px; background: #FAF6EB; padding: 16px; border-radius: 8px; border-left: 4px solid #1B5E20;">
        <div>${photoTag}</div>
        <div style="flex-grow: 1;">
          <h2 style="color: #1B5E20; font-size: 20px; margin-bottom: 4px;">${fullName}</h2>
          <p style="font-size: 13px; color: #71583D; margin-bottom: 8px;">የክርስትና ስም: <strong>${member.baptismalName || '-'}</strong></p>
          <div style="display: flex; gap: 16px; font-size: 12px;">
            <div><strong>የአባል ቁጥር:</strong> <span style="color: #1B5E20; font-weight: 700;">${member.memberNo}</span></div>
            <div><strong>ጾታ:</strong> ${member.sex === 'male' ? 'ወንድ' : 'ሴት'}</div>
            <div><strong>ክፍል:</strong> ${member.department?.nameAm || '-'}</div>
            <div><strong>ሁኔታ:</strong> <span style="font-weight: 600;">${member.status}</span></div>
          </div>
        </div>
        <div style="text-align: center;">
          <img src="${qrDataUrl}" style="width: 80px; height: 80px;" alt="QR" />
          <div style="font-size: 9px; color: #71583D;">${member.memberNo}</div>
        </div>
      </div>

      <h3 style="color: #1B5E20; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #C9A227; padding-bottom: 4px;">ዝርዝር የግል እና የአድራሻ መረጃ</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
        <tr>
          <td style="width: 25%; font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የትውልድ ቀን</td>
          <td style="width: 25%; padding: 6px; border: 1px solid #E0E0E0;">${member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '-'}</td>
          <td style="width: 25%; font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">ስልክ ቁጥር</td>
          <td style="width: 25%; padding: 6px; border: 1px solid #E0E0E0;">${member.phone || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">ኢሜይል</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.email || '-'}</td>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">አድራሻ (ክልል/ዞን)</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.region || '-'} ${member.zone ? ', ' + member.zone : ''}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">ወረዳ / ቀበሌ</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">ወረዳ ${member.woreda || '-'} ቀበሌ ${member.kebele || '-'}</td>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የአጥቢያ ቤተክርስቲያን</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.parish || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የንስሐ አባት</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.confessionFather || '-'}</td>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የትምህርት ደረጃ</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.educationLevel || '-'}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የሥራ መስክ</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.occupation || '-'}</td>
          <td style="font-weight: 600; padding: 6px; background: #FAF6EB; border: 1px solid #E0E0E0;">የአደጋ ጊዜ ተጠሪ</td>
          <td style="padding: 6px; border: 1px solid #E0E0E0;">${member.emergencyName || '-'} (${member.emergencyPhone || '-'})</td>
        </tr>
      </table>

      <div class="footer">
        <div>አዕማደ ሰላም ሰንበት ትምህርት ቤት</div>
        <div>የተዘጋጀበት ቀን: ${new Date().toISOString().split('T')[0]}</div>
      </div>
    `);

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  // =========================================================================
  // 4. ID CARD GENERATION (PDF badge with photo and QR code)
  // =========================================================================

  async generateIdCardPdf(member: any): Promise<Buffer> {
    const fullName =
      `${member.firstName} ${member.fatherName} ${member.grandfatherName || ''}`.trim();
    const qrDataUrl = await QRCode.toDataURL(member.memberNo, { margin: 1, width: 140 });

    const photoTag = member.photoUrl
      ? `<img src="${member.photoUrl}" style="width: 80px; height: 95px; object-fit: cover; border-radius: 6px; border: 2px solid #C9A227;" alt="Photo" />`
      : `<div style="width: 80px; height: 95px; background: #FAF6EB; border-radius: 6px; border: 1px solid #C9A227; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #71583D; text-align: center;">ፎቶ</div>`;

    const html = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Ethiopic', 'Segoe UI', Arial, sans-serif;
      background: #FFFFFF;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .id-card {
      width: 340px;
      height: 215px;
      background: #FFFFFF;
      border: 2px solid #1B5E20;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .card-header {
      background: #1B5E20;
      color: #FAF6EB;
      padding: 6px 10px;
      text-align: center;
      border-bottom: 3px solid #C9A227;
    }
    .card-header h1 {
      font-size: 11px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.5px;
    }
    .card-header h2 {
      font-size: 8.5px;
      font-weight: 500;
      color: #C9A227;
    }
    .card-body {
      flex-grow: 1;
      padding: 8px 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      background: #FCFAF6;
    }
    .info-container {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .member-name {
      font-size: 13px;
      font-weight: 700;
      color: #1B5E20;
      margin-bottom: 2px;
    }
    .baptismal-name {
      font-size: 10px;
      color: #71583D;
      margin-bottom: 4px;
    }
    .info-row {
      font-size: 9px;
      color: #2B1D0E;
      margin-bottom: 2px;
    }
    .info-row strong {
      color: #1B5E20;
    }
    .qr-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .card-footer {
      background: #2B1D0E;
      color: #FAF6EB;
      font-size: 8px;
      text-align: center;
      padding: 3px;
      display: flex;
      justify-content: space-between;
      padding-left: 10px;
      padding-right: 10px;
    }
  </style>
</head>
<body>
  <div class="id-card">
    <div class="card-header">
      <h1>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h1>
      <h2>AEMADE SELAM SUNDAY SCHOOL MEMBER ID CARD</h2>
    </div>
    <div class="card-body">
      <div>
        ${photoTag}
      </div>
      <div class="info-container">
        <div class="member-name">${fullName}</div>
        <div class="baptismal-name">የክርስትና ስም: ${member.baptismalName || '-'}</div>
        <div class="info-row"><strong>መታወቂያ:</strong> ${member.memberNo}</div>
        <div class="info-row"><strong>ክፍል:</strong> ${member.department?.nameAm || '-'}</div>
        <div class="info-row"><strong>ስልክ:</strong> ${member.phone || '-'}</div>
      </div>
      <div class="qr-side">
        <img src="${qrDataUrl}" style="width: 55px; height: 55px;" alt="QR" />
        <span style="font-size: 7px; color: #71583D;">${member.memberNo}</span>
      </div>
    </div>
    <div class="card-footer">
      <span>የተመዘገበበት: ${member.joinedAt ? new Date(member.joinedAt).getFullYear() : '2026'}</span>
      <span>የአባልነት መታወቂያ ካርድ</span>
    </div>
  </div>
</body>
</html>`;

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        width: '95mm',
        height: '65mm',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  // =========================================================================
  // 5. OFFICIAL LETTER TEMPLATES (Membership Confirmation & Recommendation)
  // =========================================================================

  async generateLetterPdf(
    member: any,
    letterType: LetterType,
    recipient?: string,
    purpose?: string,
  ): Promise<Buffer> {
    const fullName =
      `${member.firstName} ${member.fatherName} ${member.grandfatherName || ''}`.trim();
    const todayStr = new Date().toISOString().split('T')[0];
    const addressee = recipient || 'ለሚመለከተው ሁሉ / To Whom It May Concern';

    let titleAm = '';
    let bodyAm = '';

    if (letterType === LetterType.CONFIRMATION) {
      titleAm = 'የአባልነት ማረጋገጫ ደብዳቤ';
      bodyAm = `
        <p style="margin-bottom: 12px; text-indent: 24px;">
          አቶ/ወ/ሮ/ወ/ሪት <strong>${fullName}</strong> (የክርስትና ስም: <strong>${member.baptismalName || '-'}</strong>፣ የአባል መለያ ቁጥር: <strong>${member.memberNo}</strong>) 
          በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን በአዕማደ ሰላም ሰንበት ትምህርት ቤት ከ <strong>${member.joinedAt ? new Date(member.joinedAt).toISOString().split('T')[0] : '2020'}</strong> ዓ.ም ጀምሮ በ<strong>${member.department?.nameAm || 'አባልነት'}</strong> ክፍል በሙሉ ፈቃደኝነት እና በታማኝነት ሲያገለግሉ የቆዩ ሕጋዊ አባላችን መሆናቸውን እናረጋግጣለን።
        </p>
        <p style="margin-bottom: 12px; text-indent: 24px;">
          ${purpose ? `ይህ ደብዳቤ ${purpose} እንዲያገለግል በአባሉ ጥያቄ መሠረት ተሰጥቷል።` : 'ይህ ደብዳቤ በአባሉ ጥያቄ መሠረት ለሚመለከተው አካል ሁሉ በደስታ የተሰጠ ነው።'}
        </p>
      `;
    } else {
      titleAm = 'የምስክርነት እና የድጋፍ ደብዳቤ';
      bodyAm = `
        <p style="margin-bottom: 12px; text-indent: 24px;">
          አቶ/ወ/ሮ/ወ/ሪት <strong>${fullName}</strong> (የክርስትና ስም: <strong>${member.baptismalName || '-'}</strong>፣ የአባል መለያ ቁጥር: <strong>${member.memberNo}</strong>) 
          በአዕማደ ሰላም ሰንበት ትምህርት ቤት ውስጥ ባገለገሉባቸው ዓመታት ሁሉ በመልካም መንፈሳዊ ሥነ-ምግባራቸው፣ በታታሪነታቸው፣ ለቤተክርስቲያን እና ለማኅበረሰቡ ባላቸው ታማኝ እና ቀናዒ አገልግሎት የተመሰገኑ አባላችን ናቸው።
        </p>
        <p style="margin-bottom: 12px; text-indent: 24px;">
          ስለሆነም በተሰማሩበት ማንኛውም መስክ መልካም ስራቸውን እንደሚቀጥሉ ሙሉ እምነት ያለን ሲሆን፣ የሚመለከተው አካል ሁሉ ተገቢውን ትብብር እና ድጋፍ እንዲያደርግላቸው በታላቅ አክብሮት እንመክራለን።
        </p>
        <p style="margin-bottom: 12px; text-indent: 24px;">
          ${purpose ? `ይህ የድጋፍ ደብዳቤ ${purpose} እንዲያገለግል የተሰጠ ነው።` : 'ይህ የድጋፍ ደብዳቤ በሰንበት ትምህርት ቤቱ አስተዳደር ጸድቆ ተሰጥቷል።'}
        </p>
      `;
    }

    const html = this.getHtmlWrapper(`
      <div class="header">
        <div class="cross-icon">✝</div>
        <div class="org-title">
          <h1>በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን</h1>
          <h2>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h2>
          <p>Aemade Selam Sunday School Administration</p>
        </div>
        <div class="cross-icon">✝</div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 12px;">
        <div><strong>የደብዳቤ ቁጥር:</strong> AS/ADM/${Date.now().toString().slice(-6)}</div>
        <div><strong>ቀን:</strong> ${todayStr}</div>
      </div>

      <div style="margin-bottom: 20px; font-size: 13px;">
        <strong>ለ:</strong> ${addressee}
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1B5E20; font-size: 16px; text-decoration: underline; text-underline-offset: 4px;">
          ጉዳዩ፡ ${titleAm}
        </h2>
      </div>

      <div style="font-size: 13px; line-height: 1.8; color: #2B1D0E; margin-bottom: 40px;">
        ${bodyAm}
      </div>

      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="text-align: center;">
          <div style="border-bottom: 1px dotted #2B1D0E; width: 180px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 600;">ዋና ጸሐፊ</div>
          <div style="font-size: 10px; color: #71583D;">አዕማደ ሰላም ሰንበት ትምህርት ቤት</div>
        </div>
        <div style="text-align: center; border: 2px dashed #C9A227; padding: 12px 20px; border-radius: 8px;">
          <div style="color: #C9A227; font-size: 12px; font-weight: 700;">የሰንበት ትምህርት ቤቱ ማኅተም</div>
          <div style="font-size: 9px; color: #71583D; margin-top: 4px;">Official Seal</div>
        </div>
        <div style="text-align: center;">
          <div style="border-bottom: 1px dotted #2B1D0E; width: 180px; margin-bottom: 6px;"></div>
          <div style="font-size: 12px; font-weight: 600;">ሊቀመንበር</div>
          <div style="font-size: 10px; color: #71583D;">አዕማደ ሰላም ሰንበት ትምህርት ቤት</div>
        </div>
      </div>

      <div class="footer">
        <div>አዕማደ ሰላም ሰንበት ትምህርት ቤት ጽ/ቤት | ስልክ: +251 11 000 0000</div>
        <div>ኢሜይል: info@aemadeselam.org</div>
      </div>
    `);

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
