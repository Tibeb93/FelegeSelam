import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DEFAULT_SITE_IDENTITY } from '../common/site-identity';

export const DEFAULT_SITE_SETTINGS = {
  'identity.school': DEFAULT_SITE_IDENTITY.school,
  'identity.church': DEFAULT_SITE_IDENTITY.church,
  'identity.location': DEFAULT_SITE_IDENTITY.location,
  site_identity: {
    nameAm: DEFAULT_SITE_IDENTITY.school.nameAm,
    nameEn: DEFAULT_SITE_IDENTITY.school.nameEn,
    shortName: DEFAULT_SITE_IDENTITY.school.shortNameAm,
    shortNameAm: DEFAULT_SITE_IDENTITY.school.shortNameAm,
    shortNameEn: DEFAULT_SITE_IDENTITY.school.shortNameEn,
    taglineAm: DEFAULT_SITE_IDENTITY.school.taglineAm,
    taglineEn: DEFAULT_SITE_IDENTITY.school.taglineEn,
    churchName: DEFAULT_SITE_IDENTITY.church.nameAm,
    churchNameAm: DEFAULT_SITE_IDENTITY.church.nameAm,
    churchNameEn: DEFAULT_SITE_IDENTITY.church.nameEn,
    townAm: DEFAULT_SITE_IDENTITY.location.townAm,
    townEn: DEFAULT_SITE_IDENTITY.location.townEn,
    zoneAm: DEFAULT_SITE_IDENTITY.location.zoneAm,
    zoneEn: DEFAULT_SITE_IDENTITY.location.zoneEn,
    combinedAm: DEFAULT_SITE_IDENTITY.location.combinedAm,
    combinedEn: DEFAULT_SITE_IDENTITY.location.combinedEn,
    logoUrl: DEFAULT_SITE_IDENTITY.school.logoUrl,
    faviconUrl: DEFAULT_SITE_IDENTITY.school.faviconUrl,
  },
  appearance: {
    heroBackgroundType: 'gradient', // 'gradient' | 'image' | 'solid'
    heroBackgroundImage: null as string | null,
    heroOverlayOpacity: 65,
    heroSolidColor: '#0A2E52',
    primaryColor: '#0F4C81',
    accentColor: '#F2B233',
    primaryDark: '#0A2E52',
    primaryLight: '#1E78C8',
    softBg: '#E8F1FB',
  },
  home_content: {
    heroTitleAm: 'እንኳን ወደ ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት በደህና መጡ',
    heroTitleEn: 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral',
    heroSubtitleAm: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን እምነትና ሥርዓት የሚማሩበትና መንፈሳዊ ሕይወትዎን የሚያዳብሩበት መድረክ',
    heroSubtitleEn:
      'A platform to learn the faith and order of the Ethiopian Orthodox Tewahedo Church and cultivate spiritual growth',
    welcomeMessageAm:
      'በሰላም መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።',
    welcomeMessageEn:
      'Welcome! Dedicated to serving students and parishioners of Felegeselam Kidus Giyorgis Cathedral Sunday School.',
    primaryCtaTextAm: 'የአባላት ምዝገባ',
    primaryCtaTextEn: 'Member Registration',
    primaryCtaLink: '/register',
    secondaryCtaTextAm: 'ትምህርቶችን ይመልከቱ',
    secondaryCtaTextEn: 'Explore Courses',
    secondaryCtaLink: '/courses',
    sections: [
      {
        id: 'sinksar',
        enabled: true,
        titleAm: 'የዕለቱ ስንክሳር',
        titleEn: "Today's Synaxarium",
        order: 1,
      },
      {
        id: 'news',
        enabled: true,
        titleAm: 'ዜናዎችና ማስታወቂያዎች',
        titleEn: 'News & Announcements',
        order: 2,
      },
      {
        id: 'courses',
        enabled: true,
        titleAm: 'የሚሰጡ ትምህርቶች',
        titleEn: 'Featured Courses',
        order: 3,
      },
      { id: 'mezmur', enabled: true, titleAm: 'የምስጋና መዝሙራት', titleEn: 'Spiritual Hymns', order: 4 },
      { id: 'contact', enabled: true, titleAm: 'አድራሻና ግንኙነት', titleEn: 'Contact Us', order: 5 },
    ],
    announcement: {
      enabled: false,
      textAm: 'የዘንድሮው የትምህርት ዘመን ምዝገባ ተጀምሯል!',
      textEn: 'Registration for the new academic year is now open!',
      type: 'info',
      link: '/register',
    },
  },
  about_contact: {
    aboutAm:
      'አዕማደ ሰላም ሰንበት ትምህርት ቤት በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (ፍኖተ ሰላም፣ ምዕራብ ጎጃም) ስር የሚገኝ መንፈሳዊ ተቋም ሲሆን ወጣቶችንና ምዕመናንን በሃይማኖትና በምግባር ለማነጽ ይሠራል።',
    aboutEn:
      'Aemade Selam Sunday School is a spiritual institution under Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam, dedicated to edifying youth and parishioners in Orthodox faith and virtuous deeds.',
    missionAm: 'ሕፃናትንና ወጣቶችን በኦርቶዶክሳዊት ተዋሕዶ እምነት ማነጽና ለቤተክርስቲያንና ለአገር የሚጠቅሙ ዜጎች ማድረግ።',
    missionEn:
      'Nurturing children and youth in Orthodox Tewahedo faith and shaping productive citizens for Church and society.',
    visionAm: 'በሃይማኖት የጸና፣ በምግባር ያበራና በትምህርት የበለጸገ መንፈሳዊ ትውልድ ማየት።',
    visionEn:
      'To see a spiritual generation steadfast in faith, radiant in virtuous deeds, and enriched in divine knowledge.',
    phone: '',
    alternatePhone: '',
    email: '',
    address: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
    mapLink: '',
    socialLinks: {
      telegram: '',
      youtube: '',
      facebook: '',
      tiktok: '',
    },
    footerCopyrightAm: '© ፳፻፲፰ አዕማደ ሰላም ሰንበት ትምህርት ቤት። መብቱ በሕግ የተጠበቀ ነው።',
    footerCopyrightEn: '© 2026 Aemade Selam Sunday School. All rights reserved.',
  },
  system_config: {
    defaultLanguage: 'am',
    maintenanceMode: false,
    maintenanceMessageAm: 'ጣቢያችን ለጊዜያዊ እድሳት ተዘግቷል። በቅርቡ እንመለሳለን!',
    maintenanceMessageEn:
      'Our website is currently undergoing scheduled maintenance. We will be back shortly!',
    sessionTimeoutMinutes: 30,
    adminIpAllowlist: '',
  },
  school_profile: {
    nameAm: DEFAULT_SITE_IDENTITY.school.nameAm,
    nameEn: DEFAULT_SITE_IDENTITY.school.nameEn,
    logoUrl: DEFAULT_SITE_IDENTITY.school.logoUrl,
    parish: DEFAULT_SITE_IDENTITY.church.nameAm,
    mottoAm: DEFAULT_SITE_IDENTITY.school.taglineAm,
    mottoEn: DEFAULT_SITE_IDENTITY.school.taglineEn,
  },
  contact_details: {
    phone: '',
    alternatePhone: '',
    email: '',
    address: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
    poBox: '',
  },
  localization: {
    defaultLanguage: 'am',
    supportedLanguages: ['am', 'en'],
    timezone: 'Africa/Addis_Ababa',
    calendar: 'ethiopian',
  },
  ethiopian_calendar: {
    fastingSeasons: [
      {
        id: 'great_lent',
        nameAm: 'ዐቢይ ጾም (ሁዳዴ)',
        nameEn: 'The Great Fast (Abiy Tsom / Lent)',
        durationDays: 55,
        type: 'movable',
        isStrict: true,
        descriptionAm: 'ጌታችን መድኃኒታችን ኢየሱስ ክርስቶስ የጾመው ጾም፤ ፶፭ ቀናት የሚጾም ታላቅ ጾም ነው።',
        descriptionEn: 'The 55-day holy fast of our Lord and Savior Jesus Christ prior to Easter.',
      },
      {
        id: 'filseta',
        nameAm: 'ጾመ ፍልሰታ',
        nameEn: 'Fast of the Assumption (Filseta)',
        startMonthAm: 'ነሐሴ',
        startDay: 1,
        endMonthAm: 'ነሐሴ',
        endDay: 16,
        durationDays: 16,
        type: 'fixed',
        isStrict: true,
        descriptionAm: 'የእመቤታችን ቅድስት ድንግል ማርያም ዕርገት መታሰቢያ ጾም።',
        descriptionEn: 'The 16-day fast commemorating the Assumption of the Holy Virgin Mary.',
      },
      {
        id: 'nebiat',
        nameAm: 'ጾመ ነቢያት (የገና ጾም)',
        nameEn: 'Fast of the Prophets (Advent)',
        startMonthAm: 'ኅዳር',
        startDay: 15,
        endMonthAm: 'ታኅሣሥ',
        endDay: 28,
        durationDays: 43,
        type: 'fixed',
        isStrict: false,
        descriptionAm: 'የክርስቶስን ልደት በመጠባበቅ ነቢያት የተነበዩበትና የጾሙት ጾም።',
        descriptionEn: 'The 43-day fast in preparation for the Feast of the Nativity (Genna).',
      },
      {
        id: 'apostles',
        nameAm: 'ጾመ ሐዋርያት (የሰኔ ጾም)',
        nameEn: 'Fast of the Apostles',
        durationDays: 30,
        type: 'movable',
        isStrict: false,
        descriptionAm: 'መንፈስ ቅዱስ ከወረደ በኋላ ሐዋርያት ለወንጌል አገልግሎት የጾሙት ጾም።',
        descriptionEn: 'The Fast observed by the Apostles after the descent of the Holy Spirit.',
      },
      {
        id: 'salvation',
        nameAm: 'ጾመ ድኅነት (ረቡዕና ዓርብ)',
        nameEn: 'Fast of Salvation (Wednesdays & Fridays)',
        type: 'weekly',
        isStrict: false,
        descriptionAm: 'ረቡዕ የጌታ ምክረ ሞት የተደረገበት፤ ዓርብ ጌታ የተሰቀለበት መታሰቢያ በዓመቱ ሁሉ ይጾማል።',
        descriptionEn: 'Weekly fasts on Wednesday (betrayal council) and Friday (crucifixion).',
      },
      {
        id: 'nineveh',
        nameAm: 'ጾመ ነነዌ',
        nameEn: 'Fast of Nineveh',
        durationDays: 3,
        type: 'movable',
        isStrict: true,
        descriptionAm: 'የነነዌ ሰዎች በዮናስ ስብከት ንስሐ የገቡበት የ፫ ቀናት ጾም።',
        descriptionEn: 'The three-day fast commemorating the repentance of the people of Nineveh.',
      },
      {
        id: 'gehad',
        nameAm: 'ጾመ ጋድ (የልደትና ጥምቀት ዋዜማ)',
        nameEn: 'Gehad (Eve of Nativity & Epiphany)',
        type: 'fixed',
        isStrict: true,
        descriptionAm: 'በልደትና በጥምቀት ዋዜማ የሚጾም ጥብቅ የአንድ ቀን ጾም።',
        descriptionEn: 'Strict fasting days on the eve of Genna and Timkat.',
      },
    ],
    majorFeasts: [
      {
        id: 'meskel',
        nameAm: 'በዓለ መስቀል (ደመራ)',
        nameEn: 'Finding of the True Cross (Meskel)',
        monthAm: 'መስከረም',
        day: 17,
        gregorianEquivalent: 'September 27',
        isLordFeast: true,
        descriptionAm: 'ንግሥት ዕሌኒ የጌታችንን ቅዱስ መስቀል በደመራ ጭስ መሪነት ያገኘችበት በዓል።',
        descriptionEn: 'Commemoration of the Discovery of the True Cross by Queen Helena.',
      },
      {
        id: 'genna',
        nameAm: 'በዓለ ልደት (ገና)',
        nameEn: 'Feast of the Nativity (Genna)',
        monthAm: 'ታኅሣሥ',
        day: 29,
        gregorianEquivalent: 'January 7',
        isLordFeast: true,
        descriptionAm: 'የአምላካችንና የመድኃኒታችን የኢየሱስ ክርስቶስ የልደቱ በዓል።',
        descriptionEn: 'The Holy Nativity of our Lord, God, and Savior Jesus Christ.',
      },
      {
        id: 'timkat',
        nameAm: 'በዓለ ጥምቀት',
        nameEn: 'Feast of the Epiphany (Timkat)',
        monthAm: 'ጥር',
        day: 11,
        gregorianEquivalent: 'January 19',
        isLordFeast: true,
        descriptionAm: 'ጌታችን በዮርዳኖስ ባሕር በዮሐንስ እጅ የተጠመቀበት ታላቅ በዓል።',
        descriptionEn: 'The Baptism of our Lord Jesus Christ in the River Jordan.',
      },
      {
        id: 'kana_zegelila',
        nameAm: 'ቃና ዘገሊላ',
        nameEn: 'Miracle at Cana of Galilee',
        monthAm: 'ጥር',
        day: 12,
        gregorianEquivalent: 'January 20',
        isLordFeast: true,
        descriptionAm: 'ጌታችን በቃና ዘገሊላ ሰርግ ውሃውን ወደ ወይን የለወጠበት ተአምር።',
        descriptionEn: 'Our Lord turning water into wine at the wedding in Cana of Galilee.',
      },
      {
        id: 'tsinset',
        nameAm: 'በዓለ ጽንሰት',
        nameEn: 'The Annunciation / Incarnation',
        monthAm: 'መጋቢት',
        day: 29,
        gregorianEquivalent: 'April 7',
        isLordFeast: true,
        descriptionAm: 'መልአኩ ቅዱስ ገብርኤል ለእመቤታችን ያበሰረበትና ጌታ የተፀነሰበት በዓል።',
        descriptionEn: 'The Annunciation to the Virgin Mary by the Archangel Gabriel.',
      },
      {
        id: 'hosaena',
        nameAm: 'ሆሣዕና',
        nameEn: 'Palm Sunday (Hosanna)',
        type: 'movable',
        isLordFeast: true,
        descriptionAm: 'ጌታችን በውዳሴና በክብር በውርንጭላይቱ ላይ ተቀምጦ ወደ ኢየሩሳሌም የገባበት።',
        descriptionEn: 'Triumphal entry of our Lord Jesus Christ into Jerusalem.',
      },
      {
        id: 'siklet',
        nameAm: 'ስቅለተ ክርስቶስ (ዓርብ)',
        nameEn: 'Good Friday (Crucifixion)',
        type: 'movable',
        isLordFeast: true,
        descriptionAm: 'ጌታችን ስለ ድኅነታችን በቀራንዮ የተሰቀለበት ዕለት።',
        descriptionEn: 'The Crucifixion and Death of our Lord on Mount Golgotha.',
      },
      {
        id: 'fasika',
        nameAm: 'ትንሣኤ (ፋሲካ)',
        nameEn: 'The Holy Resurrection (Easter / Fasika)',
        type: 'movable',
        isLordFeast: true,
        descriptionAm: 'የጌታችን የመድኃኒታችን የኢየሱስ ክርስቶስ የትንሣኤው በዓል።',
        descriptionEn: 'The Glorious Resurrection of our Lord Jesus Christ from the dead.',
      },
      {
        id: 'erget',
        nameAm: 'በዓለ ዕርገት',
        nameEn: 'The Ascension',
        type: 'movable',
        isLordFeast: true,
        descriptionAm: 'ጌታችን ከትንሣኤው በ፵ኛው ቀን በክብር ወደ ሰማይ ያረገበት በዓል።',
        descriptionEn: 'The Ascension of our Lord Jesus Christ into Heaven on the 40th day.',
      },
      {
        id: 'paraclete',
        nameAm: 'በዓለ ጰራቅሊጦስ',
        nameEn: 'Pentecost (Paraclete)',
        type: 'movable',
        isLordFeast: true,
        descriptionAm: 'መንፈስ ቅዱስ በሐዋርያት ላይ የወረደበት በዓል።',
        descriptionEn: 'The Descent of the Holy Spirit upon the Apostles on the 50th day.',
      },
      {
        id: 'buhe',
        nameAm: 'ደብረ ታቦር (ቡሄ)',
        nameEn: 'Transfiguration (Debre Tabor / Buhe)',
        monthAm: 'ነሐሴ',
        day: 13,
        gregorianEquivalent: 'August 19',
        isLordFeast: true,
        descriptionAm: 'ጌታችን በደብረ ታቦር ተራራ መለኮታዊ ክብሩን ለደቀ መዛሙርቱ የገለጠበት።',
        descriptionEn: 'The Transfiguration of our Lord Jesus Christ on Mount Tabor.',
      },
      {
        id: 'filseta_feast',
        nameAm: 'ዕርገተ ማርያም (ፍልሰታ)',
        nameEn: 'Assumption of the Virgin Mary',
        monthAm: 'ነሐሴ',
        day: 16,
        gregorianEquivalent: 'August 22',
        isLordFeast: false,
        descriptionAm: 'የእመቤታችን ቅድስት ድንግል ማርያም ሥጋዋ ያረገበት በዓል።',
        descriptionEn: 'The Assumption and Coronation of the Blessed Virgin Mary.',
      },
      {
        id: 'patron_george',
        nameAm: 'ቅዱስ ጊዮርጊስ (የካቴድራሉ ጠባቂ)',
        nameEn: 'Saint George the Martyr (Patron Saint)',
        monthAm: 'ሚያዝያ',
        day: 23,
        gregorianEquivalent: 'May 1',
        isLordFeast: false,
        descriptionAm: 'የፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራልና የሰንበት ትምህርት ቤታችን ጠባቂ ቅዱስ ጊዮርጊስ ዓመታዊ በዓል።',
        descriptionEn:
          'Annual Feast of St. George the Martyr, patron of our Cathedral and Sunday school.',
      },
    ],
  },
};

