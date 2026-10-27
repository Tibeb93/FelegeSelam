'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Calendar,
  Sparkles,
  CreditCard,
  GraduationCap,
  Music,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSiteIdentity } from '@/hooks/useSiteIdentity';

interface PortalDashboardProps {
  params: { locale: string };
}

export default function MemberPortalDashboard({ params: { locale } }: PortalDashboardProps) {
  const t = useTranslations('Portal');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const siteIdentity = useSiteIdentity(locale);

  // Load member full profile with enrollments & attendance
  const { data: memberProfile } = useQuery({
    queryKey: ['members', 'me', 'profile'],
    queryFn: () => apiRequest('/members/me/profile'),
    enabled: !!user,
  });

  // Load upcoming events
  const { data: eventsData } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => apiRequest('/events', { params: { limit: 3 } }),
  });

  // Load today's spiritual post
  const { data: postsData } = useQuery({
    queryKey: ['posts', 'today'],
    queryFn: () => apiRequest('/posts/today'),
  });

  const todayPost = postsData?.data?.[0];
  const upcomingEvents = eventsData?.data || [];
  const enrollments = memberProfile?.enrollments || [];

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: 'going' | 'maybe' | 'not_going' }) =>
      apiRequest(`/events/${eventId}/rsvp`, {
        method: 'POST',
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  return (
    <div className="space-y-8">
      {/* 1. Welcome Member Header Banner */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/15 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{locale === 'am' ? 'የሰንበት ት/ቤት አባል' : 'Active Member'}</span>
              </span>
              {memberProfile?.memberNo && (
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  #{memberProfile.memberNo}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
              {locale === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome'},{' '}
              {memberProfile?.firstName
                ? `${memberProfile.firstName} ${memberProfile.fatherName}`
                : user?.email || user?.phone || 'የተከበሩ አባል'}
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {memberProfile?.department?.nameAm
                ? `${memberProfile.department.nameAm} • ${siteIdentity.churchName}`
                : locale === 'am'
                ? 'በዚህ ፖርታል አማካኝነት ትምህርቶችዎን፣ የመገኘት ምዝገባዎንና ውጤትዎን መከታተል ይችላሉ።'
                : 'Manage your course enrollments, attendance records, exam results, and spiritual activities.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl min-h-[44px]">
              <Link href={`/${locale}/portal/profile`}>
                <CreditCard className="mr-1.5 h-4 w-4" />
                <span>{t('idCard')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl min-h-[44px]">
              <Link href={`/${locale}/portal/courses`}>
                <BookOpen className="mr-1.5 h-4 w-4 text-primary" />
                <span>{t('myCourses')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Today's Spiritual Feed Widget */}
      <Card className="border-border bg-gradient-to-r from-card to-primary/5 shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {locale === 'am' ? 'የዕለቱ መንፈሳዊ ማስታወሻ' : "Today's Spiritual Reflection"}
              </CardTitle>
              <CardDescription className="text-xs text-primary font-semibold">
                {todayPost ? todayPost.type : locale === 'am' ? 'ስንክሳርና ቃል' : 'Daily Word'}
              </CardDescription>
            </div>
          </div>

          <Button asChild variant="ghost" size="sm" className="text-xs text-primary gap-1">
            <Link href={`/${locale}/news`}>
              <span>{locale === 'am' ? 'ሁሉንም አንብብ' : 'View All'}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">
            {todayPost ? todayPost.title : locale === 'am' ? 'በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ' : 'Firm in Faith, Shining in Good Deeds'}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {todayPost
              ? todayPost.body.replace(/<[^>]*>?/gm, '').slice(0, 240) + '...'
              : locale === 'am'
              ? 'የእግዚአብሔር ቃል ለሕይወታችን መሪ፥ ለእግራችን መብራት ነው። በሰንበት ትምህርት ቤት የምንማረው ትምህርት እውነተኛ ክርስቲያናዊ ሕይወት እንድንመራ ያዘጋጀናል።'
              : 'Your word is a lamp to my feet and a light to my path. Daily reflection and prayer fortify our spiritual journey.'}
          </p>
        </CardContent>
      </Card>

      {/* 3. Main Dashboard Grid: My Courses & Next Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Enrolled Courses */}
        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t('myCourses')}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {enrollments.length} {locale === 'am' ? 'የተመዘገቡባቸው ክፍሎች' : 'Enrolled courses'}
                </CardDescription>
              </div>
            </div>

            <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
              <Link href={`/${locale}/portal/courses`}>
                <span>{locale === 'am' ? 'ዝርዝር' : 'Details'}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="pt-4 flex-1 space-y-3">
            {enrollments.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  {locale === 'am'
                    ? 'በአሁኑ ወቅት በተመዘገቡበት ክፍል ውስጥ አልተካተቱም።'
                    : 'You are not enrolled in any course yet.'}
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={`/${locale}/courses`}>
                    {locale === 'am' ? 'ክፍት ትምህርቶችን ይመልከቱ' : 'Browse Courses'}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 3).map((enr: any) => (
                  <div
                    key={enr.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-muted/20 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {locale === 'am' ? enr.course?.titleAm : enr.course?.titleEn || enr.course?.titleAm}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary font-semibold text-[11px]">
                          {enr.status}
                        </span>
                        <span>{enr.course?.schedule || ''}</span>
                      </div>
                    </div>

                    <Button asChild size="sm" variant="ghost" className="rounded-lg h-9 w-9 p-0">
                      <Link href={`/${locale}/portal/courses`} aria-label="Open course">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Events & RSVP */}
        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t('events')}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {locale === 'am' ? 'የሚቀጥሉት ጉባኤያትና መርሐ-ግብራት' : 'Upcoming church and school events'}
                </CardDescription>
              </div>
            </div>

            <Button asChild variant="ghost" size="sm" className="text-xs gap-1">
              <Link href={`/${locale}/portal/events`}>
                <span>{locale === 'am' ? 'ሁሉንም' : 'View All'}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="pt-4 flex-1 space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">
                  {locale === 'am' ? 'ምንም የሚመጣ መርሐ-ግብር አልተመዘገበም' : 'No upcoming events listed.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 2).map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">
                        {ev.title}
                      </h3>
                      <span className="text-xs text-primary font-bold">
                        {new Date(ev.startAt).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {ev.location || siteIdentity.churchName}
                    </p>

                    {/* Quick RSVP buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'going' })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {t('rsvpGoing')}
                      </button>
                      <button
                        onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'maybe' })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors"
                      >
                        {t('rsvpMaybe')}
                      </button>
                      <button
                        onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'not_going' })}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {t('rsvpNotGoing')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Quick Portal Feature Grid Shortcuts */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href={`/${locale}/portal/profile`}
          className="p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-primary transition-colors flex flex-col justify-between space-y-2 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{t('idCard')}</h4>
            <p className="text-[11px] text-muted-foreground">{locale === 'am' ? 'በQR ኮድና በPDF' : 'With QR & PDF'}</p>
          </div>
        </Link>

        <Link
          href={`/${locale}/portal/academic`}
          className="p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-primary transition-colors flex flex-col justify-between space-y-2 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{t('attendanceGrades')}</h4>
            <p className="text-[11px] text-muted-foreground">{locale === 'am' ? 'ውጤትና መገኘት' : 'GPA & Attendance'}</p>
          </div>
        </Link>

        <Link
          href={`/${locale}/portal/favorites`}
          className="p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-primary transition-colors flex flex-col justify-between space-y-2 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{t('favorites')}</h4>
            <p className="text-[11px] text-muted-foreground">{locale === 'am' ? 'የተወደዱ መዝሙራት' : 'Saved hymns'}</p>
          </div>
        </Link>

        <Link
          href={`/${locale}/portal/forms`}
          className="p-4 rounded-2xl border border-border bg-card shadow-xs hover:border-primary transition-colors flex flex-col justify-between space-y-2 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{t('forms')}</h4>
            <p className="text-[11px] text-muted-foreground">{locale === 'am' ? 'ማመልከቻዎችና ቅጾች' : 'Applications'}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
