'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Course, Member, PaginatedResponse } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  FormCard,
  FormSection,
  TextField,
  TextArea,
  SelectWithSearch,
  DateField,
  SecondaryButton,
  SubmitBar,
} from '@/components/forms';
import { BookOpen, Users, ArrowLeft, Save } from 'lucide-react';

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
  const isAm = locale === 'am';

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<Member[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const methods = useForm<CourseFormData>({
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

  const {
    handleSubmit,
    formState: { isDirty },
  } = methods;

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
        logger.error('Failed to load teachers', err);
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

  const statusOptions = [
    { label: t('statusDraft'), value: 'draft' },
    { label: t('statusOpen'), value: 'open' },
    { label: t('statusClosed'), value: 'closed' },
    { label: t('statusArchived'), value: 'archived' },
  ];

  const levelOptions = ACADEMIC_LEVELS.map((lvl) => ({
    label: lvl,
    value: lvl,
  }));

  const teacherOptions = [
    { label: `-- ${t('selectTeacher')} --`, value: '' },
    ...teachers.map((tch) => ({
      label: `${tch.firstName} ${tch.fatherName} (${tch.memberNo})`,
      value: tch.id,
    })),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SecondaryButton
          type="button"
          onClick={handleBack}
          startIcon={<ArrowLeft className="h-4 w-4" />}
          className="h-10 px-4 text-xs"
        >
          {tCommon('back')}
        </SecondaryButton>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          {courseId ? t('editTitle') : t('createTitle')}
        </h1>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive font-medium animate-fadeIn">
          {errorMessage}
        </div>
      )}

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Course Info */}
          <FormCard>
            <FormSection
              title={t('title')}
              icon={BookOpen}
              description={isAm ? 'የትምህርቱ ርዕስ፣ ደረጃ እና የአገልግሎት ሁኔታ።' : 'Course title, level and enrollment status.'}
            >
              <TextField
                name="titleAm"
                label={t('titleAm')}
                placeholder="ለምሳሌ፡ የነገረ መለኮት መግቢያ"
                required
              />
              <TextField
                name="titleEn"
                label={t('titleEn')}
                placeholder="e.g. Introduction to Theology"
              />
              <div className="md:col-span-2">
                <TextArea
                  name="description"
                  label={t('description')}
                  placeholder="የትምህርቱ ዝርዝር ዓላማና ይዘት..."
                  rows={3}
                />
              </div>
              <SelectWithSearch
                name="level"
                label={t('level')}
                options={levelOptions}
              />
              <SelectWithSearch
                name="status"
                label={t('status')}
                options={statusOptions}
                required
              />
            </FormSection>
          </FormCard>

          {/* Schedule & Teacher Assignment */}
          <FormCard>
            <FormSection
              title={t('assignTeacher')}
              icon={Users}
              description={isAm ? 'የመምህር ምደባ፣ የተማሪዎች አቅም እና የትምህርት ክፍለ ጊዜ።' : 'Assign teacher, student capacity, and course schedule.'}
            >
              {!isTeacher && (
                <div className="md:col-span-2">
                  <SelectWithSearch
                    name="teacherId"
                    label={t('teacher')}
                    options={teacherOptions}
                    placeholder={`-- ${t('selectTeacher')} --`}
                  />
                </div>
              )}
              <TextField
                name="capacity"
                type="number"
                label={t('capacity')}
                placeholder="40"
              />
              <TextField
                name="schedule"
                label={t('schedule')}
                placeholder="ለምሳሌ፡ ቅዳሜ ከሰዓት 8:00 - 10:00"
              />
              <DateField
                name="startDate"
                label={t('startDate')}
                locale={locale as 'am' | 'en'}
              />
              <DateField
                name="endDate"
                label={t('endDate')}
                locale={locale as 'am' | 'en'}
              />
            </FormSection>
          </FormCard>

          {/* Action Bar */}
          <SubmitBar
            primaryLabel={loading ? t('savingCourse') : t('saveCourse')}
            primaryLoading={loading}
            primaryIcon={<Save className="h-4 w-4" />}
            secondaryLabel={tCommon('cancel')}
            secondaryAction={handleBack}
          />
        </form>
      </FormProvider>

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
