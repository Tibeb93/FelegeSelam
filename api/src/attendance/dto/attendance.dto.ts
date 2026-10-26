import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceSessionDto {
  @ApiPropertyOptional({
    example: '2026-10-26',
    description: 'Date of session (defaults to today)',
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({
    example: 'የሰንበት መርሐ-ግብር / Sunday Service',
    description: 'Custom session title',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: '4a19d12f-8ce1-4b02-ac72-67e58773557c',
    description:
      'Course UUID if this is a course-specific session (omit for general Sunday service)',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}

export class MarkAttendanceRecordDto {
  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.present,
    description: 'Attendance status (present, absent, late, excused)',
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({
    example: 'Authorized leave / በፈቃድ',
    description: 'Optional note or remark',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}

export enum AttendanceExportFormat {
  PDF = 'pdf',
  XLSX = 'xlsx',
}

export class ExportAttendanceQueryDto {
  @ApiPropertyOptional({
    enum: AttendanceExportFormat,
    default: AttendanceExportFormat.PDF,
    description: 'Export file format (pdf or xlsx)',
  })
  @IsOptional()
  @IsEnum(AttendanceExportFormat)
  format?: AttendanceExportFormat;
}

export class ScanAttendanceDto {
  @ApiProperty({
    example: 'AS-2026-0001',
    description: 'Member number scanned from QR code or entered',
  })
  @IsString()
  @IsNotEmpty()
  memberNo!: string;

  @ApiPropertyOptional({
    example: '4a19d12f-8ce1-4b02-ac72-67e58773557c',
    description: 'Course UUID if applicable',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
