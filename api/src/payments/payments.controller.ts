import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Ip,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import {
  SubmitMembershipPaymentDto,
  ReviewMembershipPaymentDto,
  RecordCashPaymentDto,
  QueryMembershipPaymentsDto,
  SendPaymentRemindersDto,
} from './dto/payment.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Membership Payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // =========================================================================
  // 1. PUBLIC / GENERAL CONFIGURATION
  // =========================================================================

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Get current membership fee configuration & active payment accounts' })
  async getPaymentConfig() {
    return this.paymentsService.getPaymentConfig();
  }

  // =========================================================================
  // 2. MEMBER PORTAL ENDPOINTS
  // =========================================================================

  @Get('my-status')
  @ApiBearerAuth('JWT-auth')
  @Roles('member', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Get current member membership fee status and payment history' })
  async getMyPaymentStatus(@CurrentUser('id') userId: string, @Query('year') year?: number) {
    return this.paymentsService.getMyPaymentStatus(userId, year);
  }

  @Post('submit')
  @ApiBearerAuth('JWT-auth')
  @Roles('member', 'super_admin', 'admin')
  @UseInterceptors(FileInterceptor('proof'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit membership payment with proof slip / screenshot' })
  async submitPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitMembershipPaymentDto,
    @UploadedFile() proofFile?: Express.Multer.File,
    @Ip() ip?: string,
  ) {
    return this.paymentsService.submitPayment(userId, dto, proofFile, ip);
  }

  @Get('my-receipt/:paymentId/pdf')
  @ApiBearerAuth('JWT-auth')
  @Roles('member', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Download official PDF receipt for approved payment' })
  async downloadMyReceiptPdf(
    @CurrentUser('id') userId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.paymentsService.getMyReceiptPdf(userId, paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Membership-Receipt-${paymentId.slice(0, 8)}.pdf"`,
    );
    res.send(pdfBuffer);
  }

  // =========================================================================
  // 3. ADMIN CONTROL & REVIEW ENDPOINTS
  // =========================================================================

  @Get('admin')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin list all payments with filters, search, and totals' })
  async getAdminPayments(@Query() query: QueryMembershipPaymentsDto) {
    return this.paymentsService.getAdminPayments(query);
  }

  @Get('admin/summary')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin dashboard payment summary metrics' })
  async getAdminSummary(@Query('year') year?: number) {
    return this.paymentsService.getAdminSummary(year);
  }

  @Post('admin/:id/review')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin review (approve or reject) a membership payment' })
  async reviewPayment(
    @CurrentUser('id') adminUserId: string,
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() dto: ReviewMembershipPaymentDto,
    @Ip() ip?: string,
  ) {
    return this.paymentsService.reviewPayment(adminUserId, paymentId, dto, ip);
  }

  @Post('admin/record-cash')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin record direct cash payment for a member' })
  async recordCashPayment(
    @CurrentUser('id') adminUserId: string,
    @Body() dto: RecordCashPaymentDto,
    @Ip() ip?: string,
  ) {
    return this.paymentsService.recordCashPayment(adminUserId, dto, ip);
  }

  @Get('admin/unpaid-members')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin list unpaid active members for specified year' })
  async getUnpaidMembers(@Query('year') year?: number) {
    return this.paymentsService.getUnpaidMembers(year);
  }

  @Post('admin/send-reminders')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin broadcast payment reminders to unpaid active members' })
  async sendReminders(
    @CurrentUser('id') adminUserId: string,
    @Body() dto: SendPaymentRemindersDto,
    @Ip() ip?: string,
  ) {
    return this.paymentsService.sendReminders(adminUserId, dto, ip);
  }

  @Get('admin/export')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin export payments to styled Excel sheet' })
  async exportPaymentsExcel(@Query() query: QueryMembershipPaymentsDto, @Res() res: Response) {
    const excelBuffer = await this.paymentsService.exportPaymentsExcel(query);
    const filename = `Membership-Payments-${query.year || 'All'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  }

  @Get('admin/:id/receipt/pdf')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Admin download receipt PDF for approved payment' })
  async getReceiptPdfForAdmin(@Param('id', ParseUUIDPipe) paymentId: string, @Res() res: Response) {
    const pdfBuffer = await this.paymentsService.getReceiptPdfForAdmin(paymentId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Membership-Receipt-${paymentId.slice(0, 8)}.pdf"`,
    );
    res.send(pdfBuffer);
  }
}
