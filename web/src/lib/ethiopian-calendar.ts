/**
 * Ethiopian Calendar utilities
 * Implements bidirectional conversion between Gregorian and Ethiopian Date.
 */

export const ETHIOPIAN_MONTHS_AM = [
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

export const ETHIOPIAN_MONTHS_EN = [
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
export function gregorianToEthiopian(dateInput: Date | string = new Date()): EthiopianDate {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1; // 1-12
  const gd = date.getUTCDate();

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

  // JDN to Ethiopian date (Ethiopian Epoch is 1723856)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
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

/**
 * Converts an Ethiopian Date to a Gregorian Date
 */
export function ethiopianToGregorian(
  year: number,
  month: number, // 1-13
  day: number,
): Date {
  const jdn =
    1723856 +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1;

  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const lPrime = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (lPrime + 1)) / 1461001);
  const lDoublePrime = lPrime - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * lDoublePrime) / 2447);
  const d = lDoublePrime - Math.floor((2447 * j) / 80);
  const lTriplePrime = Math.floor(j / 11);
  const m = j + 2 - 12 * lTriplePrime;
  const y = 100 * (n - 49) + i + lTriplePrime;

  // Return UTC Date normalized to midnight
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Converts an Ethiopian Date directly to an ISO Date string (YYYY-MM-DD)
 */
export function ethiopianToIsoGregorian(
  year: number,
  month: number,
  day: number,
): string {
  const gDate = ethiopianToGregorian(year, month, day);
  return gDate.toISOString().split('T')[0];
}

export function formatEthiopianDate(
  ethDate: EthiopianDate,
  locale: 'am' | 'en' = 'am',
): string {
  if (locale === 'am') {
    return `${ethDate.monthNameAm} ${ethDate.day} ቀን ${ethDate.year} ዓ.ም`;
  }
  return `${ethDate.monthNameEn} ${ethDate.day}, ${ethDate.year} E.C.`;
}
