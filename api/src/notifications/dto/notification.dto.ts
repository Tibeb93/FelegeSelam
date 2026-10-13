import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum NotificationTarget {
  ALL = 'all',
  DEPARTMENT = 'department',
  USER = 'user',
}

export class SendNotificationDto {
  @ApiProperty({
    enum: NotificationTarget,
    example: NotificationTarget.ALL,
    description: 'Target audience: all, department, or user',
  })
  @IsEnum(NotificationTarget)
  target!: NotificationTarget;

  @ApiPropertyOptional({
    example: 1,
    description: 'Department ID (required when target = department)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'User UUID (required when target = user)',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    example: 'የሰንበት ትምህርት ቤት ጠቅላላ ጉባኤ ጥሪ',
    description: 'Notification title',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'እሑድ ከቅዳሴ በኋላ በዋናው አዳራሽ እንድትገኙ እናሳስባለን።',
    description: 'Notification body message',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    example: { link: '/events' },
    description: 'Optional JSON metadata payload',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'fcm_token_xyz_123456789',
    description: 'Unique push notification device token (FCM / APNs / WebPush)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  token!: string;

  @ApiPropertyOptional({
    enum: DevicePlatform,
    default: DevicePlatform.web,
    description: 'Device platform (android, ios, web)',
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}

export class QueryNotificationDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter to only unread notifications',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}
