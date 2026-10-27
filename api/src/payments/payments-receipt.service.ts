import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import type { Browser } from 'puppeteer';
import * as fs from 'fs';
import { MembershipPayment, Member } from '@prisma/client';
import { DEFAULT_SITE_IDENTITY } from '../common/site-identity';

export type MembershipPaymentWithMember = MembershipPayment & {
  member: Pick<
    Member,
    | 'id'
    | 'memberNo'
    | 'firstName'
    | 'fatherName'
    | 'grandfatherName'
    | 'phone'
    | 'email'
    | 'parish'
  >;
};

@Injectable()
export class PaymentsReceiptService {
  private readonly logger = new Logger(PaymentsReceiptService.name);

  private readonly brandPrimary = '#0F4C81';
  private readonly brandNavy = '#0A2E52';
  private readonly brandGold = '#F2B233';
  private readonly brandSoftBlue = '#E8F1FB';

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

  formatPaymentMethod(method: string): string {
    const map: Record<string, string> = {
      telebirr: 'ቴሌብር (Telebirr)',
      cbe: 'የኢትዮጵያ ንግድ ባንክ (CBE)',
      abyssinia: 'አቢሲኒያ ባንክ (Bank of Abyssinia)',
      awash: 'አዋሽ ባንክ (Awash Bank)',
      dashen: 'ዳሽን ባንክ (Dashen Bank)',
      other_bank: 'ሌላ ባንክ (Other Bank Transfer)',
      cash: 'በጥሬ ገንዘብ (Cash)',
    };
    return map[method] || method;
  }

