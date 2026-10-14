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
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
