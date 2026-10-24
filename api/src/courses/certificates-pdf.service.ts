import { Injectable, Logger } from '@nestjs/common';
import type { Browser } from 'puppeteer';
import * as QRCode from 'qrcode';
import * as fs from 'fs';

export interface CertificatePdfPayload {
  code: string;
  issuedAt: Date;
  member: {
    memberNo: string;
    firstName: string;
    fatherName: string;
    grandfatherName?: string | null;
    baptismalName?: string | null;
  };
  course: {
    titleAm: string;
    titleEn?: string | null;
    level?: string | null;
  };
  gradeSummary: {
    averagePercentage: number;
    result: string;
  };
}

@Injectable()
export class CertificatesPdfService {
  private readonly logger = new Logger(CertificatesPdfService.name);

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

  async generateCertificatePdf(payload: CertificatePdfPayload): Promise<Buffer> {
    const fullName =
      `${payload.member.firstName} ${payload.member.fatherName} ${payload.member.grandfatherName || ''}`.trim();
    const issueDateStr = new Date(payload.issuedAt).toISOString().split('T')[0];
    const qrDataUrl = await QRCode.toDataURL(payload.code, {
      margin: 1,
      width: 120,
      color: {
        dark: '#0F4C81',
        light: '#FFFFFF',
      },
    });

    const html = `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <title>የምስክር ወረቀት - ${payload.code}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Ethiopic', 'Segoe UI', Arial, sans-serif;
      background: #FFFFFF;
      color: #0F2438;
      width: 297mm;
      height: 210mm;
      padding: 12mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .outer-frame {
      width: 100%;
      height: 100%;
      border: 6px double #0F4C81;
      padding: 6px;
      background: #FFFFFF;
    }
    .inner-frame {
      width: 100%;
      height: 100%;
      border: 2px solid #D7E3F1;
      padding: 24px 36px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0F4C81;
      padding-bottom: 12px;
    }
    .cross {
      font-size: 34px;
      color: #F2B233;
      line-height: 1;
      margin-bottom: 4px;
    }
    .church-name {
      font-size: 18px;
      font-weight: 700;
      color: #0F4C81;
    }
    .school-name {
      font-size: 22px;
      font-weight: 700;
      color: #0A2E52;
      margin-top: 2px;
    }
    .subtitle {
      font-size: 12px;
      color: #5B6B7C;
      letter-spacing: 1px;
      margin-top: 2px;
    }
    .cert-badge {
      text-align: center;
      margin: 12px 0;
    }
    .cert-badge h1 {
      font-size: 28px;
      color: #0F4C81;
      font-weight: 700;
      display: inline-block;
      padding: 4px 28px;
      border-bottom: 3px double #F2B233;
    }
    .cert-badge p {
      font-size: 13px;
      color: #5B6B7C;
      font-weight: 600;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .body-text {
      text-align: center;
      font-size: 16px;
      line-height: 1.9;
      margin: 6px 20px;
    }
    .student-name {
      font-size: 24px;
      font-weight: 700;
      color: #0F4C81;
      border-bottom: 2px dashed #F2B233;
      padding: 0 18px;
      display: inline-block;
    }
    .course-title {
      font-size: 20px;
      font-weight: 700;
      color: #0A2E52;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #D7E3F1;
    }
    .sig-box {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #0F2438;
      padding-top: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .qr-section {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #E8F1FB;
      padding: 8px 14px;
      border: 1px solid #D7E3F1;
      border-radius: 8px;
    }
    .qr-meta {
      font-size: 11px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="outer-frame">
    <div class="inner-frame">
      <div class="header">
        <div class="cross">✝</div>
        <div class="church-name">በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን</div>
        <div class="school-name">አዕማደ ሰላም ሰንበት ትምህርት ቤት</div>
        <div class="subtitle">ETHIOPIAN ORTHODOX TEWAHEDO CHURCH — AEMADE SELAM SUNDAY SCHOOL</div>
      </div>

      <div class="cert-badge">
        <h1>የትምህርት ማጠናቀቂያ የምስክር ወረቀት</h1>
        <p>Certificate of Course Completion</p>
      </div>

      <div class="body-text">
        ተማሪ <span class="student-name">${fullName}</span>
        ${payload.member.baptismalName ? `(የክርስትና ስም፡ <strong>${payload.member.baptismalName}</strong>)` : ''}
        <br />
        በአዕማደ ሰላም ሰንበት ትምህርት ቤት ሲሰጥ የነበረውን
        <span class="course-title">«${payload.course.titleAm}»</span>
        ${payload.course.titleEn ? `(${payload.course.titleEn})` : ''}
        ${payload.course.level ? `[${payload.course.level}]` : ''}
        መንፈሳዊ ትምህርት በአማካይ ውጤት <strong>${payload.gradeSummary.averagePercentage}% (${payload.gradeSummary.result})</strong>
        በሚገባ አጠናቀው ይህ የምስክር ወረቀት ተሰጥቷቸዋል።
      </div>

      <div class="footer">
        <div class="sig-box">
          <div class="sig-line">የትምህርት ክፍል ኃላፊ ፊርማ</div>
        </div>

        <div class="qr-section">
          <img src="${qrDataUrl}" style="width: 78px; height: 78px;" alt="QR Code" />
          <div class="qr-meta">
            <div><strong>የምስክር ወረቀት ቁጥር:</strong> ${payload.code}</div>
            <div><strong>የአባል መለያ:</strong> ${payload.member.memberNo}</div>
            <div><strong>የተሰጠበት ቀን:</strong> ${issueDateStr}</div>
          </div>
        </div>

        <div class="sig-box">
          <div class="sig-line">የሰንበት ትምህርት ቤቱ ሰብሳቢ ፊርማና ማኅተም</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const browser = await this.getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
