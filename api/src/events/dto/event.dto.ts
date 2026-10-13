import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsDateString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventRsvpStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreateEventDto {
  @ApiProperty({
    example: 'የጥምቀት በዓል ልዩ መንፈሳዊ ጉባኤ',
    description: 'Event title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'ዓመታዊ የበዓለ ጥምቀት መዝሙርና ትምህርተ ወንጌል መርሐ ግብር',
    description: 'Event description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'የሰንበት ትምህርት ቤቱ ዋና አዳራሽ',
    description: 'Event venue or location',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({
    example: '2026-11-15T14:00:00.000Z',
    description: 'Event start timestamp (ISO 8601)',
  })
  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional({
    example: '2026-11-15T18:00:00.000Z',
    description: 'Event end timestamp (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'Maximum attendee capacity (null for unlimited)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class QueryEventDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter to only upcoming events (startAt >= now)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  upcomingOnly?: boolean;
}

export class RsvpEventDto {
  @ApiProperty({
    enum: EventRsvpStatus,
    example: EventRsvpStatus.going,
    description: 'RSVP status (going, maybe, not_going)',
  })
  @IsEnum(EventRsvpStatus)
  status!: EventRsvpStatus;

  @ApiPropertyOptional({
    description: 'Optional memberId (defaults to the logged-in user’s member profile)',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;
}

export class QueryAttendeesDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: EventRsvpStatus,
    description: 'Filter attendees by RSVP status (going, maybe, not_going)',
  })
  @IsOptional()
  @IsEnum(EventRsvpStatus)
  status?: EventRsvpStatus;
}
