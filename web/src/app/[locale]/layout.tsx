import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '../../providers/QueryProvider';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import { AuthProvider } from '../../providers/AuthProvider';
import { SiteSettingsProvider } from '../../providers/SiteSettingsProvider';
import { NavigationProgressBar } from '../../components/common/NavigationProgressBar';
import '../globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F4C81' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2E52' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Aemade Selam Sunday School | Felegeselam Kidus Giyorgis Cathedral',
    template: '%s | Aemade Selam Sunday School, Felegeselam Kidus Giyorgis Cathedral',
  },
  description:
    'Ethiopian Orthodox Tewahedo Church Sunday School Management System and Spiritual Education Portal. አዕማደ ሰላም ሰንበት ትምህርት ቤት - ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም፣ አማራ ክልል፣ ኢትዮጵያ።',
  keywords: [
    'Ethiopian Orthodox',
    'Tewahedo',
    'Sunday School',
    'Aemade Selam',
    'Felegeselam Kidus Giyorgis Cathedral',
    'Finote Selam',
    'West Gojjam',
    'Amhara',
    'ቅዱስ ጊዮርጊስ',
    'ፈለገ ሰላም',
    'አዕማደ ሰላም',
    'ፍኖተ ሰላም',
    'ምዕራብ ጎጃም',
    'Mezmur',
    'Sinksar',
    'Ethiopian Calendar',
    'ሰንበት ትምህርት ቤት',
    'መዝሙር',
    'ስንክሳር',
  ],
  authors: [{ name: 'Aemade Selam Sunday School, Felegeselam Kidus Giyorgis Cathedral' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Aemade Selam Sunday School | Felegeselam Kidus Giyorgis Cathedral',
    description:
      'በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ኦፊሴላዊ ድረ-ገጽ እና መንፈሳዊ የትምህርት ፖርታል (ፍኖተ ሰላም፣ ምዕራብ ጎጃም)።',
    url: '/',
    siteName: 'Aemade Selam Sunday School - Felegeselam Kidus Giyorgis Cathedral',
    images: [
      {
        url: '/uploads/branding/logo.png',
        width: 800,
        height: 600,
        alt: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት - ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
      },
    ],
    locale: 'am_ET',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aemade Selam Sunday School | Felegeselam Kidus Giyorgis Cathedral',
    description: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ - ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  const placeOfWorshipJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PlaceOfWorship',
    name: 'Felegeselam Kidus Giyorgis Cathedral',
    alternateName: 'ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል',
    subOrganization: {
      '@type': 'EducationalOrganization',
      name: 'Aemade Selam Sunday School',
      alternateName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Felegeselam Kidus Giyorgis Cathedral',
      addressLocality: 'Finote Selam',
      addressRegion: 'Amhara',
      addressCountry: 'ET',
    },
  };

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeOfWorshipJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-secondary/30 font-ethiopic">
        {/* Skip to Content for Accessibility / Lighthouse 95+ */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {locale === 'am' ? 'ወደ ዋናው ይዘት ይለፉ (Skip to Content)' : 'Skip to main content'}
        </a>
        <NavigationProgressBar />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <SiteSettingsProvider>
              <ThemeProvider>
                <ToastProvider>
                  <AuthProvider>{children}</AuthProvider>
                </ToastProvider>
              </ThemeProvider>
            </SiteSettingsProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
