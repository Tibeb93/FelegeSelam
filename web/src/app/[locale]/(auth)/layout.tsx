'use client';

import React from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTheme } from '../../../providers/ThemeProvider';
import { SchoolLogo } from '../../../components/common/SchoolLogo';
import { Sun, Moon } from 'lucide-react';
import { useSiteIdentity } from '../../../hooks/useSiteIdentity';

export default function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { theme, toggleTheme } = useTheme();
  const siteIdentity = useSiteIdentity(locale);

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Bar for Language & Theme Switching */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher currentLocale={locale} />
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-sm"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-secondary" />
          ) : (
            <Moon className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>

      {/* Main Auth Content Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="flex flex-col items-center justify-center text-center">
          <Link
            href={`/${locale}`}
            aria-label="Home"
            className="flex items-center justify-center transition-transform hover:scale-105 mb-2"
          >
            <SchoolLogo size={68} />
          </Link>
          <span className="text-xs font-bold text-primary dark:text-[#68A7E0] uppercase tracking-wide">
            {siteIdentity.churchName}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {siteIdentity.schoolName}
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
