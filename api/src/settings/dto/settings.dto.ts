import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    example: 'site_identity',
    description: 'Setting key identifier',
  })
  @IsString()
  @IsNotEmpty()
  settingKey!: string;

  @ApiProperty({
    example: {
      nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      nameEn: 'Aemade Selam Sunday School',
      logoUrl: '/uploads/branding/logo.png',
    },
    description: 'JSON setting value object',
  })
  @IsObject()
  @IsNotEmpty()
  settingValue!: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Updated school tagline and logo',
    description: 'Reason for version history tracking',
  })
  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class BatchUpdateSettingsDto {
  @ApiProperty({
    example: {
      site_identity: {
        nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      },
    },
    description: 'Map of setting keys to setting value objects',
  })
  @IsObject()
  @IsNotEmpty()
  settings!: Record<string, Record<string, any>>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class RolePermissionItemDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  roleId!: number;

  @ApiProperty({ example: ['members:read', 'courses:read'] })
  @IsArray()
  permissions!: string[];
}

export class UpdateRolesMatrixDto {
  @ApiProperty({ type: [RolePermissionItemDto] })
  @IsArray()
  matrix!: RolePermissionItemDto[];
}

export class DangerActionDto {
  @ApiProperty({
    example: 'RESTORE',
    description: 'Exact uppercase confirmation code (e.g. RESTORE, PURGE, BACKUP)',
  })
  @IsString()
  @IsNotEmpty()
  confirmation!: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Days retention period for purge operations (default 30)',
  })
  @IsNumber()
  @IsOptional()
  days?: number;
}
