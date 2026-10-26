import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  Prisma,
  CourseStatus,
  EnrollmentStatus,
  AttendanceStatus,
  AttendanceSessionStatus,
  MemberStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CertificatesPdfService } from './certificates-pdf.service';
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
import {
  RecordSessionAttendanceDto,
  ScanAttendanceDto,
  QueryAttendanceDto,
} from './dto/attendance.dto';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { IssueCertificateDto } from './dto/certificate.dto';
import { paginate } from '../common/dto/pagination.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly certificatesPdfService: CertificatesPdfService,
  ) {}

  // =========================================================================
  // HELPER: Teacher Scope & Ownership Validation
  // =========================================================================

  private getTeacherIdentifiers(user: any): string[] {
    if (!user) return [];
    const ids: string[] = [];
    if (user.id) ids.push(user.id);
    if (user.member?.id) ids.push(user.member.id);
    return ids;
  }

  private isTeacherOwner(course: { teacherId: string | null }, user: any): boolean {
    if (!course.teacherId || !user) return false;
    const teacherIds = this.getTeacherIdentifiers(user);
    return teacherIds.includes(course.teacherId);
  }

  private assertCourseAccess(course: { teacherId: string | null }, user: any): void {
    if (!user) return;
    if (user.role === 'teacher' && !this.isTeacherOwner(course, user)) {
      throw new ForbiddenException(
        'Teachers can only access and manage their own assigned courses',
      );
    }
  }

  private normalizeSessionDate(dateStr?: string): Date {
    const isoDate = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
    const parsed = new Date(`${isoDate}T00:00:00.000Z`);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid session date: ${dateStr}`);
    }
    return parsed;
  }

  public calculateGradeSummary(grades: { score: number; maxScore: number }[]) {
    if (!grades || grades.length === 0) {
      return {
        assessmentsCount: 0,
        totalScore: 0,
        totalMaxScore: 0,
        averagePercentage: 0,
        passed: false,
        result: 'INCOMPLETE' as const,
      };
    }

    const totalScore = grades.reduce((acc, g) => acc + Number(g.score), 0);
    const totalMaxScore = grades.reduce((acc, g) => acc + Number(g.maxScore || 100), 0);
    const averagePercentage =
      totalMaxScore > 0 ? Number(((totalScore / totalMaxScore) * 100).toFixed(2)) : 0;
    const passed = averagePercentage >= 50;

    return {
      assessmentsCount: grades.length,
      totalScore: Number(totalScore.toFixed(2)),
      totalMaxScore: Number(totalMaxScore.toFixed(2)),
      averagePercentage,
      passed,
      result: (passed ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
    };
  }

  // =========================================================================
  // 1. COURSES CRUD
  // =========================================================================

  async createCourse(dto: CreateCourseDto) {
    if (dto.teacherId) {
      const [userExists, memberExists] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
        this.prisma.member.findUnique({ where: { id: dto.teacherId } }),
      ]);
      if (!userExists && !memberExists) {
        throw new BadRequestException(`Assigned teacher (${dto.teacherId}) not found`);
      }
    }

    const course = await this.prisma.course.create({
      data: {
        titleAm: dto.titleAm,
        titleEn: dto.titleEn ?? null,
        description: dto.description ?? null,
        level: dto.level ?? null,
        teacherId: dto.teacherId ?? null,
        schedule: dto.schedule ?? null,
        capacity: dto.capacity ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? CourseStatus.draft,
      },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    this.logger.log(`Course created: ${course.id} (${course.titleAm})`);
    return course;
  }

  async findAllCourses(query: QueryCourseDto, user?: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.level) {
      where.level = query.level;
    }
    if (query.teacherId) {
      where.teacherId = query.teacherId;
    }

    // Enforce teacher scope: teachers see ONLY their own courses
    if (user?.role === 'teacher') {
      const teacherIds = this.getTeacherIdentifiers(user);
      where.teacherId = { in: teacherIds };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { titleAm: { contains: term } },
        { titleEn: { contains: term } },
        { description: { contains: term } },
        { level: { contains: term } },
      ];
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['titleAm', 'titleEn', 'level', 'status', 'startDate', 'createdAt'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginate(courses, total, page, limit);
  }

  async findOneCourse(id: string, user?: any) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          where: !user || user?.role === 'member' ? { published: true } : undefined,
          orderBy: { orderNo: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            attendances: true,
            certificates: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    this.assertCourseAccess(course, user);
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto, user: any) {
    const course = await this.findOneCourse(id, user);

    if (
      user?.role === 'teacher' &&
      dto.teacherId &&
      !this.getTeacherIdentifiers(user).includes(dto.teacherId)
    ) {
      throw new ForbiddenException('Teachers cannot reassign course ownership to another teacher');
    }

    if (dto.teacherId) {
      const [userExists, memberExists] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
        this.prisma.member.findUnique({ where: { id: dto.teacherId } }),
      ]);
      if (!userExists && !memberExists) {
        throw new BadRequestException(`Assigned teacher (${dto.teacherId}) not found`);
      }
    }

    const updated = await this.prisma.course.update({
      where: { id: course.id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    this.logger.log(`Course updated: ${updated.id}`);
    return updated;
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    await this.prisma.course.delete({ where: { id } });
    return { id, deleted: true };
  }

  // =========================================================================
  // 2. LESSONS CRUD, ORDERING & MEDIA UPLOAD
  // =========================================================================

  async createLesson(courseId: string, dto: CreateLessonDto, user: any) {
    await this.findOneCourse(courseId, user);

    let orderNo = dto.orderNo;
    if (!orderNo) {
      const lastLesson = await this.prisma.lesson.findFirst({
        where: { courseId },
        orderBy: { orderNo: 'desc' },
      });
      orderNo = lastLesson ? lastLesson.orderNo + 1 : 1;
    }

    return this.prisma.lesson.create({
      data: {
        courseId,
        title: dto.title,
        content: dto.content ?? null,
        mediaType: dto.mediaType ?? 'text',
        fileUrl: dto.fileUrl ?? null,
        orderNo,
        published: dto.published ?? false,
      },
    });
  }

  async findLessons(courseId: string, query: QueryLessonDto, user?: any) {
    await this.findOneCourse(courseId, user);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = { courseId };

    if (user?.role === 'member') {
      where.published = true;
    } else if (query.published !== undefined) {
      where.published = query.published;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { content: { contains: term } }];
    }

    let orderBy: Prisma.LessonOrderByWithRelationInput = { orderNo: 'asc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (
        ['orderNo', 'title', 'createdAt'].includes(field) &&
        (direction === 'asc' || direction === 'desc')
      ) {
        orderBy = { [field]: direction };
      }
    }

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return paginate(lessons, total, page, limit);
  }

  async updateLesson(courseId: string, lessonId: string, dto: UpdateLessonDto, user: any) {
    await this.findOneCourse(courseId, user);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found in course ${courseId}`);
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto,
    });
  }

  async reorderLessons(courseId: string, dto: ReorderLessonsDto, user: any) {
    await this.findOneCourse(courseId, user);

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.lesson.updateMany({
          where: { id: item.lessonId, courseId },
          data: { orderNo: item.orderNo },
        }),
      ),
    );

    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { orderNo: 'asc' },
    });
  }

  async uploadLessonMedia(
    courseId: string,
    lessonId: string,
    file: Express.Multer.File,
    user: any,
  ) {
    await this.findOneCourse(courseId, user);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found in course ${courseId}`);
    }

    const { fileUrl, mediaType } = await this.storageService.saveLessonMedia(file);

    if (lesson.fileUrl && lesson.fileUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(lesson.fileUrl);
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        fileUrl,
        mediaType,
      },
    });
  }

  async deleteLesson(courseId: string, lessonId: string, user: any) {
    await this.findOneCourse(courseId, user);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found in course ${courseId}`);
    }

    if (lesson.fileUrl && lesson.fileUrl.startsWith('/uploads/')) {
      await this.storageService.deleteFile(lesson.fileUrl);
    }

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { id: lessonId, deleted: true };
  }

  // =========================================================================
  // 3. ENROLLMENTS (SINGLE, DROP, CAPACITY CHECK, BULK BY DEPARTMENT)
  // =========================================================================

  async enrollMember(courseId: string, dto: CreateEnrollmentDto, user: any) {
    const course = await this.findOneCourse(courseId, user);

    if (course.status === CourseStatus.closed || course.status === CourseStatus.archived) {
      throw new BadRequestException(`Cannot enroll in a ${course.status} course`);
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${dto.memberId} not found`);
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        memberId_courseId: {
          memberId: dto.memberId,
          courseId,
        },
      },
    });

    if (
      existing &&
      (existing.status === EnrollmentStatus.active ||
        existing.status === EnrollmentStatus.completed)
    ) {
      throw new ConflictException('Member is already enrolled in this course');
    }

    // Check capacity
    if (course.capacity !== null && course.capacity !== undefined) {
      const currentActiveCount = await this.prisma.enrollment.count({
        where: {
          courseId,
          status: { in: [EnrollmentStatus.active, EnrollmentStatus.completed] },
        },
      });
      if (currentActiveCount >= course.capacity) {
        throw new BadRequestException(
          `Course has reached its maximum capacity of ${course.capacity} students`,
        );
      }
    }

    if (existing && existing.status === EnrollmentStatus.dropped) {
      return this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: EnrollmentStatus.active },
        include: { member: true },
      });
    }

    return this.prisma.enrollment.create({
      data: {
        courseId,
        memberId: dto.memberId,
        status: EnrollmentStatus.active,
      },
      include: { member: true },
    });
  }

  async bulkEnrollByDepartment(courseId: string, dto: BulkDepartmentEnrollDto, user: any) {
    const course = await this.findOneCourse(courseId, user);

    if (course.status === CourseStatus.closed || course.status === CourseStatus.archived) {
      throw new BadRequestException(`Cannot enroll in a ${course.status} course`);
    }

    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new NotFoundException(`Department with ID ${dto.departmentId} not found`);
    }

    const deptMembers = await this.prisma.member.findMany({
      where: {
        departmentId: dto.departmentId,
        status: MemberStatus.active,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    const existingEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
    });

    const activeOrCompletedSet = new Set(
      existingEnrollments
        .filter(
          (e) => e.status === EnrollmentStatus.active || e.status === EnrollmentStatus.completed,
        )
        .map((e) => e.memberId),
    );
    const droppedMap = new Map(
      existingEnrollments
        .filter((e) => e.status === EnrollmentStatus.dropped)
        .map((e) => [e.memberId, e.id]),
    );

    let currentCount = activeOrCompletedSet.size;
    const maxCapacity = course.capacity ?? Infinity;

    let enrolledCount = 0;
    let skippedAlreadyEnrolled = 0;
    let skippedCapacityLimit = 0;
    const enrolledMemberIds: string[] = [];

    for (const member of deptMembers) {
      if (activeOrCompletedSet.has(member.id)) {
        skippedAlreadyEnrolled++;
        continue;
      }

      if (currentCount >= maxCapacity) {
        skippedCapacityLimit++;
        continue;
      }

      const droppedEnrollmentId = droppedMap.get(member.id);
      if (droppedEnrollmentId) {
        await this.prisma.enrollment.update({
          where: { id: droppedEnrollmentId },
          data: { status: EnrollmentStatus.active },
        });
      } else {
        await this.prisma.enrollment.create({
          data: {
            courseId,
            memberId: member.id,
            status: EnrollmentStatus.active,
          },
        });
      }

      currentCount++;
      enrolledCount++;
      enrolledMemberIds.push(member.id);
    }

    return {
      courseId,
      departmentId: dto.departmentId,
      departmentNameAm: department.nameAm,
      totalDepartmentMembers: deptMembers.length,
      enrolledCount,
      skippedAlreadyEnrolled,
      skippedCapacityLimit,
      enrolledMemberIds,
    };
  }

  async updateEnrollmentStatus(
    courseId: string,
    enrollmentId: string,
    dto: UpdateEnrollmentStatusDto,
    user: any,
  ) {
    await this.findOneCourse(courseId, user);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found in course ${courseId}`);
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: dto.status },
      include: { member: true, grades: true },
    });
  }

  async findEnrollments(courseId: string, query: QueryEnrollmentDto, user: any) {
    await this.findOneCourse(courseId, user);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = { courseId };
    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.member = {
        OR: [
          { memberNo: { contains: term } },
          { firstName: { contains: term } },
          { fatherName: { contains: term } },
          { phone: { contains: term } },
        ],
      };
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: true,
          grades: true,
        },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const enriched = enrollments.map((e) => ({
      ...e,
      gradeSummary: this.calculateGradeSummary(e.grades),
    }));

    return paginate(enriched, total, page, limit);
  }

  // =========================================================================
  // 4. ATTENDANCE (WHOLE SESSION, EDIT PAST SESSION, QR SCAN)
  // =========================================================================

  async recordSessionAttendance(courseId: string, dto: RecordSessionAttendanceDto, user: any) {
    const course = await this.findOneCourse(courseId, user);
    const sessionDate = this.normalizeSessionDate(dto.sessionDate);

    // Check for duplicate memberIds in the request payload
    const seenMembers = new Set<string>();
    for (const item of dto.records) {
      if (seenMembers.has(item.memberId)) {
        throw new ConflictException(
          `Duplicate memberId (${item.memberId}) in attendance session payload`,
        );
      }
      seenMembers.add(item.memberId);
    }

    // Check if any of these attendance records already exist for this date
    const existing = await this.prisma.attendance.findMany({
      where: {
        courseId,
        sessionDate,
        memberId: { in: Array.from(seenMembers) },
      },
    });

    if (existing.length > 0) {
      throw new ConflictException(
        `Attendance already recorded for ${existing.length} student(s) on ${dto.sessionDate}. Use PUT to edit a past session.`,
      );
    }

    let session = await this.prisma.attendanceSession.findFirst({
      where: { courseId, sessionDate, status: AttendanceSessionStatus.open },
    });
    if (!session) {
      session = await this.prisma.attendanceSession.create({
        data: {
          courseId,
          sessionDate,
          title: `${course.titleAm} - የመገኘት መዝገብ`,
          status: AttendanceSessionStatus.open,
          openedBy: user?.id || 'system',
        },
      });
    }

    const created = await this.prisma.$transaction(
      dto.records.map((rec) =>
        this.prisma.attendance.create({
          data: {
            sessionId: session.id,
            courseId,
            memberId: rec.memberId,
            sessionDate,
            status: rec.status,
            markedBy: user?.id ?? null,
          },
          include: {
            member: {
              select: {
                id: true,
                memberNo: true,
                firstName: true,
                fatherName: true,
              },
            },
          },
        }),
      ),
    );

    return {
      courseId,
      sessionDate: sessionDate.toISOString().split('T')[0],
      totalRecorded: created.length,
      records: created,
    };
  }

  async editSessionAttendance(courseId: string, dto: RecordSessionAttendanceDto, user: any) {
    const course = await this.findOneCourse(courseId, user);
    const sessionDate = this.normalizeSessionDate(dto.sessionDate);

    let session = await this.prisma.attendanceSession.findFirst({
      where: { courseId, sessionDate, status: AttendanceSessionStatus.open },
    });
    if (!session) {
      session = await this.prisma.attendanceSession.create({
        data: {
          courseId,
          sessionDate,
          title: `${course.titleAm} - የመገኘት መዝገብ`,
          status: AttendanceSessionStatus.open,
          openedBy: user?.id || 'system',
        },
      });
    }

    const updated = await this.prisma.$transaction(
      dto.records.map((rec) =>
        this.prisma.attendance.upsert({
          where: {
            sessionId_memberId: {
              sessionId: session.id,
              memberId: rec.memberId,
            },
          },
          update: {
            status: rec.status,
            markedBy: user?.id ?? null,
          },
          create: {
            sessionId: session.id,
            courseId,
            memberId: rec.memberId,
            sessionDate,
            status: rec.status,
            markedBy: user?.id ?? null,
          },
          include: {
            member: {
              select: {
                id: true,
                memberNo: true,
                firstName: true,
                fatherName: true,
              },
            },
          },
        }),
      ),
    );

    return {
      courseId,
      sessionDate: sessionDate.toISOString().split('T')[0],
      totalUpdated: updated.length,
      records: updated,
    };
  }

  async scanAttendanceQr(dto: ScanAttendanceDto, user: any) {
    const course = await this.findOneCourse(dto.courseId, user);

    const member = await this.prisma.member.findFirst({
      where: { memberNo: dto.memberNo.trim(), deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with number "${dto.memberNo}" not found`);
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        memberId_courseId: {
          memberId: member.id,
          courseId: course.id,
        },
      },
    });

    if (!enrollment || enrollment.status === EnrollmentStatus.dropped) {
      throw new BadRequestException(
        `Member ${member.memberNo} is not actively enrolled in course "${course.titleAm}"`,
      );
    }

    const sessionDate = this.normalizeSessionDate(dto.sessionDate);

    let session = await this.prisma.attendanceSession.findFirst({
      where: { courseId: course.id, sessionDate, status: AttendanceSessionStatus.open },
    });
    if (!session) {
      session = await this.prisma.attendanceSession.create({
        data: {
          courseId: course.id,
          sessionDate,
          title: `${course.titleAm} - የመገኘት መዝገብ`,
          status: AttendanceSessionStatus.open,
          openedBy: user?.id || 'system',
        },
      });
    }

    const existing = await this.prisma.attendance.findUnique({
      where: {
        sessionId_memberId: {
          sessionId: session.id,
          memberId: member.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Duplicate attendance: Member ${member.memberNo} is already marked "${existing.status}" for ${sessionDate.toISOString().split('T')[0]}`,
      );
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        sessionId: session.id,
        memberId: member.id,
        courseId: course.id,
        sessionDate,
        status: dto.status ?? AttendanceStatus.present,
        markedBy: user?.id ?? null,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAm: true,
            titleEn: true,
          },
        },
      },
    });

    return attendance;
  }

  async findCourseAttendance(courseId: string, query: QueryAttendanceDto, user: any) {
    await this.findOneCourse(courseId, user);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = { courseId };

    if (query.sessionDate) {
      where.sessionDate = this.normalizeSessionDate(query.sessionDate);
    }
    if (query.memberId) {
      where.memberId = query.memberId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return paginate(records, total, page, limit);
  }

  // =========================================================================
  // 5. GRADES & ASSESSMENTS
  // =========================================================================

  async addGrade(enrollmentId: string, dto: CreateGradeDto, user: any) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    this.assertCourseAccess(enrollment.course, user);

    const maxScore = dto.maxScore ?? 100;
    if (dto.score > maxScore) {
      throw new BadRequestException(`Score (${dto.score}) cannot exceed maxScore (${maxScore})`);
    }

    const grade = await this.prisma.grade.create({
      data: {
        enrollmentId,
        assessment: dto.assessment,
        score: dto.score,
        maxScore,
        remark: dto.remark ?? null,
      },
    });

    const allGrades = await this.prisma.grade.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      grade,
      summary: this.calculateGradeSummary(allGrades),
    };
  }

  async updateGrade(gradeId: string, dto: UpdateGradeDto, user: any) {
    const existing = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Grade ${gradeId} not found`);
    }

    this.assertCourseAccess(existing.enrollment.course, user);

    const nextScore = dto.score ?? existing.score;
    const nextMax = dto.maxScore ?? existing.maxScore;

    if (nextScore > nextMax) {
      throw new BadRequestException(`Score (${nextScore}) cannot exceed maxScore (${nextMax})`);
    }

    const grade = await this.prisma.grade.update({
      where: { id: gradeId },
      data: {
        assessment: dto.assessment,
        score: dto.score,
        maxScore: dto.maxScore,
        remark: dto.remark,
      },
    });

    const allGrades = await this.prisma.grade.findMany({
      where: { enrollmentId: existing.enrollmentId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      grade,
      summary: this.calculateGradeSummary(allGrades),
    };
  }

  async deleteGrade(gradeId: string, user: any) {
    const existing = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: {
          include: { course: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Grade ${gradeId} not found`);
    }

    this.assertCourseAccess(existing.enrollment.course, user);

    await this.prisma.grade.delete({ where: { id: gradeId } });

    const remainingGrades = await this.prisma.grade.findMany({
      where: { enrollmentId: existing.enrollmentId },
    });

    return {
      id: gradeId,
      deleted: true,
      summary: this.calculateGradeSummary(remainingGrades),
    };
  }

  async getEnrollmentGrades(enrollmentId: string, user: any) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
        member: true,
        grades: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    if (user?.role === 'teacher') {
      this.assertCourseAccess(enrollment.course, user);
    } else if (user?.role === 'member') {
      const isOwnMember =
        enrollment.member.userId === user.id ||
        (user.member && enrollment.memberId === user.member.id);
      if (!isOwnMember) {
        throw new ForbiddenException('Members can only view their own grades');
      }
    }

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      memberId: enrollment.memberId,
      enrollmentStatus: enrollment.status,
      member: {
        id: enrollment.member.id,
        memberNo: enrollment.member.memberNo,
        firstName: enrollment.member.firstName,
        fatherName: enrollment.member.fatherName,
      },
      course: {
        id: enrollment.course.id,
        titleAm: enrollment.course.titleAm,
        titleEn: enrollment.course.titleEn,
      },
      grades: enrollment.grades,
      summary: this.calculateGradeSummary(enrollment.grades),
    };
  }

  // =========================================================================
  // 6. CERTIFICATES (ISSUE, PDF GENERATION, PUBLIC VERIFICATION)
  // =========================================================================

  private async generateCertificateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CERT-AS-${year}-`;

    const lastCert = await this.prisma.certificate.findFirst({
      where: {
        code: { startsWith: prefix },
      },
      orderBy: { code: 'desc' },
    });

    let nextSeq = 1;
    if (lastCert) {
      const parts = lastCert.code.split('-');
      const seqNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seqNum)) {
        nextSeq = seqNum + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  }

  async issueCertificate(dto: IssueCertificateDto, user: any) {
    let enrollment;

    if (dto.enrollmentId) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: { id: dto.enrollmentId },
        include: {
          member: true,
          course: true,
          grades: true,
        },
      });
    } else if (dto.memberId && dto.courseId) {
      enrollment = await this.prisma.enrollment.findUnique({
        where: {
          memberId_courseId: {
            memberId: dto.memberId,
            courseId: dto.courseId,
          },
        },
        include: {
          member: true,
          course: true,
          grades: true,
        },
      });
    } else {
      throw new BadRequestException(
        'Provide either enrollmentId or both memberId and courseId to issue a certificate',
      );
    }

    if (!enrollment) {
      throw new NotFoundException('Enrollment record not found');
    }

    this.assertCourseAccess(enrollment.course, user);

    if (enrollment.status !== EnrollmentStatus.completed) {
      throw new BadRequestException(
        `Certificate can only be issued for completed enrollments (current status: "${enrollment.status}")`,
      );
    }

    const gradeSummary = this.calculateGradeSummary(enrollment.grades);
    if (enrollment.grades.length > 0 && !gradeSummary.passed) {
      throw new BadRequestException(
        `Cannot issue certificate: student grade average (${gradeSummary.averagePercentage}%) is below passing threshold (50%)`,
      );
    }

    const existingCert = await this.prisma.certificate.findFirst({
      where: {
        memberId: enrollment.memberId,
        courseId: enrollment.courseId,
      },
    });

    if (existingCert) {
      throw new ConflictException(
        `Certificate (${existingCert.code}) has already been issued for this member and course`,
      );
    }

    const code = await this.generateCertificateCode();

    const certificate = await this.prisma.certificate.create({
      data: {
        memberId: enrollment.memberId,
        courseId: enrollment.courseId,
        code,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            baptismalName: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAm: true,
            titleEn: true,
            level: true,
          },
        },
      },
    });

    this.logger.log(
      `Issued certificate ${certificate.code} for member ${certificate.member.memberNo}`,
    );

    return {
      ...certificate,
      gradeSummary,
    };
  }

  async verifyCertificateByCode(code: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { code: code.trim() },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            baptismalName: true,
          },
        },
        course: {
          select: {
            id: true,
            titleAm: true,
            titleEn: true,
            level: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate with code "${code}" is invalid or not found`);
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        memberId_courseId: {
          memberId: certificate.memberId,
          courseId: certificate.courseId,
        },
      },
      include: { grades: true },
    });

    const gradeSummary = this.calculateGradeSummary(enrollment?.grades ?? []);

    return {
      valid: true,
      certificate: {
        id: certificate.id,
        code: certificate.code,
        issuedAt: certificate.issuedAt,
        member: {
          ...certificate.member,
          fullName:
            `${certificate.member.firstName} ${certificate.member.fatherName} ${certificate.member.grandfatherName || ''}`.trim(),
        },
        course: certificate.course,
        gradeSummary,
      },
    };
  }

  async generateCertificatePdfBuffer(idOrCode: string, byCode: boolean = false) {
    const certificate = await this.prisma.certificate.findUnique({
      where: byCode ? { code: idOrCode } : { id: idOrCode },
      include: {
        member: true,
        course: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate "${idOrCode}" not found`);
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        memberId_courseId: {
          memberId: certificate.memberId,
          courseId: certificate.courseId,
        },
      },
      include: { grades: true },
    });

    const gradeSummary = this.calculateGradeSummary(enrollment?.grades ?? []);

    const buffer = await this.certificatesPdfService.generateCertificatePdf({
      code: certificate.code,
      issuedAt: certificate.issuedAt,
      member: certificate.member,
      course: certificate.course,
      gradeSummary: {
        averagePercentage: gradeSummary.averagePercentage || 100,
        result: gradeSummary.assessmentsCount > 0 ? gradeSummary.result : 'PASS',
      },
    });

    return {
      buffer,
      filename: `Certificate_${certificate.code}.pdf`,
    };
  }

  // =========================================================================
  // 7. PER-COURSE REPORT (ATTENDANCE % PER STUDENT & AVERAGE GRADE)
  // =========================================================================

  async getCourseReport(courseId: string, user: any) {
    const course = await this.findOneCourse(courseId, user);

    const [enrollments, attendances, certificates] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          member: {
            select: {
              id: true,
              memberNo: true,
              firstName: true,
              fatherName: true,
              grandfatherName: true,
              sex: true,
              phone: true,
            },
          },
          grades: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.attendance.findMany({
        where: { courseId },
      }),
      this.prisma.certificate.findMany({
        where: { courseId },
      }),
    ]);

    const distinctSessions = new Set(
      attendances.map((a) => new Date(a.sessionDate).toISOString().split('T')[0]),
    );
    const totalSessionsHeld = distinctSessions.size;

    const certMap = new Map(certificates.map((c) => [c.memberId, c]));

    const students = enrollments.map((enrollment) => {
      const studentAttendances = attendances.filter((a) => a.memberId === enrollment.memberId);
      const presentCount = studentAttendances.filter(
        (a) => a.status === AttendanceStatus.present,
      ).length;
      const lateCount = studentAttendances.filter((a) => a.status === AttendanceStatus.late).length;
      const excusedCount = studentAttendances.filter(
        (a) => a.status === AttendanceStatus.excused,
      ).length;
      const absentCount = studentAttendances.filter(
        (a) => a.status === AttendanceStatus.absent,
      ).length;

      const attendedCount = presentCount + lateCount;
      const attendancePercentage =
        totalSessionsHeld > 0 ? Number(((attendedCount / totalSessionsHeld) * 100).toFixed(2)) : 0;

      const gradeSummary = this.calculateGradeSummary(enrollment.grades);
      const cert = certMap.get(enrollment.memberId);

      return {
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        member: {
          ...enrollment.member,
          fullName:
            `${enrollment.member.firstName} ${enrollment.member.fatherName} ${enrollment.member.grandfatherName || ''}`.trim(),
        },
        attendance: {
          totalSessions: totalSessionsHeld,
          presentCount,
          lateCount,
          excusedCount,
          absentCount,
          attendancePercentage,
        },
        grades: gradeSummary,
        certificate: cert
          ? {
              issued: true,
              code: cert.code,
              issuedAt: cert.issuedAt,
            }
          : {
              issued: false,
              code: null,
              issuedAt: null,
            },
      };
    });

    const totalEnrolled = students.length;
    const activeCount = students.filter((s) => s.enrollmentStatus === 'active').length;
    const completedCount = students.filter((s) => s.enrollmentStatus === 'completed').length;
    const droppedCount = students.filter((s) => s.enrollmentStatus === 'dropped').length;

    const courseAverageAttendancePercentage =
      totalEnrolled > 0
        ? Number(
            (
              students.reduce((acc, s) => acc + s.attendance.attendancePercentage, 0) /
              totalEnrolled
            ).toFixed(2),
          )
        : 0;

    const gradedStudents = students.filter((s) => s.grades.assessmentsCount > 0);
    const courseAverageGradePercentage =
      gradedStudents.length > 0
        ? Number(
            (
              gradedStudents.reduce((acc, s) => acc + s.grades.averagePercentage, 0) /
              gradedStudents.length
            ).toFixed(2),
          )
        : 0;

    const passCount = students.filter((s) => s.grades.result === 'PASS').length;
    const failCount = students.filter((s) => s.grades.result === 'FAIL').length;

    return {
      course: {
        id: course.id,
        titleAm: course.titleAm,
        titleEn: course.titleEn,
        level: course.level,
        teacherId: course.teacherId,
        schedule: course.schedule,
        capacity: course.capacity,
        status: course.status,
      },
      summary: {
        totalEnrolled,
        activeCount,
        completedCount,
        droppedCount,
        totalSessionsHeld,
        courseAverageAttendancePercentage,
        courseAverageGradePercentage,
        passCount,
        failCount,
        certificatesIssuedCount: certificates.length,
      },
      students,
    };
  }
}
