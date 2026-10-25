import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Auth & RBAC Module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let memberToken: string;
  let memberUserId: string;

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

    // Clean up test users from any previous test runs
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test_reg_member@aemade.org',
            'test_lockout@aemade.org',
            'test_refresh_rot@aemade.org',
            'test_created_user@aemade.org',
          ],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test_reg_member@aemade.org',
            'test_lockout@aemade.org',
            'test_refresh_rot@aemade.org',
            'test_created_user@aemade.org',
          ],
        },
      },
    });
    await app.close();
  });

  // -------------------------------------------------------------
  // 1. REGISTER
  // -------------------------------------------------------------
  describe('POST /api/v1/auth/register', () => {
    it('should register a new member with pending status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test_reg_member@aemade.org',
          password: 'Password@123',
          phone: '+251911999888',
          firstName: 'ዮናታን',
          fatherName: 'አበበ',
          grandfatherName: 'ተሾመ',
          sex: 'male',
        })
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test_reg_member@aemade.org');
      expect(res.body.user.status).toBe('pending');
      expect(res.body.member.memberNo).toBeDefined();

      memberUserId = res.body.user.id;

      // Activate user so they can log in for subsequent tests
      await prisma.user.update({
        where: { id: memberUserId },
        data: { status: 'active' },
      });
    });

    it('should reject registration if email is already taken', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test_reg_member@aemade.org',
          password: 'Password@123',
          firstName: 'ሌላ',
          fatherName: 'ሰው',
          sex: 'female',
        })
        .expect(409);
    });
  });

  // -------------------------------------------------------------
  // 2. MEMBER LOGIN (POST /api/v1/auth/login)
  // -------------------------------------------------------------
  describe('POST /api/v1/auth/login (Member Portal Entry)', () => {
    it('should reject staff role attempting to use member login (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@aemade.org',
          password: 'Admin@123456!',
        })
        .expect(403);

      expect(res.body.message).toContain('ይህ መግቢያ ለአባላት ብቻ ነው');
    });

    it('should log in registered member and return member role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test_reg_member@aemade.org',
          password: 'Password@123',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('member');
      memberToken = res.body.accessToken;
    });

    it('should get current user profile on GET /auth/me with bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.email).toBe('test_reg_member@aemade.org');
      expect(res.body.role.name).toBe('member');
      expect(res.body.member).toBeDefined();
    });

    it('should fail GET /auth/me without bearer token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });

  // -------------------------------------------------------------
  // 2b. ADMIN LOGIN (POST /api/v1/auth/admin/login)
  // -------------------------------------------------------------
  describe('POST /api/v1/auth/admin/login (Staff Entry)', () => {
    it('should reject member credentials on admin login with generic 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          identifier: 'test_reg_member@aemade.org',
          password: 'Password@123',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should log in super_admin successfully and provide redirectPath', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          identifier: 'admin@aemade.org',
          password: 'Admin@123456!',
        })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.role).toBe('super_admin');
      expect(res.body.redirectPath).toBe('/admin');
      superAdminToken = res.body.accessToken;
    });

    it('should reject invalid password for admin with generic 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          identifier: 'admin@aemade.org',
          password: 'WrongAdminPassword123!',
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  // -------------------------------------------------------------
  // 3. REFRESH TOKEN ROTATION
  // -------------------------------------------------------------
  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate refresh token and revoke the previous one', async () => {
      // 1. Login to get fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test_reg_member@aemade.org',
          password: 'Password@123',
        })
        .expect(200);

      const oldRefreshToken = loginRes.body.refreshToken;

      // 2. Call refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
      expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);

      // 3. Trying to reuse old refresh token must be rejected (revoked)
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    });
  });

  // -------------------------------------------------------------
  // 4. ACCOUNT LOCKOUT AFTER 5 FAILED LOGINS
  // -------------------------------------------------------------
  describe('Account Lockout (5 failed attempts)', () => {
    it('should lock user out for 15 minutes after 5 consecutive bad passwords', async () => {
      // Register a dedicated user for lockout test
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test_lockout@aemade.org',
          password: 'Password@123',
          firstName: 'ተፈታኝ',
          fatherName: 'ሰው',
          sex: 'male',
        })
        .expect(201);

      // 4 failed attempts -> 401
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            identifier: 'test_lockout@aemade.org',
            password: 'WrongPassword!',
          })
          .expect(401);
      }

      // 5th failed attempt -> 403 (Locked out)
      const fifthAttempt = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test_lockout@aemade.org',
          password: 'WrongPassword!',
        })
        .expect(403);

      expect(fifthAttempt.body.message).toContain('locked');

      // 6th attempt with CORRECT password still gets 403 lockout
      const attemptWhileLocked = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test_lockout@aemade.org',
          password: 'Password@123',
        })
        .expect(403);

      expect(attemptWhileLocked.body.message).toContain('locked');
    });
  });

  // -------------------------------------------------------------
  // 5. RBAC & ROLE DENIAL (Member denied 403 on Super Admin route)
  // -------------------------------------------------------------
  describe('RBAC & Role Denial', () => {
    it('should deny member (403 Forbidden) on super_admin GET /users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(res.body.message).toContain('Access denied');
    });

    it('should allow super_admin on GET /users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 6. USERS MANAGEMENT (CRUD & Role Assignment)
  // -------------------------------------------------------------
  describe('Users Management Module (super_admin only)', () => {
    let newUserId: string;

    it('should allow super_admin to create a new user with role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'test_created_user@aemade.org',
          password: 'TestPassword@123',
          roleId: 2, // admin
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe('test_created_user@aemade.org');
      expect(res.body.role.id).toBe(2);
      newUserId = res.body.id;
    });

    it('should allow super_admin to assign a new role to the user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${newUserId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ roleId: 3 }) // teacher
        .expect(200);

      expect(res.body.role.id).toBe(3);
    });

    it('should allow super_admin to suspend user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${newUserId}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.status).toBe('suspended');
    });
  });

  // -------------------------------------------------------------
  // 7. SIGN OUT EVERYWHERE (POST /auth/admin/logout-all)
  // -------------------------------------------------------------
  describe('POST /api/v1/auth/admin/logout-all', () => {
    it('should revoke all refresh tokens and write LOGOUT_ALL_DEVICES audit log', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/logout-all')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.message).toContain('ወጥተዋል');

      const audit = await prisma.auditLog.findFirst({
        where: { action: 'LOGOUT_ALL_DEVICES' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 8. AUDIT LOG WRITES VERIFICATION
  // -------------------------------------------------------------
  describe('Audit Log Writes Verification', () => {
    it('should have written audit logs for login, admin login, and user events', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'LOGIN_SUCCESS',
              'ADMIN_LOGIN_SUCCESS',
              'ADMIN_LOGIN_FAILURE',
              'POST_USERS',
              'REGISTER_MEMBER',
              'LOGOUT_ALL_DEVICES',
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs.length).toBeGreaterThan(0);
      const actions = logs.map((l) => l.action);
      expect(actions).toContain('LOGIN_SUCCESS');
      expect(actions).toContain('ADMIN_LOGIN_SUCCESS');
      expect(actions).toContain('ADMIN_LOGIN_FAILURE');
      expect(actions).toContain('REGISTER_MEMBER');
    });
  });
});
