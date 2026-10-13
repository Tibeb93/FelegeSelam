import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IssueCertificateDto {
  @ApiPropertyOptional({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'Completed Enrollment UUID (either enrollmentId OR memberId+courseId is required)',
  })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @ApiPropertyOptional({
    example: 'b104121d-5ae7-476b-8c1b-4796a594297e',
    description: 'Member UUID',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    example: 'c204121d-5ae7-476b-8c1b-4796a594297e',
    description: 'Course UUID',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
