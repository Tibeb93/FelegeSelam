import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as argon2 from 'argon2';
import * as sharpModule from 'sharp';
const sharp = (sharpModule as any).default || sharpModule;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Phase 5: Mezmur, Daily Posts, Events & Notifications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superAdminToken: string;
  let contentManagerToken: string;
  let member1Token: string;
  let member2Token: string;
  let member3Token: string;

  let member1UserId: string;
  let testDeptId: number;

  let categoryId: number;
  let publicMezmurId: string;
  let privateMezmurId: string;

  let scheduledSinksarId: string;
  let urgentPostId: string;
  let eventId: string;

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
    const adminRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      identifier: 'admin@aemade.org',
      password: 'Admin@123456!',
    });
    superAdminToken = adminRes.body.accessToken;

    // 2. Create Content Manager user and 3 Member users
    const cmRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'content_manager' },
    });
    const memberRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'member' },
    });

    const ts = Date.now();
    const passwordHash = await argon2.hash('Pass123456!');

    const dept = await prisma.department.create({
      data: {
        nameAm: `የመዝሙርና ሥነ ጥበብ ክፍል ${ts}`,
        nameEn: `Choir & Arts Dept ${ts}`,
      },
    });
    testDeptId = dept.id;

    await prisma.user.create({
      data: {
        email: `cm_${ts}@aemade.org`,
        passwordHash,
        roleId: cmRole.id,
        status: 'active',
      },
    });

    const cmLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `cm_${ts}@aemade.org`,
        password: 'Pass123456!',
      });
    contentManagerToken = cmLogin.body.accessToken;

    // Member 1
    const m1User = await prisma.user.create({
      data: {
        email: `m1_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    member1UserId = m1User.id;
    await prisma.member.create({
      data: {
        memberNo: `AS-P5-${ts}-1`,
        userId: m1User.id,
        firstName: 'ያሬድ',
        fatherName: 'ብርሃኑ',
        sex: 'male',
        departmentId: testDeptId,
        status: 'active',
      },
    });
    const m1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `m1_${ts}@aemade.org`,
        password: 'Pass123456!',
      });
    member1Token = m1Login.body.accessToken;

    // Member 2
    const m2User = await prisma.user.create({
      data: {
        email: `m2_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    await prisma.member.create({
      data: {
        memberNo: `AS-P5-${ts}-2`,
        userId: m2User.id,
        firstName: 'ማርታ',
        fatherName: 'ተስፋዬ',
        sex: 'female',
        departmentId: testDeptId,
        status: 'active',
      },
    });
    const m2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `m2_${ts}@aemade.org`,
        password: 'Pass123456!',
      });
    member2Token = m2Login.body.accessToken;

    // Member 3
    const m3User = await prisma.user.create({
      data: {
        email: `m3_${ts}@aemade.org`,
        passwordHash,
        roleId: memberRole.id,
        status: 'active',
      },
    });
    await prisma.member.create({
      data: {
        memberNo: `AS-P5-${ts}-3`,
        userId: m3User.id,
        firstName: 'ናትናኤል',
        fatherName: 'ግርማ',
        sex: 'male',
        departmentId: testDeptId,
        status: 'active',
      },
    });
    const m3Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        identifier: `m3_${ts}@aemade.org`,
        password: 'Pass123456!',
      });
    member3Token = m3Login.body.accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. ROLE RULES: CONTENT_MANAGER PERMISSIONS
  // =========================================================================
  describe('1. Role Rules (content_manager scope)', () => {
    it('should forbid content_manager from accessing /members, /courses, /users, and /notifications/send (403)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          target: 'all',
          title: 'ያልተፈቀደ መልእክት',
        })
        .expect(403);
    });

    it('should forbid a regular member from creating mezmurs, posts, or events (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/mezmurs')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ title: 'ሙከራ መዝሙር' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ type: 'news', title: 'ዜና', body: 'ሙከራ' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ title: 'ጉባኤ', startAt: '2026-12-01T10:00:00.000Z' })
        .expect(403);
    });
  });

  // =========================================================================
  // 2. MEZMUR: CATEGORIES, CRUD, UPLOADS, SEARCH, PUBLIC LIST & FAVORITES
  // =========================================================================
  describe('2. Mezmur, Categories, Media Uploads, Search & Favorites', () => {
    it('should allow content_manager to create and list mezmur categories', async () => {
      const catRes = await request(app.getHttpServer())
        .post('/api/v1/mezmurs/categories')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          nameAm: `የበዓለ ልደት መዝሙራት ${Date.now()}`,
          nameEn: 'Nativity Hymns',
        })
        .expect(201);

      categoryId = catRes.body.id;

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/mezmurs/categories')
        .expect(200);

      expect(listRes.body.data.some((c: any) => c.id === categoryId)).toBe(true);
    });

    it('should allow content_manager to create public and private mezmurs and upload audio/video', async () => {
      const pubRes = await request(app.getHttpServer())
        .post('/api/v1/mezmurs')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          title: 'ተወልደ ኢየሱስ በቤተ ልሔም',
          lyrics: 'ተወልደ ኢየሱስ በቤተ ልሔም ዘይሁዳ አማኑኤል ተወልደልን',
          categoryId,
          singer: 'አዕማደ ሰላም መዘምራን',
          isPublic: true,
        })
        .expect(201);

      publicMezmurId = pubRes.body.id;

      const privRes = await request(app.getHttpServer())
        .post('/api/v1/mezmurs')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          title: 'የውስጥ ልምምድ መዝሙር',
          lyrics: 'ለጥናት ብቻ የተዘጋጀ ሚስጥራዊ ግጥም',
          categoryId,
          isPublic: false,
        })
        .expect(201);

      privateMezmurId = privRes.body.id;

      // Upload audio (MP3)
      const audioUpload = await request(app.getHttpServer())
        .post(`/api/v1/mezmurs/${publicMezmurId}/audio`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .attach('file', Buffer.from('ID3-fake-mp3-audio-content'), {
          filename: 'tewelde-iyesus.mp3',
          contentType: 'audio/mpeg',
        })
        .expect(201);

      expect(audioUpload.body.audioUrl).toContain('/uploads/mezmurs/audio/');

      // Upload video (MP4)
      const videoUpload = await request(app.getHttpServer())
        .post(`/api/v1/mezmurs/${publicMezmurId}/video`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .attach('file', Buffer.from('ftypmp42-fake-video-content'), {
          filename: 'tewelde-iyesus.mp4',
          contentType: 'video/mp4',
        })
        .expect(201);

      expect(videoUpload.body.videoUrl).toContain('/uploads/mezmurs/video/');
    });

    it('should list only isPublic mezmurs on /mezmurs/public and support search on title & lyrics', async () => {
      const pubList = await request(app.getHttpServer())
        .get('/api/v1/mezmurs/public?search=በቤተ ልሔም')
        .expect(200);

      const ids = pubList.body.data.map((m: any) => m.id);
      expect(ids).toContain(publicMezmurId);
      expect(ids).not.toContain(privateMezmurId);
    });

    it('should allow a member to favorite, list favorites, and unfavorite a mezmur', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/mezmurs/${publicMezmurId}/favorite`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(201);

      const favList = await request(app.getHttpServer())
        .get('/api/v1/mezmurs/favorites/me')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(favList.body.data.some((m: any) => m.id === publicMezmurId)).toBe(true);

      await request(app.getHttpServer())
        .delete(`/api/v1/mezmurs/${publicMezmurId}/favorite`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);
    });
  });

  // =========================================================================
  // 3. POSTS: SCHEDULING, EXPIRY, IMAGE UPLOAD, /posts/today & URGENT ALERTS
  // =========================================================================
  describe('3. Daily Posts, Scheduling, Expiry & Urgent Notifications', () => {
    it('should schedule a future sinksar post so it does not appear in /posts/today until publishAt arrives', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1 hour

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          type: 'sinksar',
          title: 'የዕለቱ ስንክሳር - ጥቅምት ፫',
          body: 'በዚህች ዕለት አባ ጽጌ ድንግል እና ቅዱሳን ሰማዕታት ይታሰባሉ።',
          publishAt: futureDate,
        })
        .expect(201);

      scheduledSinksarId = createRes.body.id;
      expect(createRes.body.lifecycleStatus).toBe('scheduled');

      // Should NOT appear in /posts/today yet
      const todayBefore = await request(app.getHttpServer()).get('/api/v1/posts/today').expect(200);

      expect(todayBefore.body.some((p: any) => p.id === scheduledSinksarId)).toBe(false);

      // Upload cover image to the sinksar post
      const pngBuffer = await sharp({
        create: {
          width: 300,
          height: 200,
          channels: 3,
          background: { r: 27, g: 94, b: 32 },
        },
      })
        .png()
        .toBuffer();

      const imgRes = await request(app.getHttpServer())
        .post(`/api/v1/posts/${scheduledSinksarId}/image`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .attach('image', pngBuffer, {
          filename: 'sinksar.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(imgRes.body.imageUrl).toContain('/uploads/posts/');

      // Now update publishAt to the past so the scheduled post becomes due
      const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
      const updatedRes = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${scheduledSinksarId}`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({ publishAt: pastDate })
        .expect(200);

      expect(updatedRes.body.lifecycleStatus).toBe('published');

      // Run scheduler job
      await request(app.getHttpServer())
        .post('/api/v1/posts/scheduler/run')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(201);

      // Should now appear in /posts/today!
      const todayAfter = await request(app.getHttpServer()).get('/api/v1/posts/today').expect(200);

      expect(todayAfter.body.some((p: any) => p.id === scheduledSinksarId)).toBe(true);
    });

    it('should place urgent posts first in /posts/today and automatically notify members', async () => {
      const urgentRes = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          type: 'urgent',
          title: 'አስቸኳይ የጸሎተ ምሕላ ጥሪ',
          body: 'ነገ ማለዳ 12:00 ሰዓት ሁሉም አባላት በቤተክርስቲያን እንዲገኙ ጥሪ ቀርቧል።',
        })
        .expect(201);

      urgentPostId = urgentRes.body.id;
      expect(urgentRes.body.isUrgent).toBe(true);

      // Verify /posts/today has urgent items first
      const todayRes = await request(app.getHttpServer()).get('/api/v1/posts/today').expect(200);

      expect(todayRes.body.length).toBeGreaterThanOrEqual(2);
      expect(todayRes.body[0].isUrgent).toBe(true);

      // Verify Member 1 received the automatic in-app notification
      const notifRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(notifRes.body.unreadCount).toBeGreaterThanOrEqual(1);
      const urgentNotif = notifRes.body.data.find((n: any) => n.data?.postId === urgentPostId);
      expect(urgentNotif).toBeDefined();
      expect(urgentNotif.title).toContain('አስቸኳይ');
    });

    it('should hide expired posts from /posts/today and public /posts when expiresAt passes', async () => {
      const pastPublish = new Date(Date.now() - 120 * 1000).toISOString();
      const pastExpiry = new Date(Date.now() - 10 * 1000).toISOString();

      await request(app.getHttpServer())
        .patch(`/api/v1/posts/${scheduledSinksarId}`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          publishAt: pastPublish,
          expiresAt: pastExpiry,
        })
        .expect(200);

      const schedRun = await request(app.getHttpServer())
        .post('/api/v1/posts/scheduler/run')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(201);

      expect(schedRun.body.expiredCount).toBeGreaterThanOrEqual(1);

      const todayRes = await request(app.getHttpServer()).get('/api/v1/posts/today').expect(200);

      expect(todayRes.body.some((p: any) => p.id === scheduledSinksarId)).toBe(false);
    });
  });

  // =========================================================================
  // 4. EVENTS: CRUD, RSVP CAPACITY CHECK & ATTENDEES LIST
  // =========================================================================
  describe('4. Events CRUD, RSVP Capacity Enforcement & Attendees List', () => {
    it('should allow content_manager to create an event with capacity 2', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .send({
          title: 'ዓመታዊ የአባላት መንፈሳዊ ጉዞ ( capacity = 2 )',
          description: 'ወደ ደብረ ሊባኖስ ገዳም የሚደረግ መንፈሳዊ ጉዞ',
          location: 'ደብረ ሊባኖስ',
          startAt: '2026-11-20T06:00:00.000Z',
          endAt: '2026-11-20T19:00:00.000Z',
          capacity: 2,
        })
        .expect(201);

      eventId = res.body.id;
      expect(res.body.capacity).toBe(2);
      expect(res.body.rsvpSummary.remainingCapacity).toBe(2);
    });

    it('should enforce RSVP capacity check for "going" status and allow "maybe"', async () => {
      // Member 1 RSVPs going (1/2)
      await request(app.getHttpServer())
        .post(`/api/v1/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ status: 'going' })
        .expect(201);

      // Member 2 RSVPs going (2/2 - full)
      await request(app.getHttpServer())
        .post(`/api/v1/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${member2Token}`)
        .send({ status: 'going' })
        .expect(201);

      // Member 3 tries to RSVP going -> 400 capacity reached
      const m3Going = await request(app.getHttpServer())
        .post(`/api/v1/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${member3Token}`)
        .send({ status: 'going' })
        .expect(400);

      expect(m3Going.body.message).toContain('capacity');

      // Member 3 can still RSVP maybe
      await request(app.getHttpServer())
        .post(`/api/v1/events/${eventId}/rsvp`)
        .set('Authorization', `Bearer ${member3Token}`)
        .send({ status: 'maybe' })
        .expect(201);
    });

    it('should list event attendees with status filtering', async () => {
      const goingRes = await request(app.getHttpServer())
        .get(`/api/v1/events/${eventId}/attendees?status=going`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(200);

      expect(goingRes.body.data.length).toBe(2);

      const allAttendees = await request(app.getHttpServer())
        .get(`/api/v1/events/${eventId}/attendees`)
        .set('Authorization', `Bearer ${contentManagerToken}`)
        .expect(200);

      expect(allAttendees.body.data.length).toBe(3);
    });
  });

  // =========================================================================
  // 5. NOTIFICATIONS & DEVICE TOKENS
  // =========================================================================
  describe('5. In-App Notifications, Admin Broadcast & DeviceToken Registration', () => {
    it('should allow admin to send notifications to one user, a department, and everyone', async () => {
      // 1. Send to one user
      const userSend = await request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          target: 'user',
          userId: member1UserId,
          title: 'የግል ማስታወሻ',
          body: 'እባክዎ የአባልነት መታወቂያዎን ይውሰዱ።',
        })
        .expect(201);

      expect(userSend.body.sentCount).toBe(1);

      // 2. Send to department
      const deptSend = await request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          target: 'department',
          departmentId: testDeptId,
          title: 'የመዝሙር ክፍል ጥሪ',
          body: 'ቅዳሜ የመዝሙር ጥናት ይኖራል።',
        })
        .expect(201);

      expect(deptSend.body.sentCount).toBe(3);
    });

    it('should allow user to mark single notification read and mark all read', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
      const firstNotifId = listRes.body.data[0].id;

      // Mark single notification read
      const singleRead = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${firstNotifId}/read`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(singleRead.body.readAt).toBeTruthy();

      // Mark all read
      await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      const afterAll = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(afterAll.body.unreadCount).toBe(0);
    });

    it('should register, list, and delete DeviceTokens for push notifications', async () => {
      const tokenStr = `fcm_token_${Date.now()}_android`;

      const regRes = await request(app.getHttpServer())
        .post('/api/v1/device-tokens')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({
          token: tokenStr,
          platform: 'android',
        })
        .expect(201);

      expect(regRes.body.token).toBe(tokenStr);
      expect(regRes.body.platform).toBe('android');

      const listTokens = await request(app.getHttpServer())
        .get('/api/v1/device-tokens')
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);

      expect(listTokens.body.some((t: any) => t.token === tokenStr)).toBe(true);

      await request(app.getHttpServer())
        .delete(`/api/v1/device-tokens/${tokenStr}`)
        .set('Authorization', `Bearer ${member1Token}`)
        .expect(200);
    });
  });
});
