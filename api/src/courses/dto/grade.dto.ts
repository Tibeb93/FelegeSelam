import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({
    example: 'የመካከለኛ ዘመን ፈተና (Midterm Exam)',
    description: 'Assessment title or category',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assessment!: string;

  @ApiProperty({
    example: 88,
    description: 'Points scored by the student',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({
    example: 100,
    default: 100,
    description: 'Maximum possible points for this assessment',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional({
    example: 'በጣም ጥሩ ውጤት',
    description: 'Teacher remark or feedback',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class UpdateGradeDto extends PartialType(CreateGradeDto) {}
