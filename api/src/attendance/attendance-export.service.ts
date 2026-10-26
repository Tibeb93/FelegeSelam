import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Browser } from 'puppeteer';

@Injectable()
export class AttendanceExportService {
  private readonly logger = new Logger(AttendanceExportService.name);

  // Blue & White Brand Colors
  private readonly brandPrimary700 = '#0F4C81'; // Deep Blue
  private readonly brandPrimary900 = '#0A2E52'; // Navy
  private readonly brandPrimary100 = '#E8F1FB'; // Soft Blue
  private readonly brandText = '#0F2438';
  private readonly brandMuted = '#5B6B7C';
  private readonly brandBorder = '#D7E3F1';
  private readonly brandSuccess = '#1B8E5A';
  private readonly brandDanger = '#C62828';
  private readonly brandWarning = '#E39B00';

  private async getBrowser(): Promise<Browser> {
    const puppeteer = await import('puppeteer');
    const candidates = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
    ].filter(Boolean) as string[];

    const fs = await import('fs');
    let executablePath: string | undefined;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    return puppeteer.default.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }

  /**
   * Generate Attendance PDF Export
   */
  async exportPdf(session: any, stats: any): Promise<Buffer> {
    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();

      const dateStr = new Date(session.sessionDate).toLocaleDateString('en-CA');
      const recordsHtml = (session.attendances || [])
        .map((att: any, idx: number) => {
          const statusColors: Record<string, { bg: string; text: string; label: string }> = {
            present: { bg: '#E8F5E9', text: '#1B8E5A', label: 'ተገኝቷል (Present)' },
            absent: { bg: '#FFEBEE', text: '#C62828', label: 'አልተገኘም (Absent)' },
            late: { bg: '#FFF8E1', text: '#E39B00', label: 'አርፍዷል (Late)' },
            excused: { bg: '#E3F2FD', text: '#1E78C8', label: 'በፈቃድ (Excused)' },
          };
          const conf = statusColors[att.status] || {
            bg: '#F5F5F5',
            text: '#666',
            label: att.status,
          };
          const fullName =
            `${att.member.firstName} ${att.member.fatherName} ${att.member.grandfatherName || ''}`.trim();
          const dept = att.member.department?.nameAm || 'አጠቃላይ (General)';
          const time = att.updatedAt
            ? new Date(att.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '-';

          return `
            <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F9FBFE'};">
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: center;">${idx + 1}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; font-weight: 600; font-family: monospace;">${att.member.memberNo}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #0F2438;">${fullName}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #5B6B7C;">${dept}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; text-align: center;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; background: ${conf.bg}; color: ${conf.text};">
                  ${conf.label}
                </span>
              </td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #E2E8F0; font-size: 10px; color: #5B6B7C; text-align: center;">${time}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap');
            body {
              font-family: 'Noto Sans Ethiopic', 'Segoe UI', Tahoma, sans-serif;
              margin: 0;
              padding: 24px;
              color: #0F2438;
              background: #FFFFFF;
            }
            .header-banner {
              border-bottom: 2px solid #0F4C81;
              padding-bottom: 16px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .title {
              font-size: 20px;
              font-weight: 700;
              color: #0F4C81;
              margin: 0 0 4px 0;
            }
            .subtitle {
              font-size: 12px;
              color: #5B6B7C;
              margin: 0;
            }
            .meta-box {
              text-align: right;
              font-size: 11px;
              color: #5B6B7C;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              border: 1px solid #D7E3F1;
              border-radius: 8px;
              padding: 10px 14px;
              background: #F8FAFD;
              text-align: center;
            }
            .stat-value {
              font-size: 18px;
              font-weight: 700;
            }
            .stat-label {
              font-size: 10px;
              color: #5B6B7C;
              text-transform: uppercase;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #0F4C81;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 600;
              text-align: left;
              padding: 8px 10px;
            }
            .footer {
              margin-top: 24px;
              font-size: 10px;
              color: #8A9BA8;
              text-align: center;
              border-top: 1px solid #E2E8F0;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <h1 class="title">አዕማደ ሰላም ሰንበት ትምህርት ቤት</h1>
              <p class="subtitle">የመገኘት መዝገብ ሪፖርት / Attendance Roster Sheet: <strong>${session.title}</strong></p>
            </div>
            <div class="meta-box">
              <div>ቀን / Date: <strong>${dateStr}</strong></div>
              <div>ሁኔታ / Status: <strong>${session.status === 'open' ? 'ክፍት (Open)' : 'የተዘጋ (Closed)'}</strong></div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" style="color: #1B8E5A;">${stats.present || 0}</div>
              <div class="stat-label">የተገኙ (Present)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #C62828;">${stats.absent || 0}</div>
              <div class="stat-label">ያልተገኙ (Absent)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #E39B00;">${stats.late || 0}</div>
              <div class="stat-label">ያረፈዱ (Late)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #0F4C81;">${stats.totalMarked || 0}</div>
              <div class="stat-label">ጠቅላላ የተመዘገቡ (Total Marked)</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="width: 100px;">የአባል መለያ (ID)</th>
                <th>ሙሉ ስም (Full Name)</th>
                <th>የአገልግሎት ክፍል (Department)</th>
                <th style="width: 120px; text-align: center;">ሁኔታ (Status)</th>
                <th style="width: 70px; text-align: center;">ሰዓት (Time)</th>
              </tr>
            </thead>
            <tbody>
              ${recordsHtml}
            </tbody>
          </table>

          <div class="footer">
            የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን — አዕማደ ሰላም ሰንበት ትምህርት ቤት © ${new Date().getFullYear()}
          </div>
        </body>
        </html>
      `;

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Attendance Excel (.xlsx) Export
   */
  async exportExcel(session: any, stats: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aemade Selam System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('የመገኘት መዝገብ (Attendance)', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    // Title Row
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'አዕማደ ሰላም ሰንበት ትምህርት ቤት — የመገኘት መዝገብ (Attendance Sheet)';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F4C81' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Subtitle & Date
    sheet.mergeCells('A2:F2');
    const subCell = sheet.getCell('A2');
    subCell.value = `መርሐ-ግብር: ${session.title} | ቀን: ${new Date(session.sessionDate).toLocaleDateString('en-CA')} | የተገኙ: ${stats.present} | ያልተገኙ: ${stats.absent} | ያረፈዱ: ${stats.late}`;
    subCell.font = { name: 'Arial', size: 10, italic: true };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    sheet.addRow([]);

    // Table Header
    const headerRow = sheet.addRow([
      '#',
      'የአባል መለያ (Member ID)',
      'ሙሉ ስም (Full Name)',
      'የአገልግሎት ክፍል (Department)',
      'የመገኘት ሁኔታ (Status)',
      'የተመዘገበበት ሰዓት (Time)',
    ]);
    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0A2E52' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD7E3F1' } },
        bottom: { style: 'thin', color: { argb: 'FFD7E3F1' } },
      };
    });

    // Data Rows
    (session.attendances || []).forEach((att: any, idx: number) => {
      const fullName =
        `${att.member.firstName} ${att.member.fatherName} ${att.member.grandfatherName || ''}`.trim();
      const dept = att.member.department?.nameAm || 'አጠቃላይ';
      const time = att.updatedAt
        ? new Date(att.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '-';

      const statusLabels: Record<string, string> = {
        present: 'ተገኝቷል (Present)',
        absent: 'አልተገኘም (Absent)',
        late: 'አርፍዷል (Late)',
        excused: 'በፈቃድ (Excused)',
      };

      const row = sheet.addRow([
        idx + 1,
        att.member.memberNo,
        fullName,
        dept,
        statusLabels[att.status] || att.status,
        time,
      ]);

      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        };
        if (colNumber === 5) {
          // Status column color
          if (att.status === 'present') {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1B8E5A' } };
          } else if (att.status === 'absent') {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFC62828' } };
          } else if (att.status === 'late') {
            cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFE39B00' } };
          }
        }
      });
    });

    sheet.columns = [
      { width: 6 },
      { width: 18 },
      { width: 30 },
      { width: 25 },
      { width: 22 },
      { width: 16 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
