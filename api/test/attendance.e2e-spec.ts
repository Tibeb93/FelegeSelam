import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Admin-Only Attendance System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let adminToken: string;
  let teacherAToken: string;
  let teacherBToken: string;
  let memberToken: string;

  let adminUserId: string;
  let teacherAUserId: string;
  let teacherBUserId: string;
  let memberUserId: string;

  let testDeptId: number;
  let courseAId: string;
  let courseBId: string;

  let member1Id: string;
  let member1No: string;
  let member2Id: string;
  let member2No: string;
  let member3Id: string;
  let member3No: string;

  let sundaySessionId: string;
  let courseSessionId: string;

  const ts = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // 1. Login as default Super Admin
    const superAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        identifier: 'admin@aemade.org',
        password: 'Admin@123456!',
      });
    superAdminToken = superAdminLogin.body.accessToken;

    // 2. Fetch roles
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'admin' } });
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'teacher' } });
    const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: 'member' } });

    // 3. Create Department
    const dept = await prisma.department.create({
      data: {
        nameAm: `የመገኘት ክፍል ${ts}`,
        nameEn: `Attendance Test Dept ${ts}`,
      },
    });
    testDeptId = dept.id;

    const passwordHash = await argon2.hash('TestPass@123');

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_att_${ts}@aemade.org`,
        passwordHash,
        roleId: adminRole.id,
        status: 'active',
      },
    });
    adminUserId = adminUser.id;

    // 5. Create Teacher A & Teacher B
    const teacherAUser = await prisma.user.create({
      data: {
        email: `teacher_att_a_${ts}@aemade.org`,
        passwordHash,
        roleId: teacherRole.id,
        status: 'active',
      },
    });
    teacherAUserId = teacherAUser.id;

    const teacherBUser = await prisma.user.create({
      data: {
        email: `teacher_att_b_${ts}@aemade.org`,
        passwordHash,
        roleId: teacherRole.id,
        status: 'active',
      },
    });
    teacherBUserId = teacherBUser.id;

    // 6. Create Member User
    const memberUser = await prisma.user.create({
      data: {
        email: `member_att_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    memberUserId = memberUser.id;

    // Obtain access tokens
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        identifier: `admin_att_${ts}@aemade.org`,
        password: 'TestPass@123',
      });
    adminToken = adminRes.body.accessToken;

    const teacherARes = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        identifier: `teacher_att_a_${ts}@aemade.org`,
        password: 'TestPass@123',
      });
    teacherAToken = teacherARes.body.accessToken;

    const teacherBRes = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        identifier: `teacher_att_b_${ts}@aemade.org`,
        password: 'TestPass@123',
      });
    teacherBToken = teacherBRes.body.accessToken;

    const memberRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `member_att_${ts}@aemade.org`,
        password: 'TestPass@123',
      });
    memberToken = memberRes.body.accessToken;

    // 7. Create Test Members for marking
    const m1 = await prisma.member.create({
      data: {
        memberNo: `AS-ATT-${ts}-01`,
        firstName: 'ዳዊት',
        fatherName: 'ተክሌ',
        grandfatherName: 'ወልደሰማዕት',
        sex: 'male',
        phone: `+2519111${ts.toString().slice(-5)}`,
        status: 'active',
        departmentId: testDeptId,
      },
    });
    member1Id = m1.id;
    member1No = m1.memberNo;

    const m2 = await prisma.member.create({
      data: {
        memberNo: `AS-ATT-${ts}-02`,
        firstName: 'ማርታ',
        fatherName: 'ዘውዱ',
        grandfatherName: 'ኃይሉ',
        sex: 'female',
        phone: `+2519112${ts.toString().slice(-5)}`,
        status: 'active',
        departmentId: testDeptId,
      },
    });
    member2Id = m2.id;
    member2No = m2.memberNo;

    const m3 = await prisma.member.create({
      data: {
        memberNo: `AS-ATT-${ts}-03`,
        firstName: 'Bartolomewos',
        fatherName: 'Yohannes',
        grandfatherName: 'Gebre',
        sex: 'male',
        phone: `+2519113${ts.toString().slice(-5)}`,
        status: 'active',
        departmentId: testDeptId,
      },
    });
    member3Id = m3.id;
    member3No = m3.memberNo;

    // 8. Create Courses: Course A taught by Teacher A, Course B taught by Teacher B
    const cA = await prisma.course.create({
      data: {
        titleAm: 'የነገረ መለኮት መግቢያ',
        titleEn: 'Introduction to Theology',
        teacherId: teacherAUserId,
        status: 'open',
      },
    });
    courseAId = cA.id;

    const cB = await prisma.course.create({
      data: {
        titleAm: 'የግዕዝ ቋንቋ ጥናት',
        titleEn: 'Geez Language Studies',
        teacherId: teacherBUserId,
        status: 'open',
      },
    });
    courseBId = cB.id;

    // Enroll m1 and m2 into Course A
    await prisma.enrollment.createMany({
      data: [
        { courseId: courseAId, memberId: member1Id, status: 'active' },
        { courseId: courseAId, memberId: member2Id, status: 'active' },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup created data
    if (sundaySessionId) {
      await prisma.attendance.deleteMany({ where: { sessionId: sundaySessionId } });
      await prisma.attendanceSession.deleteMany({ where: { id: sundaySessionId } });
    }
    if (courseSessionId) {
      await prisma.attendance.deleteMany({ where: { sessionId: courseSessionId } });
      await prisma.attendanceSession.deleteMany({ where: { id: courseSessionId } });
    }

    await prisma.enrollment.deleteMany({ where: { courseId: { in: [courseAId, courseBId] } } });
    await prisma.course.deleteMany({ where: { id: { in: [courseAId, courseBId] } } });
    await prisma.member.deleteMany({ where: { id: { in: [member1Id, member2Id, member3Id] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, teacherAUserId, teacherBUserId, memberUserId] } },
    });
    await prisma.department.deleteMany({ where: { id: testDeptId } });

    await app.close();
  });

  // -------------------------------------------------------------
  // 1. RBAC & PERMISSION CHECKS (Members Never Mark Themselves)
  // -------------------------------------------------------------
  describe('1. Role-Based Access Control', () => {
    it('should reject member token from opening an attendance session (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          sessionDate: '2026-10-25',
          title: 'Sunday Service',
        })
        .expect(403);
    });

    it('should reject member token from searching members (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/members/search?q=${member1No}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request to attendance endpoints (401)', async () => {
      await request(app.getHttpServer()).get('/api/v1/attendance/sessions').expect(401);
    });
  });

  // -------------------------------------------------------------
  // 2. MEMBER SEARCH API (Amharic Name & Member ID)
  // -------------------------------------------------------------
  describe('2. Lightweight Member Search (GET /api/v1/members/search)', () => {
    it('should find member by memberNo', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/search?q=${encodeURIComponent(member1No)}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((m: any) => m.id === member1Id);
      expect(found).toBeDefined();
      expect(found.memberNo).toBe(member1No);
      expect(found.fullName).toContain('ዳዊት');
    });

    it('should find member by Amharic first name', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/search?q=${encodeURIComponent('ማርታ')}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = res.body.find((m: any) => m.id === member2Id);
      expect(found).toBeDefined();
      expect(found.memberNo).toBe(member2No);
      expect(found.fullName).toContain('ማርታ');
    });

    it('should find member by English name', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/search?q=${encodeURIComponent('Bartolomewos')}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = res.body.find((m: any) => m.id === member3Id);
      expect(found).toBeDefined();
      expect(found.memberNo).toBe(member3No);
    });

    it('should return empty array for non-matching query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members/search?q=NonExistentQueryXYZ123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  // -------------------------------------------------------------
  // 3. SESSION OPENING & REUSE (Idempotency)
  // -------------------------------------------------------------
  describe('3. Attendance Session Lifecycle', () => {
    const today = new Date().toISOString().split('T')[0];

    it('should open a new Sunday general session as Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionDate: today,
          title: 'Sunday Service / የእሑድ ጉባኤ',
        })
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('open');
      expect(res.body.courseId).toBeNull();
      expect(res.body.stats).toBeDefined();
      sundaySessionId = res.body.id;
    });

    it('should reuse the existing Sunday session when requested again for the same date', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionDate: today,
        })
        .expect(200);

      expect(res.body.id).toBe(sundaySessionId);
    });

    it('should prevent Teacher A from opening a session for Course B (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          sessionDate: today,
          courseId: courseBId,
        })
        .expect(403);
    });

    it('should allow Teacher A to open a session for their own Course A', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sessions')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          sessionDate: today,
          courseId: courseAId,
          title: 'Course A Lecture',
        })
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.courseId).toBe(courseAId);
      courseSessionId = res.body.id;
    });
  });

  // -------------------------------------------------------------
  // 4. MARKING ATTENDANCE & NO DUPLICATES (PUT /records/:memberId)
  // -------------------------------------------------------------
  describe('4. Marking Attendance Records', () => {
    it('should mark member 1 as present', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${sundaySessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'present' })
        .expect(200);

      expect(res.body.record).toBeDefined();
      expect(res.body.record.id).toBeDefined();
      expect(res.body.record.status).toBe('present');
      expect(res.body.record.memberId).toBe(member1Id);
      expect(res.body.record.sessionId).toBe(sundaySessionId);
    });

    it('should update member 1 to late without creating duplicate', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${sundaySessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'late', notes: 'Arrived 15 minutes late' })
        .expect(200);

      expect(res.body.record.status).toBe('late');
      expect(res.body.record.notes).toBe('Arrived 15 minutes late');

      // Verify in DB that only 1 record exists for this (session, member)
      const count = await prisma.attendance.count({
        where: {
          sessionId: sundaySessionId,
          memberId: member1Id,
        },
      });
      expect(count).toBe(1);
    });

    it('should mark member 2 as absent and member 3 as excused', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${sundaySessionId}/records/${member2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'absent' })
        .expect(200);

      await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${sundaySessionId}/records/${member3Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'excused', notes: 'Permission requested' })
        .expect(200);

      // Verify session details and live counts
      const sessionRes = await request(app.getHttpServer())
        .get(`/api/v1/attendance/sessions/${sundaySessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(sessionRes.body.stats.late).toBeGreaterThanOrEqual(1);
      expect(sessionRes.body.stats.absent).toBeGreaterThanOrEqual(1);
      expect(sessionRes.body.stats.excused).toBeGreaterThanOrEqual(1);
    });

    it('should reject marking when teacher attempts to mark another course session (403)', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${courseSessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ status: 'present' })
        .expect(403);
    });

    it('should allow teacher to mark enrolled member in their own course', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${courseSessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ status: 'present' })
        .expect(200);

      expect(res.body.record.status).toBe('present');
    });

    it('should bulk mark remaining unmarked members as absent', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${courseSessionId}/mark-all-absent`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(res.body.id).toBe(courseSessionId);
      expect(res.body.stats.absent).toBeGreaterThanOrEqual(1); // member 2 was not marked yet
    });
  });

  // -------------------------------------------------------------
  // 5. SESSION CLOSURE & REOPENING
  // -------------------------------------------------------------
  describe('5. Close & Reopen Session Constraints', () => {
    it('should close the course session as teacher', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${courseSessionId}/close`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(res.body.status).toBe('closed');
      expect(res.body.closedAt).toBeDefined();
    });

    it('should reject marking records when session is closed (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${courseSessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ status: 'absent' })
        .expect(400);

      expect(res.body.message).toContain('closed');
    });

    it('should forbid Teacher A and Admin from reopening a closed session (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${courseSessionId}/reopen`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${courseSessionId}/reopen`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should allow Super Admin to reopen a closed session', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/attendance/sessions/${courseSessionId}/reopen`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.status).toBe('open');
      expect(res.body.closedAt).toBeNull();

      // Now marking should succeed again
      const markRes = await request(app.getHttpServer())
        .put(`/api/v1/attendance/sessions/${courseSessionId}/records/${member1Id}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ status: 'present' })
        .expect(200);

      expect(markRes.body.record.status).toBe('present');
    });
  });

  // -------------------------------------------------------------
  // 6. EXPORTING ATTENDANCE (XLSX & PDF)
  // -------------------------------------------------------------
  describe('6. Attendance Export (Excel & PDF)', () => {
    it('should export attendance session as Excel sheet', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/sessions/${sundaySessionId}/export?format=xlsx`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.body).toBeDefined();
    });

    it('should export attendance session as PDF document', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/sessions/${sundaySessionId}/export?format=pdf`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.body).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 7. AUDIT LOG VERIFICATION
  // -------------------------------------------------------------
  describe('7. Audit Logging', () => {
    it('should have recorded audit log entries for attendance actions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'ATTENDANCE_RECORD_MARKED',
              'ATTENDANCE_SESSION_CLOSED',
              'ATTENDANCE_SESSION_REOPENED',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      expect(logs.length).toBeGreaterThan(0);
      const actions = logs.map((l) => l.action);
      expect(actions).toContain('ATTENDANCE_RECORD_MARKED');
      expect(actions).toContain('ATTENDANCE_SESSION_CLOSED');
      expect(actions).toContain('ATTENDANCE_SESSION_REOPENED');
    });
  });
});
