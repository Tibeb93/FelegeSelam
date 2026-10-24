import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '../../providers/QueryProvider';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import { AuthProvider } from '../../providers/AuthProvider';
import '../globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F4C81' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2E52' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት | Aemade Selam Sunday School',
    template: '%s | አዕማደ ሰላም ሰንበት ትምህርት ቤት',
  },
  description:
    'Ethiopian Orthodox Tewahedo Church Sunday School Management System and Spiritual Education Portal. አዕማደ ሰላም ሰንበት ትምህርት ቤት - ደብረ ሰላም ቅዱስ እስጢፋኖስ ቤተ ክርስቲያን።',
  keywords: [
    'Ethiopian Orthodox',
    'Tewahedo',
    'Sunday School',
    'Aemade Selam',
    'Mezmur',
    'Sinksar',
    'Ethiopian Calendar',
    'ቅዱስ እስጢፋኖስ',
    'ሰንበት ትምህርት ቤት',
    'መዝሙር',
    'ስንክሳር',
  ],
  authors: [{ name: 'Aemade Selam Sunday School' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት | Aemade Selam Sunday School',
    description:
      'በደብረ ሰላም ቅዱስ እስጢፋኖስ ቤተ ክርስቲያን አዕማደ ሰላም ሰንበት ትምህርት ቤት ኦፊሴላዊ ድረ-ገጽ እና መንፈሳዊ የትምህርት ፖርታል።',
    url: '/',
    siteName: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
    images: [
      {
        url: '/uploads/branding/logo.png',
        width: 800,
        height: 600,
        alt: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት',
      },
    ],
    locale: 'am_ET',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት | Aemade Selam Sunday School',
    description: 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ - ኦፊሴላዊ ድረ-ገጽ',
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

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-secondary/30 font-ethiopic">
        {/* Skip to Content for Accessibility / Lighthouse 95+ */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {locale === 'am' ? 'ወደ ዋናው ይዘት ይለፉ (Skip to Content)' : 'Skip to main content'}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider>
              <ToastProvider>
                <AuthProvider>{children}</AuthProvider>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
