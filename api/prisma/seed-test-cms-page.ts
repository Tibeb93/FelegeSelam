import { PrismaClient, PageStatus, SectionAudience, MenuLocation, Prisma } from '@prisma/client';
import { SECTION_REGISTRY } from '../../packages/cms-registry/dist';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Checkpoint A test CMS page...');

  const slug = 'test-cms';

  // Delete existing test page if present
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) {
    await prisma.page.delete({ where: { slug } });
  }

  const heroDef = SECTION_REGISTRY.hero;
  const cardsDef = SECTION_REGISTRY.featureCards;
  const imageTextDef = SECTION_REGISTRY.imageWithText;
  const statsDef = SECTION_REGISTRY.statsCounter;
  const faqDef = SECTION_REGISTRY.faqAccordion;
  const ctaDef = SECTION_REGISTRY.memberCallToAction;

  const testPage = await prisma.page.create({
    data: {
      slug,
      titleAm: 'የሙከራ ተለዋዋጭ ገጽ (CMS Test Page)',
      titleEn: 'CMS Dynamic Test Page',
      status: PageStatus.published,
      version: 1,
      seo: {
        titleAm: 'የሙከራ ገጽ - አዕማደ ሰላም',
        titleEn: 'CMS Test Page - Aemade Selam',
        descAm: 'ሙሉ በሙሉ ከመረጃ ቋት የተገነባ ተለዋዋጭ ገጽ',
        descEn: 'Fully dynamic page built entirely from database rows',
      },
      sections: {
        create: [
          {
            type: 'hero',
            orderNo: 0,
            visible: true,
            audience: SectionAudience.everyone,
            content: {
              am: {
                title: 'እንኳን ወደ አዕማደ ሰላም ተለዋዋጭ ገጽ በደህና መጡ',
                subtitle: 'ይህ ገጽ ሙሉ በሙሉ ከመረጃ ቋት (Database) የሚነበብና የሚቀናጅ ነው',
                tagline: 'አዲስ የሲኤምኤስ (CMS) ሥርዓት',
                primaryCtaText: 'ይመዝገቡ',
                primaryCtaLink: '/register',
                secondaryCtaText: 'ስለ እኛ',
                secondaryCtaLink: '/about',
                bgImageUrl: '/images/hero-bg.jpg',
              },
              en: {
                title: 'Welcome to Aemade Selam Dynamic Page',
                subtitle: 'This page is rendered entirely from database rows via Next.js server components',
                tagline: 'Brand New Dynamic CMS',
                primaryCtaText: 'Register Now',
                primaryCtaLink: '/register',
                secondaryCtaText: 'Learn More',
                secondaryCtaLink: '/about',
                bgImageUrl: '/images/hero-bg.jpg',
              },
            } as Prisma.InputJsonValue,
            config: heroDef.defaultConfig as Prisma.InputJsonValue,
            style: heroDef.defaultStyle as any,
          },
          {
            type: 'featureCards',
            orderNo: 1,
            visible: true,
            audience: SectionAudience.everyone,
            content: cardsDef.defaultContent as any,
            config: cardsDef.defaultConfig as any,
            style: cardsDef.defaultStyle as any,
          },
          {
            type: 'imageWithText',
            orderNo: 2,
            visible: true,
            audience: SectionAudience.everyone,
            content: imageTextDef.defaultContent as any,
            config: imageTextDef.defaultConfig as any,
            style: imageTextDef.defaultStyle as any,
          },
          {
            type: 'statsCounter',
            orderNo: 3,
            visible: true,
            audience: SectionAudience.everyone,
            content: statsDef.defaultContent as any,
            config: statsDef.defaultConfig as any,
            style: statsDef.defaultStyle as any,
          },
          {
            type: 'faqAccordion',
            orderNo: 4,
            visible: true,
            audience: SectionAudience.everyone,
            content: faqDef.defaultContent as any,
            config: faqDef.defaultConfig as any,
            style: faqDef.defaultStyle as any,
          },
          {
            type: 'memberCallToAction',
            orderNo: 5,
            visible: true,
            audience: SectionAudience.everyone,
            content: ctaDef.defaultContent as any,
            config: ctaDef.defaultConfig as any,
            style: ctaDef.defaultStyle as any,
          },
        ],
      },
    },
    include: {
      sections: true,
    },
  });

  // Create initial page version snapshot
  await prisma.pageVersion.create({
    data: {
      pageId: testPage.id,
      version: 1,
      note: 'Seeded test CMS page',
      snapshot: testPage as any,
    },
  });

  // 2. Seed header and footer menus
  await prisma.menu.upsert({
    where: { location: MenuLocation.header },
    create: {
      location: MenuLocation.header,
      items: [
        { id: '1', labelAm: 'መነሻ', labelEn: 'Home', target: { type: 'page', url: '/' }, visible: true, audience: 'everyone' },
        { id: '2', labelAm: 'ስለ እኛ', labelEn: 'About', target: { type: 'page', url: '/about' }, visible: true, audience: 'everyone' },
        { id: '3', labelAm: 'ዜና', labelEn: 'News', target: { type: 'page', url: '/news' }, visible: true, audience: 'everyone' },
        { id: '4', labelAm: 'መዝሙር', labelEn: 'Mezmur', target: { type: 'page', url: '/mezmur' }, visible: true, audience: 'everyone' },
        { id: '5', labelAm: 'ትምህርት', labelEn: 'Courses', target: { type: 'page', url: '/courses' }, visible: true, audience: 'everyone' },
        { id: '6', labelAm: 'ቀን መቁጠሪያ', labelEn: 'Calendar', target: { type: 'page', url: '/calendar' }, visible: true, audience: 'everyone' },
        { id: '7', labelAm: 'አድራሻ', labelEn: 'Contact', target: { type: 'page', url: '/contact' }, visible: true, audience: 'everyone' },
        { id: '8', labelAm: 'የሙከራ ገጽ', labelEn: 'CMS Test', target: { type: 'page', url: '/test-cms' }, visible: true, audience: 'everyone' },
      ],
    },
    update: {
      items: [
        { id: '1', labelAm: 'መነሻ', labelEn: 'Home', target: { type: 'page', url: '/' }, visible: true, audience: 'everyone' },
        { id: '2', labelAm: 'ስለ እኛ', labelEn: 'About', target: { type: 'page', url: '/about' }, visible: true, audience: 'everyone' },
        { id: '3', labelAm: 'ዜና', labelEn: 'News', target: { type: 'page', url: '/news' }, visible: true, audience: 'everyone' },
        { id: '4', labelAm: 'መዝሙር', labelEn: 'Mezmur', target: { type: 'page', url: '/mezmur' }, visible: true, audience: 'everyone' },
        { id: '5', labelAm: 'ትምህርት', labelEn: 'Courses', target: { type: 'page', url: '/courses' }, visible: true, audience: 'everyone' },
        { id: '6', labelAm: 'ቀን መቁጠሪያ', labelEn: 'Calendar', target: { type: 'page', url: '/calendar' }, visible: true, audience: 'everyone' },
        { id: '7', labelAm: 'አድራሻ', labelEn: 'Contact', target: { type: 'page', url: '/contact' }, visible: true, audience: 'everyone' },
        { id: '8', labelAm: 'የሙከራ ገጽ', labelEn: 'CMS Test', target: { type: 'page', url: '/test-cms' }, visible: true, audience: 'everyone' },
      ],
    },
  });

  console.log(`Successfully created test page "${slug}" with ${testPage.sections.length} sections!`);
}

main()
  .catch((e) => {
    console.error('Error seeding test CMS page:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
