import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreatePostDto {
  @ApiProperty({
    enum: PostType,
    example: PostType.sinksar,
    description: 'Post type (sinksar, bible_reading, saint_of_day, urgent, event, news, teaching)',
  })
  @IsEnum(PostType)
  type!: PostType;

  @ApiProperty({
    example: 'የዕለቱ ስንክሳር - ጥቅምት ፫',
    description: 'Post title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    example: 'በዚህች ዕለት የቅዱساን አበው መታሰቢያ ይከበራል...',
    description: 'Post body content',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({
    example: '/uploads/posts/sample.webp',
    description: 'Optional cover image URL',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Whether post is marked urgent (automatically true if type = urgent)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    example: '2026-10-13T08:00:00.000Z',
    description: 'Scheduled publication timestamp (defaults to now if omitted)',
  })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional({
    example: '2026-10-20T23:59:59.000Z',
    description: 'Optional expiration timestamp after which the post is hidden',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class QueryPostDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PostType, description: 'Filter by post type' })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Filter by urgent flag' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isUrgent?: boolean;
}
