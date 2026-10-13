import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { FormStatus } from '@prisma/client';

describe('Phase 6: Online Forms, Validation, Review & Exports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let member1Token: string;
  let member2Token: string;
  let teacherToken: string;
  let contentManagerToken: string;

  let member1Id: string;
  let member2Id: string;

  let customFormId: string;
  let oneResponseFormId: string;
  let closedFormId: string;
  let expiredFormId: string;

  let member1ResponseId: string;
  let member2ResponseId: string;

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
    const adminRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: 'admin@aemade.org',
      password: 'Admin@123456!',
    });
    superAdminToken = adminRes.body.accessToken;

    // 2. Fetch roles
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'member' },
    });
    const teacherRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'teacher' },
    });
    const cmRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'content_manager' },
    });

    const ts = Date.now();
    const passwordHash = await argon2.hash('Pass123456!');

    // 3. Create Member 1 User & Profile
    const u1 = await prisma.user.create({
      data: {
        email: `form_member1_${ts}@aemade.org`,
        phone: `0981${ts.toString().slice(-6)}`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    const m1 = await prisma.member.create({
      data: {
        memberNo: `AS-FM1-${ts.toString().slice(-4)}`,
        userId: u1.id,
        firstName: 'ዮሐንስ',
        fatherName: 'ተስፋዬ',
        sex: 'male',
        status: 'active',
        phone: u1.phone,
        email: u1.email,
      },
    });
    member1Id = m1.id;

    const resM1 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: u1.email,
      password: 'Pass123456!',
    });
    member1Token = resM1.body.accessToken;

    // 4. Create Member 2 User & Profile
    const u2 = await prisma.user.create({
      data: {
        email: `form_member2_${ts}@aemade.org`,
        phone: `0982${ts.toString().slice(-6)}`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    const m2 = await prisma.member.create({
      data: {
        memberNo: `AS-FM2-${ts.toString().slice(-4)}`,
        userId: u2.id,
        firstName: 'ማርታ',
        fatherName: 'ኃይሉ',
        sex: 'female',
        status: 'active',
        phone: u2.phone,
        email: u2.email,
      },
    });
    member2Id = m2.id;

    const resM2 = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: u2.email,
      password: 'Pass123456!',
    });
    member2Token = resM2.body.accessToken;

    // 5. Create Teacher User
    const uTeacher = await prisma.user.create({
      data: {
        email: `teacher_forms_${ts}@aemade.org`,
        passwordHash,
        roleId: teacherRole.id,
        status: 'active',
      },
    });
    const resT = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: uTeacher.email,
      password: 'Pass123456!',
    });
    teacherToken = resT.body.accessToken;

    // 6. Create Content Manager User
    const uCm = await prisma.user.create({
      data: {
        email: `cm_forms_${ts}@aemade.org`,
        passwordHash,
        roleId: cmRole.id,
        status: 'active',
      },
    });
    const resCm = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: uCm.email,
      password: 'Pass123456!',
    });
    contentManagerToken = resCm.body.accessToken;
  }, 60000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  describe('1. Form Templates & Schema Builder API', () => {
    it('should list all 5 ready form templates with bilingual schema', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/forms/templates')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);

      const keys = res.body.map((t: any) => t.key);
      expect(keys).toContain('membership_renewal');
      expect(keys).toContain('event_registration');
      expect(keys).toContain('volunteer_signup');
      expect(keys).toContain('pledge');
      expect(keys).toContain('satisfaction_survey');

      // Verify each template has rich field schemas
      for (const t of res.body) {
        expect(t.fieldsCount).toBeGreaterThan(3);
        expect(Array.isArray(t.formSchema.fields)).toBe(true);
      }
    });

    it('should instantiate a new form from ready template (volunteer_signup)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/forms/from-template/volunteer_signup')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toContain('የበጎ ፈቃድ አገልግሎት ምዝገባ ቅጽ');
      expect(res.body.status).toBe(FormStatus.open);
    });

    it('should build a custom form with all 8 field types and validation rules', async () => {
      const customFormPayload = {
        title: 'የ2019 ልዩ መንፈሳዊ ጉባኤና የአባላት ዳሰሳ ቅጽ',
        description: 'የአባላት የተሳትፎና የአገልግሎት ዝግጁነት መመዝገቢያ ቅጽ',
        status: FormStatus.open,
        allowOneResponsePerMember: false,
        openUntil: '2026-12-31T23:59:59.000Z',
        formSchema: {
          titleAm: 'የ2019 ልዩ መንፈሳዊ ጉባኤና የአባላት ዳሰሳ ቅጽ',
          titleEn: 'Annual Spiritual Conference & Member Survey',
          fields: [
            {
              name: 'spiritualName',
              type: 'text',
              labelAm: 'የክርስትና ስም',
              labelEn: 'Baptismal Name',
              required: true,
              validation: { minLength: 3, maxLength: 50 },
            },
            {
              name: 'reflection',
              type: 'textarea',
              labelAm: 'የመንፈሳዊ ሕይወት አስተያየት',
              labelEn: 'Spiritual Life Reflection',
              required: true,
              validation: { minLength: 10 },
            },
            {
              name: 'serviceYears',
              type: 'number',
              labelAm: 'በሰንበት ት/ቤት ያገለገሉበት ዓመታት',
              labelEn: 'Years in Ministry',
              required: true,
              validation: { min: 1, max: 40 },
            },
            {
              name: 'registrationDate',
              type: 'date',
              labelAm: 'የምዝገባ ቀን',
              labelEn: 'Registration Date',
              required: true,
              validation: { minDate: '2026-01-01' },
            },
            {
              name: 'departmentChoice',
              type: 'dropdown',
              labelAm: 'የተመረጠ የአገልግሎት ዘርፍ',
              labelEn: 'Chosen Ministry',
              required: true,
              options: [
                { value: 'ትምህርት', labelAm: 'የትምህርት ክፍል' },
                { value: 'መዝሙር', labelAm: 'የመዝሙር ክፍል' },
                { value: 'ልማት', labelAm: 'የልማት ክፍል' },
              ],
            },
            {
              name: 'shiftPreference',
              type: 'radio',
              labelAm: 'የአገልግሎት ሰዓት ምርጫ',
              labelEn: 'Shift Preference',
              required: true,
              options: [
                { value: 'ጧት', labelAm: 'የጧት መርሐ ግብር' },
                { value: 'ከሰዓት', labelAm: 'የከሰዓት መርሐ ግብር' },
              ],
            },
            {
              name: 'availableDays',
              type: 'checkbox',
              labelAm: 'የሚገኙባቸው ቀናት',
              labelEn: 'Available Days',
              required: true,
              options: [
                { value: 'ቅዳሜ', labelAm: 'ቅዳሜ' },
                { value: 'እሑድ', labelAm: 'እሑድ' },
              ],
              validation: { minSelected: 1 },
            },
            {
              name: 'receiptFile',
              type: 'file',
              labelAm: 'የተሳትፎ ክፍያ ደረሰኝ',
              labelEn: 'Participation Receipt Slip',
              required: true,
            },
          ],
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(customFormPayload)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(customFormPayload.title);
      expect(res.body.allowOneResponsePerMember).toBe(false);
      customFormId = res.body.id;
    });

    it('should create a form with allowOneResponsePerMember = true', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'የአባላት ዓመታዊ የእርካታ ዳሰሳ ቅጽ (አንድ ምላሽ ብቻ)',
          description: 'በአንድ አባል አንድ ጊዜ ብቻ የሚሞላ የዳሰሳ ቅጽ',
          status: FormStatus.open,
          allowOneResponsePerMember: true,
          formSchema: {
            fields: [
              {
                name: 'score',
                type: 'number',
                labelAm: 'የእርካታ ነጥብ (ከ 1 እስከ 10)',
                labelEn: 'Satisfaction Score',
                required: true,
                validation: { min: 1, max: 10 },
              },
              {
                name: 'feedback',
                type: 'text',
                labelAm: 'አስተያየት',
                labelEn: 'Feedback',
                required: false,
              },
            ],
          },
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.allowOneResponsePerMember).toBe(true);
      oneResponseFormId = res.body.id;
    });
  });

  describe('2. Role Boundary and Permissions', () => {
    it('should deny member from creating a form (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          title: 'ህገ-ወጥ ቅጽ',
          formSchema: { fields: [] },
        })
        .expect(403);
    });

    it('should deny teacher from creating a form (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'የመምህራን ቅጽ',
          formSchema: { fields: [] },
        })
        .expect(403);
    });

    it('should deny content_manager from creating a form (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          title: 'የይዘት አስተዳዳሪ ቅጽ',
          formSchema: { fields: [] },
        })
        .expect(403);
    });
  });

  describe('3. Public Access, Status & Deadlines', () => {
    it('should list open forms on public endpoint', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/forms/public').expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      const ids = res.body.data.map((f: any) => f.id);
      expect(ids).toContain(customFormId);
      expect(ids).toContain(oneResponseFormId);
    });

    it('should create draft and expired forms to test submission restrictions', async () => {
      // Draft form
      const resDraft = await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'ረቂቅ ቅጽ (Draft)',
          status: FormStatus.draft,
          formSchema: {
            fields: [{ name: 'test', type: 'text', labelAm: 'ፈተና', required: true }],
          },
        })
        .expect(201);
      closedFormId = resDraft.body.id;

      // Expired form (openUntil in past)
      const resExpired = await request(app.getHttpServer())
        .post('/api/v1/forms')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'የጊዜ ገደቡ ያለፈበት ቅጽ (Expired)',
          status: FormStatus.open,
          openUntil: '2020-01-01T00:00:00.000Z',
          formSchema: {
            fields: [{ name: 'test', type: 'text', labelAm: 'ፈተና', required: true }],
          },
        })
        .expect(201);
      expiredFormId = resExpired.body.id;
    });

    it('should reject submission to a draft or closed form (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/${closedFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: { test: 'መልስ' },
        })
        .expect(400);

      expect(res.body.message).toContain('not currently accepting submissions');
    });

    it('should reject submission to an expired form (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/${expiredFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: { test: 'መልስ' },
        })
        .expect(400);

      expect(res.body.message).toContain('deadline expired');
    });
  });

  describe('4. File Field Upload Service', () => {
    it('should upload a valid file attachment and return fileUrl', async () => {
      const sampleBuffer = Buffer.from('የደረሰኝ ናሙና ጽሑፍ ወይም ሰነድ');

      const res = await request(app.getHttpServer())
        .post('/api/v1/forms/upload')
        .attach('file', sampleBuffer, 'bank_receipt.pdf')
        .expect(201);

      expect(res.body.fileUrl).toBeDefined();
      expect(res.body.fileUrl).toContain('/uploads/forms/');
      expect(res.body.originalName).toBe('bank_receipt.pdf');
    });
  });

  describe('5. Schema Validation & Rejections', () => {
    it('should reject submission when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/${customFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: {
            // Missing all required fields
            serviceYears: 3,
          },
        })
        .expect(400);

      expect(res.body.message).toBe('Form validation failed');
      expect(Array.isArray(res.body.errors)).toBe(true);

      const missingFields = res.body.errors.map((e: any) => e.field);
      expect(missingFields).toContain('spiritualName');
      expect(missingFields).toContain('reflection');
      expect(missingFields).toContain('registrationDate');
      expect(missingFields).toContain('departmentChoice');
      expect(missingFields).toContain('shiftPreference');
      expect(missingFields).toContain('availableDays');
      expect(missingFields).toContain('receiptFile');
    });

    it('should reject submission when values violate validation rules (minLength, min, dropdown)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/${customFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: {
            spiritualName: 'ሀ', // too short (< 3)
            reflection: 'አጭር', // too short (< 10)
            serviceYears: 99, // exceeds max 40
            registrationDate: '2026-10-15',
            departmentChoice: 'ያልተፈቀደ ክፍል', // invalid option
            shiftPreference: 'ጧት',
            availableDays: [], // empty array for required checkbox
            receiptFile: '/uploads/forms/receipt.pdf',
          },
        })
        .expect(400);

      expect(res.body.message).toBe('Form validation failed');
      const errFields = res.body.errors.map((e: any) => e.field);
      expect(errFields).toContain('spiritualName');
      expect(errFields).toContain('reflection');
      expect(errFields).toContain('serviceYears');
      expect(errFields).toContain('departmentChoice');
      expect(errFields).toContain('availableDays');
    });
  });

  describe('6. Successful Submission & One-Response Rule', () => {
    it('should successfully submit valid answers to custom form', async () => {
      const validAnswers = {
        spiritualName: 'ኃይለ ሚካኤል',
        reflection: 'በሰንበት ትምህርት ቤቱ መማሬ በመንፈሳዊ ሕይወቴ ትልቅ እገዛ አድርጎልኛል።',
        serviceYears: 5,
        registrationDate: '2026-10-14',
        departmentChoice: 'ትምህርት',
        shiftPreference: 'ጧት',
        availableDays: ['ቅዳሜ', 'እሑድ'],
        receiptFile: '/uploads/forms/receipt_001.pdf',
      };

      const res = await request(app.getHttpServer())
        .post(`/api/v1/forms/${customFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ answers: validAnswers })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.formId).toBe(customFormId);
      expect(res.body.status).toBe('submitted');
      expect(res.body.memberId).toBe(member1Id);
      member1ResponseId = res.body.id;
    });

    it('should enforce one response per member rule: allow first submission and reject duplicate', async () => {
      // First submission by Member 1 -> succeeds
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/forms/${oneResponseFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: {
            score: 9,
            feedback: 'ትምህርቱና ዝማሬው እጅግ ድንቅና የሚያንጽ ነው።',
          },
        })
        .expect(201);

      expect(res1.body.id).toBeDefined();
      expect(res1.body.memberId).toBe(member1Id);

      // Duplicate submission by Member 1 to the same form -> rejected
      const dupRes = await request(app.getHttpServer())
        .post(`/api/v1/forms/${oneResponseFormId}/submit`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          answers: {
            score: 10,
            feedback: 'ሁለተኛ ሙከራ',
          },
        })
        .expect(400);

      expect(dupRes.body.message).toContain('already submitted a response');

      // Member 2 can still submit their first response
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/forms/${oneResponseFormId}/submit`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({
          answers: {
            score: 8,
            feedback: 'መልካም አገልግሎት ነው።',
          },
        })
        .expect(201);

      expect(res2.body.id).toBeDefined();
      expect(res2.body.memberId).toBe(member2Id);
      member2ResponseId = res2.body.id;
    });
  });

  describe('7. Admin Response Review & Notes', () => {
    it('should deny regular member from reviewing a response (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/forms/responses/${member1ResponseId}/review`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          status: 'approved',
          reviewNote: 'የግል ፈቃድ',
        })
        .expect(403);
    });

    it('should allow admin to list responses with member details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/forms/${customFormId}/responses`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].member).toBeDefined();
      expect(res.body.data[0].member.memberNo).toBeDefined();
    });

    it('should allow admin to approve response with review note', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/forms/responses/${member1ResponseId}/review`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'approved',
          reviewNote: 'የቀረበው መረጃና የደረሰኝ ማስረጃ ተረጋግጦ ጸድቋል።',
        })
        .expect(200);

      expect(res.body.id).toBe(member1ResponseId);
      expect(res.body.status).toBe('approved');
      expect(res.body.reviewNote).toBe('የቀረበው መረጃና የደረሰኝ ማስረጃ ተረጋግጦ ጸድቋል።');
    });

    it('should allow admin to reject response with review note', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/forms/responses/${member2ResponseId}/review`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'rejected',
          reviewNote: 'ተጨማሪ ማብራሪያና የንስሐ አባት ደብዳቤ ያስፈልጋል።',
        })
        .expect(200);

      expect(res.body.id).toBe(member2ResponseId);
      expect(res.body.status).toBe('rejected');
      expect(res.body.reviewNote).toBe('ተጨማሪ ማብራሪያና የንስሐ አባት ደብዳቤ ያስፈልጋል።');
    });
  });

  describe('8. Exports to Excel and PDF', () => {
    it('should export all form responses to styled Excel (.xlsx)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/forms/${customFormId}/export?format=xlsx`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('should export all form responses to Puppeteer PDF (.pdf)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/forms/${customFormId}/export?format=pdf`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
    }, 30000);
  });
});
