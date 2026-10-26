import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceExportService } from './attendance-export.service';
import {
  CreateAttendanceSessionDto,
  MarkAttendanceRecordDto,
  AttendanceExportFormat,
} from './dto/attendance.dto';
import {
  AttendanceStatus,
  AttendanceSessionStatus,
  EnrollmentStatus,
  MemberStatus,
} from '@prisma/client';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: AttendanceExportService,
  ) {}

  private getRoleName(user: any): string {
    if (!user) return '';
    if (typeof user.role === 'string') return user.role;
    if (user.role && typeof user.role === 'object' && user.role.name) return user.role.name;
    return '';
  }

  private normalizeDate(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  /**
   * 1. Open or reuse today's attendance session
   * One open general Sunday session per date, plus optional course sessions.
   */
  async openOrReuseSession(dto: CreateAttendanceSessionDto, user: any) {
    const sessionDate = this.normalizeDate(dto.sessionDate);
    const courseId = dto.courseId || null;

    // Teacher course verification
    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        throw new NotFoundException(`Course with id ${courseId} not found`);
      }
      if (this.getRoleName(user) === 'teacher' && course.teacherId !== user.id) {
        throw new ForbiddenException(
          'Teachers can only manage attendance for their assigned course',
        );
      }
    } else if (this.getRoleName(user) === 'teacher') {
      // General sessions can only be managed by super_admin and admin
      throw new ForbiddenException(
        'General Sunday service attendance can only be opened by administrators',
      );
    }

    // Check if an open session already exists for this date and course
    const existing = await this.prisma.attendanceSession.findFirst({
      where: {
        sessionDate,
        courseId,
        status: AttendanceSessionStatus.open,
      },
    });

    if (existing) {
      return this.getSession(existing.id, user);
    }

    // Determine title
    let title = dto.title?.trim();
    if (!title) {
      if (courseId) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        title = `${course?.titleAm || 'ትምህርት'} - የመገኘት መዝገብ`;
      } else {
        title = 'የሰንበት መርሐ-ግብር / Sunday Service';
      }
    }

    const session = await this.prisma.attendanceSession.create({
      data: {
        sessionDate,
        title,
        courseId,
        status: AttendanceSessionStatus.open,
        openedBy: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_SESSION_OPENED',
        entity: 'ATTENDANCE_SESSION',
        entityId: session.id,
        newValue: { title: session.title, sessionDate, courseId },
      },
    });

    this.logger.log(
      `Opened attendance session "${session.title}" (${session.id}) by user ${user.id}`,
    );
    return this.getSession(session.id, user);
  }

  /**
   * 2. List sessions (for selector dropdown and historical review)
   */
  async getSessions(user: any) {
    const where: any = {};
    if (this.getRoleName(user) === 'teacher') {
      const teacherCourses = await this.prisma.course.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      where.courseId = { in: teacherCourses.map((c) => c.id) };
    }

    return this.prisma.attendanceSession.findMany({
      where,
      orderBy: [{ sessionDate: 'desc' }, { createdAt: 'desc' }],
      take: 30,
      include: {
        course: {
          select: { id: true, titleAm: true, titleEn: true },
        },
        _count: {
          select: { attendances: true },
        },
      },
    });
  }

  /**
   * 3. Get single session with counts, metrics, and records
   */
  async getSession(sessionId: string, user: any) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: { id: true, titleAm: true, titleEn: true, teacherId: true },
        },
        attendances: {
          orderBy: { updatedAt: 'desc' },
          include: {
            member: {
              select: {
                id: true,
                memberNo: true,
                firstName: true,
                fatherName: true,
                grandfatherName: true,
                photoUrl: true,
                status: true,
                department: {
                  select: { id: true, nameAm: true, nameEn: true },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    if (
      this.getRoleName(user) === 'teacher' &&
      session.courseId &&
      session.course?.teacherId !== user.id
    ) {
      throw new ForbiddenException('You do not have permission to view attendance for this course');
    }

    // Compute live counters
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const att of session.attendances) {
      if (att.status === AttendanceStatus.present) present++;
      else if (att.status === AttendanceStatus.absent) absent++;
      else if (att.status === AttendanceStatus.late) late++;
      else if (att.status === AttendanceStatus.excused) excused++;
    }

    const totalMarked = session.attendances.length;

    // Calculate total eligible pool
    let totalEligible = 0;
    if (session.courseId) {
      totalEligible = await this.prisma.enrollment.count({
        where: {
          courseId: session.courseId,
          status: EnrollmentStatus.active,
        },
      });
    } else {
      totalEligible = await this.prisma.member.count({
        where: {
          status: MemberStatus.active,
          deletedAt: null,
        },
      });
    }

    const notMarkedYet = Math.max(0, totalEligible - totalMarked);

    return {
      ...session,
      records: session.attendances,
      attendances: session.attendances,
      stats: {
        present,
        absent,
        late,
        excused,
        totalMarked,
        totalEligible,
        unmarked: notMarkedYet,
        notMarkedYet,
      },
    };
  }

  /**
   * 4. Close session
   */
  async closeSession(sessionId: string, user: any) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    if (
      this.getRoleName(user) === 'teacher' &&
      session.courseId &&
      session.course?.teacherId !== user.id
    ) {
      throw new ForbiddenException('Teachers can only close sessions for their own course');
    }

    if (session.status === AttendanceSessionStatus.closed) {
      return this.getSession(sessionId, user);
    }

    await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: AttendanceSessionStatus.closed,
        closedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_SESSION_CLOSED',
        entity: 'ATTENDANCE_SESSION',
        entityId: sessionId,
        newValue: { closedAt: new Date() },
      },
    });

    return this.getSession(sessionId, user);
  }

  /**
   * 5. Reopen session (Super Admin ONLY)
   */
  async reopenSession(sessionId: string, user: any) {
    if (this.getRoleName(user) !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can reopen a closed attendance session');
    }

    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: AttendanceSessionStatus.open,
        closedAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_SESSION_REOPENED',
        entity: 'ATTENDANCE_SESSION',
        entityId: sessionId,
        newValue: { reopenedAt: new Date() },
      },
    });

    return this.getSession(sessionId, user);
  }

  /**
   * 6. Mark or update attendance record for a member
   * PUT /attendance/sessions/:id/records/:memberId
   * Creates or updates so there are never duplicates. Closed sessions reject changes.
   */
  async markRecord(sessionId: string, memberId: string, dto: MarkAttendanceRecordDto, user: any) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    if (session.status === AttendanceSessionStatus.closed) {
      throw new BadRequestException(
        'Session is closed. Closed sessions reject attendance changes.',
      );
    }

    // Teacher permission check
    if (this.getRoleName(user) === 'teacher') {
      if (!session.courseId || session.course?.teacherId !== user.id) {
        throw new ForbiddenException('Teachers can only mark attendance for their assigned course');
      }
    }

    // Member existence check
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.deletedAt) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // Upsert record: creates or updates, unique by (sessionId, memberId)
    const record = await this.prisma.attendance.upsert({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId,
        },
      },
      update: {
        status: dto.status,
        notes: dto.notes,
        markedBy: user.id,
        courseId: session.courseId,
        sessionDate: session.sessionDate,
      },
      create: {
        sessionId,
        memberId,
        courseId: session.courseId,
        sessionDate: session.sessionDate,
        status: dto.status,
        notes: dto.notes,
        markedBy: user.id,
      },
      include: {
        member: {
          select: {
            id: true,
            memberNo: true,
            firstName: true,
            fatherName: true,
            grandfatherName: true,
            photoUrl: true,
            department: {
              select: { id: true, nameAm: true, nameEn: true },
            },
          },
        },
      },
    });

    // Write audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_RECORD_MARKED',
        entity: 'ATTENDANCE',
        entityId: record.id,
        newValue: {
          sessionId,
          memberId,
          memberNo: record.member.memberNo,
          status: dto.status,
          markedBy: user.email || user.id,
        },
      },
    });

    // Return updated session state with the new record
    const updatedSession = await this.getSession(sessionId, user);
    return {
      record,
      session: updatedSession,
    };
  }

  /**
   * Delete / unmark a record (for undo of freshly marked attendance)
   */
  async deleteRecord(sessionId: string, memberId: string, user: any) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    if (session.status === AttendanceSessionStatus.closed) {
      throw new BadRequestException('Session is closed. Closed sessions reject changes.');
    }

    const existing = await this.prisma.attendance.findUnique({
      where: {
        sessionId_memberId: {
          sessionId,
          memberId,
        },
      },
    });

    if (existing) {
      await this.prisma.attendance.delete({
        where: { id: existing.id },
      });

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ATTENDANCE_RECORD_DELETED',
          entity: 'ATTENDANCE',
          entityId: existing.id,
          oldValue: { sessionId, memberId },
        },
      });
    }

    const updatedSession = await this.getSession(sessionId, user);
    return {
      success: true,
      session: updatedSession,
    };
  }

  /**
   * 7. Mark all remaining unmarked members as absent
   */
  async markAllRemainingAbsent(sessionId: string, user: any) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { course: true },
    });

    if (!session) {
      throw new NotFoundException(`Attendance session ${sessionId} not found`);
    }

    if (session.status === AttendanceSessionStatus.closed) {
      throw new BadRequestException(
        'Session is closed. Closed sessions reject attendance changes.',
      );
    }

    if (
      this.getRoleName(user) === 'teacher' &&
      session.courseId &&
      session.course?.teacherId !== user.id
    ) {
      throw new ForbiddenException('Teachers can only manage their own course');
    }

    // Get already marked member IDs
    const existing = await this.prisma.attendance.findMany({
      where: { sessionId },
      select: { memberId: true },
    });
    const markedIds = new Set(existing.map((e) => e.memberId));

    // Find unmarked eligible members
    let unmarkedIds: string[] = [];
    if (session.courseId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          courseId: session.courseId,
          status: EnrollmentStatus.active,
        },
        select: { memberId: true },
      });
      unmarkedIds = enrollments.map((e) => e.memberId).filter((mid) => !markedIds.has(mid));
    } else {
      const activeMembers = await this.prisma.member.findMany({
        where: {
          status: MemberStatus.active,
          deletedAt: null,
        },
        select: { id: true },
      });
      unmarkedIds = activeMembers.map((m) => m.id).filter((mid) => !markedIds.has(mid));
    }

    if (unmarkedIds.length > 0) {
      await this.prisma.attendance.createMany({
        data: unmarkedIds.map((mid) => ({
          sessionId,
          memberId: mid,
          courseId: session.courseId,
          sessionDate: session.sessionDate,
          status: AttendanceStatus.absent,
          markedBy: user.id,
          notes: 'Marked absent remaining / ቀሪ ያልተገኙ ተብለው የተመዘገቡ',
        })),
        skipDuplicates: true,
      });

      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ATTENDANCE_ALL_REMAINING_ABSENT',
          entity: 'ATTENDANCE_SESSION',
          entityId: sessionId,
          newValue: { count: unmarkedIds.length },
        },
      });
    }

    return this.getSession(sessionId, user);
  }

  /**
   * 8. Export attendance sheet to PDF or Excel
   */
  async exportSession(sessionId: string, format: AttendanceExportFormat, user: any) {
    const sessionData = await this.getSession(sessionId, user);
    const dateStr = new Date(sessionData.sessionDate).toISOString().split('T')[0];

    if (format === AttendanceExportFormat.XLSX) {
      const buffer = await this.exportService.exportExcel(sessionData, sessionData.stats);
      return {
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `Attendance_${dateStr}_${sessionData.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
      };
    }

    const buffer = await this.exportService.exportPdf(sessionData, sessionData.stats);
    return {
      buffer,
      mimeType: 'application/pdf',
      filename: `Attendance_${dateStr}_${sessionData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    };
  }

  /**
   * 9. Scan member QR code (memberNo + courseId) to mark attendance
   */
  async scanAttendance(dto: any, user: any) {
    const member = await this.prisma.member.findFirst({
      where: { memberNo: dto.memberNo.trim(), deletedAt: null },
    });
    if (!member) {
      throw new NotFoundException(`Member with number "${dto.memberNo}" not found`);
    }

    const sessionDate = this.normalizeDate(dto.sessionDate);
    const courseId = dto.courseId || null;

    let session = await this.prisma.attendanceSession.findFirst({
      where: {
        courseId,
        sessionDate,
        status: AttendanceSessionStatus.open,
      },
    });

    if (!session) {
      session = await this.prisma.attendanceSession.create({
        data: {
          sessionDate,
          courseId,
          title: courseId ? 'የኮርስ መገኘት መዝገብ' : 'የሰንበት መርሐ-ግብር',
          status: AttendanceSessionStatus.open,
          openedBy: user?.id || 'system',
        },
      });
    }

    const result = await this.markRecord(
      session.id,
      member.id,
      { status: dto.status ?? AttendanceStatus.present },
      user,
    );

    return result.record;
  }
}
