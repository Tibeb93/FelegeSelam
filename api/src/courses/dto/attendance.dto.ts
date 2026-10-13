import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AttendanceRecordItemDto {
  @ApiProperty({
    example: 'b104121d-5ae7-476b-8c1b-4796a594297e',
    description: 'Member UUID',
  })
  @IsUUID()
  memberId!: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.present,
    description: 'Attendance status (present, absent, late, excused)',
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;
}

export class RecordSessionAttendanceDto {
  @ApiProperty({
    example: '2026-10-13',
    description: 'Session date in YYYY-MM-DD format',
  })
  @IsDateString()
  sessionDate!: string;

  @ApiProperty({
    type: [AttendanceRecordItemDto],
    description: 'Attendance records for students in the session',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  records!: AttendanceRecordItemDto[];
}

export class ScanAttendanceDto {
  @ApiProperty({
    example: 'AS-2026-0001',
    description: 'Member number scanned from QR code',
  })
  @IsString()
  @IsNotEmpty()
  memberNo!: string;

  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Course UUID',
  })
  @IsUUID()
  courseId!: string;

  @ApiPropertyOptional({
    example: '2026-10-13',
    description: 'Session date (defaults to today in UTC if omitted)',
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    default: AttendanceStatus.present,
    description: 'Attendance status (defaults to present)',
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}

export class QueryAttendanceDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '2026-10-13',
    description: 'Filter by session date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @ApiPropertyOptional({ description: 'Filter by member UUID' })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, description: 'Filter by attendance status' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
