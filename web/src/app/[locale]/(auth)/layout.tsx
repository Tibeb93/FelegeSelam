'use client';

import React from 'react';
import Link from 'next/link';
import { Cross } from 'lucide-react';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTheme } from '../../../providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { theme, toggleTheme } = useTheme();

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
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link
            href={`/${locale}`}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg ring-4 ring-primary/20"
          >
            <Cross className="h-8 w-8 text-secondary" />
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
