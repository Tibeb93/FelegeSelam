import { IsUUID, IsInt, Min, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateEnrollmentDto {
  @ApiProperty({
    example: 'b104121d-5ae7-476b-8c1b-4796a594297e',
    description: 'Member UUID to enroll in the course',
  })
  @IsUUID()
  memberId!: string;
}

export class BulkDepartmentEnrollDto {
  @ApiProperty({
    example: 1,
    description: 'Department ID whose active members should be bulk-enrolled',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId!: number;
}

export class UpdateEnrollmentStatusDto {
  @ApiProperty({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.completed,
    description: 'Updated enrollment status (active, completed, dropped)',
  })
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;
}

export class QueryEnrollmentDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus, description: 'Filter by enrollment status' })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