  async generateReceiptPdf(
    payment: MembershipPaymentWithMember,
    schoolInfo?: {
      nameAmharic?: string;
      nameEnglish?: string;
      churchNameAm?: string;
      churchNameEn?: string;
      locationLine?: string;
      locationLineEn?: string;
    },
  ): Promise<Buffer> {
    const receiptNumber =
      payment.receiptNo || `REC-${payment.membershipYear}-${payment.id.slice(0, 8).toUpperCase()}`;
    const schoolNameAm = schoolInfo?.nameAmharic || DEFAULT_SITE_IDENTITY.school.nameAm;
    const schoolNameEn = schoolInfo?.nameEnglish || DEFAULT_SITE_IDENTITY.school.nameEn;
    const churchNameAm = schoolInfo?.churchNameAm || DEFAULT_SITE_IDENTITY.church.nameAm;
    const churchNameEn = schoolInfo?.churchNameEn || DEFAULT_SITE_IDENTITY.church.nameEn;
    const locationLine = schoolInfo?.locationLine || DEFAULT_SITE_IDENTITY.location.combinedAm;
    const locationLineEn = schoolInfo?.locationLineEn || DEFAULT_SITE_IDENTITY.location.combinedEn;

    const qrData = JSON.stringify({
      receiptNo: receiptNumber,
      memberNo: payment.member.memberNo,
      amount: Number(payment.amount),
      year: payment.membershipYear,
      method: payment.method,
      referenceNo: payment.referenceNo,
      paidOn: payment.paidOn,
      verified: true,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 140,
      margin: 1,
      color: { dark: this.brandNavy, light: '#FFFFFF' },
    });

    const dateStr = new Date(payment.paidOn).toISOString().split('T')[0];
    const reviewedDateStr = payment.reviewedAt
      ? new Date(payment.reviewedAt).toISOString().split('T')[0]
      : dateStr;
    const amountFormatted = Number(payment.amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const memberFullName = [
      payment.member.firstName,
      payment.member.fatherName,
      payment.member.grandfatherName,
    ]
      .filter(Boolean)
      .join(' ');

    const html = `
      <!DOCTYPE html>
      <html lang="am">
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${receiptNumber}</title>
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
            border: 2px solid ${this.brandPrimary};
            border-radius: 8px;
            padding: 16px 20px;
            background-color: #FFFFFF;
            position: relative;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid ${this.brandPrimary};
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .header-left h1 {
            color: ${this.brandNavy};
            font-size: 16px;
            margin: 0 0 3px 0;
            font-weight: 700;
          }

          .header-left h2 {
            color: ${this.brandGold};
            font-size: 12px;
            margin: 0;
            font-weight: 600;
          }

          .receipt-badge {
            background-color: ${this.brandSoftBlue};
            border: 1px solid #C7DCF3;
            border-radius: 6px;
            padding: 6px 14px;
            text-align: right;
          }

          .receipt-badge .num {
            font-size: 14px;
            font-weight: 700;
            color: ${this.brandNavy};
          }

          .content-grid {
            display: grid;
            grid-template-columns: 2.2fr 1fr;
            gap: 16px;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
          }

          .info-table td {
            padding: 5px 6px;
            border-bottom: 1px solid #E2EBF5;
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
            background-color: ${this.brandSoftBlue};
            border: 2px solid ${this.brandPrimary};
            border-radius: 6px;
            padding: 10px;
            text-align: center;
            margin-top: 10px;
          }

          .amount-box .title {
            font-size: 10px;
            color: #5B6B7C;
            text-transform: uppercase;
            font-weight: 600;
          }

          .amount-box .val {
            font-size: 20px;
            font-weight: 700;
            color: ${this.brandNavy};
            margin: 4px 0;
          }

          .qr-side {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding-left: 8px;
          }

          .qr-side img {
            width: 115px;
            height: 115px;
            border: 1px solid #C7DCF3;
            border-radius: 6px;
            padding: 3px;
            background: #fff;
          }

          .status-tag {
            display: inline-block;
            margin-top: 8px;
            padding: 3px 8px;
            background-color: #DEF7EC;
            color: #03543F;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px dashed #C7DCF3;
            font-size: 9px;
            color: #5B6B7C;
          }

          .sign-line {
            width: 150px;
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
              <h1>${schoolNameAm}</h1>
              <h2 style="color: #0F4C81; font-size: 13px; font-weight: 700; margin: 2px 0;">${churchNameAm} (${churchNameEn})</h2>
              <p style="color: #5B6B7C; font-size: 10px; margin: 1px 0;">${locationLine} | ${locationLineEn}</p>
              <h3 style="color: ${this.brandGold}; font-size: 11px; margin: 3px 0 0; font-weight: 600;">${schoolNameEn} — ዓመታዊ የአባልነት ክፍያ ደረሰኝ (Membership Receipt)</h3>
            </div>
            <div class="receipt-badge">
              <div style="font-size: 10px; color: #5B6B7C;">የደረሰኝ ቁጥር (Receipt No)</div>
              <div class="num">${receiptNumber}</div>
              <div style="font-size: 9px; color: #7B8B9C;">የፀደቀበት፦ ${reviewedDateStr}</div>
            </div>
          </div>

          <div class="content-grid">
            <div>
              <table class="info-table">
                <tr>
                  <td class="label">የአባል ስም (Full Name)</td>
                  <td class="val">${memberFullName}</td>
                </tr>
                <tr>
                  <td class="label">የአባል መለያ (Member No)</td>
                  <td class="val"><code>${payment.member.memberNo}</code></td>
                </tr>
                <tr>
                  <td class="label">ስልክ (Phone)</td>
                  <td class="val">${payment.member.phone || '-'}</td>
                </tr>
                <tr>
                  <td class="label">የአባልነት ዓመተ ምሕረት (Year)</td>
                  <td class="val">${payment.membershipYear} ዓ.ም. (E.C.)</td>
                </tr>
                <tr>
                  <td class="label">የክፍያ ዘዴ (Method)</td>
                  <td class="val">${this.formatPaymentMethod(payment.method)}</td>
                </tr>
                <tr>
                  <td class="label">የማመሳከሪያ ቁጥር (Ref No)</td>
                  <td class="val"><code>${payment.referenceNo}</code></td>
                </tr>
                <tr>
                  <td class="label">የተከፈለበት ቀን (Paid Date)</td>
                  <td class="val">${dateStr}</td>
                </tr>
              </table>

              <div class="amount-box">
                <div class="title">የተከፈለው ጠቅላላ መጠን (Total Amount Paid)</div>
                <div class="val">${amountFormatted} ${payment.currency || 'ETB'}</div>
              </div>
            </div>

            <div class="qr-side">
              <img src="${qrCodeDataUrl}" alt="QR Code" />
              <div class="status-tag">✓ የተረጋገጠ (VERIFIED & PAID)</div>
              <div style="font-size: 8px; color: #7B8B9C; margin-top: 6px;">
                በሰንበት ት/ቤቱ የተረጋገጠ ዲጂታል ደረሰኝ<br/>
                Official Verified Digital Receipt
              </div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sign-line">የሂሳብ ሹም / ገንዘብ ያዥ ፊርማ (Treasurer)</div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
              የሰንበት ትምህርት ቤቱ ይፋዊ ማህተም (Official Seal)
            </div>
            <div>
              <div class="sign-line">የአባሉ ፊርማ (Member)</div>
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
}
