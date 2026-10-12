import { PrismaClient, Sex, MemberStatus, CourseStatus, MediaType, EnrollmentStatus, AttendanceStatus, PostType, EventRsvpStatus, FormStatus, FormResponseStatus, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const isDemo = process.argv.includes('--demo');

async function main() {
  console.log('--- Starting Aemade Selam Database Seed ---');
  console.log(`Demo data mode: ${isDemo ? 'ENABLED (--demo)' : 'DISABLED (Core only)'}`);

  // ------------------------------------------------------------------
  // 1. ROLES & PERMISSIONS (5 roles)
  // ------------------------------------------------------------------
  console.log('Seeding roles...');
  const rolesData = [
    {
      name: 'super_admin',
      permissions: ['*'],
    },
    {
      name: 'admin',
      permissions: [
        'members:read',
        'members:create',
        'members:update',
        'departments:read',
        'courses:read',
        'courses:write',
        'attendance:read',
        'attendance:write',
        'contributions:read',
        'contributions:write',
        'posts:read',
        'posts:write',
        'events:read',
        'events:write',
        'forms:read',
        'forms:write',
        'reports:read',
      ],
    },
    {
      name: 'teacher',
      permissions: [
        'courses:read',
        'courses:update',
        'lessons:read',
        'lessons:write',
        'attendance:read',
        'attendance:write',
        'grades:read',
        'grades:write',
        'members:read',
      ],
    },
    {
      name: 'content_manager',
      permissions: [
        'posts:read',
        'posts:write',
        'mezmur:read',
        'mezmur:write',
        'events:read',
        'events:write',
      ],
    },
    {
      name: 'member',
      permissions: [
        'profile:read',
        'profile:update',
        'courses:read',
        'lessons:read',
        'grades:read',
        'mezmur:read',
        'favorites:read',
        'favorites:write',
        'events:read',
        'rsvp:write',
        'forms:read',
        'forms:submit',
        'contributions:read',
      ],
    },
  ];

  const roleMap = new Map<string, number>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: { name: r.name, permissions: r.permissions },
    });
    roleMap.set(role.name, role.id);
  }
  console.log(`✓ 5 roles seeded/verified`);

  // ------------------------------------------------------------------
  // 2. DEPARTMENTS (5 departments with Amharic names)
  // ------------------------------------------------------------------
  console.log('Seeding departments...');
  const departmentsData = [
    {
      nameAm: 'መዝሙር ክፍል',
      nameEn: 'Choir & Hymnology Department',
      description: 'የያሬዳዊ ዜማና ቅዱሳት መዝሙራት ትምህርትና አገልግሎት ማስተባበሪያ ክፍል',
    },
    {
      nameAm: 'ትምህርት ክፍል',
      nameEn: 'Education Department',
      description: 'የነገረ መለኮት፣ የመጽሐፍ ቅዱስና የቤተ ክርስቲያን ሥርዓት ትምህርቶች ክፍል',
    },
    {
      nameAm: 'ማኅበራዊ አገልግሎት ክፍል',
      nameEn: 'Social Service Department',
      description: 'የበጎ አድራጎት፣ የልማትና የእርስ በእርስ መረዳዳት አገልግሎት ክፍል',
    },
    {
      nameAm: 'ህፃናት ክፍል',
      nameEn: 'Children Ministry Department',
      description: 'የህፃናት መንፈሳዊ አስተዳደግ፣ ትምህርትና መርሐ ግብራት ክፍል',
    },
    {
      nameAm: 'ወጣቶች ክፍል',
      nameEn: 'Youth Fellowship Department',
      description: 'የወጣቶች መንፈሳዊ ሕይወት ግንባታ፣ ውይይትና የሕብረት አገልግሎት ክፍል',
    },
  ];

  const departmentMap = new Map<string, number>();
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { nameAm: d.nameAm },
      update: { nameEn: d.nameEn, description: d.description },
      create: { nameAm: d.nameAm, nameEn: d.nameEn, description: d.description },
    });
    departmentMap.set(d.nameAm, dept.id);
  }
  console.log(`✓ 5 departments seeded/verified`);

  // ------------------------------------------------------------------
  // 3. MEZMUR CATEGORIES (7 categories)
  // ------------------------------------------------------------------
  console.log('Seeding mezmur categories...');
  const mezmurCategoriesData = [
    { nameAm: 'የእግዚአብሔር አብ / ሥላሴ', nameEn: 'Holy Trinity' },
    { nameAm: 'የእመቤታችን ቅድስት ድንግል ማርያም', nameEn: 'St. Mary' },
    { nameAm: 'የጌታችን የመድኃኒታችን ኢየሱስ ክርስቶስ', nameEn: 'Our Lord Jesus Christ' },
    { nameAm: 'የቅዱሳን መላእክት', nameEn: 'Holy Angels' },
    { nameAm: 'የቅዱሳን ጻድቃንና ሰማዕታት', nameEn: 'Saints and Martyrs' },
    { nameAm: 'የጾምና የንስሐ', nameEn: 'Fasting and Repentance' },
    { nameAm: 'የበዓላትና የምስጋና', nameEn: 'Feasts and Praise' },
  ];

  const mezmurCatMap = new Map<string, number>();
  for (const mc of mezmurCategoriesData) {
    const cat = await prisma.mezmurCategory.upsert({
      where: { nameAm: mc.nameAm },
      update: { nameEn: mc.nameEn },
      create: { nameAm: mc.nameAm, nameEn: mc.nameEn },
    });
    mezmurCatMap.set(mc.nameAm, cat.id);
  }
  console.log(`✓ 7 mezmur categories seeded/verified`);

  // ------------------------------------------------------------------
  // 4. SUPER ADMIN USER & MEMBER
  // ------------------------------------------------------------------
  console.log('Seeding super admin...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@aemade.org';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456!';
  const superAdminHash = await argon2.hash(superAdminPassword);
  const superAdminRoleId = roleMap.get('super_admin')!;

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: superAdminHash,
      roleId: superAdminRoleId,
      status: UserStatus.active,
    },
    create: {
      email: superAdminEmail,
      phone: '+251911000000',
      passwordHash: superAdminHash,
      roleId: superAdminRoleId,
      status: UserStatus.active,
    },
  });

  const superAdminMember = await prisma.member.upsert({
    where: { memberNo: 'MEM-0001' },
    update: {
      userId: superAdminUser.id,
      firstName: 'ተክለ',
      fatherName: 'ሃይማኖት',
      grandfatherName: 'ወልደስላሴ',
      baptismalName: 'ገብረ ክርስቶስ',
      sex: Sex.male,
      status: MemberStatus.active,
    },
    create: {
      memberNo: 'MEM-0001',
      userId: superAdminUser.id,
      firstName: 'ተክለ',
      fatherName: 'ሃይማኖት',
      grandfatherName: 'ወልደስላሴ',
      baptismalName: 'ገብረ ክርስቶስ',
      sex: Sex.male,
      phone: '+251911000000',
      email: superAdminEmail,
      status: MemberStatus.active,
      educationLevel: 'ደረጃ ፬ / ዲግሪ',
      occupation: 'የሰንበት ትምህርት ቤት ሥራ አስኪያጅ',
      notes: 'Super Administrator Account',
    },
  });
  console.log(`✓ Super Admin user (${superAdminEmail}) and Member profile created`);

  // Default system settings
  await prisma.setting.upsert({
    where: { settingKey: 'general' },
    update: {},
    create: {
      settingKey: 'general',
      settingValue: {
        churchNameAm: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን',
        schoolNameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
        mottoAm: 'በሃይማኖትና በምግባር የጸና ትውልድ እናፈራለን',
        contactPhone: '+251911000000',
        contactEmail: 'contact@aemade.org',
      },
    },
  });
  console.log(`✓ General system setting seeded`);

  // ------------------------------------------------------------------
  // 5. DEMO DATA GENERATION (--demo flag)
  // ------------------------------------------------------------------
  if (!isDemo) {
    console.log('\nSeed completed without demo data. Pass --demo to seed full sample datasets.');
    return;
  }

  console.log('\n--- Seeding Demo Datasets ---');

  // Teacher user for courses
  const teacherRole = roleMap.get('teacher')!;
  const teacherHash = await argon2.hash('Teacher@123456!');
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@aemade.org' },
    update: { passwordHash: teacherHash, roleId: teacherRole, status: UserStatus.active },
    create: {
      email: 'teacher@aemade.org',
      phone: '+251911223344',
      passwordHash: teacherHash,
      roleId: teacherRole,
      status: UserStatus.active,
    },
  });

  const teacherMember = await prisma.member.upsert({
    where: { memberNo: 'MEM-0002' },
    update: { userId: teacherUser.id },
    create: {
      memberNo: 'MEM-0002',
      userId: teacherUser.id,
      firstName: 'ቀሲስ',
      fatherName: 'ዮሐንስ',
      grandfatherName: 'መኮንን',
      baptismalName: 'ኃይለ መስቀል',
      sex: Sex.male,
      phone: '+251911223344',
      email: 'teacher@aemade.org',
      departmentId: departmentMap.get('ትምህርት ክፍል'),
      status: MemberStatus.active,
      educationLevel: 'ማስተርስ',
      occupation: 'የነገረ መለኮት መምህር',
    },
  });

  // A. 30 MEMBERS (MEM-0003 to MEM-0032)
  console.log('Seeding 30 demo members...');
  const amharicFirstNames = [
    { fn: 'ዮናስ', fan: 'ታደሰ', gfn: 'ዘውዴ', bn: 'ገብረ ማርያም', sex: Sex.male },
    { fn: 'ሳራ', fan: 'በቀለ', gfn: 'ታሪኩ', bn: 'ወለተ ማርያም', sex: Sex.female },
    { fn: 'ዳንኤል', fan: 'ግርማ', gfn: 'ተሾመ', bn: 'ገብረ ሚካኤል', sex: Sex.male },
    { fn: 'ሩት', fan: 'አስፋው', gfn: 'ኃይሉ', bn: 'ወለተ ጊዮርጊስ', sex: Sex.female },
    { fn: 'በርተሎሜዎስ', fan: 'ደረጀ', gfn: 'መላኩ', bn: 'ፍሬ ክርስቶስ', sex: Sex.male },
    { fn: 'ሄለን', fan: 'ሙሉጌታ', gfn: 'ተፈሪ', bn: 'ወለተ ኪዳን', sex: Sex.female },
    { fn: 'አብርሃም', fan: 'ታምራት', gfn: 'ደስታ', bn: 'ገብረ እግዚአብሔር', sex: Sex.male },
    { fn: 'ማርታ', fan: 'ተስፋዬ', gfn: 'አየለ', bn: 'ወለተ መድኅን', sex: Sex.female },
    { fn: 'ሳሙኤል', fan: 'አለሙ', gfn: 'ብርሃኑ', bn: 'ጸጋ ክርስቶስ', sex: Sex.male },
    { fn: 'ራሔል', fan: 'አማረ', gfn: 'ጌታቸው', bn: 'ወለተ ሰማዕት', sex: Sex.female },
    { fn: 'ናትናኤል', fan: 'ካሳሁን', gfn: 'ገብሬ', bn: 'ገብረ ሩፋኤል', sex: Sex.male },
    { fn: 'ሐና', fan: 'ኃይሌ', gfn: 'ወርቁ', bn: 'ወለተ ዮሐንስ', sex: Sex.female },
    { fn: 'ሚካኤል', fan: 'መሰለ', gfn: 'ታደለ', bn: 'ገብረ ሥላሴ', sex: Sex.male },
    { fn: 'ሊዲያ', fan: 'አበበ', gfn: 'ደበበ', bn: 'ወለተ ጴጥሮስ', sex: Sex.female },
    { fn: 'ኤልያስ', fan: 'አያሌው', gfn: 'ደምሴ', bn: 'ኃይለ ማርያም', sex: Sex.male },
    { fn: 'ሰሎሜ', fan: 'ተገኝ', gfn: 'ፀጋዬ', bn: 'ወለተ ሐና', sex: Sex.female },
    { fn: 'ጳውሎስ', fan: 'ብርሃኔ', gfn: 'ኃይለስላሴ', bn: 'ገብረ ዮሐንስ', sex: Sex.male },
    { fn: 'እስቴፋኖስ', fan: 'ደበበ', gfn: 'ከበደ', bn: 'ሰማዕተ ክርስቶስ', sex: Sex.male },
    { fn: 'ማርያማዊት', fan: 'አድማሱ', gfn: 'አስራት', bn: 'ወለተ ሚካኤል', sex: Sex.female },
    { fn: 'ቢንያም', fan: 'ጌትነት', gfn: 'መንግሥቱ', bn: 'ገብረ መድኅን', sex: Sex.male },
    { fn: 'እልፍነሽ', fan: 'ተረፈ', gfn: 'ስዩም', bn: 'ወለተ ተክለሃይማኖት', sex: Sex.female },
    { fn: 'ቴዎድሮስ', fan: 'ያሬድ', gfn: 'ወንድሙ', bn: 'ፍቅረ ክርስቶስ', sex: Sex.male },
    { fn: 'ቤተልሔም', fan: 'እሸቱ', gfn: 'ነጋሽ', bn: 'ወለተ መስቀል', sex: Sex.female },
    { fn: 'ዳዊት', fan: 'በላይ', gfn: 'አስናቀ', bn: 'ገብረ ዑራኤል', sex: Sex.male },
    { fn: 'ስምረት', fan: 'ፋንታሁን', gfn: 'ዘለቀ', bn: 'ወለተ ስላሴ', sex: Sex.female },
    { fn: 'ዮሴፍ', fan: 'ወርቁ', gfn: 'ጌታነህ', bn: 'ገብረ አረጋዊ', sex: Sex.male },
    { fn: 'እስክንድር', fan: 'ግርማይ', gfn: 'ተክሉ', bn: 'ኃይለ ገብርኤል', sex: Sex.male },
    { fn: 'ጽጌረዳ', fan: 'ኃይለሚካኤል', gfn: 'ተፈራ', bn: 'ወለተ በርተሎሜዎስ', sex: Sex.female },
    { fn: 'አቤል', fan: 'ወልዴ', gfn: 'ነጋቱ', bn: 'ገብረ ተክለሃይማኖት', sex: Sex.male },
    { fn: 'ኪዳን', fan: 'መኮንን', gfn: 'ጥላሁን', bn: 'ወለተ ሩፋኤል', sex: Sex.female },
  ];

  const deptIds = Array.from(departmentMap.values());
  const createdMembers = [superAdminMember, teacherMember];

  for (let i = 0; i < amharicFirstNames.length; i++) {
    const p = amharicFirstNames[i];
    const memberNo = `MEM-${(i + 3).toString().padStart(4, '0')}`;
    const deptId = deptIds[i % deptIds.length];

    const member = await prisma.member.upsert({
      where: { memberNo },
      update: {},
      create: {
        memberNo,
        firstName: p.fn,
        fatherName: p.fan,
        grandfatherName: p.gfn,
        baptismalName: p.bn,
        sex: p.sex,
        phone: `+2519${(10000000 + i).toString().slice(0, 8)}`,
        email: `member${i + 3}@aemade.org`,
        departmentId: deptId,
        status: MemberStatus.active,
        parish: 'ቅድስት ሥላሴ ካቴድራል',
        confessionFather: 'መልአከ ሰላም ቆሞስ አባ ተክለ ማርያም',
        educationLevel: i % 2 === 0 ? 'የመጀመሪያ ዲግሪ' : 'የሁለተኛ ደረጃ ትምህርት',
        occupation: i % 2 === 0 ? 'የቢሮ ባለሙያ' : 'ተማሪ',
        region: 'አዲስ አበባ',
        zone: 'ቂርቆስ',
        woreda: 'ወረዳ 04',
        kebele: 'ቀበሌ 12',
        joinedAt: new Date(2023, i % 12, (i % 28) + 1),
      },
    });
    createdMembers.push(member);
  }
  console.log(`✓ 30+ members verified`);

  // B. 5 COURSES WITH LESSONS
  console.log('Seeding 5 courses with lessons...');
  const coursesData = [
    {
      titleAm: 'የመጽሐፍ ቅዱስ ጥናት ፩ (ኦሪትና ታሪክ)',
      titleEn: 'Biblical Studies I (Pentateuch & History)',
      description: 'ከኦሪት ዘፍጥረት እስከ ነቢያት መጻሕፍት ያለው ጥልቅ መንፈሳዊ ትንታኔና የትርጓሜ ጥናት',
      level: 'ደረጃ ፩',
      schedule: 'ቅዳሜ ከሰዓት 8:00 - 10:00',
      capacity: 40,
      status: CourseStatus.open,
    },
    {
      titleAm: 'ሥርዓተ ቤተ ክርስቲያንና ምሥጢራት',
      titleEn: 'Church Liturgy and Holy Sacraments',
      description: 'ሰባቱ ምሥጢራተ ቤተ ክርስቲያን፣ የቅዳሴ ሥርዓትና የበዓላት አከባበር ትምህርት',
      level: 'ደረጃ ፪',
      schedule: 'እሑድ ከሰዓት 3:00 - 5:00',
      capacity: 35,
      status: CourseStatus.open,
    },
    {
      titleAm: 'ነገረ ማርያም (Mariology)',
      titleEn: 'Mariology: The Mystery of the Theotokos',
      description: 'የእመቤታችን ቅድስት ድንግል ማርያም ዘላለማዊ ድንግልና፣ አማላጅነትና ክብረ ቅድስና',
      level: 'ደረጃ ፪',
      schedule: 'ረቡዕ ማታ 12:00 - 1:30',
      capacity: 50,
      status: CourseStatus.open,
    },
    {
      titleAm: 'የግዕዝ ቋንቋ መሠረታዊ ጥናት',
      titleEn: 'Introduction to Ge\'ez Language',
      description: 'የግዕዝ ፊደላት፣ ሰዋስው፣ ቃላት ግንባታና የጸሎት መጻሕፍት ንባብ',
      level: 'ደረጃ ፩',
      schedule: 'ቅዳሜ ጠዋት 3:00 - 5:00',
      capacity: 30,
      status: CourseStatus.open,
    },
    {
      titleAm: 'ያሬዳዊ ዜማና የከበሮ አመታት',
      titleEn: 'Saint Yared Hymnody & Liturgical Rhythms',
      description: 'የቅዱስ ያሬድ ዜማ ሥርዓት (ግዕዝ፣ ዕዝል፣ አራራይ) እና የዝማሬ መሣሪያዎች አጠቃቀም',
      level: 'ደረጃ ፫',
      schedule: 'እሑድ ጠዋት 2:00 - 4:00',
      capacity: 25,
      status: CourseStatus.open,
    },
  ];

  const createdCourses = [];
  for (const c of coursesData) {
    let course = await prisma.course.findFirst({ where: { titleAm: c.titleAm } });
    if (!course) {
      course = await prisma.course.create({
        data: {
          ...c,
          teacherId: teacherMember.id,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2027-06-30'),
        },
      });
    }
    createdCourses.push(course);

    // Seed 4 lessons for each course
    const lessonTitles = [
      'ክፍል ፩፡ መግቢያና ታሪካዊ ዳራ',
      'ክፍል ፪፡ መሠረተ እምነትና አስተምህሮ',
      'ክፍል ፫፡ ተግባራዊ ክርስቲያናዊ ሕይወት',
      'ክፍል ፬፡ ማጠቃለያና የጥያቄዎች መልስ',
    ];

    for (let lIndex = 0; lIndex < lessonTitles.length; lIndex++) {
      const orderNo = lIndex + 1;
      const lesson = await prisma.lesson.findFirst({
        where: { courseId: course.id, orderNo },
      });
      if (!lesson) {
        await prisma.lesson.create({
          data: {
            courseId: course.id,
            title: lessonTitles[lIndex],
            content: `ይህ የትምህርቱ ${orderNo}ኛ ሳምንት ይዘት ነው። ጥልቅ መንፈሳዊ ትንታኔና የቅዱሳን አበው ትምህርት በዝርዝር ተካቷል።`,
            mediaType: orderNo === 2 ? MediaType.pdf : MediaType.text,
            orderNo,
            published: true,
          },
        });
      }
    }
  }
  console.log(`✓ 5 courses with lessons verified`);

  // Enroll first 15 members in first course
  const primaryCourse = createdCourses[0];
  for (let m = 0; m < 15; m++) {
    const member = createdMembers[m];
    const enrollment = await prisma.enrollment.upsert({
      where: {
        memberId_courseId: {
          memberId: member.id,
          courseId: primaryCourse.id,
        },
      },
      update: {},
      create: {
        memberId: member.id,
        courseId: primaryCourse.id,
        status: EnrollmentStatus.active,
      },
    });

    // Add grade
    await prisma.grade.create({
      data: {
        enrollmentId: enrollment.id,
        assessment: 'የአጋማሽ ፈተና (Midterm)',
        score: 75 + (m % 25),
        maxScore: 100,
        remark: 'ጥሩ ውጤት',
      },
    });

    // Add attendance
    await prisma.attendance.upsert({
      where: {
        memberId_courseId_sessionDate: {
          memberId: member.id,
          courseId: primaryCourse.id,
          sessionDate: new Date('2026-10-03'),
        },
      },
      update: {},
      create: {
        memberId: member.id,
        courseId: primaryCourse.id,
        sessionDate: new Date('2026-10-03'),
        status: AttendanceStatus.present,
        markedBy: teacherMember.id,
      },
    });
  }
  console.log(`✓ Enrollments, grades, and attendances verified`);

  // C. 20 MEZMURS
  console.log('Seeding 20 mezmurs...');
  const mezmursData = [
    { title: 'ቸርነትህ ብዙ ነው', cat: 'የእግዚአብሔር አብ / ሥላሴ', singer: 'ሊቀ መዘምራን ቴዎድሮስ ዮሴፍ', lyrics: 'ቸርነትህ ብዙ ነው ምህረትህም አያልቅም፤ አቤቱ አምላካችን ስምህ የተመሰገነ ይሁን።' },
    { title: 'ሰላም ለኪ ማርያም ድንግል', cat: 'የእመቤታችን ቅድስት ድንግል ማርያም', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'ሰላም ለኪ ማርያም ድንግል ንጽሕት፤ በጸሎትሽ ጠብቂን ከመከራ ሕይወት።' },
    { title: 'መስቀል ኃይላችን ነው', cat: 'የጌታችን የመድኃኒታችን ኢየሱስ ክርስቶስ', singer: 'ዘማሪ ዲ/ን ቴዎድሮስ', lyrics: 'መስቀል ኃይላችን ነው መስቀል ቤዛችን ነው፤ በክርስቶስ መስቀል ድኅነት አግኝተናል።' },
    { title: 'ቅዱስ ሚካኤል ሊቀ መላእክት', cat: 'የቅዱሳን መላእክት', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'ቅዱስ ሚካኤል ቆሟል በፊታችን፤ ታዳጊ መልአክ ነው ለመከራችን።' },
    { title: 'ጻድቁ አባታችን ተክለ ሃይማኖት', cat: 'የቅዱሳን ጻድቃንና ሰማዕታት', singer: 'ዘማሪት ፋንቱ ወልዴ', lyrics: 'ተክለ ሃይማኖት ጸሎትህ አይለየን፤ በምልጃህ ጸንተን በበረከት እንኑር።' },
    { title: 'አቤቱ ይቅር በለን', cat: 'የጾምና የንስሐ', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'አቤቱ እንደ ቸርነትህ ይቅር በለን፤ እንደ ምህረትህም ብዛት በደላችንን ደምስስ።' },
    { title: 'እንኳን አደረሳችሁ ለብርሃነ መስቀሉ', cat: 'የበዓላትና የምስጋና', singer: 'ሊቀ መዘምራን ኪነጥበብ', lyrics: 'መስቀል አበራ በደመና፤ ደስ ይበለን በሃይማኖት ሆነን ሁላችን በአንድነት።' },
    { title: 'ሥላሴን አመስግኑ', cat: 'የእግዚአብሔር አብ / ሥላሴ', singer: 'ዘማሪ ዲ/ን ልዑለቃል', lyrics: 'አንድነቱን ሳንለይ ሦስትነቱን ሳንቀላቅል፤ ለአብ ለወልድ ለመንፈስ ቅዱስ ክብር ምስጋና ይሁን።' },
    { title: 'ማርያም ድንግል እናቴ', cat: 'የእመቤታችን ቅድስት ድንግል ማርያም', singer: 'ዘማሪት ምርትነሽ ጥላሁን', lyrics: 'ማርያም ድንግል እናቴ አንቺ ነሽ ዋስትናዬ፤ ባንቺ አማላጅነት ይብራ ዘመኔ።' },
    { title: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው', cat: 'የጌታችን የመድኃኒታችን ኢየሱስ ክርስቶስ', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?' },
    { title: 'ገብርኤል አብሳሪው', cat: 'የቅዱሳን መላእክት', singer: 'ዘማሪ ይስሐቅ', lyrics: 'ብስራተ ሰላምን ይዞ የመጣው፤ ገብርኤል መልአከ እግዚአብሔር ነው።' },
    { title: 'ጊዮርጊስ ኃያል ሰማዕት', cat: 'የቅዱሳን ጻድቃንና ሰማዕታት', singer: 'ዘማሪ ዲ/ን ዘርዓያዕቆብ', lyrics: 'ጊዮርጊስ ተጋዳይ በፈተና የጸና፤ አክሊለ ክብርን ተቀዳጀ በጽናት።' },
    { title: 'በቀራንዮ መስቀል ላይ', cat: 'የጌታችን የመድኃኒታችን ኢየሱስ ክርስቶስ', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'በቀራንዮ ተሰቅሎ አዳነን፤ በክቡር ደሙ ፈሳሽነት ከኃጢአት አነጻን።' },
    { title: 'ድንግል ሆይ ስምሽን ስጠራ', cat: 'የእመቤታችን ቅድስት ድንግል ማርያም', singer: 'ዘማሪት ሲስተር ልኬለሽ', lyrics: 'ስምሽን ስጠራ ልቤ ይረካል፤ በአማላጅነትሽ ጥላ ከለላ ያገኛል።' },
    { title: 'ሩፋኤል ፈዋሽ መልአክ', cat: 'የቅዱሳን መላእክት', singer: 'ዘማሪ ዲ/ን አስቻለው', lyrics: 'ሕመምን አርቆ ጤናን የሚያድል፤ ሩፋኤል ሊቀ መላእክት ይቁም ከጎናችን።' },
    { title: 'አቡነ አረጋዊ ዘደብረ ዳሞ', cat: 'የቅዱሳን ጻድቃንና ሰማዕታት', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'ዘንዶውን በገመድ አስይዞ የረዳህ፤ ደብረ ዳሞ ላይ በጸሎት የጸናህ።' },
    { title: 'ነፍሴ ሆይ እግዚአብሔርን ባርኪ', cat: 'የእግዚአብሔር አብ / ሥላሴ', singer: 'ዘማሪ ዲ/ን ቴዎድሮስ', lyrics: 'ነፍሴ ሆይ እግዚአብሔርን ባርኪ፤ ምስጋናውንም አትርሺ።' },
    { title: 'ጽዮን ሆይ ደስ ይበልሽ', cat: 'የበዓላትና የምስጋና', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'ጽዮን ሆይ ደስ ይበልሽ ንጉሥሽ ይመጣል፤ ጻድቅና አዳኝ የሆነው ጌታ።' },
    { title: 'በጾም በጸሎት እንትጋ', cat: 'የጾምና የንስሐ', singer: 'ዘማሪት ፋንቱ', lyrics: 'በጾም በጸሎት ወደ አምላክ እንቅረብ፤ የልብ ንጽሕናን ከእርሱ እንቀበል።' },
    { title: 'እልል በሉ በአንድነት', cat: 'የበዓላትና የምስጋና', singer: 'አዕማደ ሰላም መዘምራን', lyrics: 'እልል በሉ በአንድነት ለእግዚአብሔር ክብር፤ ድንቅ ሥራውን በምድር ላይ አሳይቷልና።' },
  ];

  for (const m of mezmursData) {
    const catId = mezmurCatMap.get(m.cat);
    const existing = await prisma.mezmur.findFirst({ where: { title: m.title } });
    if (!existing) {
      await prisma.mezmur.create({
        data: {
          title: m.title,
          categoryId: catId,
          singer: m.singer,
          lyrics: m.lyrics,
          isPublic: true,
          createdBy: superAdminMember.id,
        },
      });
    }
  }
  console.log(`✓ 20 mezmurs verified`);

  // D. 10 POSTS
  console.log('Seeding 10 posts...');
  const postsData = [
    {
      type: PostType.sinksar,
      title: 'የዕለቱ ስንክሳር፡ ጥቅምት ፪',
      body: 'በዚህች ዕለት የከበሩ ጻድቃንና ሰማዕታት መታሰቢያቸው ሆነ፤ ጸሎታቸውና ምልጃቸው ከሁላችን ጋር ይሁን።',
      isUrgent: false,
    },
    {
      type: PostType.bible_reading,
      title: 'የዕለቱ የቅዱስ ወንጌል ንባብ',
      body: '«እኔ የመንገድ እውነትና ሕይወት ነኝ፤ በእኔ በቀር ወደ አብ የሚመጣ ማንም የለም» - ዮሐንስ ፲፬:፮',
      isUrgent: false,
    },
    {
      type: PostType.saint_of_day,
      title: 'የዕለቱ ቅዱስ፡ አባ ጳውሊ ታላቁ ገዳማዊ',
      body: 'የገዳማዊ ሕይወት ቀዳሚ የሆኑት አባ ጳውሊ በበረሃ የኖሩበት ገድልና ድንቅ መንፈሳዊ ተጋድሎ።',
      isUrgent: false,
    },
    {
      type: PostType.teaching,
      title: 'የሰንበት ትምህርት ቤት አስፈላጊነት በዘመናችን',
      body: 'ሰንበት ትምህርት ቤት የቤተ ክርስቲያን የጀርባ አጥንት ናት። ሕፃናትና ወጣቶች በእውነተኛው ሃይማኖትና ምግባር የሚታነጹበት ማዕከል ናት።',
      isUrgent: false,
    },
    {
      type: PostType.urgent,
      title: 'አስቸኳይ ማስታወቂያ፡ ልዩ የጸሎትና የምልጃ መርሐ ግብር',
      body: 'ለሁሉም የሰንበት ትምህርት ቤት አባላት፡ በመጪው ዓርብ ከምሽቱ 11:30 ጀምሮ ልዩ የጋራ ጸሎት ይደረጋል፤ ሳያቋርጡ ይገኙ።',
      isUrgent: true,
    },
    {
      type: PostType.event,
      title: 'ዓመታዊ የሰንበት ትምህርት ቤት የምስረታ በዓል',
      body: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት የተመሰረተበትን 26ኛ ዓመት በልዩ መንፈሳዊ ድግስ እናከብራለን።',
      isUrgent: false,
    },
    {
      type: PostType.news,
      title: 'የአዲስ ተማሪዎች ምዝገባ ተጀመረ',
      body: 'ለ2019 ዓ.ም የትምህርት ዘመን ከደረጃ ፩ እስከ ፬ የአዲስ ተማሪዎች ምዝገባ በይፋ ተከፍቷል።',
      isUrgent: false,
    },
    {
      type: PostType.teaching,
      title: 'ስለ አሥራትና በኩራት ትምህርት',
      body: '«በቤቴ ውስጥ መብል እንዲሆን አሥራቱን ሁሉ ወደ ጎተራ አግቡ» - ሚልክያስ ፫:፲። የክርስትና የልግስና መርሆዎች።',
      isUrgent: false,
    },
    {
      type: PostType.sinksar,
      title: 'የጥቅምት ወር የበዓላት ማውጫ',
      body: 'በዚህ ወር የሚከበሩ ዓበይትና ንዑሳን የቅዱሳን በዓላት ዝርዝርና መርሐ ግብራቸው።',
      isUrgent: false,
    },
    {
      type: PostType.news,
      title: 'የመዘምራን ክፍል አዲስ አልበም ዝግጅት',
      body: 'የመዝሙር ክፍሉ አዲስ መንፈሳዊ ያሬዳዊ የዝማሬ አልበም ለማዘጋጀት ልምምድ ጀምሯል።',
      isUrgent: false,
    },
  ];

  for (const p of postsData) {
    const existing = await prisma.post.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.post.create({
        data: {
          ...p,
          authorId: superAdminMember.id,
        },
      });
    }
  }
  console.log(`✓ 10 posts verified`);

  // E. 3 EVENTS
  console.log('Seeding 3 events...');
  const eventsData = [
    {
      title: 'የሰንበት ትምህርት ቤት የምክክር ጉባኤ',
      description: 'የአስተዳደር አባላት፣ መምህራንና የአገልግሎት ክፍላት የጋራ ዓመታዊ የዕቅድ ጉባኤ',
      location: 'ዋናው የመሰብሰቢያ አዳራሽ',
      startAt: new Date('2026-10-25T09:00:00Z'),
      endAt: new Date('2026-10-25T13:00:00Z'),
      capacity: 100,
    },
    {
      title: 'የወጣቶች መንፈሳዊ ሲምፖዚየም',
      description: 'ወጣቱ በዘመናዊው ዓለም ውስጥ ያለውን የክርስትና ማንነት ለመጠበቅ የሚደረግ ውይይት',
      location: 'የሰንበት ት/ቤት ትልቁ አዳራሽ',
      startAt: new Date('2026-11-08T14:00:00Z'),
      endAt: new Date('2026-11-08T18:00:00Z'),
      capacity: 150,
    },
    {
      title: 'የቅዱስ ያሬድ መዝሙር ዝግጅት ኮንሰርት',
      description: 'በአዕማደ ሰላም መዘምራን የሚቀርብ ልዩ የያሬዳዊ ዜማና ዝማሬ ምሽት',
      location: 'የቤተ ክርስቲያኑ አውደ ምሕረት',
      startAt: new Date('2026-11-22T16:00:00Z'),
      endAt: new Date('2026-11-22T20:00:00Z'),
      capacity: 500,
    },
  ];

  for (const e of eventsData) {
    let evt = await prisma.event.findFirst({ where: { title: e.title } });
    if (!evt) {
      evt = await prisma.event.create({
        data: {
          ...e,
          createdBy: superAdminMember.id,
        },
      });

      // Add RSVP from members
      for (let r = 0; r < 5; r++) {
        await prisma.eventRsvp.upsert({
          where: {
            eventId_memberId: {
              eventId: evt.id,
              memberId: createdMembers[r].id,
            },
          },
          update: {},
          create: {
            eventId: evt.id,
            memberId: createdMembers[r].id,
            status: EventRsvpStatus.going,
          },
        });
      }
    }
  }
  console.log(`✓ 3 events with RSVPs verified`);

  // F. 2 FORMS
  console.log('Seeding 2 forms...');
  const formsData = [
    {
      title: 'የአዲስ ተማሪዎች ምዝገባ ቅጽ (2019 ዓ.ም)',
      description: 'ወደ ሰንበት ትምህርት ቤቱ አዲስ ለሚገቡ ተማሪዎች የተዘጋጀ የመመዝገቢያ ቅጽ',
      formSchema: {
        fields: [
          { name: 'fullName', label: 'ሙሉ ስም', type: 'text', required: true },
          { name: 'baptismalName', label: 'የክርስትና ስም', type: 'text', required: true },
          { name: 'age', label: 'ዕድሜ', type: 'number', required: true },
          { name: 'departmentInterest', label: 'የሚፈልጉት የአገልግሎት ክፍል', type: 'select', options: ['ትምህርት', 'መዝሙር', 'ልማት'] },
        ],
      },
      status: FormStatus.open,
    },
    {
      title: 'የአባላት አስተያየትና መጠይቅ ቅጽ',
      description: 'የሰንበት ትምህርት ቤቱን አገልግሎት ለማሻሻል የቀረበ የዳሰሳ ጥናት',
      formSchema: {
        fields: [
          { name: 'satisfaction', label: 'በትምህርቱ አገልግሎት ምን ያህል ረክተዋል?', type: 'rating', min: 1, max: 5 },
          { name: 'suggestions', label: 'ተጨማሪ አስተያየትና ማሻሻያ ሀሳብ', type: 'textarea', required: false },
        ],
      },
      status: FormStatus.open,
    },
  ];

  for (const f of formsData) {
    let form = await prisma.form.findFirst({ where: { title: f.title } });
    if (!form) {
      form = await prisma.form.create({
        data: {
          ...f,
          createdBy: superAdminMember.id,
          openUntil: new Date('2026-12-31'),
        },
      });

      // Add a response
      await prisma.formResponse.create({
        data: {
          formId: form.id,
          memberId: createdMembers[0].id,
          answers: {
            fullName: 'ተክለ ሃይማኖት ወልደስላሴ',
            baptismalName: 'ገብረ ክርስቶስ',
            age: 28,
            departmentInterest: 'ትምህርት',
          },
          status: FormResponseStatus.submitted,
        },
      });
    }
  }
  console.log(`✓ 2 forms with responses verified`);

  console.log('\n--- Demo Data Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
