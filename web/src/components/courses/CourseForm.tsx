'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Course, Member, PaginatedResponse } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { BookOpen, Calendar, Clock, Users, ArrowLeft, Save } from 'lucide-react';

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const courseSchema = z.object({
  titleAm: z.string().min(2, 'የትምህርቱ ርዕስ በአማርኛ መሞላት አለበት'),
  titleEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  capacity: z.coerce.number().min(1, 'አቅም ቢያንስ 1 መሆን አለበት').optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'archived']),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData?: Course;
  courseId?: string;
  isTeacher?: boolean;
}

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

export function CourseForm({ initialData, courseId, isTeacher = false }: CourseFormProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Member[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      titleAm: initialData?.titleAm || '',
      titleEn: initialData?.titleEn || '',
      description: initialData?.description || '',
      level: initialData?.level || 'ደረጃ ፩ (Level 1)',
      teacherId: initialData?.teacherId || '',
      schedule: initialData?.schedule || '',
      capacity: initialData?.capacity || 40,
      startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
      endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
      status: initialData?.status || 'draft',
    },
  });

  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');

  // Load teachers list
  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await apiClient.get<PaginatedResponse<Member>>('/members', {
          params: { limit: 100, status: 'active' },
        });
        const items = res?.items || res?.data || [];
        setTeachers(items);
      } catch (err) {
        console.error('Failed to load teachers', err);
      }
    }
    loadTeachers();
  }, []);

  const onSubmit = async (data: CourseFormData) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const payload = {
        ...data,
        capacity: data.capacity ? Number(data.capacity) : undefined,
        teacherId: data.teacherId ? data.teacherId : undefined,
        startDate: data.startDate ? data.startDate : undefined,
        endDate: data.endDate ? data.endDate : undefined,
      };

      if (courseId) {
        await apiClient.put(`/courses/${courseId}`, payload);
      } else {
        await apiClient.post('/courses', payload);
      }

      router.push(`/${locale}/admin/courses`);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      router.push(`/${locale}/admin/courses`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tCommon('back')}</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {courseId ? t('editTitle') : t('createTitle')}
        </h1>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{t('title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('titleAm')} error={errors.titleAm?.message} required>
              <input
                {...register('titleAm')}
                placeholder="ለምሳሌ፡ የነገረ መለኮት መግቢያ"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>

            <FormField label={t('titleEn')} error={errors.titleEn?.message}>
              <input
                {...register('titleEn')}
                placeholder="e.g. Introduction to Theology"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>
          </div>

          <FormField label={t('description')} error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="የትምህርቱ ዝርዝር ዓላማና ይዘት..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t('level')} error={errors.level?.message}>
              <select
                {...register('level')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ACADEMIC_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label={t('status')} error={errors.status?.message} required>
              <select
                {...register('status')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="draft">{t('statusDraft')}</option>
                <option value="open">{t('statusOpen')}</option>
                <option value="closed">{t('statusClosed')}</option>
                <option value="archived">{t('statusArchived')}</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Schedule & Teacher Assignment */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Users className="h-5 w-5 text-secondary" />
            <h2 className="text-base font-semibold">{t('assignTeacher')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isTeacher && (
              <FormField label={t('teacher')} error={errors.teacherId?.message}>
                <select
                  {...register('teacherId')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- {t('selectTeacher')} --</option>
                  {teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.firstName} {tch.fatherName} ({tch.memberNo})
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label={t('capacity')} error={errors.capacity?.message}>
              <input
                type="number"
                {...register('capacity')}
                placeholder="40"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>

            <FormField label={t('schedule')} error={errors.schedule?.message}>
              <input
                {...register('schedule')}
                placeholder="ለምሳሌ፡ ቅዳሜ ከሰዓት 8:00 - 10:00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('startDate')}
              </label>
              <EthiopianDatePicker
                value={startDateVal || ''}
                onChange={(val) => setValue('startDate', val, { shouldDirty: true })}
                locale={locale as 'am' | 'en'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('endDate')}
              </label>
              <EthiopianDatePicker
                value={endDateVal || ''}
                onChange={(val) => setValue('endDate', val, { shouldDirty: true })}
                locale={locale as 'am' | 'en'}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? t('savingCourse') : t('saveCourse')}</span>
          </button>
        </div>
      </form>

      {/* Unsaved changes confirmation */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        title={locale === 'am' ? 'ያልተቀመጡ ለውጦች' : 'Unsaved Changes'}
        description={
          locale === 'am'
            ? 'ያልተቀመጡ ለውጦች አሉ። በእርግጥ መውጣት ይፈልጋሉ?'
            : 'You have unsaved changes. Are you sure you want to discard them and leave?'
        }
        confirmLabel={locale === 'am' ? 'አዎ ውጣ' : 'Discard & Leave'}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        onConfirm={() => router.push(`/${locale}/admin/courses`)}
      />
    </div>
  );
}
