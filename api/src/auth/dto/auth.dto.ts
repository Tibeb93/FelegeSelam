import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sex } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'yonas@aemade.org' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ዮናስ' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'ታደሰ' })
  @IsString()
  @IsNotEmpty()
  fatherName: string;

  @ApiPropertyOptional({ example: 'ዘውዴ' })
  @IsString()
  @IsOptional()
  grandfatherName?: string;

  @ApiPropertyOptional({ example: 'ገብረ ማርያም' })
  @IsString()
  @IsOptional()
  baptismalName?: string;

  @ApiProperty({ enum: Sex, example: Sex.male })
  @IsEnum(Sex)
  sex: Sex;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@aemade.org' })
  @IsNotEmpty()
  @IsString()
  identifier: string; // email or phone

  @ApiProperty({ example: 'Admin@123456!' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Two-factor TOTP token if 2FA is active', example: '123456' })
  @IsOptional()
  @IsString()
  twoFactorToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT Refresh Token' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@aemade.org' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@aemade.org' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '6-digit reset code received via email', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'NewPassword@123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyTwoFactorDto {
  @ApiProperty({ description: '6-digit TOTP code', example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
