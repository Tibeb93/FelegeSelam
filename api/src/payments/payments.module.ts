import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsReceiptService } from './payments-receipt.service';
import { PaymentsExportService } from './payments-export.service';
import { PaymentsAutomationService } from './payments-automation.service';
import { ManualPaymentProvider } from './providers/manual-payment.provider';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsReceiptService,
    PaymentsExportService,
    PaymentsAutomationService,
    ManualPaymentProvider,
  ],
  exports: [PaymentsService, PaymentsReceiptService],
})
export class PaymentsModule {}
