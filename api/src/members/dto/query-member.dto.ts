import { IsOptional, IsEnum, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { MemberStatus, Sex } from '@prisma/client';

export class QueryMemberDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MemberStatus, description: 'Filter by member status' })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ enum: Sex, description: 'Filter by sex' })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({ description: 'Filter by parish church' })
  @IsOptional()
  @IsString()
  parish?: string;
}

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
}

export class ExportMemberQueryDto extends QueryMemberDto {
  @ApiPropertyOptional({
    enum: ExportFormat,
    default: ExportFormat.XLSX,
    description: 'Export format',
  })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;
}
