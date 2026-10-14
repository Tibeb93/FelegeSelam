import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    example: 'school_profile',
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
      parish: 'ደብረ ሰላም ቅዱስ እስጢፋኖስ',
    },
    description: 'JSON setting value object',
  })
  @IsObject()
  @IsNotEmpty()
  settingValue!: Record<string, any>;
}

export class BatchUpdateSettingsDto {
  @ApiProperty({
    example: {
      school_profile: {
        nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
        nameEn: 'Aemade Selam Sunday School',
      },
      contact_details: {
        phone: '+251 91 123 4567',
        email: 'info@aemadeselam.org',
      },
    },
    description: 'Map of setting keys to setting value objects',
  })
  @IsObject()
  @IsNotEmpty()
  settings!: Record<string, Record<string, any>>;
}
