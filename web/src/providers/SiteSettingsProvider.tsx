'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useLiveEvents } from '../hooks/useLiveEvents';

export interface SiteIdentity {
  nameAm: string;
  nameEn: string;
  shortName: string;
  taglineAm: string;
  taglineEn: string;
  churchName: string;
  logoUrl: string;
  faviconUrl: string;
  addressBlockAm?: string;
  addressBlockEn?: string;
}

export interface ChurchIdentity {
  nameAm: string;
  nameEn: string;
  cathedral: boolean;
  patronSaintAm: string;
  patronSaintEn: string;
}

export interface LocationIdentity {
  townAm: string;
  townEn: string;
  zoneAm: string;
  zoneEn: string;
  regionCountryAm: string;
  regionCountryEn: string;
  combinedAm: string;
  combinedEn: string;
  addressBlockAm?: string;
  addressBlockEn?: string;
  latitude: string;
  longitude: string;
}

export interface SchoolIdentity {
  nameAm: string;
  nameEn: string;
  shortNameAm: string;
  shortNameEn: string;
  taglineAm: string;
  taglineEn: string;
  establishedYearEt: number;
}

export interface AppearanceSettings {
  heroBackgroundType: 'gradient' | 'image' | 'solid';
  heroBackgroundImage: string | null;
  heroOverlayOpacity: number;
  heroSolidColor: string;
  primaryColor: string;
  accentColor: string;
  primaryDark: string;
  primaryLight: string;
  softBg: string;
}

export interface HomeSection {
  id: string;
  enabled: boolean;
  titleAm: string;
  titleEn: string;
  order: number;
}

export interface HomeContent {
  heroTitleAm: string;
  heroTitleEn: string;
  heroSubtitleAm: string;
  heroSubtitleEn: string;
  welcomeMessageAm: string;
  welcomeMessageEn: string;
  primaryCtaTextAm: string;
  primaryCtaTextEn: string;
  primaryCtaLink: string;
  secondaryCtaTextAm: string;
  secondaryCtaTextEn: string;
  secondaryCtaLink: string;
  sections: HomeSection[];
  announcement: {
    enabled: boolean;
    textAm: string;
    textEn: string;
    type: 'info' | 'warning' | 'success';
    link?: string;
  };
}

export interface AboutContactSettings {
  aboutAm: string;
  aboutEn: string;
  missionAm: string;
  missionEn: string;
  visionAm: string;
  visionEn: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  mapLink: string;
  socialLinks: {
    telegram?: string;
    youtube?: string;
    facebook?: string;
    tiktok?: string;
  };
  footerCopyrightAm: string;
  footerCopyrightEn: string;
}

export interface SystemConfigSettings {
  defaultLanguage: 'am' | 'en';
  maintenanceMode: boolean;
  maintenanceMessageAm: string;
  maintenanceMessageEn: string;
  sessionTimeoutMinutes: number;
  adminIpAllowlist: string;
}

export interface PublicSettingsResponse {
  siteIdentity: SiteIdentity;
  appearance: AppearanceSettings;
  homeContent: HomeContent;
  aboutContact: AboutContactSettings;
  systemConfig: SystemConfigSettings;
  church?: ChurchIdentity;
  location?: LocationIdentity;
  school?: SchoolIdentity;
  siteIdentityCombined?: {
    school: SchoolIdentity;
    church: ChurchIdentity;
    location: LocationIdentity;
  };
  schoolProfile?: any;
  contactDetails?: any;
  localization?: any;
}

