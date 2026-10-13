import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateLessonDto {
  @ApiProperty({ example: 'ክፍል ፩፡ መግቢያና ታሪካዊ ዳራ', description: 'Lesson title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    example: 'ይህ የትምህርቱ ፩ኛ ሳምንት ይዘት ነው...',
    description: 'Lesson content or transcript',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    enum: MediaType,
    default: MediaType.text,
    description: 'Media type (text, pdf, audio, video, link)',
  })
  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @ApiPropertyOptional({
    example: '/uploads/lessons/pdf/sample.pdf',
    description: 'Media file URL or external link',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileUrl?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Lesson ordering number within the course',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderNo?: number;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether lesson is published and visible to students',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}

export class ReorderLessonItemDto {
  @ApiProperty({ description: 'Lesson UUID' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ example: 1, description: 'New order number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderNo!: number;
}

export class ReorderLessonsDto {
  @ApiProperty({ type: [ReorderLessonItemDto], description: 'List of lesson order mappings' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderLessonItemDto)
  items!: ReorderLessonItemDto[];
}

export class QueryLessonDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by published status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;
}
