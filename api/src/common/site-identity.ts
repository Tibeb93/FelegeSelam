/**
 * Single source of truth for Church, School, and Location Identity
 * Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam
 */

export interface ISchoolIdentity {
  nameAm: string;
  nameEn: string;
  shortNameAm: string;
  shortNameEn: string;
  taglineAm: string;
  taglineEn: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface IChurchIdentity {
  nameAm: string;
  nameEn: string;
  shortNameAm?: string;
  shortNameEn?: string;
}

export interface ILocationIdentity {
  townAm: string;
  townEn: string;
  zoneAm: string;
  zoneEn: string;
  regionAm: string;
  regionEn: string;
  countryAm: string;
  countryEn: string;
  regionCountryAm: string;
  regionCountryEn: string;
  combinedAm: string;
  combinedEn: string;
  addressBlockAm: string;
  addressBlockEn: string;
  phone: string;
  email: string;
  mapLink: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ISiteIdentity {
  school: ISchoolIdentity;
  church: IChurchIdentity;
  location: ILocationIdentity;
}

export const DEFAULT_SITE_IDENTITY: ISiteIdentity = {
  school: {
    nameAm: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    nameEn: 'Aemade Selam Sunday School',
    shortNameAm: 'አዕማደ ሰላም',
    shortNameEn: 'Aemade Selam',
    taglineAm: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ',
    taglineEn: 'Firm in Faith, Shining in Good Deeds',
    logoUrl: '/uploads/branding/logo.png',
    faviconUrl: '/favicon.ico',
  },
  church: {
    nameAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
    nameEn: 'Felegeselam Kidus Giyorgis Cathedral',
    shortNameAm: 'ፈለገ ሰላም ካቴድራል',
    shortNameEn: 'Felegeselam Cathedral',
  },
  location: {
    townAm: 'ፍኖተ ሰላም',
    townEn: 'Finote Selam',
    zoneAm: 'ምዕራብ ጎጃም ዞን',
    zoneEn: 'West Gojjam Zone',
    regionAm: 'አማራ ክልል',
    regionEn: 'Amhara Region',
    countryAm: 'ኢትዮጵያ',
    countryEn: 'Ethiopia',
    regionCountryAm: 'አማራ ክልል፣ ኢትዮጵያ',
    regionCountryEn: 'Amhara Region, Ethiopia',
    combinedAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
    combinedEn: 'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam',
    addressBlockAm: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም፣ አማራ ክልል፣ ኢትዮጵያ',
    addressBlockEn:
      'Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam, Amhara Region, Ethiopia',
    phone: '',
    email: '',
    mapLink: '',
    latitude: null,
    longitude: null,
  },
};

/**
 * Builds localized combined single-line identifier
 */
export function buildCombinedLine(churchName: string, town: string, zone: string): string {
  return `${churchName}፣ ${town}፣ ${zone}`;
}
