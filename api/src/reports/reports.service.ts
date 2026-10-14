import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FormStatus } from '@prisma/client';

export interface DashboardReportResult {
  summary: {
    totalMembers: number;
    newMembers: number;
    activePosts: number;
    openForms: number;
    upcomingEventsCount: number;
  };
  membersPerMonth: Array<{
    month: string;
    labelAm: string;
    labelEn: string;
    count: number;
  }>;
  membersByDepartment: Array<{
    departmentId: number | null;
    nameAm: string;
    nameEn: string | null;
    count: number;
  }>;
  membersByAgeGroup: {
    under18: number;
    age18To25: number;
    age26To35: number;
    age36To50: number;
    above50: number;
    unknown: number;
  };
  attendanceRatePerCourse: Array<{
    courseId: string;
    courseTitle: string;
    totalRecords: number;
    presentCount: number;
    attendanceRate: number;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    location: string | null;
    startAt: Date;
    capacity: number | null;
  }>;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates comprehensive metrics for the admin dashboard
   */
  async getDashboard(): Promise<DashboardReportResult> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Total & New Members
    const [totalMembers, newMembers] = await Promise.all([
      this.prisma.member.count({
        where: { deletedAt: null },
      }),
      this.prisma.member.count({
        where: {
          deletedAt: null,
          joinedAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    // 2. Members per month for the last 12 months
    const membersPerMonth: Array<{
      month: string;
      labelAm: string;
      labelEn: string;
      count: number;
    }> = [];

    const amharicMonths = [
      'ጥር',
      'የካቲት',
      'መጋቢት',
      'ሚያዝያ',
      'ግንቦት',
      'ሰኔ',
      'ሐምሌ',
      'ነሐሴ',
      'ጳጉሜ',
      'መስከረም',
      'ጥቅምት',
      'ኅዳር',
      'ታኅሣሥ',
    ];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.prisma.member.count({
        where: {
          deletedAt: null,
          joinedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const yearMonth = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`;
      const monthIdx = startOfMonth.getMonth();
      const monthNameEn = startOfMonth.toLocaleString('en-US', { month: 'short' });

      membersPerMonth.push({
        month: yearMonth,
        labelAm: `${amharicMonths[monthIdx % 12]} ${startOfMonth.getFullYear()}`,
        labelEn: `${monthNameEn} ${startOfMonth.getFullYear()}`,
        count,
      });
    }

    // 3. Members by department
    const departments = await this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            members: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const unassignedCount = await this.prisma.member.count({
      where: { deletedAt: null, departmentId: null },
    });

    const membersByDepartment = departments.map((d) => ({
      departmentId: d.id,
      nameAm: d.nameAm,
      nameEn: d.nameEn,
      count: d._count.members,
    }));

    if (unassignedCount > 0) {
      membersByDepartment.push({
        departmentId: null,
        nameAm: 'ያልተመደበ',
        nameEn: 'Unassigned',
        count: unassignedCount,
      });
    }

    // 4. Members by age group (<18, 18-25, 26-35, 36-50, 50+)
    const allMembersDob = await this.prisma.member.findMany({
      where: { deletedAt: null },
      select: { dateOfBirth: true },
    });

    const ageGroupCounts = {
      under18: 0,
      age18To25: 0,
      age26To35: 0,
      age36To50: 0,
      above50: 0,
      unknown: 0,
    };

    for (const m of allMembersDob) {
      if (!m.dateOfBirth) {
        ageGroupCounts.unknown++;
        continue;
      }

      const diffMs = now.getTime() - new Date(m.dateOfBirth).getTime();
      const age = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));

      if (age < 18) ageGroupCounts.under18++;
      else if (age <= 25) ageGroupCounts.age18To25++;
      else if (age <= 35) ageGroupCounts.age26To35++;
      else if (age <= 50) ageGroupCounts.age36To50++;
      else ageGroupCounts.above50++;
    }

    // 5. Attendance rate per course
    const courses = await this.prisma.course.findMany({
      select: {
        id: true,
        titleAm: true,
        attendances: {
          select: {
            status: true,
          },
        },
      },
    });

    const attendanceRatePerCourse = courses.map((c) => {
      const totalRecords = c.attendances.length;
      const presentCount = c.attendances.filter((a) => a.status === 'present').length;
      const rate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

      return {
        courseId: c.id,
        courseTitle: c.titleAm,
        totalRecords,
        presentCount,
        attendanceRate: rate,
      };
    });

    // 6. Active posts count
    const activePosts = await this.prisma.post.count({
      where: {
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    });

    // 7. Open forms count
    const openForms = await this.prisma.form.count({
      where: {
        status: FormStatus.open,
        OR: [{ openUntil: null }, { openUntil: { gte: now } }],
      },
    });

    // 8. Upcoming events count & list
    const upcomingEventsList = await this.prisma.event.findMany({
      where: {
        startAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        location: true,
        startAt: true,
        capacity: true,
      },
    });

    const upcomingEventsCount = await this.prisma.event.count({
      where: { startAt: { gte: now } },
    });

    return {
      summary: {
        totalMembers,
        newMembers,
        activePosts,
        openForms,
        upcomingEventsCount,
      },
      membersPerMonth,
      membersByDepartment,
      membersByAgeGroup: ageGroupCounts,
      attendanceRatePerCourse,
      upcomingEvents: upcomingEventsList,
    };
  }
}
