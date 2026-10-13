import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FormStatus, FormResponseStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FormSchemaDefinition } from './form-schema.interface';

export class CreateFormDto {
  @ApiProperty({
    example: 'የአባልነት እድሳት ቅጽ (2019 ዓ.ም)',
    description: 'Title of the form',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'የሰንበት ትምህርት ቤት አባላት ዓመታዊ ምዝገባና ማደሻ ቅጽ',
    description: 'Detailed description of the form purpose',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'JSON form schema specifying field definitions, options, and validation rules',
    example: {
      titleAm: 'የአባልነት እድሳት ቅጽ',
      titleEn: 'Membership Renewal Form',
      fields: [
        {
          name: 'fullName',
          type: 'text',
          labelAm: 'ሙሉ ስም',
          labelEn: 'Full Name',
          required: true,
          validation: { minLength: 3 },
        },
      ],
    },
  })
  @IsObject()
  @IsNotEmpty()
  formSchema!: FormSchemaDefinition;

  @ApiPropertyOptional({
    enum: FormStatus,
    default: FormStatus.draft,
    description: 'Form publication status (draft, open, closed)',
  })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Submission cutoff date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  openUntil?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Restrict to a single response per authenticated member',
  })
  @IsOptional()
  @IsBoolean()
  allowOneResponsePerMember?: boolean;
}

export class UpdateFormDto extends PartialType(CreateFormDto) {}

export class SubmitResponseDto {
  @ApiProperty({
    description: 'Key-value map of form answers matching field names in formSchema',
    example: {
      fullName: 'ዮሐንስ ተስፋዬ',
      spiritualFather: 'ቀሲስ ተክለ ማርያም',
      department: 'ትምህርት',
    },
  })
  @IsObject()
  @IsNotEmpty()
  answers!: Record<string, any>;
}

export class ReviewResponseDto {
  @ApiProperty({
    enum: [FormResponseStatus.approved, FormResponseStatus.rejected],
    example: FormResponseStatus.approved,
    description: 'Review decision status',
  })
  @IsEnum(FormResponseStatus)
  status!: FormResponseStatus;

  @ApiPropertyOptional({
    example: 'ሁሉም መረጃዎችና ማረጋገጫዎች በትክክል ተሟልተዋል።',
    description: 'Optional admin review note / remark',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class QueryFormDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: FormStatus,
    description: 'Filter forms by status',
  })
  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @ApiPropertyOptional({
    description: 'Search term for form title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryResponseDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: FormResponseStatus,
    description: 'Filter responses by review status',
  })
  @IsOptional()
  @IsEnum(FormResponseStatus)
  status?: FormResponseStatus;

  @ApiPropertyOptional({
    description: 'Filter responses by member UUID',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Search term inside response answers or member names',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Submissions from date (ISO string or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Submissions to date (ISO string or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class ExportFormResponsesDto extends QueryResponseDto {
  @ApiProperty({
    enum: ['xlsx', 'pdf'],
    example: 'xlsx',
    description: 'Export format: xlsx (Excel) or pdf (PDF)',
  })
  @IsString()
  @IsNotEmpty()
  format!: 'xlsx' | 'pdf';
}
