import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateContributionDto {
  @ApiProperty({
    example: 'd9b1a52f-1234-4567-89ab-cdef01234567',
    description: 'Member UUID making the contribution',
  })
  @IsUUID()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({
    example: 500,
    description: 'Contribution amount in ETB',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    example: 'monthly_fee',
    description: 'Contribution type: monthly_fee | donation | pledge | special_event | feast',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @ApiPropertyOptional({
    example: 'telebirr',
    description: 'Payment method: cash | bank_transfer | telebirr | cbe_birr',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: '2026-10',
    description: 'Period or month of contribution (e.g. 2026-10 or 2019/01)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  period?: string;

  @ApiPropertyOptional({
    example: 'REC-2026-0001',
    description: 'Receipt number (if omitted, automatically generated)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  receiptNo?: string;

  @ApiPropertyOptional({
    example: 'የጥቅምት ወር መደበኛ የአባላት መዋጮ',
    description: 'Optional remarks or transaction notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-10-15T10:00:00.000Z',
    description: 'Payment timestamp (defaults to current time)',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class UpdateContributionDto extends PartialType(CreateContributionDto) {}

export class QueryContributionDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by member UUID' })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Filter by contribution type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Filter by period' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ description: 'Search receipt number, member name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'From date (ISO string or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'To date (ISO string or YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class ExportContributionDto extends QueryContributionDto {
  @ApiProperty({
    enum: ['xlsx'],
    example: 'xlsx',
    description: 'Export format: xlsx (Excel)',
  })
  @IsString()
  @IsNotEmpty()
  format!: 'xlsx';
}
