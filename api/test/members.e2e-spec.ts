import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as ExcelJS from 'exceljs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Members Module & Exports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let memberToken: string;
  let createdMemberId: string;
  let createdMemberNo: string;

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
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // 1. Login as Super Admin
    const adminRes = await request(app.getHttpServer()).post('/api/v1/auth/admin/login').send({
      identifier: 'admin@aemade.org',
      password: 'Admin@123456!',
    });
    superAdminToken = adminRes.body.accessToken;

    // 2. Register and login as a normal member user for role tests
    const uniqueEmail = `test_member_${Date.now()}@aemade.org`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        password: 'UserPass123!',
        firstName: 'መደበኛ',
        fatherName: 'አባል',
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        sex: 'male',
      });

    // Make this user active member
    await prisma.user.update({
      where: { email: uniqueEmail },
      data: { status: 'active' },
    });

    const memberLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: uniqueEmail,
      password: 'UserPass123!',
    });
    memberToken = memberLoginRes.body.accessToken;
  });

  afterAll(async () => {
    if (createdMemberId) {
      await prisma.member.deleteMany({
        where: { id: createdMemberId },
      });
    }
    await app.close();
  });

  describe('1. RBAC & Security', () => {
    it('should reject unauthenticated request to /api/v1/members', async () => {
      await request(app.getHttpServer()).get('/api/v1/members').expect(401);
    });

    it('should forbid member role from creating a member (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/members')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          firstName: 'ቴዎድሮስ',
          fatherName: 'ካሳ',
          sex: 'male',
        })
        .expect(403);
    });
  });

  describe('2. Member CRUD & Status Workflow', () => {
    it('should create a member with auto-generated member number AS-YYYY-0001 (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/members')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          firstName: 'ቴዎድሮስ',
          fatherName: 'ካሳ',
          grandfatherName: 'ኃይሉ',
          baptismalName: 'ወልደ ጊዮርጊስ',
          sex: 'male',
          phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`,
          email: `tewodros_${Date.now()}@example.com`,
          status: 'pending',
          parish: 'ደብረ ሰላም መድኃኔዓለም',
          confessionFather: 'መልአከ ሰላም አስራት',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('memberNo');
      expect(res.body.memberNo).toMatch(/^AS-\d{4}-\d{4}$/);
      expect(res.body.status).toBe('pending');
      expect(res.body.firstName).toBe('ቴዎድሮስ');

      createdMemberId = res.body.id;
      createdMemberNo = res.body.memberNo;
    });

    it('should list members with pagination and search filter', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members?page=1&limit=10&search=ቴዎድሮስ')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((m: any) => m.id === createdMemberId)).toBe(true);
    });

    it('should fetch single member by ID (200)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdMemberId);
      expect(res.body.memberNo).toBe(createdMemberNo);
    });

    it('should update member info (200)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          occupation: 'Lecturer',
          educationLevel: 'Masters',
        })
        .expect(200);

      expect(res.body.occupation).toBe('Lecturer');
      expect(res.body.educationLevel).toBe('Masters');
    });

    it('should approve pending member to active (200)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/members/${createdMemberId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.status).toBe('active');
    });

    it('should reject re-approval of an already active member (400)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/members/${createdMemberId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  describe('3. Photo Upload with Sharp Resizing', () => {
    it('should reject invalid photo format (400)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/members/${createdMemberId}/photo`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('photo', Buffer.from('not an image text content'), 'file.txt')
        .expect(400);
    });

    it('should upload, resize and optimize photo to webp (200/201)', async () => {
      // Create a 10x10 dummy PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/members/${createdMemberId}/photo`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('photo', pngBuffer, 'avatar.png')
        .expect(201);

      expect(res.body).toHaveProperty('photoUrl');
      expect(res.body.photoUrl).toMatch(/^\/uploads\/photos\/.+\.webp$/);
    });
  });

  describe('4. Bulk Import from Excel (.xlsx)', () => {
    it('should download the Excel import template with correct headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members/template')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('should import members and return report with created and error rows', async () => {
      // Build a test Excel workbook
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Members');

      sheet.addRow(['Title banner']);
      sheet.addRow(['FirstName', 'FatherName', 'GrandfatherName', 'BaptismalName', 'Sex']);

      // Valid row 1
      sheet.addRow([
        'በርናባስ',
        'ተስፋዬ',
        'ዘውዱ',
        'ገብረ መስቀል',
        'male',
        '1995-04-10',
        `+251988${Math.floor(100000 + Math.random() * 900000)}`,
      ]);
      // Invalid row 2 (missing FatherName and invalid sex)
      sheet.addRow(['አልማዝ', '', '', '', 'unknown_sex']);

      const excelBuffer = await workbook.xlsx.writeBuffer();

      const res = await request(app.getHttpServer())
        .post('/api/v1/members/import')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('file', Buffer.from(excelBuffer), 'bulk_members.xlsx')
        .expect(201);

      expect(res.body).toHaveProperty('total', 2);
      expect(res.body).toHaveProperty('created', 1);
      expect(res.body).toHaveProperty('skipped', 1);
      expect(res.body.errorsCount).toBe(1);
      expect(res.body.errors[0].row).toBe(4);
      expect(res.body.errors[0].reasons.length).toBeGreaterThan(0);
    });
  });

  describe('5. Exports (PDF, Word, Excel, ID Card, Letters)', () => {
    jest.setTimeout(45000); // Puppeteer rendering can take a few seconds

    it('should export single member as Excel (XLSX)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}/export?format=xlsx`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('should export single member as Word (DOCX)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}/export?format=docx`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.docx');
    });

    it('should export single member as PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}/export?format=pdf`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should export members roster list as Excel (XLSX)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members/export?format=xlsx')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('should export members roster list as Word (DOCX)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members/export?format=docx')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.docx');
    });

    it('should export members roster list as PDF', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/members/export?format=pdf')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should generate member ID Card as PDF with QR code', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}/id-card`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should generate membership confirmation letter as PDF', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/members/${createdMemberId}/letter`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          type: 'confirmation',
          recipient: 'ለኢትዮጵያ ንግድ ባንክ',
          purpose: 'የብድር አገልግሎት ለማግኘት',
        })
        .expect(201);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });

    it('should generate recommendation letter as PDF', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/members/${createdMemberId}/letter`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          type: 'recommendation',
          recipient: 'ለቅዱስ ጳውሎስ መንፈሳዊ ኮሌጅ',
          purpose: 'የነፃ ትምህርት ዕድል ለማግኘት',
        })
        .expect(201);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');
    });
  });

  describe('6. Soft Delete', () => {
    it('should soft delete member and exclude them from normal queries', async () => {
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);

      // Verify findOne returns 404
      await request(app.getHttpServer())
        .get(`/api/v1/members/${createdMemberId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });
});
