import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export const DEFAULT_SETTINGS = {
  school_profile: {
    nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    nameEn: 'Aemade Selam Sunday School',
    logoUrl: '/uploads/branding/logo.png',
    parish: 'ደብረ ሰላም ቅዱስ እስጢፋኖስ',
    mottoAm: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ',
    mottoEn: 'Firm in Faith, Shining in Good Deeds',
  },
  contact_details: {
    phone: '+251 91 123 4567',
    alternatePhone: '+251 11 551 2345',
    email: 'info@aemadeselam.org',
    address: 'አዲስ አበባ, ኢትዮጵያ',
    poBox: '1234',
  },
  localization: {
    defaultLanguage: 'am',
    supportedLanguages: ['am', 'en'],
    timezone: 'Africa/Addis_Ababa',
    calendar: 'ethiopian',
  },
  system_config: {
    allowSelfRegistration: true,
    requireAdminApproval: true,
    maintenanceMode: false,
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
        id: 'patron_stephen',
        nameAm: 'ቅዱስ እስጢፋኖስ (ቀዳሜ ሰማዕት)',
        nameEn: 'Saint Stephen Protomartyr (Patron Saint)',
        monthAm: 'ታኅሣሥ',
        day: 17,
        gregorianEquivalent: 'December 26',
        isLordFeast: false,
        descriptionAm: 'የሰንበት ትምህርት ቤታችን ጠባቂ ቅዱስ እስጢፋኖስ ቀዳሜ ሰማዕት ዓመታዊ በዓል።',
        descriptionEn: 'Annual Feast of St. Stephen the Protomartyr, patron of our Sunday school.',
      },
    ],
    monthlyFeasts: [
      { day: 1, nameAm: 'ልደታ ለማርያም / ቅዱስ ራጉኤል', nameEn: 'Lideta Mary / St. Raguel' },
      { day: 2, nameAm: 'ታዴዎስ ሐዋርያ', nameEn: 'Thaddaeus the Apostle' },
      { day: 3, nameAm: 'በዓታ ለማርያም', nameEn: 'Ba’ata Mary (Entrance of Mary)' },
      { day: 4, nameAm: 'ዮሐንስ ወልደ ነጐድጓድ', nameEn: 'John the Evangelist' },
      { day: 5, nameAm: 'አቡነ ገብረ መንፈስ ቅዱስ / ጴጥሮስ ወጳውሎስ', nameEn: 'Abune Gebre Menfes Qiddus' },
      { day: 6, nameAm: 'ቅድስት አርሴማ / ኢየሱስ', nameEn: 'St. Arsema' },
      { day: 7, nameAm: 'ሥላሴ (አብ፣ ወልድ፣ መንፈስ ቅዱስ)', nameEn: 'The Holy Trinity (Selassie)' },
      { day: 8, nameAm: 'አባ ኪሮስ / ዮልያኖስ', nameEn: 'Abba Kiros' },
      { day: 9, nameAm: 'ቶማስ ሐዋርያ / ሠለስቱ ምዕት', nameEn: 'Thomas the Apostle' },
      { day: 10, nameAm: 'መስቀለ ክርስቶስ', nameEn: 'Holy Cross' },
      { day: 11, nameAm: 'ቅድስት ሐና ወኢያቄም', nameEn: 'St. Anne and Joachim' },
      { day: 12, nameAm: 'ቅዱስ ሚካኤል ሊቀ መላእክት', nameEn: 'Archangel Michael' },
      { day: 13, nameAm: 'እግዚአብሔር አብ / ቅዱስ ሩፋኤል', nameEn: 'God the Father / St. Raphael' },
      { day: 14, nameAm: 'አቡነ አረጋዊ / ገብረ ክርስቶስ', nameEn: 'Abune Aregawi' },
      { day: 15, nameAm: 'ቅዱስ ቂርቆስ ወኢየሉጣ', nameEn: 'St. Qirqos and Julitta' },
      { day: 16, nameAm: 'ኪዳነ ምሕረት', nameEn: 'Kidane Mihret (Covenant of Mercy)' },
      { day: 17, nameAm: 'ቅዱስ እስጢፋኖስ / ያዕቆብ', nameEn: 'St. Stephen Protomartyr' },
      { day: 18, nameAm: 'ተክለ አልፋ / ፊልጶስ ሐዋርያ', nameEn: 'St. Philip the Apostle' },
      { day: 19, nameAm: 'ቅዱስ ገብርኤል ሊቀ መላእክት', nameEn: 'Archangel Gabriel' },
      { day: 20, nameAm: 'ሕንፀተ ቤተክርስቲያን', nameEn: 'Dedication of the Church' },
      { day: 21, nameAm: 'እግዝእትነ ማርያም (ማርያም)', nameEn: 'Our Lady Mary (Mariam)' },
      { day: 22, nameAm: 'ቅዱስ ዑራኤል / ደቅስዮስ', nameEn: 'Archangel Uriel' },
      { day: 23, nameAm: 'ቅዱስ ጊዮርጊስ ኃያል', nameEn: 'St. George the Martyr' },
      { day: 24, nameAm: 'አቡነ ተክለ ሃይማኖት', nameEn: 'Abune Tekle Haymanot' },
      { day: 25, nameAm: 'መርቆሬዎስ ሠማዕት', nameEn: 'St. Mercurius' },
      { day: 26, nameAm: 'ሆሴዕ ነቢይ / ቶማስ ዘመርዓስ', nameEn: 'Hosea the Prophet' },
      { day: 27, nameAm: 'መድኃኔዓለም', nameEn: 'Medhane Alem (Savior of the World)' },
      { day: 28, nameAm: 'አማኑኤል / አብርሃም ይስሐቅ ያዕቆብ', nameEn: 'Emmanuel' },
      { day: 29, nameAm: 'በዓለ ወልድ / ቅዱስ ጴጥሮስ', nameEn: 'Be’ale Wold' },
      { day: 30, nameAm: 'ዮሐንስ መጥምቅ / ማርቆስ ወንጌላዊ', nameEn: 'St. John the Baptist' },
    ],
  },
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public calendar fasting days and feasts data
   */
  async getCalendarSettings() {
    const allSettings = await this.getAllSettingsMap();
    return allSettings.ethiopian_calendar || DEFAULT_SETTINGS.ethiopian_calendar;
  }

  /**
   * Public read-only endpoint returning public branding and contact details for website
   */
  async getPublicSettings() {
    const allSettings = await this.getAllSettingsMap();

    return {
      schoolProfile: allSettings.school_profile || DEFAULT_SETTINGS.school_profile,
      contactDetails: allSettings.contact_details || DEFAULT_SETTINGS.contact_details,
      localization: allSettings.localization || DEFAULT_SETTINGS.localization,
    };
  }

  /**
   * Get all settings as a key-value dictionary
   */
  async getAllSettingsMap(): Promise<Record<string, any>> {
    const settingsList = await this.prisma.setting.findMany();
    const map: Record<string, any> = { ...DEFAULT_SETTINGS };

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

    if ((DEFAULT_SETTINGS as any)[settingKey]) {
      return {
        settingKey,
        settingValue: (DEFAULT_SETTINGS as any)[settingKey],
      };
    }

    throw new NotFoundException(`Setting with key "${settingKey}" not found`);
  }

  /**
   * Upsert a setting
   */
  async upsertSetting(settingKey: string, settingValue: Record<string, any>) {
    return this.prisma.setting.upsert({
      where: { settingKey },
      update: {
        settingValue: settingValue as unknown as Prisma.InputJsonValue,
      },
      create: {
        settingKey,
        settingValue: settingValue as unknown as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Batch update multiple settings
   */
  async batchUpdate(settingsMap: Record<string, Record<string, any>>) {
    const updated: any[] = [];
    for (const [key, val] of Object.entries(settingsMap)) {
      const saved = await this.upsertSetting(key, val);
      updated.push(saved);
    }
    return updated;
  }
}
