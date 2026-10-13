import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnrollmentStatus } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, QueryCourseDto } from './dto/course.dto';
import {
  CreateLessonDto,
  UpdateLessonDto,
  ReorderLessonsDto,
  QueryLessonDto,
} from './dto/lesson.dto';
import {
  CreateEnrollmentDto,
  BulkDepartmentEnrollDto,
  UpdateEnrollmentStatusDto,
  QueryEnrollmentDto,
} from './dto/enrollment.dto';
import { RecordSessionAttendanceDto, QueryAttendanceDto } from './dto/attendance.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators/auth.decorator';

@ApiTags('Courses & Lessons')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // =========================================================================
  // 1. COURSES CRUD
  // =========================================================================

  @Post()
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Create a new course (admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @Get()
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiOperation({
    summary: 'List courses (teachers see only their assigned courses)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of courses' })
  async findAllCourses(@Query() query: QueryCourseDto, @CurrentUser() user: any) {
    return this.coursesService.findAllCourses(query, user);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiOperation({ summary: 'Get course details with lessons' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @ApiResponse({ status: 403, description: 'Forbidden if teacher does not own course' })
  async findOneCourse(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.coursesService.findOneCourse(id, user);
  }

  @Put(':id')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiOperation({ summary: 'Update course (teachers can only edit their own courses)' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  async updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateCourse(id, dto, user);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiOperation({ summary: 'Partially update course' })
  async patchCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateCourse(id, dto, user);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiOperation({ summary: 'Delete course (admin only)' })
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.deleteCourse(id);
  }

  // =========================================================================
  // 2. LESSONS CRUD, ORDERING & MEDIA UPLOAD
  // =========================================================================

  @Post(':courseId/lessons')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Create a lesson in a course' })
  @ApiResponse({ status: 201, description: 'Lesson created' })
  async createLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.createLesson(courseId, dto, user);
  }

  @Get(':courseId/lessons')
  @Roles('super_admin', 'admin', 'teacher', 'member')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({
    summary: 'List lessons in a course ordered by orderNo (members see only published)',
  })
  async findLessons(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: QueryLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.findLessons(courseId, query, user);
  }

  @Patch(':courseId/lessons/reorder')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Reorder lessons within a course' })
  async reorderLessons(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderLessonsDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.reorderLessons(courseId, dto, user);
  }

  @Put(':courseId/lessons/:lessonId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiOperation({ summary: 'Update lesson details, orderNo, or published status' })
  async updateLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateLesson(courseId, lessonId, dto, user);
  }

  @Patch(':courseId/lessons/:lessonId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiOperation({ summary: 'Publish, hide, or partially update a lesson' })
  async patchLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateLesson(courseId, lessonId, dto, user);
  }

  @Post(':courseId/lessons/:lessonId/upload')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiOperation({
    summary: 'Upload lesson media (PDF max 15MB, Audio max 25MB, Video max 50MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadLessonMedia(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.uploadLessonMedia(courseId, lessonId, file, user);
  }

  @Delete(':courseId/lessons/:lessonId')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiOperation({ summary: 'Delete lesson from course' })
  async deleteLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.deleteLesson(courseId, lessonId, user);
  }

  // =========================================================================
  // 3. ENROLLMENTS (SINGLE, BULK BY DEPARTMENT, DROP)
  // =========================================================================

  @Post(':courseId/enrollments')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Enroll a member in a course (checks capacity and duplicates)' })
  @ApiResponse({ status: 201, description: 'Member enrolled' })
  async enrollMember(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.enrollMember(courseId, dto, user);
  }

  @Post(':courseId/enrollments/bulk-department')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Bulk enroll all active members of a department into a course' })
  @ApiResponse({ status: 201, description: 'Bulk enrollment report' })
  async bulkEnrollByDepartment(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: BulkDepartmentEnrollDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.bulkEnrollByDepartment(courseId, dto, user);
  }

  @Get(':courseId/enrollments')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'List enrollments and grade summaries for a course' })
  async findEnrollments(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: QueryEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.findEnrollments(courseId, query, user);
  }

  @Patch(':courseId/enrollments/:enrollmentId/status')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiOperation({ summary: 'Update enrollment status (active, completed, dropped)' })
  async updateEnrollmentStatus(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateEnrollmentStatus(courseId, enrollmentId, dto, user);
  }

  @Patch(':courseId/enrollments/:enrollmentId/drop')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'enrollmentId', description: 'Enrollment UUID' })
  @ApiOperation({ summary: 'Drop a student enrollment from a course' })
  async dropEnrollment(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateEnrollmentStatus(
      courseId,
      enrollmentId,
      { status: EnrollmentStatus.dropped },
      user,
    );
  }

  // =========================================================================
  // 4. ATTENDANCE SESSIONS (RECORD WHOLE SESSION & EDIT PAST SESSION)
  // =========================================================================

  @Post(':courseId/attendance')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Record a whole attendance session in one request' })
  @ApiResponse({ status: 201, description: 'Attendance session recorded' })
  @ApiResponse({ status: 409, description: 'Duplicate attendance for session date' })
  async recordSessionAttendance(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: RecordSessionAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.recordSessionAttendance(courseId, dto, user);
  }

  @Put(':courseId/attendance')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'Edit/update a past attendance session' })
  @ApiResponse({ status: 200, description: 'Attendance session updated' })
  async editSessionAttendance(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: RecordSessionAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.editSessionAttendance(courseId, dto, user);
  }

  @Get(':courseId/attendance')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({ summary: 'List attendance records for a course' })
  async findCourseAttendance(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: QueryAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.findCourseAttendance(courseId, query, user);
  }

  // =========================================================================
  // 5. PER-COURSE REPORT (ATTENDANCE % & AVERAGE GRADE PER STUDENT)
  // =========================================================================

  @Get(':courseId/report')
  @Roles('super_admin', 'admin', 'teacher')
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiOperation({
    summary: 'Get comprehensive per-course report with student attendance % and average grades',
  })
  async getCourseReport(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.getCourseReport(courseId, user);
  }
}
