'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { DashboardReport } from '../../../types/api';
import {
  Users,
  BookOpen,
  Calendar,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '../../../components/ui/SkeletonLoaders';

export default function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery<DashboardReport>({
    queryKey: ['admin-dashboard-summary'],
    queryFn: () => apiClient.get<DashboardReport>('/reports/dashboard'),
  });

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{user?.role?.name || 'Administrator'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {locale === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome back'},{' '}
              {user?.email?.split('@')[0] || user?.phone || 'አገልጋይ'}
            </h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
              {locale === 'am'
                ? 'የአዕማደ ሰላም ሰንበት ትምህርት ቤት የአስተዳደር መረጃ፣ የተማሪዎችና የአባላት ክትትል ማዕከል'
                : 'Aemade Selam Sunday School executive dashboard, member management, and academic operations.'}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <Link
              href={`/${locale}/admin/members`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <span>{locale === 'am' ? 'የአባላት ዝርዝር' : 'View Members'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Members */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ጠቅላላ አባላት' : 'Total Members'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.overview.totalMembers ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am'
                ? `+${dashboard?.overview.newMembersLast30Days ?? 0} በባለፉት 30 ቀናት`
                : `+${dashboard?.overview.newMembersLast30Days ?? 0} in last 30 days`}
            </p>
          </div>
        </div>

        {/* Card 2: Active Posts */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ንቁ መልዕክቶች' : 'Active Posts'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.overview.activePosts ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'ስንክሳር፣ ንባብና ትምህርቶች' : 'Sinksar, readings & teachings'}
            </p>
          </div>
        </div>

        {/* Card 3: Upcoming Events */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'መርሐ-ግብሮች' : 'Upcoming Events'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.overview.upcomingEvents ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'የቅርብ ጊዜ መርሐ-ግብራት' : 'Scheduled activities'}
            </p>
          </div>
        </div>

        {/* Card 4: Open Forms */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'ክፍት ቅጾች' : 'Open Forms'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.overview.openForms ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'የአባላት ምዝገባና ዳሰሳ' : 'Active surveys & renewals'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
