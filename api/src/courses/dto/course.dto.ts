import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateCourseDto {
  @ApiProperty({ example: 'የመጽሐፍ ቅዱስ ጥናት ፩', description: 'Course title in Amharic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titleAm!: string;

  @ApiPropertyOptional({
    example: 'Biblical Studies I',
    description: 'Course title in English',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleEn?: string;

  @ApiPropertyOptional({
    example: 'ከኦሪት ዘፍጥረት እስከ ነቢያት መጻሕፍት ያለው ጥልቅ መንፈሳዊ ትንታኔ',
    description: 'Course description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ደረጃ ፩', description: 'Academic level' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  level?: string;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Assigned teacher ID (User UUID or Member UUID)',
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({
    example: 'ቅዳሜ ከሰዓት 8:00 - 10:00',
    description: 'Class schedule',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  schedule?: string;

  @ApiPropertyOptional({
    example: 40,
    description: 'Maximum student capacity',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: '2026-09-01',
    description: 'Course start date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2027-06-30',
    description: 'Course end date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: CourseStatus,
    default: CourseStatus.draft,
    description: 'Course status (draft, open, closed, archived)',
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class QueryCourseDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CourseStatus, description: 'Filter by course status' })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ description: 'Filter by course level' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned teacher ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
