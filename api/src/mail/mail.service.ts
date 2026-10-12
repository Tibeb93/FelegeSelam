import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    this.logger.log('====================================================');
    this.logger.log(`[EMAIL DISPATCH] Password Reset Code for: ${email}`);
    this.logger.log(`Code: [ ${code} ] (Valid for 15 minutes)`);
    this.logger.log('====================================================');
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    this.logger.log(`[EMAIL DISPATCH] Welcome to Aemade Selam, ${fullName}! (${email})`);
  }
}
