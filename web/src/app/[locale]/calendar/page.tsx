'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Calendar as CalendarIcon,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { CalendarDataResponse } from '@/types/api';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CalendarPageProps {
  params: { locale: string };
}

const ETHIOPIAN_MONTHS = [
  { id: 1, nameAm: 'መስከረም', nameEn: 'Meskerem', season: 'መከር (Autumn)' },
  { id: 2, nameAm: 'ጥቅምት', nameEn: 'Tikimt', season: 'መከር (Autumn)' },
  { id: 3, nameAm: 'ኅዳር', nameEn: 'Hidar', season: 'መከር (Autumn)' },
  { id: 4, nameAm: 'ታኅሣሥ', nameEn: 'Tahsas', season: 'ክረምት/በጋ (Winter)' },
  { id: 5, nameAm: 'ጥር', nameEn: 'Tir', season: 'በጋ (Winter)' },
  { id: 6, nameAm: 'የካቲት', nameEn: 'Yekatit', season: 'በጋ (Winter)' },
  { id: 7, nameAm: 'መጋቢት', nameEn: 'Megabit', season: 'ጸደይ (Spring)' },
  { id: 8, nameAm: 'ሚያዝያ', nameEn: 'Miyazya', season: 'ጸደይ (Spring)' },
  { id: 9, nameAm: 'ግንቦት', nameEn: 'Ginbot', season: 'ጸደይ (Spring)' },
  { id: 10, nameAm: 'ሰኔ', nameEn: 'Sene', season: 'ክረምት (Summer)' },
  { id: 11, nameAm: 'ሐምሌ', nameEn: 'Hamle', season: 'ክረምት (Summer)' },
  { id: 12, nameAm: 'ነሐሴ', nameEn: 'Nehase', season: 'ክረምት (Summer)' },
  { id: 13, nameAm: 'ጳጉሜን', nameEn: 'Pagume', season: 'ጳጉሜን (Intercalary)' },
];

