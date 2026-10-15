import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { QueryProvider } from '../../providers/QueryProvider';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import { AuthProvider } from '../../providers/AuthProvider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'አዕማደ ሰላም ሰንበት ትምህርት ቤት | Aemade Selam Sunday School',
  description:
    'Ethiopian Orthodox Tewahedo Church Sunday School Management System - አዕማደ ሰላም ሰንበት ትምህርት ቤት የአስተዳደር ሥርዓት',
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
