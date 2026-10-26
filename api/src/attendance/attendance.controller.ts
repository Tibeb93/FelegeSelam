import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  ParseUUIDPipe,
  StreamableFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceSessionDto,
  MarkAttendanceRecordDto,
  ExportAttendanceQueryDto,
  AttendanceExportFormat,
  ScanAttendanceDto,
} from './dto/attendance.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('scan')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Scan member QR code (memberNo + courseId) to mark attendance' })
  @ApiResponse({ status: 200, description: 'Attendance marked via scan' })
  async scanAttendance(@Body() dto: ScanAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.scanAttendance(dto, user);
  }

  @Post('sessions')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Open or reuse today's attendance session" })
  @ApiResponse({ status: 200, description: 'Attendance session opened or reused' })
  @ApiResponse({ status: 403, description: 'Forbidden: Members cannot manage attendance sessions' })
  async openOrReuseSession(@Body() dto: CreateAttendanceSessionDto, @CurrentUser() user: any) {
    return this.attendanceService.openOrReuseSession(dto, user);
  }

  @Get('sessions')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiOperation({ summary: 'List recent attendance sessions' })
  @ApiResponse({ status: 200, description: 'List of attendance sessions' })
  async getSessions(@CurrentUser() user: any) {
    return this.attendanceService.getSessions(user);
  }

  @Get('sessions/:id')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiOperation({ summary: 'Get session details, live counts, and marked records' })
  @ApiResponse({ status: 200, description: 'Session data with attendance records' })
  async getSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.attendanceService.getSession(id, user);
  }

  @Post('sessions/:id/close')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiOperation({ summary: 'Close an active attendance session' })
  @ApiResponse({ status: 200, description: 'Session marked as closed' })
  async closeSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.attendanceService.closeSession(id, user);
  }

  @Post('sessions/:id/reopen')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiOperation({ summary: 'Reopen a closed attendance session (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Session reopened' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only super_admin can reopen sessions' })
  async reopenSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.attendanceService.reopenSession(id, user);
  }

  @Put('sessions/:id/records/:memberId')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiOperation({
    summary: 'Mark or update attendance for a member (present, absent, late, excused)',
  })
  @ApiResponse({ status: 200, description: 'Attendance recorded or updated' })
  @ApiResponse({ status: 400, description: 'Bad request: Session is closed' })
  async markRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: MarkAttendanceRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markRecord(id, memberId, dto, user);
  }

  @Delete('sessions/:id/records/:memberId')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiParam({ name: 'memberId', description: 'Member UUID' })
  @ApiOperation({ summary: 'Delete or undo attendance mark for a member' })
  @ApiResponse({ status: 200, description: 'Attendance mark reverted' })
  async deleteRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.deleteRecord(id, memberId, user);
  }

  @Post('sessions/:id/mark-all-absent')
  @Roles('super_admin', 'admin', 'teacher')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiOperation({ summary: 'Mark all remaining unmarked members as absent' })
  @ApiResponse({ status: 200, description: 'Remaining members marked absent' })
  async markAllRemainingAbsent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.attendanceService.markAllRemainingAbsent(id, user);
  }

  @Get('sessions/:id/export')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Attendance Session UUID' })
  @ApiQuery({ name: 'format', enum: AttendanceExportFormat, required: false })
  @ApiOperation({ summary: 'Export attendance sheet as PDF or Excel' })
  async exportSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ExportAttendanceQueryDto,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const format = query.format || AttendanceExportFormat.PDF;
    const { buffer, mimeType, filename } = await this.attendanceService.exportSession(
      id,
      format,
      user,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }
}
