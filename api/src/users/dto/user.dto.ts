import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'secretary@aemade.org' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+251911334455' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'SecretPassword@123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Role ID to assign', example: 2 })
  @IsInt()
  roleId: number;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.active })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus = UserStatus.active;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'updated@aemade.org' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+251911998877' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'NewSecret@123' })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class AssignRoleDto {
  @ApiProperty({ description: 'New role ID to assign to the user', example: 3 })
  @IsInt()
  @IsNotEmpty()
  roleId: number;
}
