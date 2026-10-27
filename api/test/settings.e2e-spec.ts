import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Site Settings (Super Admin Control) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let memberToken: string;
  let memberUserId: string;

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

    // 1. Super Admin login
    const superAdminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        identifier: 'admin@aemade.org',
        password: 'Admin@123456!',
      });
    superAdminToken = superAdminLogin.body.accessToken;

    // 2. Create Member user
    const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: 'member' } });
    const passwordHash = await argon2.hash('MemberPass@123');

    const memberUser = await prisma.user.create({
      data: {
        email: `member_settings_${ts}@aemade.org`,
        phone: `+2519119${ts.toString().slice(-5)}`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    memberUserId = memberUser.id;

    const memberLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: memberUser.email,
      password: 'MemberPass@123',
    });
    memberToken = memberLogin.body.accessToken;
  });

  afterAll(async () => {
    if (memberUserId) {
      await prisma.user.delete({ where: { id: memberUserId } }).catch(() => {});
    }
  });

  describe('1. Public Settings Access', () => {
    it('should retrieve public settings without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/settings/public').expect(200);

      expect(res.body).toHaveProperty('siteIdentity');
      expect(res.body).toHaveProperty('appearance');
      expect(res.body).toHaveProperty('homeContent');
      expect(res.body).toHaveProperty('aboutContact');
      expect(res.body).toHaveProperty('systemConfig');
      expect(res.body.siteIdentity).toHaveProperty('nameAm');
    });

    it('should retrieve public calendar data without authentication', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/settings/calendar').expect(200);

      expect(res.body).toHaveProperty('fastingSeasons');
      expect(res.body).toHaveProperty('majorFeasts');
    });
  });

  describe('2. Permission Control (site:write required)', () => {
    it('should reject unauthenticated setting modification (401)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/settings/site_identity')
        .send({ settingValue: { nameAm: 'Unauth' } })
        .expect(401);
    });

    it('should forbid member from accessing all settings list (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should forbid member from updating site settings (403)', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/settings/site_identity')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ settingValue: { nameAm: 'Hacked Name' } })
        .expect(403);
    });

    it('should forbid member from viewing danger zone stats (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/settings/danger/stats')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('3. Super Admin CRUD, Versioning & Instant Cache Invalidation', () => {
    let originalNameAm: string;
    let createdVersionId: string;

    it('should update site identity as super admin and record previous version', async () => {
      const current = await request(app.getHttpServer()).get('/api/v1/settings/public').expect(200);
      originalNameAm = current.body.siteIdentity.nameAm;

      const newNameAm = `አዕማደ ሰላም ታላቅ ሰንበት ት/ቤት ${ts}`;
      const newTaglineAm = `በእምነት እና በፍቅር ${ts}`;

      const updateRes = await request(app.getHttpServer())
        .put('/api/v1/settings/site_identity')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          settingValue: {
            ...current.body.siteIdentity,
            nameAm: newNameAm,
            taglineAm: newTaglineAm,
          },
          changeReason: 'E2E test name change',
        })
        .expect(200);

      expect(updateRes.body.settingValue.nameAm).toBe(newNameAm);

      // Verify immediate reflection on public endpoint without redeploy/cache staleness
      const publicRes = await request(app.getHttpServer())
        .get('/api/v1/settings/public')
        .expect(200);

      expect(publicRes.body.siteIdentity.nameAm).toBe(newNameAm);
      expect(publicRes.body.siteIdentity.taglineAm).toBe(newTaglineAm);
    });

    it('should find recorded version in version history', async () => {
      const versionsRes = await request(app.getHttpServer())
        .get('/api/v1/settings/versions/site_identity')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(versionsRes.body)).toBe(true);
      expect(versionsRes.body.length).toBeGreaterThan(0);
      createdVersionId = versionsRes.body[0].id;
      expect(versionsRes.body[0].settingKey).toBe('site_identity');
    });

    it('should restore previous version successfully', async () => {
      expect(createdVersionId).toBeDefined();

      const restoreRes = await request(app.getHttpServer())
        .post(`/api/v1/settings/restore/site_identity/${createdVersionId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      expect(restoreRes.body.settingValue.nameAm).toBe(originalNameAm);

      // Verify public settings reflects restored name immediately
      const publicRes = await request(app.getHttpServer())
        .get('/api/v1/settings/public')
        .expect(200);

      expect(publicRes.body.siteIdentity.nameAm).toBe(originalNameAm);
    });

    it('should reset setting to system default', async () => {
      const resetRes = await request(app.getHttpServer())
        .post('/api/v1/settings/reset/site_identity')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      expect(resetRes.body.settingValue).toHaveProperty('nameAm', 'አዕማደ ሰላም ሰንበት ትምህርት ቤት');
    });
  });

  describe('4. Branding Asset Uploads', () => {
    it('should reject invalid file types for logo (e.g. text file)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/settings/upload-branding?type=logo')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('file', Buffer.from('hello invalid text'), 'bad.txt')
        .expect(400);
    });

    it('should successfully upload and process valid PNG logo', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/settings/upload-branding?type=logo')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .attach('file', pngBuffer, 'test-logo.png')
        .expect(201);

      expect(res.body).toHaveProperty('fileUrl');
      expect(res.body.fileUrl).toContain('/uploads/branding/');
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Roles and Permissions Matrix', () => {
    it('should get roles matrix and update permissions safely', async () => {
      const matrixRes = await request(app.getHttpServer())
        .get('/api/v1/settings/roles-matrix')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(matrixRes.body).toHaveProperty('modules');
      expect(matrixRes.body).toHaveProperty('roles');

      const adminRole = matrixRes.body.roles.find((r: any) => r.name === 'admin');
      expect(adminRole).toBeDefined();

      // Grant site:write to admin role
      const updatedRoles = await request(app.getHttpServer())
        .put('/api/v1/settings/roles-matrix')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          matrix: [
            {
              roleId: adminRole.id,
              permissions: [...adminRole.permissions, 'site:write'],
            },
          ],
        })
        .expect(200);

      expect(Array.isArray(updatedRoles.body)).toBe(true);
    });
  });

  describe('6. Danger Zone Security & Typed Confirmation', () => {
    it('should reject danger actions with invalid confirmation string (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/settings/danger/restore-members')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmation: 'restore' }) // lowercase rejected
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/settings/danger/purge-audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmation: 'wrong' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/v1/settings/danger/backup')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmation: 'backup' })
        .expect(400);
    });

    it('should execute restore members when exact RESTORE confirmation provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/settings/danger/restore-members')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmation: 'RESTORE' })
        .expect(201);

      expect(res.body).toHaveProperty('restoredCount');
    });

    it('should generate system backup when exact BACKUP confirmation provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/settings/danger/backup')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmation: 'BACKUP' })
        .expect(201);

      expect(res.body).toHaveProperty('metadata');
      expect(res.body).toHaveProperty('data');
    });
  });
});
