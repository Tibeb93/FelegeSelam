'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseReport, Lesson, CourseEnrollment } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CourseOverviewTab } from '@/components/courses/CourseOverviewTab';
import { CourseLessonsTab } from '@/components/courses/CourseLessonsTab';
import { CourseStudentsTab } from '@/components/courses/CourseStudentsTab';
import { CourseAttendanceTab } from '@/components/courses/CourseAttendanceTab';
import { CourseGradesTab } from '@/components/courses/CourseGradesTab';
import { CourseCertificatesTab } from '@/components/courses/CourseCertificatesTab';
import { FormSkeleton } from '@/components/ui/SkeletonLoaders';
import {
  ArrowLeft,
  Edit,
  LayoutDashboard,
  FileText,
  Users,
  CalendarCheck,
  Award,
  ShieldCheck,
} from 'lucide-react';

type TabKey = 'overview' | 'lessons' | 'students' | 'attendance' | 'grades' | 'certificates';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [course, setCourse] = useState<Course | null>(null);
  const [report, setReport] = useState<CourseReport | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details, lessons, enrollments, and comprehensive report in parallel
      const [courseRes, lessonsRes, enrollmentsRes, reportRes] = await Promise.all([
        apiClient.get<Course>(`/courses/${courseId}`),
        apiClient.get<any>(`/courses/${courseId}/lessons`),
        apiClient.get<any>(`/courses/${courseId}/enrollments`),
        apiClient.get<CourseReport>(`/courses/${courseId}/report`).catch(() => null),
      ]);

      if (courseRes) {
        setCourse((courseRes as any).data || courseRes);
      }
      if (lessonsRes) {
        setLessons(lessonsRes.items || lessonsRes.data || (Array.isArray(lessonsRes) ? lessonsRes : []));
      }
      if (enrollmentsRes) {
        setEnrollments(enrollmentsRes.items || enrollmentsRes.data || (Array.isArray(enrollmentsRes) ? enrollmentsRes : []));
      }
      if (reportRes) {
        setReport((reportRes as any).data || reportRes);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData]);

  if (loading && !course) {
    return <FormSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center text-destructive space-y-4">
        <p className="font-semibold">{error || 'Course not found'}</p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/courses`)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tCommon('back')}</span>
        </button>
      </div>
    );
  }

  const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: t('tabOverview'), icon: LayoutDashboard },
    { key: 'lessons', label: `${t('tabLessons')} (${lessons.length})`, icon: FileText },
    { key: 'students', label: `${t('tabStudents')} (${enrollments.length})`, icon: Users },
    { key: 'attendance', label: t('tabAttendance'), icon: CalendarCheck },
    { key: 'grades', label: t('tabGrades'), icon: Award },
    { key: 'certificates', label: t('tabCertificates'), icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Breadcrumbs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${locale}/admin/courses`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{tCommon('back')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{course.titleAm}</h1>
            <StatusBadge status={course.status} />
          </div>
          {course.titleEn && (
            <p className="text-sm text-muted-foreground font-medium">{course.titleEn}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/admin/courses/${course.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Edit className="h-4 w-4 text-primary" />
            <span>{tCommon('edit')}</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <CourseOverviewTab course={course} report={report} />
        )}

        {activeTab === 'lessons' && (
          <CourseLessonsTab
            courseId={course.id}
            lessons={lessons}
            onRefresh={fetchCourseData}
          />
        )}

        {activeTab === 'students' && (
          <CourseStudentsTab
            course={course}
            enrollments={enrollments}
            onRefresh={fetchCourseData}
          />
        )}

        {activeTab === 'attendance' && (
          <CourseAttendanceTab
            course={course}
            enrollments={enrollments}
            onRefresh={fetchCourseData}
          />
        )}

        {activeTab === 'grades' && (
          <CourseGradesTab
            course={course}
            enrollments={enrollments}
            onRefresh={fetchCourseData}
          />
        )}

        {activeTab === 'certificates' && (
          <CourseCertificatesTab
            course={course}
            report={report}
            onRefresh={fetchCourseData}
          />
        )}
      </div>
    </div>
  );
}
