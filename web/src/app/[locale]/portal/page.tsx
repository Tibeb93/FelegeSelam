'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers/AuthProvider';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { useTheme } from '../../../providers/ThemeProvider';
import {
  Church,
  Cross,
  User,
  BookOpen,
  Music,
  Calendar,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';

export default function MemberPortalPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Portal Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary shadow-md">
              <Cross className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                {locale === 'am' ? 'የአባላት ፖርታል' : 'Member Portal'}
              </h1>
              <p className="text-xs text-secondary font-medium">
                {locale === 'am' ? 'አዕማደ ሰላም ሰንበት ትምህርት ቤት' : 'Aemade Selam Sunday School'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-secondary" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Portal Body */}
      <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {locale === 'am' ? 'የሰንበት ት/ቤት አባል' : 'Sunday School Member'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {locale === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'},{' '}
            {user?.email || user?.phone || 'የተከበሩ አባል'}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
            {locale === 'am'
              ? 'በዚህ ፖርታል አማካኝነት የተመዘገቡባቸውን ትምህርቶች፣ የመገኘት ሁኔታዎን፣ ውጤትዎን እና መንፈሳዊ መዝሙራትን መከታተል ይችላሉ።'
              : 'Here you can access your enrolled courses, view attendance records, access examination results, and spiritual content.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">
              {locale === 'am' ? 'የትምህርት ክፍሎቼ' : 'My Courses'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === 'am'
                ? 'የተመዘገቡባቸው ክፍሎችና የትምህርት ማስታወሻዎች'
                : 'Enrolled subjects and lecture notes'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary mb-3">
              <Music className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">
              {locale === 'am' ? 'መዝሙራትና ዜማዎች' : 'Mezmur & Hymns'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === 'am'
                ? 'የኦርቶዶክስ ተዋሕዶ መንፈሳዊ መዝሙራትና ግጥሞች'
                : 'Spiritual hymns, audio recordings, and lyrics'}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">
              {locale === 'am' ? 'መርሐ-ግብሮች' : 'Upcoming Events'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === 'am'
                ? 'የሰንበት ትምህርት ቤቱ መርሐ-ግብራትና ጉባኤያት'
                : 'Sunday school calendar and church feasts'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
