import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { CoursesService } from './courses.service';
import { ScanAttendanceDto } from './dto/attendance.dto';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { IssueCertificateDto } from './dto/certificate.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Public, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('scan')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({
    summary: 'Scan member QR code (memberNo + courseId) to mark attendance',
  })
  @ApiResponse({ status: 201, description: 'Attendance marked via QR scan' })
  @ApiResponse({ status: 409, description: 'Duplicate attendance scan for session' })
  async scanAttendance(@Body() dto: ScanAttendanceDto, @CurrentUser() user: any) {
    return this.coursesService.scanAttendanceQr(dto, user);
  }
}

@ApiTags('Grades & Assessments')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(RolesGuard)
export class GradesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('enrollments/:enrollmentId/grades')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiOperation({
    summary: 'Add an assessment grade for an enrollment and calculate pass/fail average',
  })
  @ApiResponse({ status: 201, description: 'Grade recorded with updated average summary' })
  async addGrade(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() dto: CreateGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.addGrade(enrollmentId, dto, user);
  }

  @Get('enrollments/:enrollmentId/grades')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiOperation({
    summary: 'Get all grades and calculated pass/fail average for an enrollment',
  })
  async getEnrollmentGrades(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getEnrollmentGrades(enrollmentId, user);
  }

  @Put('grades/:gradeId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'gradeId', description: 'Grade UUID' })
  @ApiOperation({ summary: 'Edit an assessment grade' })
  async updateGrade(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateGrade(gradeId, dto, user);
  }

  @Patch('grades/:gradeId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'gradeId', description: 'Grade UUID' })
  @ApiOperation({ summary: 'Partially edit an assessment grade' })
  async patchGrade(
    @Param('gradeId', ParseUUIDPipe) gradeId: string,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateGrade(gradeId, dto, user);
  }

  @Delete('grades/:gradeId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'gradeId', description: 'Grade UUID' })
  @ApiOperation({ summary: 'Delete an assessment grade' })
  async deleteGrade(@Param('gradeId', ParseUUIDPipe) gradeId: string, @CurrentUser() user: any) {
    return this.coursesService.deleteGrade(gradeId, user);
  }
}

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(RolesGuard)
export class CertificatesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post('issue')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({
    summary: 'Issue a certificate with unique code for a completed enrollment',
  })
  @ApiResponse({ status: 201, description: 'Certificate issued' })
  async issueCertificate(@Body() dto: IssueCertificateDto, @CurrentUser() user: any) {
    return this.coursesService.issueCertificate(dto, user);
  }

  @Get('verify/:code')
  @Public()
  @ApiParam({ name: 'code', description: 'Unique certificate verification code' })
  @ApiOperation({
    summary: 'Public endpoint to verify a certificate code (no authentication required)',
  })
  @ApiResponse({ status: 200, description: 'Certificate verification details' })
  @ApiResponse({ status: 404, description: 'Invalid or non-existent certificate code' })
  async verifyCertificate(@Param('code') code: string) {
    return this.coursesService.verifyCertificateByCode(code);
  }

  @Get(':id/pdf')
  @ApiBearerAuth('JWT-auth')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'id', description: 'Certificate UUID' })
  @ApiOperation({
    summary: 'Download official Certificate PDF with school logo and QR code',
  })
  async downloadCertificatePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.coursesService.generateCertificatePdfBuffer(id, false);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  @Get('verify/:code/pdf')
  @Public()
  @ApiParam({ name: 'code', description: 'Certificate code' })
  @ApiOperation({
    summary: 'Download official Certificate PDF by verification code',
  })
  async downloadCertificatePdfByCode(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.coursesService.generateCertificatePdfBuffer(code, true);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