export default function CalendarPage({ params: { locale } }: CalendarPageProps) {
  const t = useTranslations('Calendar');
  const [activeTab, setActiveTab] = useState<'all' | 'fasts' | 'feasts' | 'monthly'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(1); // 1 = Meskerem

  // Fetch dynamic calendar data from database
  const { data: calendarData } = useQuery<CalendarDataResponse>({
    queryKey: ['settings', 'calendar'],
    queryFn: () => apiRequest('/settings/calendar'),
    staleTime: 600000,
  });

  const fasts = calendarData?.fastingSeasons || [];
  const feasts = calendarData?.majorFeasts || [];
  const monthlySaints = calendarData?.monthlyFeasts || [];

  const currentMonthData = ETHIOPIAN_MONTHS.find((m) => m.id === selectedMonth) || ETHIOPIAN_MONTHS[0];
  const daysInMonth = selectedMonth === 13 ? 5 : 30;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 space-y-10" tabIndex={-1}>
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase font-semibold">
            {t('title')}
          </Badge>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {locale === 'am' ? 'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ የቀን መቁጠሪያ' : 'Ethiopian Liturgical Calendar'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setActiveTab('fasts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === 'fasts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('fastsOnly')} ({fasts.length})
          </button>
          <button
            onClick={() => setActiveTab('feasts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === 'feasts'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('feastsOnly')} ({feasts.length})
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
              activeTab === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('monthlyFeasts')} (30 {locale === 'am' ? 'ቀናት' : 'days'})
          </button>
        </div>

        {/* Month Selector & Interactive Monthly View (when on All or Monthly) */}
        {(activeTab === 'all' || activeTab === 'monthly') && (
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {locale === 'am' ? currentMonthData.nameAm : currentMonthData.nameEn} (2017 ዓ.ም)
                  </h2>
                  <p className="text-xs text-primary font-medium">{currentMonthData.season}</p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ETHIOPIAN_MONTHS.slice(0, 12).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMonth(m.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors min-h-[36px] ${
                      selectedMonth === m.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {locale === 'am' ? m.nameAm : m.nameEn.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* 30-Day Grid with Saint Names */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1;
                const saintInfo = monthlySaints.find((s) => s.day === dayNum);
                const isMeskel = selectedMonth === 1 && dayNum === 17;
                const isGenna = selectedMonth === 4 && (dayNum === 28 || dayNum === 29);
                const isTimkat = selectedMonth === 5 && dayNum === 11;
                const isMajor = isMeskel || isGenna || isTimkat;

                return (
                  <div
                    key={dayNum}
                    className={`rounded-xl border p-3 flex flex-col justify-between min-h-[90px] transition-all hover:scale-[1.02] ${
                      isMajor
                        ? 'border-secondary bg-secondary/15 shadow-sm'
                        : 'border-border bg-card/60 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-foreground">{dayNum}</span>
                      {isMajor && (
                        <Badge className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0 font-bold">
                          {locale === 'am' ? 'ዐቢይ በዓል' : 'Major'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-foreground/90 line-clamp-2 leading-tight">
                      {saintInfo
                        ? locale === 'am'
                          ? saintInfo.nameAm
                          : saintInfo.nameEn
                        : `Day ${dayNum}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Seven Canonical Fasts Section */}
        {(activeTab === 'all' || activeTab === 'fasts') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <ShieldAlert className="h-5 w-5" />
              <h2>{t('fastingSeasons')} ({locale === 'am' ? 'ሰባቱ አጽዋማት' : 'The Seven Fasts'})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fasts.map((fast) => (
                <Card key={fast.id} className="border-border bg-card shadow-xs">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                        {fast.type === 'fixed'
                          ? locale === 'am' ? 'ቋሚ ጾም' : 'Fixed Fast'
                          : fast.type === 'weekly'
                          ? locale === 'am' ? 'ሳምንታዊ' : 'Weekly'
                          : locale === 'am' ? 'ተንቀሳቃሽ' : 'Movable'}
                      </span>
                      {fast.durationDays && (
                        <span className="text-xs text-muted-foreground font-semibold">
                          {fast.durationDays} {locale === 'am' ? 'ቀናት' : 'days'}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground pt-1">
                      {locale === 'am' ? fast.nameAm : fast.nameEn}
                    </CardTitle>
                    {fast.startMonthAm && (
                      <CardDescription className="text-xs text-primary font-medium">
                        {fast.startMonthAm} {fast.startDay} - {fast.endMonthAm} {fast.endDay}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === 'am' ? fast.descriptionAm : fast.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Major & Minor Feasts Section */}
        {(activeTab === 'all' || activeTab === 'feasts') && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Sparkles className="h-5 w-5" />
              <h2>{t('majorFeasts')} ({locale === 'am' ? 'ዐበይትና ንዑሳን በዓላት' : 'Feasts of Our Lord & Saints'})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feasts.map((feast) => (
                <Card key={feast.id} className="border-border bg-card shadow-xs">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                          feast.isLordFeast
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {feast.isLordFeast
                          ? locale === 'am' ? 'የጌታ በዓል' : 'Lord Feast'
                          : locale === 'am' ? 'የቅዱሳን' : 'Saint Feast'}
                      </span>
                      {feast.monthAm && feast.day ? (
                        <span className="text-xs font-bold text-foreground">
                          {feast.monthAm} {feast.day}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">
                          {locale === 'am' ? 'ተንቀሳቃሽ' : 'Movable'}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-base font-bold text-foreground pt-1">
                      {locale === 'am' ? feast.nameAm : feast.nameEn}
                    </CardTitle>
                    {feast.gregorianEquivalent && (
                      <CardDescription className="text-xs text-muted-foreground">
                        {feast.gregorianEquivalent}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === 'am' ? feast.descriptionAm : feast.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
