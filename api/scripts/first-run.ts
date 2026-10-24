import { PrismaClient, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Aemade Selam First-Run Production Initialization ---');

  // 1. Ensure Roles exist
  console.log('Ensuring system roles exist...');
  const roles = [
    { name: 'super_admin', permissions: ['*'] },
    {
      name: 'admin',
      permissions: [
        'members:read', 'members:create', 'members:update', 'departments:read',
        'courses:read', 'courses:write', 'attendance:read', 'attendance:write',
        'contributions:read', 'contributions:write', 'posts:read', 'posts:write',
        'events:read', 'events:write', 'forms:read', 'forms:write', 'reports:read',
      ],
    },
    {
      name: 'teacher',
      permissions: [
        'courses:read', 'courses:update', 'lessons:read', 'lessons:write',
        'attendance:read', 'attendance:write', 'grades:read', 'grades:write', 'members:read',
      ],
    },
    {
      name: 'content_manager',
      permissions: ['posts:read', 'posts:write', 'mezmur:read', 'mezmur:write', 'events:read', 'events:write'],
    },
    {
      name: 'member',
      permissions: [
        'profile:read', 'profile:update', 'courses:read', 'lessons:read', 'grades:read',
        'mezmur:read', 'favorites:read', 'favorites:write', 'events:read', 'rsvp:write',
        'forms:read', 'forms:submit', 'contributions:read',
      ],
    },
  ];

  const roleMap = new Map<string, number>();
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: { name: r.name, permissions: r.permissions },
    });
    roleMap.set(role.name, role.id);
  }
  console.log('✓ System roles verified.');

  // 2. Ensure Departments exist
  const departments = [
    { nameAm: 'መዝሙር ክፍል', nameEn: 'Choir & Hymnology Department', description: 'የያሬዳዊ ዜማና ቅዱሳት መዝሙራት ትምህርትና አገልግሎት' },
    { nameAm: 'ትምህርት ክፍል', nameEn: 'Education & Academics Department', description: 'የሰንበት ትምህርት ቤት የክፍል ትምህርቶች ማስተባበሪያ' },
    { nameAm: 'ልማትና ገቢ ማሰባሰቢያ ክፍል', nameEn: 'Development & Finance Department', description: 'የሰንበት ትምህርት ቤቱ የልማት ሥራዎችና የገቢ ማሰባሰቢያ' },
    { nameAm: 'ኪነ-ጥበብና ሥነ-ጽሑፍ ክፍል', nameEn: 'Arts & Literature Department', description: 'ቴአትር፣ ሥነ-ጽሑፍና ሕትመት ሥራዎች' },
    { nameAm: 'ግንኙነትና ቴክኖሎጂ ክፍል', nameEn: 'Communications & IT Department', description: 'ሚዲያ፣ ድረ-ገጽና የመረጃ ቴክኖሎጂ አገልግሎት' },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { nameAm: d.nameAm },
      update: { nameEn: d.nameEn, description: d.description },
      create: { nameAm: d.nameAm, nameEn: d.nameEn, description: d.description },
    });
  }
  console.log('✓ School departments verified.');

  // 3. Ensure Super Admin user exists
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@aemade.org').toLowerCase().trim();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456!';
  const superAdminRoleId = roleMap.get('super_admin')!;

  const existingUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingUser) {
    console.log(`Creating initial Super Admin account (${superAdminEmail})...`);
    const passwordHash = await argon2.hash(superAdminPassword);

    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash,
        roleId: superAdminRoleId,
        status: UserStatus.active,
      },
    });
    console.log(`✓ Super Admin created successfully.`);
  } else {
    console.log(`✓ Super Admin (${superAdminEmail}) already exists. Preserving credentials.`);
    if (process.env.RESET_SUPER_ADMIN === 'true') {
      const passwordHash = await argon2.hash(superAdminPassword);
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: { passwordHash, roleId: superAdminRoleId, status: UserStatus.active },
      });
      console.log(`✓ Super Admin password reset successfully via RESET_SUPER_ADMIN flag.`);
    }
  }

  console.log('--- Initialization Complete ---');
}

main()
  .catch((e) => {
    console.error('Initialization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
