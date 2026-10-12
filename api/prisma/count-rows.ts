import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('  Aemade Selam Database Verification - Table Row Counts (24)');
  console.log('================================================================');

  const counts: Record<string, number> = {
    roles: await prisma.role.count(),
    users: await prisma.user.count(),
    refresh_tokens: await prisma.refreshToken.count(),
    departments: await prisma.department.count(),
    members: await prisma.member.count(),
    courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(),
    enrollments: await prisma.enrollment.count(),
    attendances: await prisma.attendance.count(),
    grades: await prisma.grade.count(),
    certificates: await prisma.certificate.count(),
    mezmur_categories: await prisma.mezmurCategory.count(),
    mezmurs: await prisma.mezmur.count(),
    favorites: await prisma.favorite.count(),
    posts: await prisma.post.count(),
    events: await prisma.event.count(),
    event_rsvps: await prisma.eventRsvp.count(),
    forms: await prisma.form.count(),
    form_responses: await prisma.formResponse.count(),
    contributions: await prisma.contribution.count(),
    notifications: await prisma.notification.count(),
    device_tokens: await prisma.deviceToken.count(),
    audit_logs: await prisma.auditLog.count(),
    settings: await prisma.setting.count(),
  };

  const tableNames = Object.keys(counts);
  console.log(`Found ${tableNames.length} registered system models/tables:\n`);

  console.log(' Table Name              | Rows ');
  console.log('-------------------------+------');
  for (const [table, count] of Object.entries(counts)) {
    console.log(` ${table.padEnd(23)} | ${count.toString().padStart(4)} `);
  }
  console.log('-------------------------+------');
  console.log(`Total Tables: ${tableNames.length}/24`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Error counting table rows:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
