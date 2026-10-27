import { Injectable } from '@nestjs/common';
import {
  IPaymentProvider,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './payment-provider.interface';

@Injectable()
export class ManualPaymentProvider implements IPaymentProvider {
  readonly providerId = 'manual';
  readonly name = 'Manual Bank / Telebirr Verification Provider';

  async initiatePayment(data: {
    referenceNo: string;
    method: string;
    amount: number;
  }): Promise<PaymentInitiationResult> {
    return {
      requiresProof: true,
      status: 'pending',
      referenceNo: data.referenceNo,
      instructions:
        'Please upload proof of bank transfer slip or Telebirr confirmation SMS screenshot.',
    };
  }

  async verifyPayment(data: {
    approved: boolean;
    receiptNo?: string;
    note?: string;
  }): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: data.approved ? 'approved' : 'rejected',
      receiptNo: data.receiptNo,
      notes: data.note,
    };
  }
}