export const DEFAULT_SITE_SETTINGS: PublicSettingsResponse = {
  siteIdentity: {
    nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    nameEn: 'Aemade Selam Sunday School',
    shortName: 'አዕማደ ሰላም',
    taglineAm: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ',
    taglineEn: 'Firm in Faith, Shining in Good Deeds',
    churchName: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
    logoUrl: '/uploads/branding/logo.png',
    faviconUrl: '/favicon.ico',
  },
  church: {
    nameAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
    nameEn: 'Felegeselam Kidus Giyorgis Cathedral',
    cathedral: true,
    patronSaintAm: 'ቅዱስ ጊዮርጊስ',
    patronSaintEn: 'Saint George',
  },
  location: {
    townAm: 'ፍኖተ ሰላም',
    townEn: 'Finote Selam',
    zoneAm: 'ምዕራብ ጎጃም ዞን',
    zoneEn: 'West Gojjam Zone',
    regionCountryAm: 'አማራ ክልል፣ ኢትዮጵያ',
    regionCountryEn: 'Amhara Region, Ethiopia',
    combinedAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
    combinedEn: 'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam',
    latitude: '',
    longitude: '',
  },
  school: {
    nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    nameEn: 'Aemade Selam Sunday School',
    shortNameAm: 'አዕማደ ሰላም',
    shortNameEn: 'Aemade Selam',
    taglineAm: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ',
    taglineEn: 'Firm in Faith, Shining in Good Deeds',
    establishedYearEt: 2000,
  },
  appearance: {
    heroBackgroundType: 'gradient',
    heroBackgroundImage: null,
    heroOverlayOpacity: 65,
    heroSolidColor: '#0A2E52',
    primaryColor: '#0F4C81',
    accentColor: '#F2B233',
    primaryDark: '#0A2E52',
    primaryLight: '#1E78C8',
    softBg: '#E8F1FB',
  },
  homeContent: {
    heroTitleAm: 'እንኳን ወደ ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል ሰንበት ትምህርት ቤት በደህና መጡ',
    heroTitleEn: 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral',
    heroSubtitleAm: 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን እምነትና ሥርዓት የሚማሩበትና መንፈሳዊ ሕይወትዎን የሚያዳብሩበት መድረክ',
    heroSubtitleEn: 'A platform to learn the faith and order of the Ethiopian Orthodox Tewahedo Church and cultivate spiritual growth',
    welcomeMessageAm: 'በሰላም መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።',
    welcomeMessageEn: 'Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam.',
    primaryCtaTextAm: 'የአባላት ምዝገባ',
    primaryCtaTextEn: 'Member Registration',
    primaryCtaLink: '/register',
    secondaryCtaTextAm: 'ትምህርቶችን ይመልከቱ',
    secondaryCtaTextEn: 'Explore Courses',
    secondaryCtaLink: '/courses',
    sections: [
      { id: 'sinksar', enabled: true, titleAm: 'የዕለቱ ስንክሳር', titleEn: "Today's Synaxarium", order: 1 },
      { id: 'news', enabled: true, titleAm: 'ዜናዎችና ማስታወቂያዎች', titleEn: 'News & Announcements', order: 2 },
      { id: 'courses', enabled: true, titleAm: 'የሚሰጡ ትምህርቶች', titleEn: 'Featured Courses', order: 3 },
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
  aboutContact: {
    aboutAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት በፍኖተ ሰላም ከተማ በሚገኘው በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል ስር የሚገኝ መንፈሳዊ ተቋም ሲሆን ወጣቶችንና ምዕመናንን በሃይማኖትና በምግባር ለማነጽ ይሠራል።',
    aboutEn: 'Aemade Selam Sunday School is a spiritual institution under Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam, dedicated to edifying youth and parishioners in Orthodox faith and virtuous deeds.',
    missionAm: 'ሕፃናትንና ወጣቶችን በኦርቶዶክሳዊት ተዋሕዶ እምነት ማነጽና ለቤተክርስቲያንና ለአገር የሚጠቅሙ ዜጎች ማድረግ።',
    missionEn: 'Nurturing children and youth in Orthodox Tewahedo faith and shaping productive citizens for Church and society.',
    visionAm: 'በሃይማኖት የጸና፣ በምግባር ያበራና በትምህርት የበለጸገ መንፈሳዊ ትውልድ ማየት።',
    visionEn: 'To see a spiritual generation steadfast in faith, radiant in virtuous deeds, and enriched in divine knowledge.',
    phone: '',
    alternatePhone: '',
    email: '',
    address: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም፣ አማራ ክልል፣ ኢትዮጵያ',
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
  systemConfig: {
    defaultLanguage: 'am',
    maintenanceMode: false,
    maintenanceMessageAm: 'ጣቢያችን ለጊዜያዊ እድሳት ተዘግቷል። በቅርቡ እንመለሳለን!',
    maintenanceMessageEn: 'Our website is currently undergoing scheduled maintenance. We will be back shortly!',
    sessionTimeoutMinutes: 30,
    adminIpAllowlist: '',
  },
};

interface SiteSettingsContextType {
  settings: PublicSettingsResponse;
  isLoading: boolean;
  refetchSettings: () => void;
  schoolName: (locale?: string) => string;
  tagline: (locale?: string) => string;
  churchName: (locale?: string) => string;
  town: (locale?: string) => string;
  zone: (locale?: string) => string;
  regionCountry: (locale?: string) => string;
  combinedLine: (locale?: string) => string;
  logoUrl: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SITE_SETTINGS,
  isLoading: false,
  refetchSettings: () => {},
  schoolName: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.siteIdentity.nameEn : DEFAULT_SITE_SETTINGS.siteIdentity.nameAm),
  tagline: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.siteIdentity.taglineEn : DEFAULT_SITE_SETTINGS.siteIdentity.taglineAm),
  churchName: (locale) => (locale === 'en' ? (DEFAULT_SITE_SETTINGS.church?.nameEn || DEFAULT_SITE_SETTINGS.siteIdentity.churchName) : (DEFAULT_SITE_SETTINGS.church?.nameAm || DEFAULT_SITE_SETTINGS.siteIdentity.churchName)),
  town: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.location?.townEn || 'Finote Selam' : DEFAULT_SITE_SETTINGS.location?.townAm || 'ፍኖተ ሰላም'),
  zone: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.location?.zoneEn || 'West Gojjam Zone' : DEFAULT_SITE_SETTINGS.location?.zoneAm || 'ምዕራብ ጎጃም ዞን'),
  regionCountry: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.location?.regionCountryEn || 'Amhara Region, Ethiopia' : DEFAULT_SITE_SETTINGS.location?.regionCountryAm || 'አማራ ክልል፣ ኢትዮጵያ'),
  combinedLine: (locale) => (locale === 'en' ? DEFAULT_SITE_SETTINGS.location?.combinedEn || 'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam' : DEFAULT_SITE_SETTINGS.location?.combinedAm || 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም'),
  logoUrl: DEFAULT_SITE_SETTINGS.siteIdentity.logoUrl,
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  useLiveEvents();

  const { data, isLoading } = useQuery<PublicSettingsResponse>({
    queryKey: ['public-settings'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PublicSettingsResponse>('/settings/public');
        return res;
      } catch {
        return DEFAULT_SITE_SETTINGS;
      }
    },
    staleTime: 60 * 1000, // 60s fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache retention
    refetchOnWindowFocus: false,
  });

  const settings = data || DEFAULT_SITE_SETTINGS;

  // Helper to convert hex color to HSL channels (e.g., "208 79% 28%")
  const hexToHslChannels = (color: string): string | null => {
    if (!color) return null;
    if (/^\d+\s+\d+%\s+\d+%$/.test(color.trim())) {
      return color.trim();
    }
    let cleaned = color.replace('#', '').trim();
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map((c) => c + c).join('');
    }
    if (cleaned.length !== 6) return null;

    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
          break;
        case g:
          h = ((b - r) / delta + 2) * 60;
          break;
        case b:
          h = ((r - g) / delta + 4) * 60;
          break;
      }
    }

    const hDeg = Math.round(h);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return `${hDeg} ${sPct}% ${lPct}%`;
  };

  // Apply custom theme colors if set
  useEffect(() => {
    if (typeof window === 'undefined' || !settings.appearance) return;
    const { primaryColor, accentColor, primaryDark, primaryLight, softBg } = settings.appearance;
    const root = document.documentElement;

    if (primaryColor) {
      root.style.setProperty('--color-primary-700', primaryColor);
      const hsl = hexToHslChannels(primaryColor);
      if (hsl) {
        root.style.setProperty('--primary', hsl);
      }
    }
    if (accentColor) {
      root.style.setProperty('--color-accent-gold', accentColor);
      const hsl = hexToHslChannels(accentColor);
      if (hsl) {
        root.style.setProperty('--accent', hsl);
        root.style.setProperty('--secondary', hsl);
      }
    }
    if (primaryDark) {
      root.style.setProperty('--color-primary-900', primaryDark);
    }
    if (primaryLight) {
      root.style.setProperty('--color-primary-500', primaryLight);
    }
    if (softBg) {
      root.style.setProperty('--color-primary-100', softBg);
    }
  }, [settings.appearance]);

  const schoolName = (locale?: string) => {
    return locale === 'en'
      ? settings.siteIdentity?.nameEn || DEFAULT_SITE_SETTINGS.siteIdentity.nameEn
      : settings.siteIdentity?.nameAm || DEFAULT_SITE_SETTINGS.siteIdentity.nameAm;
  };

  const tagline = (locale?: string) => {
    return locale === 'en'
      ? settings.siteIdentity?.taglineEn || DEFAULT_SITE_SETTINGS.siteIdentity.taglineEn
      : settings.siteIdentity?.taglineAm || DEFAULT_SITE_SETTINGS.siteIdentity.taglineAm;
  };

  const churchName = (locale?: string) => {
    if (locale === 'en') {
      return settings.church?.nameEn || settings.siteIdentity?.churchName || DEFAULT_SITE_SETTINGS.church?.nameEn || 'Felegeselam Kidus Giyorgis Cathedral';
    }
    return settings.church?.nameAm || settings.siteIdentity?.churchName || DEFAULT_SITE_SETTINGS.church?.nameAm || 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል';
  };

  const town = (locale?: string) => {
    return locale === 'en'
      ? settings.location?.townEn || DEFAULT_SITE_SETTINGS.location?.townEn || 'Finote Selam'
      : settings.location?.townAm || DEFAULT_SITE_SETTINGS.location?.townAm || 'ፍኖተ ሰላም';
  };

  const zone = (locale?: string) => {
    return locale === 'en'
      ? settings.location?.zoneEn || DEFAULT_SITE_SETTINGS.location?.zoneEn || 'West Gojjam Zone'
      : settings.location?.zoneAm || DEFAULT_SITE_SETTINGS.location?.zoneAm || 'ምዕራብ ጎጃም ዞን';
  };

  const regionCountry = (locale?: string) => {
    return locale === 'en'
      ? settings.location?.regionCountryEn || DEFAULT_SITE_SETTINGS.location?.regionCountryEn || 'Amhara Region, Ethiopia'
      : settings.location?.regionCountryAm || DEFAULT_SITE_SETTINGS.location?.regionCountryAm || 'አማራ ክልል፣ ኢትዮጵያ';
  };

  const combinedLine = (locale?: string) => {
    return locale === 'en'
      ? settings.location?.combinedEn || DEFAULT_SITE_SETTINGS.location?.combinedEn || 'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam'
      : settings.location?.combinedAm || DEFAULT_SITE_SETTINGS.location?.combinedAm || 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም';
  };

  const logoUrl = settings.siteIdentity?.logoUrl || DEFAULT_SITE_SETTINGS.siteIdentity.logoUrl;

  const refetchSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['public-settings'] });
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        isLoading,
        refetchSettings,
        schoolName,
        tagline,
        churchName,
        town,
        zone,
        regionCountry,
        combinedLine,
        logoUrl,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
