import { IsString, IsOptional, IsDateString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryAuditLogDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by acting user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by entity name (e.g. member, course, contribution)' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({
    description: 'Filter by action name (e.g. create, update, delete, review)',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Search term in entity, action, entityId, or IP' })
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

export class ExportAuditLogDto extends QueryAuditLogDto {
  @ApiProperty({
    enum: ['xlsx'],
    example: 'xlsx',
    description: 'Export format: xlsx',
  })
  @IsString()
  @IsNotEmpty()
  format!: 'xlsx';
}