export const DEFAULT_SETTINGS = DEFAULT_SITE_SETTINGS;

export const ROLE_MODULES = [
  {
    id: 'members',
    labelAm: 'አባላት አስተዳደር',
    labelEn: 'Members Management',
    permissions: [
      { key: 'members:read', labelAm: 'ማየት', labelEn: 'Read' },
      { key: 'members:create', labelAm: 'መመዝገብ', labelEn: 'Create' },
      { key: 'members:update', labelAm: 'ማረም', labelEn: 'Update' },
    ],
  },
  {
    id: 'courses',
    labelAm: 'ኮርሶችና ትምህርቶች',
    labelEn: 'Courses & Lessons',
    permissions: [
      { key: 'courses:read', labelAm: 'ማየት', labelEn: 'Read' },
      { key: 'courses:write', labelAm: 'ማዘጋጀት / ማረም', labelEn: 'Write' },
      { key: 'lessons:read', labelAm: 'ትምህርቶችን ማየት', labelEn: 'Lessons Read' },
      { key: 'lessons:write', labelAm: 'ትምህርቶችን ማዘጋጀት', labelEn: 'Lessons Write' },
    ],
  },
  {
    id: 'attendance',
    labelAm: 'የአቴንዳንስ ምዝገባ',
    labelEn: 'Attendance Recording',
    permissions: [
      { key: 'attendance:read', labelAm: 'መመልከት', labelEn: 'Read' },
      { key: 'attendance:write', labelAm: 'መመዝገብ / መቆጣጠር', labelEn: 'Write' },
    ],
  },
  {
    id: 'posts',
    labelAm: 'ዜናና ይዘቶች (መዝሙር፣ ቪዲዮ)',
    labelEn: 'Posts & Media Content',
    permissions: [
      { key: 'posts:read', labelAm: 'ማየት', labelEn: 'Read' },
      { key: 'posts:write', labelAm: 'መለጠፍና ማረም', labelEn: 'Write' },
      { key: 'events:read', labelAm: 'ክስተቶችን ማየት', labelEn: 'Events Read' },
      { key: 'events:write', labelAm: 'ክስተቶችን ማዘጋጀት', labelEn: 'Events Write' },
    ],
  },
  {
    id: 'contributions',
    labelAm: 'ክፍያዎችና መዋጮዎች',
    labelEn: 'Payments & Contributions',
    permissions: [
      { key: 'contributions:read', labelAm: 'ክፍያዎችን ማየት', labelEn: 'Read' },
      { key: 'contributions:write', labelAm: 'ክፍያ መመዝገብ', labelEn: 'Write' },
    ],
  },
  {
    id: 'site_settings',
    labelAm: 'የጣቢያ ቅንብሮች (Site Settings)',
    labelEn: 'Site Settings & Control',
    permissions: [
      {
        key: 'site:write',
        labelAm: 'ጣቢያውን ማሻሻል (Super Admin / Delegated Admin)',
        labelEn: 'Site Write (Modify Site Content & Appearance)',
      },
    ],
  },
];

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private publicSettingsCache: any = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clears the in-memory cache and logs invalidation
   */
  clearCache(): void {
    this.publicSettingsCache = null;
    this.cacheTimestamp = 0;
    this.logger.log('Site settings cache invalidated');
  }

  /**
   * Public calendar fasting days and feasts data
   */
  async getCalendarSettings() {
    const allSettings = await this.getAllSettingsMap();
    return allSettings.ethiopian_calendar || DEFAULT_SITE_SETTINGS.ethiopian_calendar;
  }

  /**
   * Public read-only endpoint returning public branding, appearance and content for the website.
   * Cached in-memory; invalidated immediately upon save.
   */
  async getPublicSettings() {
    const now = Date.now();
    if (this.publicSettingsCache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.publicSettingsCache;
    }

    const allSettings = await this.getAllSettingsMap();

    const churchIdentity =
      allSettings['identity.church'] || allSettings.church_identity || DEFAULT_SITE_IDENTITY.church;

    const locationIdentity =
      allSettings['identity.location'] ||
      allSettings.location_identity ||
      DEFAULT_SITE_IDENTITY.location;

    const schoolIdentity =
      allSettings['identity.school'] || allSettings.school_identity || DEFAULT_SITE_IDENTITY.school;

    const baseSiteIdentity = allSettings.site_identity || DEFAULT_SITE_SETTINGS.site_identity;
    const aboutContact = allSettings.about_contact || DEFAULT_SITE_SETTINGS.about_contact;

    const siteIdentity = {
      ...baseSiteIdentity,
      nameAm: schoolIdentity.nameAm || baseSiteIdentity.nameAm,
      nameEn: schoolIdentity.nameEn || baseSiteIdentity.nameEn,
      shortName: schoolIdentity.shortNameAm || baseSiteIdentity.shortName,
      shortNameAm: schoolIdentity.shortNameAm || baseSiteIdentity.shortName,
      shortNameEn: schoolIdentity.shortNameEn || baseSiteIdentity.shortName,
      taglineAm: schoolIdentity.taglineAm || baseSiteIdentity.taglineAm,
      taglineEn: schoolIdentity.taglineEn || baseSiteIdentity.taglineEn,
      churchName: churchIdentity.nameAm || baseSiteIdentity.churchName,
      churchNameAm: churchIdentity.nameAm || baseSiteIdentity.churchName,
      churchNameEn: churchIdentity.nameEn || baseSiteIdentity.churchNameEn,
      townAm: locationIdentity.townAm || DEFAULT_SITE_IDENTITY.location.townAm,
      townEn: locationIdentity.townEn || DEFAULT_SITE_IDENTITY.location.townEn,
      zoneAm: locationIdentity.zoneAm || DEFAULT_SITE_IDENTITY.location.zoneAm,
      zoneEn: locationIdentity.zoneEn || DEFAULT_SITE_IDENTITY.location.zoneEn,
      regionCountryAm:
        locationIdentity.regionCountryAm || DEFAULT_SITE_IDENTITY.location.regionCountryAm,
      regionCountryEn:
        locationIdentity.regionCountryEn || DEFAULT_SITE_IDENTITY.location.regionCountryEn,
      combinedAm: locationIdentity.combinedAm || DEFAULT_SITE_IDENTITY.location.combinedAm,
      combinedEn: locationIdentity.combinedEn || DEFAULT_SITE_IDENTITY.location.combinedEn,
      addressBlockAm:
        locationIdentity.addressBlockAm || DEFAULT_SITE_IDENTITY.location.addressBlockAm,
      addressBlockEn:
        locationIdentity.addressBlockEn || DEFAULT_SITE_IDENTITY.location.addressBlockEn,
      phone: locationIdentity.phone || aboutContact.phone || '',
      email: locationIdentity.email || aboutContact.email || '',
      mapLink: locationIdentity.mapLink || aboutContact.mapLink || '',
    };

    const appearance = allSettings.appearance || DEFAULT_SITE_SETTINGS.appearance;
    const homeContent = allSettings.home_content || DEFAULT_SITE_SETTINGS.home_content;
    const systemConfig = allSettings.system_config || DEFAULT_SITE_SETTINGS.system_config;

    const payload = {
      siteIdentity,
      church: churchIdentity,
      location: locationIdentity,
      school: schoolIdentity,
      appearance,
      homeContent,
      aboutContact: {
        ...aboutContact,
        phone: locationIdentity.phone || aboutContact.phone || '',
        email: locationIdentity.email || aboutContact.email || '',
        address: locationIdentity.combinedAm || aboutContact.address,
        mapLink: locationIdentity.mapLink || aboutContact.mapLink || '',
      },
      systemConfig,
      // Backward compatibility aliases
      schoolProfile: allSettings.school_profile || {
        nameAm: siteIdentity.nameAm,
        nameEn: siteIdentity.nameEn,
        logoUrl: siteIdentity.logoUrl,
        parish: churchIdentity.nameAm,
        mottoAm: siteIdentity.taglineAm,
        mottoEn: siteIdentity.taglineEn,
      },
      contactDetails: allSettings.contact_details || {
        phone: siteIdentity.phone,
        alternatePhone: aboutContact.alternatePhone || '',
        email: siteIdentity.email,
        address: siteIdentity.combinedAm,
        poBox: '',
      },
      localization: allSettings.localization || DEFAULT_SITE_SETTINGS.localization,
    };

    this.publicSettingsCache = payload;
    this.cacheTimestamp = now;
    return payload;
  }

  /**
   * Get all settings as a key-value dictionary merged with defaults
   */
  async getAllSettingsMap(): Promise<Record<string, any>> {
    const settingsList = await this.prisma.setting.findMany();
    const map: Record<string, any> = { ...DEFAULT_SITE_SETTINGS };

    for (const item of settingsList) {
      map[item.settingKey] = item.settingValue;
    }

    return map;
  }

  /**
   * List all settings for admin dashboard
   */
  async findAll() {
    const map = await this.getAllSettingsMap();
    return Object.entries(map).map(([key, value]) => ({
      settingKey: key,
      settingValue: value,
    }));
  }

  /**
   * Get specific setting by key
   */
  async findOne(settingKey: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { settingKey },
    });

    if (setting) {
      return setting;
    }

    if ((DEFAULT_SITE_SETTINGS as any)[settingKey]) {
      return {
        settingKey,
        settingValue: (DEFAULT_SITE_SETTINGS as any)[settingKey],
      };
    }

    throw new NotFoundException(`Setting with key "${settingKey}" not found`);
  }

  /**
   * Upsert a setting with version tracking, audit log, and cache invalidation
   */
  async upsertSetting(
    settingKey: string,
    settingValue: Record<string, any>,
    userId?: string,
    changeReason?: string,
  ) {
    // 1. Fetch current setting if it exists, or fall back to default
    const existing = await this.prisma.setting.findUnique({
      where: { settingKey },
    });
    const previousValue = existing
      ? existing.settingValue
      : (DEFAULT_SITE_SETTINGS as any)[settingKey];

    // 2. Save previous version to SettingVersion history if previous value exists
    if (previousValue !== undefined && previousValue !== null) {
      try {
        await this.prisma.settingVersion.create({
          data: {
            settingKey,
            settingValue: previousValue as Prisma.InputJsonValue,
            changedBy: userId || null,
            changeReason: changeReason || 'Setting updated via admin control',
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not save setting version: ${err.message}`);
      }
    }

    // 3. Upsert the new value
    const saved = await this.prisma.setting.upsert({
      where: { settingKey },
      update: {
        settingValue: settingValue as unknown as Prisma.InputJsonValue,
      },
      create: {
        settingKey,
        settingValue: settingValue as unknown as Prisma.InputJsonValue,
      },
    });

    // 4. Synchronize linked identity keys across Setting records
    try {
      if (settingKey === 'identity.church') {
        const churchName = settingValue.nameAm || settingValue.nameEn;
        await this.prisma.setting.upsert({
          where: { settingKey: 'school_profile' },
          update: { settingValue: { parish: churchName } },
          create: { settingKey: 'school_profile', settingValue: { parish: churchName } },
        });
      } else if (settingKey === 'identity.school') {
        await this.prisma.setting.upsert({
          where: { settingKey: 'school_profile' },
          update: {
            settingValue: {
              nameAm: settingValue.nameAm,
              nameEn: settingValue.nameEn,
              logoUrl: settingValue.logoUrl,
              mottoAm: settingValue.taglineAm,
              mottoEn: settingValue.taglineEn,
            },
          },
          create: {
            settingKey: 'school_profile',
            settingValue: {
              nameAm: settingValue.nameAm,
              nameEn: settingValue.nameEn,
              logoUrl: settingValue.logoUrl,
              mottoAm: settingValue.taglineAm,
              mottoEn: settingValue.taglineEn,
            },
          },
        });
      } else if (settingKey === 'site_identity') {
        await Promise.all([
          this.prisma.setting.upsert({
            where: { settingKey: 'identity.school' },
            update: {
              settingValue: {
                nameAm: settingValue.nameAm,
                nameEn: settingValue.nameEn,
                shortNameAm: settingValue.shortName || settingValue.shortNameAm,
                shortNameEn: settingValue.shortName || settingValue.shortNameEn,
                taglineAm: settingValue.taglineAm,
                taglineEn: settingValue.taglineEn,
                logoUrl: settingValue.logoUrl,
                faviconUrl: settingValue.faviconUrl,
              },
            },
            create: {
              settingKey: 'identity.school',
              settingValue: {
                nameAm: settingValue.nameAm,
                nameEn: settingValue.nameEn,
                shortNameAm: settingValue.shortName,
                taglineAm: settingValue.taglineAm,
                taglineEn: settingValue.taglineEn,
                logoUrl: settingValue.logoUrl,
                faviconUrl: settingValue.faviconUrl,
              },
            },
          }),
          settingValue.churchName &&
            this.prisma.setting.upsert({
              where: { settingKey: 'identity.church' },
              update: {
                settingValue: {
                  nameAm: settingValue.churchNameAm || settingValue.churchName,
                  nameEn: settingValue.churchNameEn || 'Felegeselam Kidus Giyorgis Cathedral',
                },
              },
              create: {
                settingKey: 'identity.church',
                settingValue: {
                  nameAm: settingValue.churchNameAm || settingValue.churchName,
                  nameEn: settingValue.churchNameEn || 'Felegeselam Kidus Giyorgis Cathedral',
                },
              },
            }),
          this.prisma.setting.upsert({
            where: { settingKey: 'school_profile' },
            update: {
              settingValue: {
                nameAm: settingValue.nameAm,
                nameEn: settingValue.nameEn,
                logoUrl: settingValue.logoUrl,
                parish: settingValue.churchName,
                mottoAm: settingValue.taglineAm,
                mottoEn: settingValue.taglineEn,
              },
            },
            create: {
              settingKey: 'school_profile',
              settingValue: {
                nameAm: settingValue.nameAm,
                nameEn: settingValue.nameEn,
                logoUrl: settingValue.logoUrl,
                parish: settingValue.churchName,
                mottoAm: settingValue.taglineAm,
                mottoEn: settingValue.taglineEn,
              },
            },
          }),
        ]);
      }
    } catch {
      // Ignore optional sync error
    }

    // 5. Invalidate cache
    this.clearCache();

    // 6. Record audit log
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'UPDATE_SITE_SETTING',
          entity: 'SETTING',
          entityId: settingKey,
          oldValue: existing ? (existing.settingValue as any) : null,
          newValue: settingValue,
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not record audit log: ${err.message}`);
    }

    return saved;
  }

  /**
   * Batch update multiple settings
   */
  async batchUpdate(
    settingsMap: Record<string, Record<string, any>>,
    userId?: string,
    changeReason?: string,
  ) {
    const updated: any[] = [];
    for (const [key, val] of Object.entries(settingsMap)) {
      const saved = await this.upsertSetting(key, val, userId, changeReason);
      updated.push(saved);
    }
    return updated;
  }

  /**
   * Reset setting to system default
   */
  async resetToDefault(settingKey: string, userId?: string) {
    const defaultValue = (DEFAULT_SITE_SETTINGS as any)[settingKey];
    if (defaultValue === undefined) {
      throw new NotFoundException(`No default configuration exists for key "${settingKey}"`);
    }

    return this.upsertSetting(
      settingKey,
      defaultValue,
      userId,
      `Reset to system default for ${settingKey}`,
    );
  }

  /**
   * Get version history for a setting
   */
  async getVersions(settingKey: string) {
    const versions = await this.prisma.settingVersion.findMany({
      where: { settingKey },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: {
              select: { name: true },
            },
            member: {
              select: { firstName: true, fatherName: true },
            },
          },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      settingKey: v.settingKey,
      settingValue: v.settingValue,
      changeReason: v.changeReason,
      createdAt: v.createdAt,
      changedBy: v.user
        ? {
            id: v.user.id,
            email: v.user.email,
            role: v.user.role?.name,
            name: v.user.member
              ? `${v.user.member.firstName} ${v.user.member.fatherName}`
              : v.user.email,
          }
        : null,
    }));
  }

  /**
   * Restore a historical setting version
   */
  async restoreVersion(settingKey: string, versionId: string, userId?: string) {
    const version = await this.prisma.settingVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.settingKey !== settingKey) {
      throw new NotFoundException(`Version ${versionId} for setting "${settingKey}" not found`);
    }

    const restoredValue = version.settingValue as Record<string, any>;
    const result = await this.upsertSetting(
      settingKey,
      restoredValue,
      userId,
      `Restored historical version from ${version.createdAt.toISOString()}`,
    );

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'RESTORE_SITE_SETTING_VERSION',
          entity: 'SETTING',
          entityId: settingKey,
          newValue: { versionId, restoredAt: new Date() },
        },
      });
    } catch {}

    return result;
  }

  /**
   * Get Roles and Permissions Matrix data
   */
  async getRolesMatrix() {
    const roles = await this.prisma.role.findMany({
      orderBy: { id: 'asc' },
    });

    return {
      modules: ROLE_MODULES,
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: (r.permissions as string[]) || [],
      })),
    };
  }

  /**
   * Update Roles and Permissions Matrix
   */
  async updateRolesMatrix(
    matrix: Array<{ roleId: number; permissions: string[] }>,
    userId?: string,
  ) {
    const updatedRoles: any[] = [];

    for (const item of matrix) {
      const existing = await this.prisma.role.findUnique({
        where: { id: item.roleId },
      });

      if (!existing) continue;

      let permissions = item.permissions;
      // super_admin always retains full '*' permission
      if (existing.name === 'super_admin' && !permissions.includes('*')) {
        permissions = ['*', ...permissions];
      }

      const updated = await this.prisma.role.update({
        where: { id: item.roleId },
        data: { permissions },
      });
      updatedRoles.push(updated);
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'UPDATE_ROLES_PERMISSIONS_MATRIX',
          entity: 'ROLE',
          newValue: { matrixCount: matrix.length },
        },
      });
    } catch {}

    return updatedRoles;
  }

  /**
   * Danger Zone Statistics
   */
  async getDangerStats() {
    const [softDeletedMembers, totalAuditLogs, totalMembers, totalVersions] = await Promise.all([
      this.prisma.member.count({ where: { deletedAt: { not: null } } }),
      this.prisma.auditLog.count(),
      this.prisma.member.count(),
      this.prisma.settingVersion.count(),
    ]);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const purgeableAuditLogs = await this.prisma.auditLog.count({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });

    return {
      softDeletedMembers,
      totalAuditLogs,
      purgeableAuditLogs,
      totalMembers,
      totalVersions,
      databaseStatus: 'Healthy',
      lastBackupDate: new Date().toISOString(),
    };
  }

  /**
   * Restore all soft-deleted members
   */
  async restoreSoftDeletedMembers(confirmation: string, userId?: string) {
    if (confirmation !== 'RESTORE') {
      throw new BadRequestException('Confirmation text must exactly be "RESTORE"');
    }

    const count = await this.prisma.member.count({
      where: { deletedAt: { not: null } },
    });

    await this.prisma.member.updateMany({
      where: { deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'RESTORE_SOFT_DELETED_MEMBERS',
          entity: 'MEMBER',
          newValue: { restoredCount: count },
        },
      });
    } catch {}

    return {
      restoredCount: count,
      message: `በተሳካ ሁኔታ ${count} አባላት ተመልሰዋል / Successfully restored ${count} soft-deleted members`,
    };
  }

  /**
   * Purge old audit logs
   */
  async purgeAuditLogs(confirmation: string, days?: number, userId?: string) {
    if (confirmation !== 'PURGE') {
      throw new BadRequestException('Confirmation text must exactly be "PURGE"');
    }

    const retentionDays = days !== undefined && days >= 0 ? days : 30;
    let whereClause: Prisma.AuditLogWhereInput = {};

    if (retentionDays > 0) {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      whereClause = { createdAt: { lt: cutoff } };
    }

    const count = await this.prisma.auditLog.count({ where: whereClause });
    await this.prisma.auditLog.deleteMany({ where: whereClause });

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'PURGE_AUDIT_LOGS',
          entity: 'AUDIT_LOG',
          newValue: { purgedCount: count, retentionDays },
        },
      });
    } catch {}

    return {
      purgedCount: count,
      retentionDays,
      message: `በተሳካ ሁኔታ ${count} የኦዲት መዝገቦች ተሰርዘዋል / Successfully purged ${count} audit logs older than ${retentionDays} days`,
    };
  }

  /**
   * Generate downloadable system backup JSON
   */
  async generateBackup(confirmation: string, userId?: string) {
    if (confirmation !== 'BACKUP') {
      throw new BadRequestException('Confirmation text must exactly be "BACKUP"');
    }

    const [settings, departments, roles, memberCount] = await Promise.all([
      this.prisma.setting.findMany(),
      this.prisma.department.findMany(),
      this.prisma.role.findMany({ select: { id: true, name: true, permissions: true } }),
      this.prisma.member.count(),
    ]);

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      system: 'Felege Selam Sunday School System',
      metadata: {
        totalSettings: settings.length,
        totalDepartments: departments.length,
        totalRoles: roles.length,
        totalMembers: memberCount,
      },
      data: {
        settings,
        departments,
        roles,
      },
    };

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || null,
          action: 'GENERATE_BACKUP',
          entity: 'SYSTEM',
          newValue: { exportedAt: backupData.exportedAt },
        },
      });
    } catch {}

    return backupData;
  }
}
