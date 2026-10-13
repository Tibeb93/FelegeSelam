import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateMezmurCategoryDto {
  @ApiProperty({ example: 'የንስሐ መዝሙራት', description: 'Category name in Amharic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nameAm!: string;

  @ApiPropertyOptional({
    example: 'Hymns of Repentance',
    description: 'Category name in English',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;
}

export class UpdateMezmurCategoryDto extends PartialType(CreateMezmurCategoryDto) {}

export class CreateMezmurDto {
  @ApiProperty({ example: 'በመስቀልህ ጥላ ሥር', description: 'Mezmur title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'በመስቀልህ ጥላ ሥር አሳርፈኝ ጌታዬ...',
    description: 'Full mezmur lyrics in Amharic/Ge’ez',
  })
  @IsOptional()
  @IsString()
  lyrics?: string;

  @ApiPropertyOptional({ example: 1, description: 'Mezmur category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'አዕማደ ሰላም መዘምራን',
    description: 'Singer or choir name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  singer?: string;

  @ApiPropertyOptional({
    example: '/uploads/mezmurs/audio/sample.mp3',
    description: 'Audio file URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  audioUrl?: string;

  @ApiPropertyOptional({
    example: '/uploads/mezmurs/video/sample.mp4',
    description: 'Video file URL or external link',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  videoUrl?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether mezmur is publicly accessible to visitors',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateMezmurDto extends PartialType(CreateMezmurDto) {}

export class QueryMezmurDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filter by singer name' })
  @IsOptional()
  @IsString()
  singer?: string;

  @ApiPropertyOptional({ description: 'Filter by public visibility' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;
}
