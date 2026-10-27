import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Browser } from 'puppeteer';
import * as fs from 'fs';
import { FormFieldSchema, FormSchemaDefinition } from './dto/form-schema.interface';
import { Form, FormResponse, Member } from '@prisma/client';
import { DEFAULT_SITE_IDENTITY } from '../common/site-identity';
import { gregorianToEthiopian } from '../common/ethiopian-calendar';

export type FormWithResponses = Form & {
  responses: Array<
    FormResponse & {
      member?: Pick<
        Member,
        'id' | 'memberNo' | 'firstName' | 'fatherName' | 'phone' | 'email'
      > | null;
    }
  >;
};

@Injectable()
export class FormsExportService {
  private readonly logger = new Logger(FormsExportService.name);

  private readonly brandPrimary = '#0F4C81';
  private readonly brandNavy = '#0A2E52';
  private readonly brandGold = '#F2B233';
  private readonly brandSoftBlue = '#E8F1FB';
  private readonly brandDark = '#0F2438';
  private readonly brandDanger = '#C62828';
  private readonly brandSuccess = '#1B8E5A';
  private readonly brandWarning = '#E39B00';

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
   * Format answer value for Excel or PDF representation
   */
  private formatAnswerValue(value: any): string {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'boolean') return value ? 'አዎ (Yes)' : 'አይደለም (No)';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      if (value.fileUrl) return value.fileUrl;
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Generates a beautifully formatted Excel report of form responses
   */
  async generateResponsesExcel(form: FormWithResponses): Promise<Buffer> {
    const ethDate = gregorianToEthiopian(new Date());
    const ethDateStr = `${ethDate.day} ${ethDate.monthNameAm} ${ethDate.year} ዓ.ም.`;
    const gregDateStr = new Date().toISOString().split('T')[0];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = `${DEFAULT_SITE_IDENTITY.school.nameAm} - ${DEFAULT_SITE_IDENTITY.church.nameAm}`;
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Responses', {
      views: [{ showGridLines: true }],
    });

    const schema = (form.formSchema as unknown as FormSchemaDefinition) || {
      fields: [],
    };
    const fields: FormFieldSchema[] = Array.isArray(schema.fields) ? schema.fields : [];

    // Title Row
    worksheet.mergeCells('A1', 'H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${DEFAULT_SITE_IDENTITY.church.nameAm} • ${DEFAULT_SITE_IDENTITY.school.nameAm} (${DEFAULT_SITE_IDENTITY.location.combinedAm}) — ${form.title}`;
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F4C81' }, // Primary Deep Blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 40;

    // Subtitle / Info Rows
    worksheet.mergeCells('A2', 'H2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `ካቴድራል፦ ${DEFAULT_SITE_IDENTITY.church.nameAm} | ቅጽ መለያ፦ ${form.id} | ሁኔታ፦ ${form.status} | ቀን (Eth / Greg)፦ ${ethDateStr} (${gregDateStr})`;
    infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF0F2438' } };
    infoCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F1FB' }, // Soft Blue
    };
    infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 24;

    // Summary Statistics Row
    worksheet.mergeCells('A3', 'H3');
    const statsCell = worksheet.getCell('A3');
    const total = form.responses.length;
    const approved = form.responses.filter((r) => r.status === 'approved').length;
    const rejected = form.responses.filter((r) => r.status === 'rejected').length;
    const submitted = form.responses.filter((r) => r.status === 'submitted').length;
    statsCell.value = `ድምር ምላሾች (Total)፦ ${total}  |  የጸደቁ (Approved)፦ ${approved}  |  ውድቅ የተደረጉ (Rejected)፦ ${rejected}  |  በመጠባበቅ ላይ (Pending)፦ ${submitted}`;
    statsCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F4C81' } };
    statsCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 24;

    // Empty row
    worksheet.getRow(4).height = 10;

    // Header Row (Row 5)
    const headerRowIdx = 5;
    const fixedHeaders = [
      '#',
      'መለያ (ID)',
      'የቀረበበት ቀን (Submitted At)',
      'የአባል ቁጥር (Member No)',
      'የአባል ስም (Member Name)',
      'ስልክ (Phone)',
      'ሁኔታ (Status)',
      'የአስተዳደር ማስታወሻ (Review Note)',
    ];

    const dynamicHeaders = fields.map((f) => {
      const am = f.labelAm || (typeof f.label === 'object' ? f.label.am : '') || f.name;
      const en = f.labelEn || (typeof f.label === 'object' ? f.label.en : '');
      return en ? `${am} (${en})` : am;
    });

    const allHeaders = [...fixedHeaders, ...dynamicHeaders];
    const headerRow = worksheet.getRow(headerRowIdx);
    headerRow.values = allHeaders;
    headerRow.height = 30;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F4C81' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0A2E52' } },
        bottom: { style: 'medium', color: { argb: 'FF0A2E52' } },
        left: { style: 'thin', color: { argb: 'FFD7E3F1' } },
        right: { style: 'thin', color: { argb: 'FFD7E3F1' } },
      };
    });

    // Populate Data Rows
    let currentRowIdx = 6;
    for (let i = 0; i < form.responses.length; i++) {
      const resp = form.responses[i];
      const answers = (resp.answers as Record<string, any>) || {};

      const memberName = resp.member
        ? `${resp.member.firstName} ${resp.member.fatherName}`
        : 'ያልተመዘገበ / Public';
      const memberNo = resp.member?.memberNo || '-';
      const phone = resp.member?.phone || '-';

      const fieldValues = fields.map((f) => this.formatAnswerValue(answers[f.name]));

      const rowValues = [
        i + 1,
        resp.id.slice(0, 8),
        new Date(resp.submittedAt).toISOString().replace('T', ' ').slice(0, 16),
        memberNo,
        memberName,
        phone,
        resp.status.toUpperCase(),
        resp.reviewNote || '-',
        ...fieldValues,
      ];

      const row = worksheet.getRow(currentRowIdx);
      row.values = rowValues;
      row.height = 22;

      // Zebra striping
      const isEven = i % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'center' : 'left' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFD7E3F1' } },
          left: { style: 'thin', color: { argb: 'FFD7E3F1' } },
          right: { style: 'thin', color: { argb: 'FFD7E3F1' } },
        };

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F6FC' },
          };
        }

        // Highlight status cell (col 7)
        if (colNumber === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (resp.status === 'approved') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1B8E5A' } };
          } else if (resp.status === 'rejected') {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC62828' } };
          } else {
            cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFE39B00' } };
          }
        }
      });

      currentRowIdx++;
    }

    // Auto fit column widths
    worksheet.columns.forEach((col, _idx) => {
      let maxLen = 12;
      col?.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(Math.max(maxLen + 3, 12), 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a beautifully formatted PDF report of form responses using Puppeteer
   */
  async generateResponsesPdf(form: FormWithResponses): Promise<Buffer> {
    const schema = (form.formSchema as unknown as FormSchemaDefinition) || {
      fields: [],
    };
    const fields: FormFieldSchema[] = Array.isArray(schema.fields) ? schema.fields : [];

    const total = form.responses.length;
    const approved = form.responses.filter((r) => r.status === 'approved').length;
    const rejected = form.responses.filter((r) => r.status === 'rejected').length;
    const submitted = form.responses.filter((r) => r.status === 'submitted').length;

    // Build table headers
    const fieldHeaderHtml = fields
      .map((f) => {
        const am = f.labelAm || (typeof f.label === 'object' ? f.label.am : '') || f.name;
        return `<th>${this.escapeHtml(am)}</th>`;
      })
      .join('');

    // Build table rows
    const rowsHtml = form.responses
      .map((resp, idx) => {
        const answers = (resp.answers as Record<string, any>) || {};
        const memberName = resp.member
          ? `${resp.member.firstName} ${resp.member.fatherName}`
          : 'ያልተመዘገበ / Public';
        const memberNo = resp.member?.memberNo || '-';
        const dateStr = new Date(resp.submittedAt).toISOString().replace('T', ' ').slice(0, 16);

        let statusBadge = '';
        if (resp.status === 'approved') {
          statusBadge = '<span class="badge approved">የጸደቀ</span>';
        } else if (resp.status === 'rejected') {
          statusBadge = '<span class="badge rejected">ውድቅ</span>';
        } else {
          statusBadge = '<span class="badge submitted">የቀረበ</span>';
        }

        const fieldCellsHtml = fields
          .map((f) => {
            const formatted = this.formatAnswerValue(answers[f.name]);
            return `<td>${this.escapeHtml(formatted)}</td>`;
          })
          .join('');

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${this.escapeHtml(memberName)}</strong><br/><small style="color: #666;">${memberNo}</small></td>
            <td style="text-align: center;">${dateStr}</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td>${this.escapeHtml(resp.reviewNote || '-')}</td>
            ${fieldCellsHtml}
          </tr>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="am">
      <head>
        <meta charset="UTF-8">
        <title>${this.escapeHtml(form.title)} - የምላሾች ሪፖርት</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          
          body {
            font-family: 'Noto Sans Ethiopic', 'Segoe UI', Tahoma, sans-serif;
            color: #2B1D0E;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 11px;
          }

          .header-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0F4C81;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .header-title h1 {
            color: #0F4C81;
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 700;
          }

          .header-title h2 {
            color: #0A2E52;
            margin: 0;
            font-size: 14px;
            font-weight: 600;
          }

          .stats-bar {
            display: flex;
            gap: 12px;
            margin-bottom: 15px;
          }

          .stat-card {
            flex: 1;
            padding: 8px 12px;
            border-radius: 4px;
            background-color: #E8F1FB;
            border-left: 4px solid #0F4C81;
          }

          .stat-card.approved { border-left-color: #1B8E5A; }
          .stat-card.rejected { border-left-color: #C62828; }
          .stat-card.submitted { border-left-color: #E39B00; }

          .stat-label {
            font-size: 10px;
            color: #5B6B7C;
            text-transform: uppercase;
          }

          .stat-value {
            font-size: 16px;
            font-weight: 700;
            color: #0F2438;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 10px;
          }

          th, td {
            border: 1px solid #D7E3F1;
            padding: 6px 8px;
            text-align: left;
            vertical-align: middle;
          }

          th {
            background-color: #0F4C81;
            color: #ffffff;
            font-weight: 600;
            border-color: #0A2E52;
            white-space: nowrap;
          }

          tr:nth-child(even) {
            background-color: #F0F6FC;
          }

          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
          }

          .badge.approved {
            background-color: #E8F8F0;
            color: #1B8E5A;
            border: 1px solid #A3E0C1;
          }

          .badge.rejected {
            background-color: #FDE8E8;
            color: #C62828;
            border: 1px solid #F8B4B4;
          }

          .badge.submitted {
            background-color: #FEF3C7;
            color: #B45309;
            border: 1px solid #FCD34D;
          }

          .footer-note {
            margin-top: 15px;
            font-size: 9px;
            color: #5B6B7C;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #D7E3F1;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="header-title">
            <h1>${DEFAULT_SITE_IDENTITY.school.nameAm}</h1>
            <div style="font-size: 11px; color: #0F4C81; font-weight: 600; margin-bottom: 3px;">
              ${DEFAULT_SITE_IDENTITY.church.nameAm} • ${DEFAULT_SITE_IDENTITY.location.combinedAm}
            </div>
            <h2>${this.escapeHtml(form.title)} - የምላሾች ሪፖርት</h2>
          </div>
          <div style="text-align: right; font-size: 10px; color: #5B6B7C;">
            <div>ቅጽ ቁጥር፦ <code>${form.id.slice(0, 8)}</code></div>
            <div>የወጣበት ቀን፦ ${new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-card">
            <div class="stat-label">ድምር ምላሾች (Total)</div>
            <div class="stat-value">${total}</div>
          </div>
          <div class="stat-card approved">
            <div class="stat-label">የጸደቁ (Approved)</div>
            <div class="stat-value" style="color: #1B8E5A;">${approved}</div>
          </div>
          <div class="stat-card rejected">
            <div class="stat-label">ውድቅ የተደረጉ (Rejected)</div>
            <div class="stat-value" style="color: #C62828;">${rejected}</div>
          </div>
          <div class="stat-card submitted">
            <div class="stat-label">በመጠባበቅ ላይ (Pending)</div>
            <div class="stat-value" style="color: #E39B00;">${submitted}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th>የአባል ስም / ቁጥር</th>
              <th style="text-align: center;">የቀረበበት ቀን</th>
              <th style="text-align: center;">ሁኔታ</th>
              <th>የአስተዳደር ማስታወሻ</th>
              ${fieldHeaderHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="' + (fields.length + 5) + '" style="text-align:center; padding: 20px;">ምንም ምላሽ አልተገኘም (No responses recorded)</td></tr>'}
          </tbody>
        </table>

        <div class="footer-note">
          <div>${DEFAULT_SITE_IDENTITY.church.nameAm} • ${DEFAULT_SITE_IDENTITY.school.nameAm} (${DEFAULT_SITE_IDENTITY.location.combinedAm})</div>
          <div>ገጽ 1 / 1</div>
        </div>
      </body>
      </html>
    `;

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
