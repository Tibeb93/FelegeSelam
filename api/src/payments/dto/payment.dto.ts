import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class SubmitMembershipPaymentDto {
  @IsEnum(PaymentMethod, {
    message:
      'Payment method must be one of: telebirr, cbe, abyssinia, awash, dashen, other_bank, cash',
  })
  @IsNotEmpty()
  method: PaymentMethod;

  @IsString()
  @IsNotEmpty({ message: 'Transaction reference number is required' })
  referenceNo: string;

  @IsDateString({}, { message: 'Paid on must be a valid date' })
  @IsNotEmpty()
  paidOn: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a valid number' })
  @Min(1, { message: 'Amount must be at least 1 ETB' })
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  membershipYear?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class ReviewMembershipPaymentDto {
  @IsEnum(PaymentStatus, { message: 'Status must be approved or rejected' })
  @IsNotEmpty()
  status: PaymentStatus;

  @ValidateIf((o) => o.status === PaymentStatus.rejected)
  @IsNotEmpty({ message: 'Rejection reason (reviewNote) is mandatory when rejecting a payment' })
  @IsString()
  reviewNote?: string;
}

export class RecordCashPaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'Member ID is required' })
  memberId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  membershipYear?: number;

  @IsDateString()
  @IsNotEmpty()
  paidOn: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class QueryMembershipPaymentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class SendPaymentRemindersDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  customMessage?: string;
}
