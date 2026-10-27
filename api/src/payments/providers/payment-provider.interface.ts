export interface PaymentInitiationResult {
  requiresProof: boolean;
  status: 'pending' | 'approved' | 'rejected';
  referenceNo?: string;
  instructions?: string;
  redirectUrl?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'approved' | 'rejected';
  receiptNo?: string;
  notes?: string;
}

export interface IPaymentProvider {
  readonly providerId: string;
  readonly name: string;
  initiatePayment(data: any): Promise<PaymentInitiationResult>;
  verifyPayment(data: any): Promise<PaymentVerificationResult>;
}
