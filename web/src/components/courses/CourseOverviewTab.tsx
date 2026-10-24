'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseReport } from '@/types/api';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Clock,
  BookOpen,
  Calendar,
} from 'lucide-react';

interface CourseOverviewTabProps {
  course: Course;
  report?: CourseReport | null;
}

export function CourseOverviewTab({ course, report }: CourseOverviewTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');

  const summary = report?.summary;
  const enrolled = summary?.totalEnrolled ?? course._count?.enrollments ?? 0;
  const capacity = course.capacity ?? 40;
  const capacityPct = Math.min(100, Math.round((enrolled / capacity) * 100));
  const isFull = enrolled >= capacity;

  const attendanceRate = summary?.courseAverageAttendancePercentage ?? 0;
  const avgGrade = summary?.courseAverageGradePercentage ?? 0;
  const passCount = summary?.passCount ?? 0;
  const failCount = summary?.failCount ?? 0;

  const teacherName = course.teacher
    ? `${course.teacher.firstName || ''} ${course.teacher.fatherName || ''}`.trim()
    : null;

  return (
    <div className="space-y-6">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enrollment & Capacity Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{t('statsEnrolled')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-foreground">
              {enrolled}{' '}
              <span className="text-sm font-normal text-muted-foreground">/ {capacity}</span>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isFull
                  ? 'bg-destructive/10 text-destructive'
                  : capacityPct > 75
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              {capacityPct}% {isFull && t('capacityFull')}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-destructive' : capacityPct > 75 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>

        {/* Active Students Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{t('statsActive')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {summary?.activeCount ?? enrolled}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary?.completedCount ?? 0} {t('statsCompleted')} · {summary?.droppedCount ?? 0}{' '}
            {t('statsDropped')}
          </p>
        </div>

        {/* Attendance Rate Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{t('attendanceRate')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">
            {summary?.totalSessionsHeld ?? 0}{' '}
            {locale === 'am' ? 'ክፍለ ጊዜያት ተካሂደዋል' : 'sessions held'}
          </p>
        </div>

        {/* Average Grade Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">{t('averageGrade')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">{avgGrade}%</div>
          <p className="text-xs text-muted-foreground">
            {passCount} {t('pass')} · {failCount} {t('fail')}
          </p>
        </div>
      </div>

      {/* Course Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>{locale === 'am' ? 'የትምህርቱ ዝርዝር መረጃ' : 'Course Details'}</span>
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-medium text-muted-foreground block">
                {locale === 'am' ? 'ማብራሪያ' : 'Description'}
              </span>
              <p className="mt-1 text-foreground whitespace-pre-line leading-relaxed">
                {course.description || (
                  <span className="italic text-muted-foreground">
                    {locale === 'am' ? 'ምንም ማብራሪያ አልተሰጠም' : 'No description provided'}
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  {t('schedule')}
                </span>
                <p className="mt-1 font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{course.schedule || '—'}</span>
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  {t('level')}
                </span>
                <p className="mt-1 font-medium text-foreground">{course.level || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  {t('startDate')}
                </span>
                <p className="mt-1 font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {course.startDate ? new Date(course.startDate).toLocaleDateString() : '—'}
                  </span>
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  {t('endDate')}
                </span>
                <p className="mt-1 font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {course.endDate ? new Date(course.endDate).toLocaleDateString() : '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Teacher & Quick Info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            <span>{t('teacher')}</span>
          </h2>

          {course.teacher ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
                  {course.teacher.firstName?.[0] || 'T'}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{teacherName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {course.teacher.phone || course.teacher.email || 'Teacher'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2 text-xs">
                {course.teacher.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {locale === 'am' ? 'ስልክ' : 'Phone'}:
                    </span>
                    <span className="font-medium text-foreground">{course.teacher.phone}</span>
                  </div>
                )}
                {course.teacher.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {locale === 'am' ? 'ኢሜይል' : 'Email'}:
                    </span>
                    <span className="font-medium text-foreground">{course.teacher.email}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              {locale === 'am'
                ? 'መምህር እስካሁን አልተመደበም። በቅጹ ላይ አሻሽለው መመደብ ይችላሉ።'
                : 'No teacher assigned yet. You can edit the course to assign a teacher.'}
            </div>
          )}

          <div className="rounded-xl bg-muted/40 p-4 space-y-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('lessonsCount')}:</span>
              <span className="font-bold text-foreground">
                {course._count?.lessons ?? course.lessons?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {locale === 'am' ? 'የተሰጡ የምስክር ወረቀቶች' : 'Certificates Issued'}:
              </span>
              <span className="font-bold text-foreground">
                {summary?.certificatesIssuedCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
