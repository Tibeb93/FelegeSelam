'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Search,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { Course, PaginatedResult } from '@/types/api';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CoursesPageProps {
  params: { locale: string };
}

export default function PublicCoursesPage({ params: { locale } }: CoursesPageProps) {
  const t = useTranslations('Website');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const { data, isLoading } = useQuery<PaginatedResult<Course>>({
    queryKey: ['courses', 'public', searchQuery, selectedLevel],
    queryFn: () =>
      apiRequest('/courses/public', {
        params: {
          search: searchQuery || undefined,
          level: selectedLevel === 'all' ? undefined : selectedLevel,
          limit: 20,
        },
      }),
  });

  const courses = data?.data || [];

  const levels = [
    { key: 'all', labelAm: 'ሁሉም ደረጃዎች', labelEn: 'All Levels' },
    { key: 'ደረጃ ፩ (መሠረታዊ)', labelAm: 'ደረጃ ፩ (መሠረታዊ)', labelEn: 'Level 1 (Beginner)' },
    { key: 'ደረጃ ፪ (መካከለኛ)', labelAm: 'ደረጃ ፪ (መካከለኛ)', labelEn: 'Level 2 (Intermediate)' },
    { key: 'ደረጃ ፫ (ከፍተኛ)', labelAm: 'ደረጃ ፫ (ከፍተኛ)', labelEn: 'Level 3 (Advanced)' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 space-y-8" tabIndex={-1}>
        {/* Header */}
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase font-semibold">
            {t('navCourses')}
          </Badge>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {locale === 'am' ? 'የሰንበት ትምህርት ቤቱ ክፍት የትምህርት ክፍሎች' : 'Sunday School Curriculum & Open Courses'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'መሠረተ ሃይማኖት፣ ቅዱሳት መጻሕፍት፣ ሥርዓተ ቤተክርስቲያንና የዜማ ትምህርቶች'
              : 'Systematic instruction in Orthodox theology, Holy Scriptures, Liturgy, and Ge’ez hymnody.'}
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {levels.map((lvl) => (
              <button
                key={lvl.key}
                onClick={() => setSelectedLevel(lvl.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                  selectedLevel === lvl.key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {locale === 'am' ? lvl.labelAm : lvl.labelEn}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={locale === 'am' ? 'ትምህርት ፈልግ...' : 'Search courses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 min-h-[44px] rounded-xl"
            />
          </div>
        </div>

        {/* Courses List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-base font-bold text-foreground">
              {locale === 'am' ? 'ምንም ክፍት ትምህርት አልተገኘም' : 'No courses found'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {locale === 'am' ? 'እባክዎ የተለየ የፍለጋ ቃል ይሞክሩ።' : 'Try searching with another keyword.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="border-border bg-card shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {course.level || (locale === 'am' ? 'አጠቃላይ' : 'General')}
                    </span>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {course._count?.lessons || 0} {locale === 'am' ? 'ትምህርቶች' : 'Lessons'}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                    {locale === 'am' ? course.titleAm : course.titleEn || course.titleAm}
                  </CardTitle>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {course.description || (locale === 'am' ? 'የሰንበት ትምህርት ቤት ኦርቶዶክሳዊ ትምህርት ክፍል' : 'Sunday school spiritual instruction module.')}
                  </CardDescription>

                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                    {course.schedule && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{course.schedule}</span>
                      </div>
                    )}
                    {course.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-secondary shrink-0" />
                        <span>
                          {locale === 'am' ? `የመያዝ አቅም: ${course.capacity} ተማሪዎች` : `Capacity: ${course.capacity} students`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    asChild
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px] rounded-xl font-semibold gap-1.5"
                  >
                    <Link href={`/${locale}/register`}>
                      <span>{locale === 'am' ? 'አባል ይሁኑና ይመዝገቡ' : 'Enroll as Member'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
