import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  // Brand Design Tokens
  private readonly brand = {
    primary700: '#0F4C81',
    primary900: '#0A2E52',
    primary500: '#1E78C8',
    primary100: '#E8F1FB',
    white: '#FFFFFF',
    text: '#0F2438',
    mutedText: '#5B6B7C',
    border: '#D7E3F1',
    gold: '#F2B233',
  };

  /**
   * Generates a branded HTML email wrapper
   */
  private getEmailHtml(title: string, bodyContent: string): string {
    return `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${this.brand.primary100}; margin: 0; padding: 24px; color: ${this.brand.text}; }
    .email-container { max-width: 560px; margin: 0 auto; background: ${this.brand.white}; border-radius: 16px; overflow: hidden; border: 1px solid ${this.brand.border}; box-shadow: 0 4px 12px rgba(10, 46, 82, 0.08); }
    .email-header { background: ${this.brand.primary900}; background: linear-gradient(135deg, ${this.brand.primary900} 0%, ${this.brand.primary700} 100%); padding: 32px 24px; text-align: center; color: ${this.brand.white}; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .email-header p { margin: 6px 0 0; font-size: 13px; color: ${this.brand.gold}; font-weight: 600; }
    .email-body { padding: 32px 24px; line-height: 1.6; font-size: 15px; color: ${this.brand.text}; }
    .code-box { background: ${this.brand.primary100}; border: 2px dashed ${this.brand.primary500}; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .code-box .code { font-size: 28px; font-weight: 800; letter-spacing: 6px; color: ${this.brand.primary700}; font-family: monospace; }
    .btn-cta { display: inline-block; background: ${this.brand.gold}; color: ${this.brand.text}; text-decoration: none; font-weight: 700; padding: 12px 28px; border-radius: 10px; margin-top: 16px; font-size: 14px; }
    .email-footer { background: ${this.brand.primary100}; padding: 20px 24px; text-align: center; font-size: 12px; color: ${this.brand.mutedText}; border-top: 1px solid ${this.brand.border}; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>አዕማደ ሰላም ሰንበት ትምህርት ቤት</h1>
      <p>ደብረ ሰላም ቅዱስ እስጢፋኖስ ቤተ ክርስቲያን</p>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <p>© ${new Date().getFullYear()} አዕማደ ሰላም ሰንበት ትምህርት ቤት • Debre Selam St. Stephen Church</p>
      <p>አዲስ አበባ፣ ኢትዮጵያ • info@aemade.org</p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const html = this.getEmailHtml(
      'የይለፍ ቃል ማደሻ ኮድ (Password Reset Code)',
      `<h3>ሰላም ለእርስዎ ይሁን፤</h3>
       <p>የአዕማደ ሰላም ሰንበት ትምህርት ቤት መለያዎን የይለፍ ቃል ለማደስ ጥያቄ ቀርቧል። በሚከተለው ባለ 6-አሃዝ ኮድ በመጠቀም የይለፍ ቃልዎን ማደስ ይችላሉ፦</p>
       <div class="code-box">
         <div class="code">${code}</div>
         <p style="margin: 6px 0 0; font-size: 12px; color: ${this.brand.mutedText};">ይህ ኮድ ለ15 ደቂቃዎች ብቻ ያገለግላል።</p>
       </div>
       <p>ይህን ጥያቄ እርስዎ ካልጠየቁ ይህንን መልዕክት ችላ ይበሉት።</p>`,
    );

    this.logger.log('====================================================');
    this.logger.log(`[EMAIL DISPATCH] Password Reset Code for: ${email}`);
    this.logger.log(`Code: [ ${code} ] (Valid for 15 minutes)`);
    this.logger.log(`Branded HTML Email payload generated (${html.length} bytes)`);
    this.logger.log('====================================================');
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const html = this.getEmailHtml(
      'እንኳን ወደ አዕማደ ሰላም በደህና መጡ (Welcome)',
      `<h3>የተከበሩ ${fullName}፤</h3>
       <p>ወደ ደብረ ሰላም ቅዱስ እስጢፋኖስ አዕማደ ሰላም ሰንበት ትምህርት ቤት የትምህርትና የአባላት ፖርታል በደህና መጡ!</p>
       <p>በመለያዎ በመግባት መንፈሳዊ ትምህርቶችን መከታተል፣ መዝሙራትን ማዳመጥ፣ እና የቤተክርስቲያን መርሐ-ግብሮችን መከታተል ይችላሉ።</p>
       <div style="text-align: center;">
         <a href="http://localhost:3001" class="btn-cta">ወደ ፖርታሉ ይግቡ</a>
       </div>`,
    );

    this.logger.log(
      `[EMAIL DISPATCH] Welcome email dispatched for: ${fullName} (${email}, ${html.length} bytes)`,
    );
  }
}
