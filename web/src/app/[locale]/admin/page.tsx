'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { DashboardReportResult, AuditLogItem } from '../../../types/api';
import {
  Users,
  UserPlus,
  CalendarCheck,
  FileCheck,
  Calendar,
  DollarSign,
  BookOpen,
  ClipboardList,
  Bell,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Skeleton } from '../../../components/ui/SkeletonLoaders';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const DEPARTMENT_COLORS = [
  '#1E4D2B', // Deep Ethiopian Forest Green
  '#D4AF37', // Church Gold
  '#8B0000', // Church Crimson
  '#2563EB', // Royal Blue
  '#0D9488', // Teal
  '#9333EA', // Purple
  '#EA580C', // Orange
  '#64748B', // Slate
];

export default function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user?.role?.name === 'content_manager') {
      router.replace(`/${locale}/admin/posts`);
    }
  }, [user, router, locale]);

  // Auto-refresh dashboard data every 60 seconds (1 minute)
  const {
    data: dashboard,
    isLoading,
    isRefetching,
    refetch,
    dataUpdatedAt,
  } = useQuery<DashboardReportResult>({
    queryKey: ['admin-dashboard-full'],
    queryFn: () => apiClient.get<DashboardReportResult>('/reports/dashboard'),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  // Query recent audit activities for feed
  const { data: auditData } = useQuery<{ data: AuditLogItem[] }>({
    queryKey: ['recent-audit-logs'],
    queryFn: () => apiClient.get<{ data: AuditLogItem[] }>('/audit-logs?limit=6'),
    enabled: user?.role?.name === 'super_admin',
  });

  // Compute average attendance rate across courses
  const avgAttendance = React.useMemo(() => {
    if (!dashboard?.attendanceRatePerCourse?.length) return 0;
    const total = dashboard.attendanceRatePerCourse.reduce(
      (sum, item) => sum + item.attendanceRate,
      0,
    );
    return Math.round(total / dashboard.attendanceRatePerCourse.length);
  }, [dashboard]);

  // Format age group data for Recharts BarChart
  const ageGroupData = React.useMemo(() => {
    if (!dashboard?.membersByAgeGroup) return [];
    const bg = dashboard.membersByAgeGroup;
    return [
      {
        name: locale === 'am' ? '<18 ዓመት' : '< 18 yrs',
        count: bg.under18,
      },
      {
        name: locale === 'am' ? '18-25 ዓመት' : '18-25 yrs',
        count: bg.age18To25,
      },
      {
        name: locale === 'am' ? '26-35 ዓመት' : '26-35 yrs',
        count: bg.age26To35,
      },
      {
        name: locale === 'am' ? '36-50 ዓመት' : '36-50 yrs',
        count: bg.age36To50,
      },
      {
        name: locale === 'am' ? '50+ ዓመት' : '50+ yrs',
        count: bg.above50,
      },
    ];
  }, [dashboard, locale]);

  // Format department data for Recharts PieChart
  const deptData = React.useMemo(() => {
    if (!dashboard?.membersByDepartment) return [];
    return dashboard.membersByDepartment.map((d) => ({
      name: locale === 'am' ? d.nameAm : d.nameEn || d.nameAm,
      value: d.count,
    }));
  }, [dashboard, locale]);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Live Status Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/15 via-primary/5 to-secondary/15 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              <span>{user?.role?.name || 'Administrator'}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              {locale === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome back'},{' '}
              {user?.email?.split('@')[0] || user?.phone || 'አገልጋይ'}
            </h1>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {locale === 'am'
                ? 'የአዕማደ ሰላም ሰንበት ትምህርት ቤት የአስተዳደር መረጃ፣ የተማሪዎችና የአባላት ክትትል ማዕከል'
                : 'Aemade Selam Sunday School executive dashboard, operations monitor, and academic intelligence.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
              title={locale === 'am' ? 'መረጃ አድስ' : 'Refresh Data'}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-primary ${isRefetching ? 'animate-spin' : ''}`}
              />
              <span>{locale === 'am' ? 'አድስ' : 'Refresh'}</span>
            </button>
            <Link
              href={`/${locale}/admin/members`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <span>{locale === 'am' ? 'የአባላት ዝርዝር' : 'View Members'}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: Total Members */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
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
                {dashboard?.summary.totalMembers ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am'
                ? `+${dashboard?.summary.newMembers ?? 0} በባለፉት 30 ቀናት`
                : `+${dashboard?.summary.newMembers ?? 0} last 30 days`}
            </p>
          </div>
        </div>

        {/* KPI 2: New This Month */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'አዲስ አባላት (በዚህ ወር)' : 'New This Month'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.summary.newMembers ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'አዲስ የተመዘገቡ' : 'Newly enrolled'}
            </p>
          </div>
        </div>

        {/* KPI 3: Attendance Rate */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'የመገኘት ምጣኔ' : 'Attendance Rate'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{avgAttendance}%</p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'በትምህርት ክፍሎች አማካይ' : 'Across courses'}
            </p>
          </div>
        </div>

        {/* KPI 4: Open Forms */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
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
                {dashboard?.summary.openForms ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'የአባልነትና የዳሰሳ' : 'Active surveys'}
            </p>
          </div>
        </div>

        {/* KPI 5: Upcoming Events */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {locale === 'am' ? 'መርሐ-ግብሮች' : 'Upcoming Events'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {dashboard?.summary.upcomingEventsCount ?? '—'}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {locale === 'am' ? 'በዓላትና ዝግጅቶች' : 'Feasts & gatherings'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {locale === 'am' ? 'ፈጣን ተግባራት' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          <Link
            href={`/${locale}/admin/members/new`}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all"
          >
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="truncate">{locale === 'am' ? 'አባል መዝግብ' : 'Add Member'}</span>
          </Link>

          <Link
            href={`/${locale}/admin/contributions`}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
          >
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="truncate">{locale === 'am' ? 'ክፍያ መዝግብ' : 'Record Payment'}</span>
          </Link>

          <Link
            href={`/${locale}/admin/courses`}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-all"
          >
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="truncate">{locale === 'am' ? 'ኮርስ ክፈት' : 'Create Course'}</span>
          </Link>

          <Link
            href={`/${locale}/admin/forms`}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-purple-500/10 hover:text-purple-600 transition-all"
          >
            <ClipboardList className="h-4 w-4 text-purple-600" />
            <span className="truncate">{locale === 'am' ? 'ቅጽ ገንባ' : 'Build Form'}</span>
          </Link>

          <Link
            href={`/${locale}/admin/notifications`}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5 text-xs font-medium text-foreground hover:bg-amber-500/10 hover:text-amber-600 transition-all"
          >
            <Bell className="h-4 w-4 text-amber-600" />
            <span className="truncate">{locale === 'am' ? 'ማሳወቂያ ላክ' : 'Send Notice'}</span>
          </Link>
        </div>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Member Growth over 12 Months */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am'
                  ? 'የአባላት ዕድገት (ባለፉት 12 ወራት)'
                  : 'Member Growth (Last 12 Months)'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am' ? 'የወርሃዊ አዳዲስ አባላት ምዝገባ' : 'Monthly newly joined members'}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : dashboard?.membersPerMonth?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboard.membersPerMonth}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E4D2B" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#1E4D2B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey={locale === 'am' ? 'labelAm' : 'labelEn'}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name={locale === 'am' ? 'አባላት' : 'Members'}
                    stroke="#1E4D2B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMembers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም መረጃ አልተገኘም' : 'No growth data found'}
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Members by Department (Pie Chart) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'አባላት በክፍል / ዘርፍ' : 'Members by Department'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am' ? 'የአባላት ስርጭት በሰንበት ት/ቤት ዘርፎች' : 'Distribution across departments'}
              </p>
            </div>
            <Users className="h-5 w-5 text-secondary" />
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {deptData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም መረጃ አልተገኘም' : 'No department data found'}
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Members by Age Group (Bar Chart) */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'አባላት በዕድሜ ክልል' : 'Members by Age Group'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am' ? 'የሕፃናት፣ ወጣቶችና ጎልማሶች ስርጭት' : 'Demographic age distribution'}
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : ageGroupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={locale === 'am' ? 'የአባላት ብዛት' : 'Members'}
                    fill="#D4AF37"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም መረጃ አልተገኘም' : 'No demographic data found'}
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Attendance Rate per Course */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'የመገኘት ምጣኔ በኮርስ' : 'Attendance Rate per Course'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {locale === 'am' ? 'በእያንዳንዱ የትምህርት ክፍል የተማሪዎች መገኘት (%)' : 'Student attendance % per course'}
              </p>
            </div>
            <CalendarCheck className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-56 w-full" />
              </div>
            ) : dashboard?.attendanceRatePerCourse?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboard.attendanceRatePerCourse}
                  margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="courseTitle"
                    tick={{ fontSize: 10 }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, locale === 'am' ? 'የመገኘት ምጣኔ' : 'Attendance Rate']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="attendanceRate"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም የትምህርት መገኘት መረጃ አልተገኘም' : 'No attendance data found'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Activity & Upcoming Events Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Audit / System Activity */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'የቅርብ ጊዜ እንቅስቃሴዎች' : 'Recent System Activity'}
              </h2>
            </div>
            {user?.role?.name === 'super_admin' && (
              <Link
                href={`/${locale}/admin/audit-logs`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {locale === 'am' ? 'ሁሉንም ተመልከት' : 'View All'}
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {auditData?.data?.length ? (
              auditData.data.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      <span className="capitalize">{log.action}</span> on{' '}
                      <span className="font-mono text-primary">{log.entity}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {log.user?.email || log.user?.phone || 'System'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም የቅርብ ጊዜ እንቅስቃሴ አልተመዘገበም' : 'No recent activity recorded'}
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Feasts & Events List */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" />
              <h2 className="text-sm font-bold text-foreground">
                {locale === 'am' ? 'የሚመጡ በዓላትና መርሐ-ግብራት' : 'Upcoming Events & Feasts'}
              </h2>
            </div>
            <Link
              href={`/${locale}/admin/events`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {locale === 'am' ? 'መርሐ-ግብሮች' : 'Manage Events'}
            </Link>
          </div>

          <div className="space-y-3">
            {dashboard?.upcomingEvents?.length ? (
              dashboard.upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{evt.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {evt.location || (locale === 'am' ? 'ዋና ደብር' : 'Main Parish')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      {new Date(evt.startAt).toLocaleDateString(
                        locale === 'am' ? 'am-ET' : 'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(evt.startAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {locale === 'am' ? 'ምንም የታቀደ መርሐ-ግብር የለም' : 'No upcoming events scheduled'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Auto-refresh indicator footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {locale === 'am'
            ? 'ቀጥታ ውሂብ (በየደቂቃው በራሱ ይታደሳል)'
            : 'Live updates: auto-refreshes every 60 seconds'}
        </span>
        {dataUpdatedAt > 0 && (
          <span>
            {locale === 'am' ? 'የመጨረሻ ዕድሳት: ' : 'Last refreshed: '}
            {new Date(dataUpdatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
