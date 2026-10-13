import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Courses, Attendance, Grades & Certificates (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let teacherAToken: string;
  let teacherBToken: string;
  let memberToken: string;

  let teacherAUserId: string;
  let teacherBUserId: string;
  let testDepartmentId: number;

  let courseAId: string;
  let courseBId: string;
  let lesson1Id: string;
  let lesson2Id: string;

  let student1Id: string;
  let student1MemberNo: string;
  let student2Id: string;
  let student3Id: string;

  let enrollment1Id: string;
  let enrollment2Id: string;
  let midtermGradeId: string;

  let issuedCertId: string;
  let issuedCertCode: string;

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

    // 1. Login as Super Admin
    const adminLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: 'admin@aemade.org',
      password: 'Admin@123456!',
    });
    superAdminToken = adminLogin.body.accessToken;

    // 2. Get roles and create dedicated test department
    const teacherRole = await prisma.role.findUniqueOrThrow({ where: { name: 'teacher' } });
    const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: 'member' } });

    const dept = await prisma.department.create({
      data: {
        nameAm: `የሙከራ ትምህርት ክፍል ${Date.now()}`,
        nameEn: `Test Academic Dept ${Date.now()}`,
      },
    });
    testDepartmentId = dept.id;

    // 3. Create Teacher A & Teacher B
    const passwordHash = await argon2.hash('TeacherPass123!');
    const ts = Date.now();

    const teacherA = await prisma.user.create({
      data: {
        email: `teacher_a_${ts}@aemade.org`,
        passwordHash,
        roleId: teacherRole.id,
        status: 'active',
      },
    });
    teacherAUserId = teacherA.id;

    const teacherB = await prisma.user.create({
      data: {
        email: `teacher_b_${ts}@aemade.org`,
        passwordHash,
        roleId: teacherRole.id,
        status: 'active',
      },
    });
    teacherBUserId = teacherB.id;

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `teacher_a_${ts}@aemade.org`,
        password: 'TeacherPass123!',
      });
    teacherAToken = loginA.body.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `teacher_b_${ts}@aemade.org`,
        password: 'TeacherPass123!',
      });
    teacherBToken = loginB.body.accessToken;

    // 4. Create 3 test student members in testDepartmentId
    const s1User = await prisma.user.create({
      data: {
        email: `student1_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });

    const s1 = await prisma.member.create({
      data: {
        memberNo: `AS-TEST-${ts}-1`,
        userId: s1User.id,
        firstName: 'ሚካኤል',
        fatherName: 'አሸናፊ',
        grandfatherName: 'በቀለ',
        baptismalName: 'ገብረ ሚካኤል',
        sex: 'male',
        departmentId: testDepartmentId,
        status: 'active',
      },
    });
    student1Id = s1.id;
    student1MemberNo = s1.memberNo;

    const loginMember = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `student1_${ts}@aemade.org`,
        password: 'TeacherPass123!',
      });
    memberToken = loginMember.body.accessToken;

    const s2 = await prisma.member.create({
      data: {
        memberNo: `AS-TEST-${ts}-2`,
        firstName: 'ሳራ',
        fatherName: 'ታደሰ',
        sex: 'female',
        departmentId: testDepartmentId,
        status: 'active',
      },
    });
    student2Id = s2.id;

    const s3 = await prisma.member.create({
      data: {
        memberNo: `AS-TEST-${ts}-3`,
        firstName: 'ዳዊት',
        fatherName: 'ካሳ',
        sex: 'male',
        departmentId: testDepartmentId,
        status: 'active',
      },
    });
    student3Id = s3.id;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. COURSES CRUD & TEACHER SCOPE
  // =========================================================================
  describe('1. Courses CRUD & Teacher Scope Permissions', () => {
    it('should forbid a teacher from creating a new course (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          titleAm: 'ያልተፈቀደ ኮርስ',
        })
        .expect(403);
    });

    it('should allow admin to create Course A (assigned to Teacher A, capacity 2) and Course B (assigned to Teacher B)', async () => {
      const resA = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          titleAm: 'ነገረ ሃይማኖት ፩ (Dogmatics I)',
          titleEn: 'Dogmatic Theology I',
          description: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን መሠረተ እምነት ትምህርት',
          level: 'ደረጃ ፩',
          teacherId: teacherAUserId,
          schedule: 'ቅዳሜ 8:00 - 10:00',
          capacity: 2,
          status: 'open',
        })
        .expect(201);

      courseAId = resA.body.id;
      expect(resA.body.teacherId).toBe(teacherAUserId);
      expect(resA.body.capacity).toBe(2);

      const resB = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          titleAm: 'የቤተክርስቲያን ታሪክ',
          titleEn: 'Church History',
          teacherId: teacherBUserId,
          capacity: 10,
          status: 'open',
        })
        .expect(201);

      courseBId = resB.body.id;
    });

    it('should restrict Teacher A to seeing ONLY their own assigned courses in GET /courses', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      const ids = res.body.data.map((c: any) => c.id);
      expect(ids).toContain(courseAId);
      expect(ids).not.toContain(courseBId);
    });

    it('should forbid Teacher A from viewing or editing Teacher B course (403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/courses/${courseBId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .put(`/api/v1/courses/${courseBId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ schedule: 'እሑድ 4:00' })
        .expect(403);

      // Verify Teacher B can access their own course
      await request(app.getHttpServer())
        .get(`/api/v1/courses/${courseBId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .expect(200);
    });

    it('should allow Teacher A to update their own Course A schedule', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/courses/${courseAId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          schedule: 'ቅዳሜ ከሰዓት 7:30 - 9:30',
        })
        .expect(200);

      expect(res.body.schedule).toBe('ቅዳሜ ከሰዓት 7:30 - 9:30');
    });
  });

  // =========================================================================
  // 2. LESSONS CRUD, ORDERING, UPLOAD & PUBLISH/HIDE
  // =========================================================================
  describe('2. Lessons CRUD, Ordering, Media Upload & Publishing', () => {
    it('should allow Teacher A to create unpublished and published lessons', async () => {
      const l1 = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/lessons`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          title: 'ምዕራፍ ፩፡ አምስቱ አዕማደ ምሥጢር',
          content: 'ምሥጢረ ሥላሴ፣ ምሥጢረ ሥጋዌ፣ ምሥጢረ ጥምቀት፣ ምሥጢረ ቁርባን፣ ምሥጢረ ትንሣኤ ሙታን',
          published: false,
        })
        .expect(201);

      lesson1Id = l1.body.id;
      expect(l1.body.orderNo).toBe(1);
      expect(l1.body.published).toBe(false);

      const l2 = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/lessons`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          title: 'ምዕራፍ ፪፡ ምሥጢረ ሥላሴ',
          content: 'አንድነትና ሦስትነት',
          published: true,
        })
        .expect(201);

      lesson2Id = l2.body.id;
      expect(l2.body.orderNo).toBe(2);
      expect(l2.body.published).toBe(true);
    });

    it('should hide unpublished lessons from members while showing them to the teacher', async () => {
      const memberRes = await request(app.getHttpServer())
        .get(`/api/v1/courses/${courseAId}/lessons`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(memberRes.body.data.length).toBe(1);
      expect(memberRes.body.data[0].id).toBe(lesson2Id);

      // Publish lesson 1
      await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseAId}/lessons/${lesson1Id}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ published: true })
        .expect(200);

      const memberResAfter = await request(app.getHttpServer())
        .get(`/api/v1/courses/${courseAId}/lessons`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(memberResAfter.body.data.length).toBe(2);
    });

    it('should upload PDF media to a lesson and reject unsupported file types', async () => {
      const fakePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');

      const uploadRes = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/lessons/${lesson1Id}/upload`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .attach('file', fakePdfBuffer, {
          filename: 'amade-mistir.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      expect(uploadRes.body.mediaType).toBe('pdf');
      expect(uploadRes.body.fileUrl).toContain('/uploads/lessons/pdf/');

      // Reject unsupported executable file
      await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/lessons/${lesson1Id}/upload`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .attach('file', Buffer.from('MZ-invalid'), {
          filename: 'malware.exe',
          contentType: 'application/x-msdownload',
        })
        .expect(400);
    });

    it('should reorder lessons cleanly', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseAId}/lessons/reorder`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          items: [
            { lessonId: lesson2Id, orderNo: 1 },
            { lessonId: lesson1Id, orderNo: 2 },
          ],
        })
        .expect(200);

      expect(res.body[0].id).toBe(lesson2Id);
      expect(res.body[0].orderNo).toBe(1);
      expect(res.body[1].id).toBe(lesson1Id);
      expect(res.body[1].orderNo).toBe(2);
    });
  });

  // =========================================================================
  // 3. ENROLLMENT: CAPACITY, DUPLICATES, DROP & BULK DEPARTMENT ENROLL
  // =========================================================================
  describe('3. Enrollment, Capacity Check, Drop & Bulk Department Enrollment', () => {
    it('should enroll Student 1 and reject duplicate enrollment (409)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/enrollments`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ memberId: student1Id })
        .expect(201);

      enrollment1Id = res.body.id;
      expect(res.body.status).toBe('active');

      // Duplicate enrollment check
      await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/enrollments`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ memberId: student1Id })
        .expect(409);
    });

    it('should enforce course capacity limit (capacity = 2)', async () => {
      // Enroll Student 2 (reaches 2/2 capacity)
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/enrollments`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ memberId: student2Id })
        .expect(201);

      enrollment2Id = res2.body.id;

      // Student 3 should be rejected due to capacity limit
      const res3 = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/enrollments`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ memberId: student3Id })
        .expect(400);

      expect(res3.body.message).toContain('capacity');
    });

    it('should drop an enrollment and free up capacity, then bulk enroll by department', async () => {
      // Drop Student 2
      const dropRes = await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseAId}/enrollments/${enrollment2Id}/drop`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(dropRes.body.status).toBe('dropped');

      // Increase Course A capacity to 10 so bulk department enroll can enroll everyone
      await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseAId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ capacity: 10 })
        .expect(200);

      const bulkRes = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/enrollments/bulk-department`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ departmentId: testDepartmentId })
        .expect(201);

      expect(bulkRes.body.totalDepartmentMembers).toBe(3);
      expect(bulkRes.body.skippedAlreadyEnrolled).toBe(1); // Student 1 already active
      expect(bulkRes.body.enrolledCount).toBe(2); // Student 2 (re-activated) + Student 3
    });
  });

  // =========================================================================
  // 4. ATTENDANCE: WHOLE SESSION, EDIT PAST SESSION & QR SCAN
  // =========================================================================
  describe('4. Attendance: Session Recording, Editing & QR Code Scan', () => {
    it('should record a whole attendance session in one request and reject duplicate session POST (409)', async () => {
      const sessionPayload = {
        sessionDate: '2026-10-05',
        records: [
          { memberId: student1Id, status: 'present' },
          { memberId: student2Id, status: 'absent' },
          { memberId: student3Id, status: 'late' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/attendance`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send(sessionPayload)
        .expect(201);

      expect(res.body.totalRecorded).toBe(3);

      // Submitting the same session again via POST must fail with 409 Conflict
      await request(app.getHttpServer())
        .post(`/api/v1/courses/${courseAId}/attendance`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send(sessionPayload)
        .expect(409);
    });

    it('should edit a past attendance session via PUT', async () => {
      const editRes = await request(app.getHttpServer())
        .put(`/api/v1/courses/${courseAId}/attendance`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          sessionDate: '2026-10-05',
          records: [{ memberId: student2Id, status: 'excused' }],
        })
        .expect(200);

      expect(editRes.body.records[0].status).toBe('excused');
    });

    it('should mark attendance via POST /attendance/scan with memberNo & courseId and reject duplicate scan (409)', async () => {
      const scanRes = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          memberNo: student1MemberNo,
          courseId: courseAId,
          sessionDate: '2026-10-12',
        })
        .expect(201);

      expect(scanRes.body.status).toBe('present');
      expect(scanRes.body.member.memberNo).toBe(student1MemberNo);

      // Duplicate QR scan on the same session date must return 409 Conflict
      await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          memberNo: student1MemberNo,
          courseId: courseAId,
          sessionDate: '2026-10-12',
        })
        .expect(409);
    });
  });

  // =========================================================================
  // 5. GRADES: ADD, EDIT & CALCULATE PASS/FAIL AVERAGE
  // =========================================================================
  describe('5. Grades: Add, Edit & Calculate Average and Pass/Fail Result', () => {
    it('should add assessments, edit a grade, and calculate average percentage and PASS result', async () => {
      // 1. Add Midterm (40 / 50)
      const g1 = await request(app.getHttpServer())
        .post(`/api/v1/enrollments/${enrollment1Id}/grades`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          assessment: 'የመካከለኛ ዘመን ፈተና (Midterm)',
          score: 40,
          maxScore: 50,
          remark: 'ጥሩ ጥረት',
        })
        .expect(201);

      midtermGradeId = g1.body.grade.id;
      expect(g1.body.summary.averagePercentage).toBe(80);
      expect(g1.body.summary.result).toBe('PASS');

      // 2. Add Final Exam (45 / 50)
      const g2 = await request(app.getHttpServer())
        .post(`/api/v1/enrollments/${enrollment1Id}/grades`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          assessment: 'ማጠቃለያ ፈተና (Final Exam)',
          score: 45,
          maxScore: 50,
          remark: 'እጅግ በጣም ጥሩ',
        })
        .expect(201);

      expect(g2.body.summary.totalScore).toBe(85);
      expect(g2.body.summary.totalMaxScore).toBe(100);
      expect(g2.body.summary.averagePercentage).toBe(85);
      expect(g2.body.summary.result).toBe('PASS');

      // 3. Edit Midterm grade from 40 to 43
      const edited = await request(app.getHttpServer())
        .put(`/api/v1/grades/${midtermGradeId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          score: 43,
          remark: 'ተስተካክሏል',
        })
        .expect(200);

      expect(edited.body.summary.totalScore).toBe(88);
      expect(edited.body.summary.averagePercentage).toBe(88);
      expect(edited.body.summary.passed).toBe(true);
    });
  });

  // =========================================================================
  // 6. CERTIFICATES: ISSUE, PDF WITH QR & PUBLIC VERIFICATION
  // =========================================================================
  describe('6. Certificates: Issue, PDF Download & Public Verification', () => {
    it('should reject certificate issuance if enrollment is not yet completed (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/certificates/issue')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ enrollmentId: enrollment1Id })
        .expect(400);
    });

    it('should mark enrollment completed and issue a unique certificate', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseAId}/enrollments/${enrollment1Id}/status`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ status: 'completed' })
        .expect(200);

      const certRes = await request(app.getHttpServer())
        .post('/api/v1/certificates/issue')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ enrollmentId: enrollment1Id })
        .expect(201);

      issuedCertId = certRes.body.id;
      issuedCertCode = certRes.body.code;
      expect(issuedCertCode).toMatch(/^CERT-AS-\d{4}-\d{4}$/);
      expect(certRes.body.gradeSummary.averagePercentage).toBe(88);
    });

    it('should allow an unauthenticated stranger to verify the certificate via public GET /certificates/verify/:code', async () => {
      const verifyRes = await request(app.getHttpServer())
        .get(`/api/v1/certificates/verify/${issuedCertCode}`)
        .expect(200);

      expect(verifyRes.body.valid).toBe(true);
      expect(verifyRes.body.certificate.code).toBe(issuedCertCode);
      expect(verifyRes.body.certificate.member.memberNo).toBe(student1MemberNo);
      expect(verifyRes.body.certificate.course.titleAm).toContain('ነገረ ሃይማኖት');
      expect(verifyRes.body.certificate.gradeSummary.averagePercentage).toBe(88);

      // Invalid code returns 404
      await request(app.getHttpServer())
        .get('/api/v1/certificates/verify/CERT-AS-9999-9999')
        .expect(404);
    });

    it('should generate and download the Certificate PDF with school logo and QR code', async () => {
      const pdfRes = await request(app.getHttpServer())
        .get(`/api/v1/certificates/${issuedCertId}/pdf`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(pdfRes.headers['content-type']).toBe('application/pdf');
      expect(pdfRes.headers['content-disposition']).toContain(issuedCertCode);
    }, 30000);
  });

  // =========================================================================
  // 7. PER-COURSE REPORT (ATTENDANCE % & AVERAGE GRADE PER STUDENT)
  // =========================================================================
  describe('7. Per-Course Report', () => {
    it('should return per-course report with student attendance % and average grade', async () => {
      const reportRes = await request(app.getHttpServer())
        .get(`/api/v1/courses/${courseAId}/report`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(reportRes.body.course.id).toBe(courseAId);
      expect(reportRes.body.summary.totalEnrolled).toBe(3);
      expect(reportRes.body.summary.totalSessionsHeld).toBe(2);
      expect(reportRes.body.summary.certificatesIssuedCount).toBe(1);

      const student1Report = reportRes.body.students.find((s: any) => s.member.id === student1Id);
      expect(student1Report).toBeDefined();
      expect(student1Report.attendance.presentCount).toBe(2);
      expect(student1Report.attendance.attendancePercentage).toBe(100);
      expect(student1Report.grades.averagePercentage).toBe(88);
      expect(student1Report.grades.result).toBe('PASS');
      expect(student1Report.certificate.issued).toBe(true);
      expect(student1Report.certificate.code).toBe(issuedCertCode);
    });
  });
});
