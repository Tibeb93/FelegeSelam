import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Phase 7: Reports, Contributions, Settings & Backup (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let adminToken: string;
  let memberToken: string;
  let memberId: string;

  let createdContributionId: string;
  let createdReceiptNo: string;
  let createdBackupFilename: string;

  beforeAll(async () => {
    jest.setTimeout(60000);

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

    // 1. Super Admin login
    const superAdminRes = await request(app.getHttpServer()).post('/api/v1/auth/admin/login').send({
      identifier: 'admin@aemade.org',
      password: 'Admin@123456!',
    });
    superAdminToken = superAdminRes.body.accessToken;

    // 2. Fetch roles
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'admin' },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'member' },
    });

    const ts = Date.now();
    const passwordHash = await argon2.hash('Pass123456!');

    // 3. Create Admin user
    const adminUser = await prisma.user.create({
      data: {
        email: `secretary_admin_${ts}@aemade.org`,
        passwordHash,
        roleId: adminRole.id,
        status: 'active',
      },
    });
    const resAdm = await request(app.getHttpServer()).post('/api/v1/auth/admin/login').send({
      identifier: adminUser.email,
      password: 'Pass123456!',
    });
    adminToken = resAdm.body.accessToken;

    // 4. Create Member user & profile
    const memberUser = await prisma.user.create({
      data: {
        email: `member_reports_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    const memberProfile = await prisma.member.create({
      data: {
        memberNo: `AS-REP-${ts.toString().slice(-4)}`,
        userId: memberUser.id,
        firstName: 'ኤልያስ',
        fatherName: 'በርሄ',
        sex: 'male',
        status: 'active',
        dateOfBirth: new Date('1998-05-12'),
      },
    });
    memberId = memberProfile.id;

    const resMem = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: memberUser.email,
      password: 'Pass123456!',
    });
    memberToken = resMem.body.accessToken;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  // ===========================================================================
  // 1. EXECUTIVE DASHBOARD REPORTS (GET /reports/dashboard)
  // ===========================================================================
  describe('1. Executive Dashboard (GET /reports/dashboard)', () => {
    it('should deny non-admin member from viewing dashboard (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should return executive dashboard metrics matching seeded demo data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const data = res.body;

      // Summary counts
      expect(data.summary).toBeDefined();
      expect(data.summary.totalMembers).toBeGreaterThanOrEqual(30);
      expect(data.summary.newMembers).toBeGreaterThanOrEqual(1);
      expect(data.summary.activePosts).toBeGreaterThanOrEqual(5);
      expect(data.summary.openForms).toBeGreaterThanOrEqual(2);
      expect(data.summary.upcomingEventsCount).toBeGreaterThanOrEqual(1);

      // Members per month (12 months)
      expect(Array.isArray(data.membersPerMonth)).toBe(true);
      expect(data.membersPerMonth.length).toBe(12);
      expect(data.membersPerMonth[11]).toHaveProperty('month');
      expect(data.membersPerMonth[11]).toHaveProperty('labelAm');
      expect(data.membersPerMonth[11]).toHaveProperty('count');

      // Members by department
      expect(Array.isArray(data.membersByDepartment)).toBe(true);
      expect(data.membersByDepartment.length).toBeGreaterThanOrEqual(5);
      const totalInDepts = data.membersByDepartment.reduce(
        (sum: number, d: any) => sum + d.count,
        0,
      );
      expect(totalInDepts).toBeGreaterThanOrEqual(30);

      // Members by age group
      expect(data.membersByAgeGroup).toBeDefined();
      const ageSum =
        data.membersByAgeGroup.under18 +
        data.membersByAgeGroup.age18To25 +
        data.membersByAgeGroup.age26To35 +
        data.membersByAgeGroup.age36To50 +
        data.membersByAgeGroup.above50 +
        data.membersByAgeGroup.unknown;
      expect(ageSum).toBeGreaterThanOrEqual(30);

      // Attendance rate per course
      expect(Array.isArray(data.attendanceRatePerCourse)).toBe(true);
      expect(data.attendanceRatePerCourse.length).toBeGreaterThanOrEqual(3);

      // Upcoming events
      expect(Array.isArray(data.upcomingEvents)).toBe(true);
      expect(data.upcomingEvents.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // 2. CONTRIBUTIONS: CRUD, AUTO RECEIPT, SUMMARY, PDF & EXCEL
  // ===========================================================================
  describe('2. Contributions Module', () => {
    it('should create a new contribution with an auto-generated receipt number', async () => {
      const payload = {
        memberId,
        amount: 1500,
        type: 'donation',
        paymentMethod: 'telebirr',
        period: '2026-10',
        notes: 'ለመንፈሳዊ ጉዞ ማስተባበሪያ የተደረገ ድጋፍ',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/contributions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(Number(res.body.amount)).toBe(1500);
      expect(res.body.receiptNo).toMatch(/^REC-2026-\d{4}$/);
      expect(res.body.member.memberNo).toBeDefined();

      createdContributionId = res.body.id;
      createdReceiptNo = res.body.receiptNo;
    });

    it('should list contributions with pagination and total amount', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contributions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(20);
      expect(res.body.meta.totalAmount).toBeGreaterThanOrEqual(10000);
    });

    it('should return school-wide monthly contributions summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contributions/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.totalAmount).toBeGreaterThanOrEqual(10000);
      expect(res.body.totalCount).toBeGreaterThanOrEqual(20);
      expect(Array.isArray(res.body.byType)).toBe(true);
      expect(Array.isArray(res.body.byMonth)).toBe(true);
      expect(res.body.byMonth.length).toBe(12);
    });

    it('should return member-specific contribution summary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contributions/members/${memberId}/summary`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.member.id).toBe(memberId);
      expect(res.body.totalAmount).toBe(1500);
      expect(res.body.totalCount).toBe(1);
    });

    it('should download official branded Receipt Voucher PDF with QR code', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/contributions/${createdContributionId}/receipt`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain(createdReceiptNo);
    }, 30000);

    it('should export contributions to styled Excel (.xlsx)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contributions/export?format=xlsx')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  // ===========================================================================
  // 3. SETTINGS: PUBLIC BRANDING & ADMIN CONFIGURATION
  // ===========================================================================
  describe('3. Settings Module', () => {
    it('should allow unauthenticated public access to public settings (GET /settings/public)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/settings/public').expect(200);

      expect(res.body.schoolProfile).toBeDefined();
      expect(res.body.schoolProfile.nameAm).toBe('አዕማደ ሰላም ሰንበት ትምህርት ቤት');
      expect(res.body.schoolProfile.nameEn).toBe('Aemade Selam Sunday School');
      expect(res.body.contactDetails).toBeDefined();
      expect(res.body.localization.defaultLanguage).toBe('am');
    });

    it('should deny member from updating settings (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/settings/school_profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          nameAm: 'የተለወጠ ስም',
        })
        .expect(403);
    });

    it('should allow admin to update school settings', async () => {
      const updatedProfile = {
        nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት (ተሻሽሏል)',
        nameEn: 'Aemade Selam Sunday School',
        mottoAm: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ',
        mottoEn: 'Firm in Faith, Shining in Good Deeds',
      };

      const res = await request(app.getHttpServer())
        .put('/api/v1/settings/school_profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedProfile)
        .expect(200);

      expect(res.body.settingKey).toBe('school_profile');

      // Verify reflected on public endpoint
      const pubRes = await request(app.getHttpServer()).get('/api/v1/settings/public').expect(200);

      expect(pubRes.body.schoolProfile.nameAm).toBe('አዕማደ ሰላም ሰንበት ትምህርት ቤት (ተሻሽሏል)');
    });
  });

  // ===========================================================================
  // 4. AUDIT LOGS: SUPER_ADMIN RESTRICTED & EXCEL EXPORT
  // ===========================================================================
  describe('4. Audit Logs (super_admin only)', () => {
    it('should deny regular admin and member from viewing audit logs (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should allow super_admin to list audit logs with filters and user relations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta.total).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('action');
      expect(res.body.data[0]).toHaveProperty('entity');
    });

    it('should export audit trail to Excel (.xlsx) for super_admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/audit-logs/export?format=xlsx')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  // ===========================================================================
  // 5. BACKUPS: TRIGGER, 30-FILE RETENTION, LIST & DOWNLOAD
  // ===========================================================================
  describe('5. Database Backups (POST /admin/backup)', () => {
    it('should deny regular admin and member from running backups (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/backup')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/admin/backup')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should create an immediate database backup into /backups directory', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/backup')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      expect(res.body.filename).toBeDefined();
      expect(res.body.filename).toMatch(/^backup-aemade-selam-.*\.sql$/);
      expect(res.body.sizeBytes).toBeGreaterThan(100);
      expect(res.body.sizeFormatted).toBeDefined();

      createdBackupFilename = res.body.filename;

      // Verify the backup file exists on disk
      const backupFilePath = path.resolve(process.cwd(), 'backups', createdBackupFilename);
      expect(fs.existsSync(backupFilePath)).toBe(true);

      const fileContent = fs.readFileSync(backupFilePath, 'utf8');
      expect(fileContent).toContain('Aemade Selam Sunday School Database Dump');
    }, 30000);

    it('should list all available backup files', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/backups')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = res.body.find((b: any) => b.filename === createdBackupFilename);
      expect(found).toBeDefined();
    });

    it('should download the database backup file', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/backups/${createdBackupFilename}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/sql');
      expect(res.headers['content-disposition']).toContain(createdBackupFilename);
    });
  });
});
