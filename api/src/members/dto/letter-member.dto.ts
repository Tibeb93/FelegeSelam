import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LetterType {
  CONFIRMATION = 'confirmation',
  RECOMMENDATION = 'recommendation',
}

export class GenerateLetterDto {
  @ApiProperty({
    enum: LetterType,
    example: LetterType.CONFIRMATION,
    description: 'Letter template type (confirmation or recommendation)',
  })
  @IsEnum(LetterType)
  @IsNotEmpty()
  type: LetterType;

  @ApiPropertyOptional({
    example: 'ለሚመለከተው ሁሉ / To Whom It May Concern',
    description: 'Addressee / recipient organization or person',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipient?: string;

  @ApiPropertyOptional({
    example: 'ለትምህርት / For scholarship application',
    description: 'Purpose or reason for the letter',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  purpose?: string;
}
