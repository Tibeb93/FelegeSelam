'use client';

import { useSiteSettings, DEFAULT_SITE_SETTINGS } from '../providers/SiteSettingsProvider';

export interface SiteIdentityHookResult {
  schoolName: string;
  schoolNameAm: string;
  schoolNameEn: string;
  churchName: string;
  churchNameAm: string;
  churchNameEn: string;
  town: string;
  townAm: string;
  townEn: string;
  zone: string;
  zoneAm: string;
  zoneEn: string;
  regionCountry: string;
  regionCountryAm: string;
  regionCountryEn: string;
  combinedLine: string;
  combinedLineAm: string;
  combinedLineEn: string;
  tagline: string;
  taglineAm: string;
  taglineEn: string;
  logoUrl: string;
  faviconUrl: string;
  phone: string;
  alternatePhone: string;
  email: string;
  address: string;
  mapLink: string;
  hasPhone: boolean;
  hasEmail: boolean;
  hasMapLink: boolean;
  hasContactInfo: boolean;
  settings: any;
  isLoading: boolean;
  refetchSettings: () => void;
}

export function useSiteIdentity(currentLocale?: string): SiteIdentityHookResult {
  const { settings, isLoading, refetchSettings } = useSiteSettings();
  const isEn = currentLocale === 'en';

  const schoolNameAm =
    settings.school?.nameAm ||
    settings.siteIdentity?.nameAm ||
    DEFAULT_SITE_SETTINGS.siteIdentity.nameAm;
  const schoolNameEn =
    settings.school?.nameEn ||
    settings.siteIdentity?.nameEn ||
    DEFAULT_SITE_SETTINGS.siteIdentity.nameEn;
  const schoolName = isEn ? schoolNameEn : schoolNameAm;

  const churchNameAm =
    settings.church?.nameAm ||
    settings.siteIdentity?.churchName ||
    DEFAULT_SITE_SETTINGS.church?.nameAm ||
    'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል';
  const churchNameEn =
    settings.church?.nameEn ||
    DEFAULT_SITE_SETTINGS.church?.nameEn ||
    'Felegeselam Kidus Giyorgis Cathedral';
  const churchName = isEn ? churchNameEn : churchNameAm;

  const townAm =
    settings.location?.townAm ||
    DEFAULT_SITE_SETTINGS.location?.townAm ||
    'ፍኖተ ሰላም';
  const townEn =
    settings.location?.townEn ||
    DEFAULT_SITE_SETTINGS.location?.townEn ||
    'Finote Selam';
  const town = isEn ? townEn : townAm;

  const zoneAm =
    settings.location?.zoneAm ||
    DEFAULT_SITE_SETTINGS.location?.zoneAm ||
    'ምዕራብ ጎጃም ዞን';
  const zoneEn =
    settings.location?.zoneEn ||
    DEFAULT_SITE_SETTINGS.location?.zoneEn ||
    'West Gojjam Zone';
  const zone = isEn ? zoneEn : zoneAm;

  const regionCountryAm =
    settings.location?.regionCountryAm ||
    DEFAULT_SITE_SETTINGS.location?.regionCountryAm ||
    'አማራ ክልል፣ ኢትዮጵያ';
  const regionCountryEn =
    settings.location?.regionCountryEn ||
    DEFAULT_SITE_SETTINGS.location?.regionCountryEn ||
    'Amhara Region, Ethiopia';
  const regionCountry = isEn ? regionCountryEn : regionCountryAm;

  const combinedLineAm =
    settings.location?.combinedAm ||
    `${churchNameAm}፣ ${townAm}፣ ምዕራብ ጎጃም`;
  const combinedLineEn =
    settings.location?.combinedEn ||
    `${churchNameEn}, ${townEn}, West Gojjam`;
  const combinedLine = isEn ? combinedLineEn : combinedLineAm;

  const taglineAm =
    settings.school?.taglineAm ||
    settings.siteIdentity?.taglineAm ||
    DEFAULT_SITE_SETTINGS.siteIdentity.taglineAm;
  const taglineEn =
    settings.school?.taglineEn ||
    settings.siteIdentity?.taglineEn ||
    DEFAULT_SITE_SETTINGS.siteIdentity.taglineEn;
  const tagline = isEn ? taglineEn : taglineAm;

  const logoUrl =
    settings.siteIdentity?.logoUrl ||
    DEFAULT_SITE_SETTINGS.siteIdentity.logoUrl;
  const faviconUrl =
    settings.siteIdentity?.faviconUrl ||
    DEFAULT_SITE_SETTINGS.siteIdentity.faviconUrl;

  const phone = settings.aboutContact?.phone || '';
  const alternatePhone = settings.aboutContact?.alternatePhone || '';
  const email = settings.aboutContact?.email || '';
  const address = isEn
    ? settings.location?.addressBlockEn ||
      settings.siteIdentity?.addressBlockEn ||
      settings.aboutContact?.address ||
      `${churchNameEn}, ${townEn}, ${zoneEn}, ${regionCountryEn}`
    : settings.location?.addressBlockAm ||
      settings.siteIdentity?.addressBlockAm ||
      settings.aboutContact?.address ||
      `${churchNameAm}፣ ${townAm}፣ ${zoneAm}፣ ${regionCountryAm}`;
  const mapLink = settings.aboutContact?.mapLink || '';

  const hasPhone = Boolean(phone && phone.trim().length > 0);
  const hasEmail = Boolean(email && email.trim().length > 0);
  const hasMapLink = Boolean(mapLink && mapLink.trim().length > 0);
  const hasContactInfo = hasPhone || hasEmail || hasMapLink;

  return {
    schoolName,
    schoolNameAm,
    schoolNameEn,
    churchName,
    churchNameAm,
    churchNameEn,
    town,
    townAm,
    townEn,
    zone,
    zoneAm,
    zoneEn,
    regionCountry,
    regionCountryAm,
    regionCountryEn,
    combinedLine,
    combinedLineAm,
    combinedLineEn,
    tagline,
    taglineAm,
    taglineEn,
    logoUrl,
    faviconUrl,
    phone,
    alternatePhone,
    email,
    address,
    mapLink,
    hasPhone,
    hasEmail,
    hasMapLink,
    hasContactInfo,
    settings,
    isLoading,
    refetchSettings,
  };
}
