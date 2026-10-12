/**
 * Ethiopian Calendar utilities
 * Implements conversion from Gregorian Date to Ethiopian Date.
 */

const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
];

const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
];

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
  monthNameAm: string;
  monthNameEn: string;
}

/**
 * Converts a Gregorian Date to an Ethiopian Date
 */
export function gregorianToEthiopian(date: Date = new Date()): EthiopianDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1; // 1-12
  const gd = date.getDate();

  // Julian day number from Gregorian date
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  const jdn =
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // JDN to Ethiopian date
  // Ethiopian Epoch is 1723856 (JD at 29 Aug 8 CE)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  const monthIndex = Math.min(Math.max(month - 1, 0), 12);

  return {
    year,
    month,
    day,
    monthNameAm: ETHIOPIAN_MONTHS_AM[monthIndex],
    monthNameEn: ETHIOPIAN_MONTHS_EN[monthIndex],
  };
}

export function formatEthiopianDate(ethDate: EthiopianDate, locale: 'am' | 'en'): string {
  if (locale === 'am') {
    return `${ethDate.monthNameAm} ${ethDate.day} ቀን ${ethDate.year} ዓ.ም`;
  }
  return `${ethDate.monthNameEn} ${ethDate.day}, ${ethDate.year} E.C.`;
}
