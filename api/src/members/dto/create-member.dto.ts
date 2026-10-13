import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsInt,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sex, MemberStatus } from '@prisma/client';

export class CreateMemberDto {
  @ApiProperty({ example: 'ዮሐንስ', description: 'First name (ስም)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'ተክለ', description: 'Father name (የአባት ስም)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fatherName: string;

  @ApiPropertyOptional({ example: 'ኃይለማርያም', description: 'Grandfather name (የአያት ስም)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  grandfatherName?: string;

  @ApiPropertyOptional({ example: 'ወልደ ጊዮርጊስ', description: 'Baptismal name (የክርስትና ስም)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  baptismalName?: string;

  @ApiProperty({ enum: Sex, example: Sex.male, description: 'Sex (ጾታ)' })
  @IsEnum(Sex)
  sex: Sex;

  @ApiPropertyOptional({
    example: '1998-05-12',
    description: 'Date of birth (የልደት ቀን - Gregorian)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '+251911223344', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: 'yohannes@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @ApiPropertyOptional({ example: 'አዲስ አበባ', description: 'Region (ክልል)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ example: 'አዲስ አበባ', description: 'Zone (ዞን)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  zone?: string;

  @ApiPropertyOptional({ example: 'የካ', description: 'Woreda (ወረዳ)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  woreda?: string;

  @ApiPropertyOptional({ example: '08', description: 'Kebele (ቀበሌ)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kebele?: string;

  @ApiPropertyOptional({ example: 'የቤት ቁጥር 123', description: 'Detailed address' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({
    example: 'ደብረ ሰላም መድኃኔዓለም',
    description: 'Parish church (የአጥቢያ ቤተክርስቲያን)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  parish?: string;

  @ApiPropertyOptional({
    example: 'መልአከ ሰላም ቀሲስ አስራት',
    description: 'Confession father (የንስሐ አባት)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(191)
  confessionFather?: string;

  @ApiPropertyOptional({ example: 'Degree', description: 'Education level' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  educationLevel?: string;

  @ApiPropertyOptional({ example: 'Engineer', description: 'Occupation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ example: 'ማርታ ተክለ', description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  emergencyName?: string;

  @ApiPropertyOptional({ example: '+251922334455', description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyPhone?: string;

  @ApiPropertyOptional({ example: 1, description: 'Department ID' })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: '/uploads/photos/abc.webp', description: 'Photo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;

  @ApiPropertyOptional({
    enum: MemberStatus,
    example: MemberStatus.pending,
    description: 'Member status',
  })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({
    example: 'Special talent in traditional hymns',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'uuid-string', description: 'Linked User Account ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}
