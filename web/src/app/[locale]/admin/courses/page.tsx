'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Course, PaginatedResponse, UserRoleName } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';

const ACADEMIC_LEVELS = [
  'ደረጃ ፩ (Level 1)',
  'ደረጃ ፪ (Level 2)',
  'ደረጃ ፫ (Level 3)',
  'ደረጃ ፬ (Level 4)',
  'የሕፃናት ክፍል (Children)',
  'የወጣቶች ክፍል (Youth)',
  'የአረጋውያን ክፍል (Seniors)',
  'ጠቅላላ ትምህርት (General)',
];

export default function CoursesPage() {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const { user } = useAuth();
  const userRole = (user?.role?.name as UserRoleName) || 'super_admin';
  const isTeacher = userRole === 'teacher';

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (levelFilter !== 'all') {
        params.level = levelFilter;
      }

      const res = await apiClient.get<PaginatedResponse<Course>>('/courses', { params });
      if (res) {
        const items = res.items || res.data || [];
        setCourses(items);
        setTotal(res.total ?? items.length);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, levelFilter]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      setDeleting(true);
      await apiClient.delete(`/courses/${courseToDelete.id}`);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      console.error('Failed to delete course', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.titleAm.toLowerCase().includes(term) ||
      (c.titleEn && c.titleEn.toLowerCase().includes(term)) ||
      (c.level && c.level.toLowerCase().includes(term)) ||
      (c.schedule && c.schedule.toLowerCase().includes(term))
    );
  });

  const columns: ColumnDef<Course>[] = [
    {
      key: 'title',
      header: locale === 'am' ? 'የትምህርት ርዕስ' : 'Course Title',
      render: (course) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/${locale}/admin/courses/${course.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors hover:underline block truncate"
            >
              {course.titleAm}
            </Link>
            {course.titleEn && (
              <p className="text-xs text-muted-foreground truncate">{course.titleEn}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      header: t('level'),
      render: (course) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
          {course.level || '—'}
        </span>
      ),
    },
    {
      key: 'teacher',
      header: t('teacher'),
      render: (course) => {
        const teacherName = course.teacher
          ? `${course.teacher.firstName || ''} ${course.teacher.fatherName || ''}`.trim()
          : null;
        return (
          <span className="text-xs font-medium text-foreground">
            {teacherName || (
              <span className="text-muted-foreground italic">
                {locale === 'am' ? 'ያልተመደበ' : 'Unassigned'}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'schedule',
      header: t('schedule'),
      render: (course) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{course.schedule || '—'}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      header: locale === 'am' ? 'ቅበላ / ተማሪዎች' : 'Enrollment',
      render: (course) => {
        const enrolled = course._count?.enrollments ?? 0;
        const capacity = course.capacity ?? 40;
        const pct = Math.min(100, Math.round((enrolled / capacity) * 100));
        const isFull = enrolled >= capacity;

        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-foreground">
                {enrolled} / {capacity}
              </span>
              <span className={isFull ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-destructive' : pct > 75 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      render: (course) => <StatusBadge status={course.status} />,
    },
    {
      key: 'actions',
      header: tCommon('actions'),
      render: (course) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/admin/courses/${course.id}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={locale === 'am' ? 'ዝርዝር እይታ' : 'View Details'}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/admin/courses/${course.id}/edit`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={locale === 'am' ? 'አሻሽል' : 'Edit'}
          >
            <Edit className="h-4 w-4" />
          </Link>
          {!isTeacher && (
            <button
              type="button"
              onClick={() => setCourseToDelete(course)}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isTeacher && locale === 'am'
              ? 'የእኔ ትምህርቶች'
              : isTeacher
                ? 'My Courses'
                : t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {!isTeacher && (
          <Link
            href={`/${locale}/admin/courses/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addCourse')}</span>
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'am' ? 'ትምህርት በስም ወይም በደረጃ ፈልግ...' : 'Search course by title or level...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{locale === 'am' ? 'ሁሉም ሁኔታዎች' : 'All Statuses'}</option>
            <option value="draft">{t('statusDraft')}</option>
            <option value="open">{t('statusOpen')}</option>
            <option value="closed">{t('statusClosed')}</option>
            <option value="archived">{t('statusArchived')}</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('allLevels')}</option>
            {ACADEMIC_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses DataTable */}
      <DataTable
        columns={columns}
        data={filteredCourses}
        isLoading={loading}
        page={page}
        pageSize={limit}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setLimit}
        locale={locale as 'am' | 'en'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!courseToDelete}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
        title={locale === 'am' ? 'ትምህርት ሰርዝ' : 'Delete Course'}
        description={
          locale === 'am'
            ? `«${courseToDelete?.titleAm}» የሚለውን ትምህርት በእርግጥ መሰረዝ ይፈልጋሉ?`
            : `Are you sure you want to delete "${courseToDelete?.titleAm}"?`
        }
        confirmLabel={locale === 'am' ? 'አዎ ሰርዝ' : 'Delete'}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        isLoading={deleting}
        onConfirm={handleDeleteCourse}
      />
    </div>
  );
}
