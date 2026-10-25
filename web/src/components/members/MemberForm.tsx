'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User,
  MapPin,
  Church,
  GraduationCap,
  PhoneCall,
  Camera,
  Save,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit2,
  Layers,
} from 'lucide-react';
import { Member, Department } from '../../types/api';
import { apiClient } from '../../lib/api-client';
import { useToast } from '../../providers/ToastProvider';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  FormCard,
  FormSection,
  TextField,
  TextArea,
  SelectWithSearch,
  DateField,
  PhoneField,
  FileDrop,
  RadioCards,
  PrimaryButton,
  SecondaryButton,
  SubmitBar,
  FormSuccessScreen,
} from '../forms';

const memberSchema = z.object({
  firstName: z.string().min(1, 'የስም መረጃ መሞላት አለበት (First name is required)'),
  fatherName: z.string().min(1, 'የአባት ስም መረጃ መሞላት አለበት (Father name is required)'),
  grandfatherName: z.string().optional().nullable(),
  baptismalName: z.string().optional().nullable(),
  sex: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'ጾታ ይምረጡ (Please select sex)' }),
  }),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'ትክክለኛ የኢሜይል አድራሻ ያስገቡ (Invalid email format)',
    }),
  region: z.string().optional().nullable(),
  zone: z.string().optional().nullable(),
  woreda: z.string().optional().nullable(),
  kebele: z.string().optional().nullable(),
  addressDetail: z.string().optional().nullable(),
  parish: z.string().optional().nullable(),
  confessionFather: z.string().optional().nullable(),
  departmentId: z.coerce.number().optional().nullable(),
  educationLevel: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  emergencyName: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  status: z.enum(['pending', 'active', 'inactive', 'graduated', 'transferred']),
  notes: z.string().optional().nullable(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  mode: 'create' | 'edit';
  initialData?: Member;
  locale?: string;
}

const STORAGE_DRAFT_KEY = 'aemade_member_registration_draft_v1';

const STEPS = [
  { id: 'personal', titleAm: 'የግል መረጃ', titleEn: 'Personal', icon: User },
  { id: 'address', titleAm: 'አድራሻ', titleEn: 'Address', icon: MapPin },
  { id: 'church', titleAm: 'ቤተክርስቲያን', titleEn: 'Church', icon: Church },
  { id: 'education_work', titleAm: 'ትምህርትና ሥራ', titleEn: 'Education & Work', icon: GraduationCap },
  { id: 'emergency', titleAm: 'አደጋ ጊዜ ተጠሪ', titleEn: 'Emergency Contact', icon: PhoneCall },
  { id: 'photo', titleAm: 'የአባል ፎቶ', titleEn: 'Photo', icon: Camera },
  { id: 'review', titleAm: 'ማጠቃለያና ማረጋገጫ', titleEn: 'Review & Submit', icon: CheckCircle2 },
] as const;

export function MemberForm({
  mode,
  initialData,
  locale = 'am',
}: MemberFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const isAm = locale === 'am';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'stepper' | 'full'>('full');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    memberNo: string;
    fullName: string;
    departmentName?: string;
    status: string;
  } | null>(null);

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['members-departments'],
    queryFn: () => apiClient.get<Department[]>('/members/departments'),
  });

  const methods = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      fatherName: initialData?.fatherName || '',
      grandfatherName: initialData?.grandfatherName || '',
      baptismalName: initialData?.baptismalName || '',
      sex: (initialData?.sex as 'male' | 'female') || 'male',
      dateOfBirth: initialData?.dateOfBirth ? initialData.dateOfBirth.split('T')[0] : '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      region: initialData?.region || 'አዲስ አበባ',
      zone: initialData?.zone || '',
      woreda: initialData?.woreda || '',
      kebele: initialData?.kebele || '',
      addressDetail: initialData?.addressDetail || '',
      parish: initialData?.parish || 'ደብረ ሰላም መድኃኔዓለም',
      confessionFather: initialData?.confessionFather || '',
      departmentId: initialData?.departmentId || undefined,
      educationLevel: initialData?.educationLevel || '',
      occupation: initialData?.occupation || '',
      emergencyName: initialData?.emergencyName || '',
      emergencyPhone: initialData?.emergencyPhone || '',
      status: initialData?.status || (mode === 'create' ? 'active' : 'pending'),
      notes: initialData?.notes || '',
    },
  });

  const {
    handleSubmit,
    watch,
    reset,
    trigger,
    formState: { isDirty },
  } = methods;

  const formValues = watch();

  // Check for saved draft in create mode
  useEffect(() => {
    if (mode === 'create') {
      try {
        const savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
        if (savedDraft) {
          setHasDraft(true);
        }
      } catch {
        // ignore
      }
    }
  }, [mode]);

  // Autosave draft to localStorage when dirty in create mode
  useEffect(() => {
    if (mode === 'create' && isDirty) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(formValues));
        } catch {
          // ignore
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, isDirty, formValues]);

  // Resume draft
  const handleResumeDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        reset(parsed);
        toast.info(
          isAm ? 'ያልተጠናቀቀው ረቂቅ መረጃ ተመልሷል' : 'Restored draft from browser'
        );
      }
    } catch {
      toast.error(isAm ? 'ረቂቁን መጫን አልተቻለም' : 'Failed to load draft');
    }
    setHasDraft(false);
  };

  // Discard draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(STORAGE_DRAFT_KEY);
    } catch {
      // ignore
    }
    setHasDraft(false);
    toast.info(isAm ? 'ረቂቁ ተሰርዟል' : 'Draft discarded');
  };

  // Prevent accidental navigation when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !submittedData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submittedData]);

  const handleCancel = () => {
    if (isDirty && !submittedData) {
      setShowLeaveConfirm(true);
    } else {
      router.back();
    }
  };

  // Fields to validate per step
  const stepFieldsToValidate: Record<number, (keyof MemberFormData)[]> = {
    0: ['firstName', 'fatherName', 'sex', 'email', 'phone', 'dateOfBirth'],
    1: ['region', 'zone', 'woreda', 'kebele', 'addressDetail'],
    2: ['parish', 'confessionFather', 'departmentId', 'status'],
    3: ['educationLevel', 'occupation'],
    4: ['emergencyName', 'emergencyPhone'],
    5: [],
    6: [],
  };

  const handleNextStep = async () => {
    const fieldsToValidate = stepFieldsToValidate[currentStepIndex] || [];
    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;

    if (isValid) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error(
        isAm
          ? 'እባክዎ የተሳሳቱ ወይም ያልተሞሉ መረጃዎችን ያስተካክሉ'
          : 'Please correct the errors before proceeding'
      );
    }
  };

  const handlePrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpToStep = async (index: number) => {
    if (index < currentStepIndex) {
      setCurrentStepIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Validate current before jumping forward
      const fieldsToValidate = stepFieldsToValidate[currentStepIndex] || [];
      const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : true;
      if (isValid) {
        setCurrentStepIndex(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const onSubmit = async (values: MemberFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        firstName: values.firstName.trim(),
        fatherName: values.fatherName.trim(),
        grandfatherName: values.grandfatherName?.trim() || undefined,
        baptismalName: values.baptismalName?.trim() || undefined,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        region: values.region?.trim() || undefined,
        zone: values.zone?.trim() || undefined,
        woreda: values.woreda?.trim() || undefined,
        kebele: values.kebele?.trim() || undefined,
        addressDetail: values.addressDetail?.trim() || undefined,
        parish: values.parish?.trim() || undefined,
        confessionFather: values.confessionFather?.trim() || undefined,
        departmentId: values.departmentId ? Number(values.departmentId) : undefined,
        educationLevel: values.educationLevel?.trim() || undefined,
        occupation: values.occupation?.trim() || undefined,
        emergencyName: values.emergencyName?.trim() || undefined,
        emergencyPhone: values.emergencyPhone?.trim() || undefined,
        status: values.status,
        notes: values.notes?.trim() || undefined,
      };

      let memberId: string;
      let generatedMemberNo = '';

      if (mode === 'create') {
        const created = await apiClient.post<Member>('/members', payload);
        memberId = created.id;
        generatedMemberNo = created.memberNo || `AS-${new Date().getFullYear()}-0001`;

        // Clear saved draft
        try {
          localStorage.removeItem(STORAGE_DRAFT_KEY);
        } catch {
          // ignore
        }

        toast.success(
          isAm ? 'አባል በተሳካ ሁኔታ ተመዝግቧል' : 'Member registered successfully'
        );
      } else {
        memberId = initialData!.id;
        generatedMemberNo = initialData?.memberNo || '';
        await apiClient.put<Member>(`/members/${memberId}`, payload);
        toast.success(
          isAm ? 'የአባል መረጃ በተሳካ ሁኔታ ታድሷል' : 'Member updated successfully'
        );
      }

      // If photo was selected, upload it
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('photo', photoFile);
          await apiClient.post(`/members/${memberId}/photo`, formData);
        } catch (photoErr: any) {
          toast.error(
            photoErr.message || (isAm ? 'ፎቶውን መጫን አልተቻለም' : 'Photo upload failed')
          );
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
      await queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });

      if (mode === 'create' && viewMode === 'stepper') {
        const dept = departments.find((d) => d.id === Number(values.departmentId));
        setSubmittedData({
          id: memberId,
          memberNo: generatedMemberNo,
          fullName: `${values.firstName} ${values.fatherName} ${values.grandfatherName || ''}`.trim(),
          departmentName: dept ? (isAm ? dept.nameAm : dept.nameEn || dept.nameAm) : undefined,
          status: values.status,
        });
      } else {
        router.push(`/${locale}/admin/members/${memberId}`);
      }
    } catch (err: any) {
      toast.error(
        err.message || (isAm ? 'ስህተት ተከስቷል' : 'An error occurred')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sexOptions = [
    {
      label: isAm ? 'ወንድ (Male)' : 'Male',
      value: 'male',
      description: isAm ? 'የወንድ አባል' : 'Male member',
    },
    {
      label: isAm ? 'ሴት (Female)' : 'Female',
      value: 'female',
      description: isAm ? 'የሴት አባል' : 'Female member',
    },
  ];

  const statusOptions = [
    { label: t('active'), value: 'active', description: isAm ? 'በአገልግሎት ላይ ያለ' : 'Currently active' },
    { label: t('pending'), value: 'pending', description: isAm ? 'በመጠባበቅ ላይ ያለ' : 'Awaiting confirmation' },
    { label: t('inactive'), value: 'inactive', description: isAm ? 'ያልነቃ አባል' : 'Inactive' },
    { label: t('graduated'), value: 'graduated', description: isAm ? 'የተመረቀ አባል' : 'Graduated' },
    { label: t('transferred'), value: 'transferred', description: isAm ? 'የተዛወረ አባል' : 'Transferred' },
  ];

  const departmentOptions = departments.map((d) => ({
    label: isAm ? d.nameAm : d.nameEn || d.nameAm,
    value: d.id,
    description: d.description || undefined,
  }));

  const educationOptions = [
    { label: isAm ? 'የመጀመሪያ ደረጃ (1-8)' : 'Primary (1-8)', value: 'Primary' },
    { label: isAm ? 'የሁለተኛ ደረጃ (9-12)' : 'Secondary (9-12)', value: 'Secondary' },
    { label: isAm ? 'ኮሌጅ ዲፕሎማ' : 'Diploma', value: 'Diploma' },
    { label: isAm ? 'የመጀመሪያ ዲግሪ' : "Bachelor's Degree", value: 'Degree' },
    { label: isAm ? 'ሁለተኛ ዲግሪ (ማስተርስ)' : "Master's Degree", value: 'Masters' },
    { label: isAm ? 'የዶክትሬት ዲግሪ' : 'PhD', value: 'PhD' },
    { label: isAm ? 'ሌላ' : 'Other', value: 'Other' },
  ];

  // If successfully submitted, render post-submit success celebration screen
  if (submittedData) {
    return (
      <FormCard className="max-w-3xl mx-auto py-10">
        <FormSuccessScreen
          title={isAm ? 'አባል በተሳካ ሁኔታ ተመዝግቧል!' : 'Member Registered Successfully!'}
          description={
            isAm
              ? 'የአባሉ መረጃ ወደ ዳታቤዝ ገብቷል፤ የመታወቂያ ቁጥር ተዘጋጅቶለታል።'
              : 'The member record has been saved and an official ID number has been assigned.'
          }
          summaryTitle={isAm ? 'የአባሉ ማጠቃለያ መረጃ' : 'Member Summary'}
          summaryItems={[
            {
              label: isAm ? 'የአባል ቁጥር (ID)' : 'Member ID',
              value: (
                <span className="font-mono text-primary font-bold">
                  {submittedData.memberNo}
                </span>
              ),
            },
            {
              label: isAm ? 'ሙሉ ስም' : 'Full Name',
              value: submittedData.fullName,
            },
            {
              label: isAm ? 'ክፍል / ዘርፍ' : 'Department',
              value: submittedData.departmentName || (isAm ? 'አልተመረጠም' : 'None'),
            },
            {
              label: isAm ? 'የአባልነት ሁኔታ' : 'Membership Status',
              value: (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">
                  {submittedData.status}
                </span>
              ),
            },
          ]}
          primaryAction={{
            label: isAm ? 'ወደ አባል መገለጫ ሂድ' : 'View Member Profile',
            href: `/${locale}/admin/members/${submittedData.id}`,
          }}
          secondaryAction={{
            label: isAm ? 'ሌላ አባል መዝግብ' : 'Register Another Member',
            onClick: () => {
              setSubmittedData(null);
              setCurrentStepIndex(0);
              reset({
                firstName: '',
                fatherName: '',
                grandfatherName: '',
                baptismalName: '',
                sex: 'male',
                dateOfBirth: '',
                phone: '',
                email: '',
                region: 'አዲስ አበባ',
                zone: '',
                woreda: '',
                kebele: '',
                addressDetail: '',
                parish: 'ደብረ ሰላም መድኃኔዓለም',
                confessionFather: '',
                departmentId: undefined,
                educationLevel: '',
                occupation: '',
                emergencyName: '',
                emergencyPhone: '',
                status: 'active',
                notes: '',
              });
              setPhotoFile(null);
            },
          }}
          tertiaryAction={{
            label: isAm ? 'ወደ አባላት ዝርዝር ተመለስ' : 'Back to Members Directory',
            href: `/${locale}/admin/members`,
          }}
        />
      </FormCard>
    );
  }

  // Active step info
  const currentStep = STEPS[currentStepIndex];
  const isReviewStep = currentStep.id === 'review';
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Unsaved Changes Confirmation Modal */}
        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title={t('unsavedChangesTitle')}
          description={t('unsavedChangesDesc')}
          variant="destructive"
          confirmLabel={isAm ? 'አዎ፣ ውጣ' : 'Yes, Leave'}
          cancelLabel={isAm ? 'ቆይ' : 'Stay'}
          onConfirm={() => {
            setShowLeaveConfirm(false);
            router.back();
          }}
        />

        {/* Draft Recovery Banner */}
        {hasDraft && mode === 'create' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-100 p-4 text-xs md:text-sm text-primary-950 dark:bg-primary-950/60 dark:text-primary-100 dark:border-primary-800 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary-700 dark:text-primary-400 shrink-0" />
              <span>
                {isAm
                  ? 'ያልተጠናቀቀ ረቂቅ ምዝገባ ተገኝቷል። መቀጠል ይፈልጋሉ?'
                  : 'An unfinished registration draft was found in your browser.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted font-medium transition-colors"
              >
                {isAm ? 'አዲስ ጀምር' : 'Discard'}
              </button>
              <button
                type="button"
                onClick={handleResumeDraft}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm transition-colors"
              >
                {isAm ? 'ረቂቁን ቀጥል' : 'Resume Draft'}
              </button>
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
              title={tCommon('back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {mode === 'create' ? t('addMember') : t('editMember')}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === 'create'
                  ? isAm
                    ? 'አዲስ አባል ወደ ሰንበት ትምህርት ቤቱ መዝግብ (የደረጃ በደረጃ ቅጽ)'
                    : 'Register a new member to the Sunday school'
                  : `${initialData?.firstName} ${initialData?.fatherName} (${initialData?.memberNo})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'stepper' ? 'full' : 'stepper')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={viewMode === 'stepper' ? 'ሙሉ ገጽ አሳይ' : 'ደረጃ በደረጃ አሳይ'}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{viewMode === 'stepper' ? (isAm ? 'ሙሉ ቅጽ' : 'All Sections') : (isAm ? 'ደረጃ በደረጃ' : 'Stepper')}</span>
            </button>
          </div>
        </div>

        {/* Stepper Progress Indicator */}
        {viewMode === 'stepper' && (
          <div className="rounded-2xl border border-border bg-card p-4 md:p-6 shadow-sm">
            {/* Mobile compact stepper bar */}
            <div className="block md:hidden space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-primary flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]">
                    {currentStepIndex + 1}
                  </span>
                  {isAm ? currentStep.titleAm : currentStep.titleEn}
                </span>
                <span className="text-muted-foreground font-mono">
                  {currentStepIndex + 1} / {STEPS.length} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Desktop 7-step horizontal timeline */}
            <div className="hidden md:flex items-center justify-between relative">
              <div className="absolute top-5 left-6 right-6 h-0.5 bg-border -z-0" />
              {STEPS.map((step, idx) => {
                const isPast = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => jumpToStep(idx)}
                    className="relative z-10 flex flex-col items-center group focus:outline-none"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isPast
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : isCurrent
                          ? 'border-primary bg-background text-primary ring-4 ring-primary/20 shadow-md'
                          : 'border-border bg-card text-muted-foreground group-hover:border-primary/50'
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs font-semibold transition-colors text-center ${
                        isCurrent
                          ? 'text-primary'
                          : isPast
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isAm ? step.titleAm : step.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP CONTENT CONTAINER */}
        <div className="space-y-6">
          {/* STEP 1: PERSONAL INFORMATION */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 0 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'የግል መረጃ (Personal Information)' : 'Personal Information'}
                icon={User}
                description={
                  isAm
                    ? 'የአባሉን ሙሉ ስም፣ ጾታ፣ የትውልድ ቀንና የመገናኛ አድራሻዎችን በትክክል ያስገቡ።'
                    : 'Enter the member legal name, gender, birth date and primary contact details.'
                }
              >
                <TextField
                  name="firstName"
                  label={isAm ? 'ስም (First Name)' : 'First Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ዮሐንስ' : 'e.g., Yohannes'}
                  required
                />
                <TextField
                  name="fatherName"
                  label={isAm ? 'የአባት ስም (Father Name)' : 'Father Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ተክለ' : 'e.g., Tekle'}
                  required
                />
                <TextField
                  name="grandfatherName"
                  label={isAm ? 'የአያት ስም (Grandfather Name)' : 'Grandfather Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ኃይለማርያም' : 'e.g., Hailemariam'}
                />
                <TextField
                  name="baptismalName"
                  label={isAm ? 'የክርስትና ስም (Baptismal Name)' : 'Baptismal Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ወልደ ጊዮርጊስ' : 'e.g., Wolde Giorgis'}
                />
                <div className="md:col-span-2">
                  <RadioCards
                    name="sex"
                    label={isAm ? 'ጾታ (Gender)' : 'Gender'}
                    options={sexOptions}
                    required
                  />
                </div>
                <DateField
                  name="dateOfBirth"
                  label={isAm ? 'የትውልድ ቀን (Date of Birth)' : 'Date of Birth'}
                  helperText={
                    isAm
                      ? 'የኢትዮጵያ ቀን መቁጠሪያን ይጠቀሙ፤ በራስ-ሰር ወደ ፈረንጅ ቀን ይሰላል።'
                      : 'Pick Ethiopian date, synced to ISO Gregorian.'
                  }
                  locale={isAm ? 'am' : 'en'}
                />
                <PhoneField
                  name="phone"
                  label={t('phone')}
                  placeholder="0911223344"
                />
                <div className="md:col-span-2">
                  <TextField
                    name="email"
                    type="email"
                    label={t('email')}
                    placeholder="member@felegeselam.org"
                  />
                </div>
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 2: RESIDENTIAL ADDRESS */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 1 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'የመኖሪያ አድራሻ (Residential Address)' : 'Residential Address'}
                icon={MapPin}
                description={
                  isAm
                    ? 'አባሉ በአሁኑ ሰዓት የሚኖርበትን ክልል፣ ወረዳ፣ ቀበሌ እና መለያ ምልክት ያስገቡ።'
                    : 'Provide the permanent residence location and key landmarks.'
                }
              >
                <TextField
                  name="region"
                  label={isAm ? 'ክልል / ከተማ አስተዳደር' : 'Region / City'}
                  placeholder={isAm ? 'ለምሳሌ፡ አዲስ አበባ' : 'Addis Ababa'}
                />
                <TextField
                  name="zone"
                  label={isAm ? 'ዞን / ክፍለ ከተማ' : 'Zone / Sub-city'}
                  placeholder={isAm ? 'ለምሳሌ፡ የካ / ቦሌ' : 'Yeka / Bole'}
                />
                <TextField
                  name="woreda"
                  label={isAm ? 'ወረዳ' : 'Woreda'}
                  placeholder={isAm ? 'ለምሳሌ፡ 08' : '08'}
                />
                <TextField
                  name="kebele"
                  label={isAm ? 'ቀበሌ / የቤት ቁጥር' : 'Kebele / House No'}
                  placeholder={isAm ? 'ለምሳሌ፡ 123' : '123'}
                />
                <div className="md:col-span-2">
                  <TextArea
                    name="addressDetail"
                    label={isAm ? 'ልዩ የመኖሪያ አድራሻ (መለያ ምልክት)' : 'Detailed Address / Landmark'}
                    placeholder={isAm ? 'ለምሳሌ፡ ከቅዱስ ሚካኤል ቤተክርስቲያን ጀርባ፣ ግራዶ ታክሲ ተራ' : 'Behind church, landmark...'}
                    rows={2}
                  />
                </div>
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 3: CHURCH INFORMATION */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 2 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'የቤተክርስቲያንና የአገልግሎት መረጃ (Church Information)' : 'Church & Service Information'}
                icon={Church}
                description={
                  isAm
                    ? 'የአጥቢያ ቤተክርስቲያን፣ የንስሐ አባት፣ የሰንበት ትምህርት ቤት ክፍልና የአባልነት ሁኔታ።'
                    : 'Parish, confession father, assigned department, and spiritual talents.'
                }
              >
                <TextField
                  name="parish"
                  label={isAm ? 'አጥቢያ ቤተ ክርስቲያን' : 'Parish Church'}
                  placeholder={isAm ? 'ለምሳሌ፡ ደብረ ሰላም መድኃኔዓለም' : 'Debre Selam Medhanealem'}
                />
                <TextField
                  name="confessionFather"
                  label={isAm ? 'የንስሐ አባት' : 'Confession Father'}
                  placeholder={isAm ? 'ለምሳሌ፡ መልአከ ሰላም ቀሲስ አስራት' : 'Memhir Asrat'}
                />
                <SelectWithSearch
                  name="departmentId"
                  label={t('department')}
                  options={departmentOptions}
                  placeholder={t('selectDepartment')}
                  helperText={
                    isAm
                      ? 'አባሉ የሚያገለግልበትን ክፍል ይምረጡ (ለምሳሌ፡ ትምህርት፣ ዝማሬ፣ ወዘተ)'
                      : 'Assigned ministry department.'
                  }
                />
                <SelectWithSearch
                  name="status"
                  label={t('status')}
                  options={statusOptions}
                  required
                />
                <div className="md:col-span-2">
                  <TextArea
                    name="notes"
                    label={isAm ? 'ተጨማሪ ማስታወሻ / ልዩ ተሰጥኦ' : 'Additional Notes / Talents'}
                    placeholder={isAm ? 'ስለ አባሉ የሚጠቀስ መንፈሳዊ ተሰጥኦ ወይም አገልግሎት...' : 'Any spiritual talents or service notes...'}
                    rows={3}
                  />
                </div>
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 4: EDUCATION & WORK */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 3 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'ትምህርትና የሥራ መስክ (Education & Occupation)' : 'Education & Occupation'}
                icon={GraduationCap}
                description={
                  isAm
                    ? 'የዓለማዊ ትምህርት ደረጃ እና ወቅታዊ የሥራ ወይም የሙያ መስክ።'
                    : 'Academic qualification and current occupation or profession.'
                }
              >
                <SelectWithSearch
                  name="educationLevel"
                  label={isAm ? 'የትምህርት ደረጃ' : 'Education Level'}
                  options={educationOptions}
                  placeholder={t('selectEducation')}
                />
                <TextField
                  name="occupation"
                  label={isAm ? 'የሥራ መስክ / ሙያ' : 'Occupation / Profession'}
                  placeholder={isAm ? 'ለምሳሌ፡ መምህር / ሐኪም / ተማሪ' : 'e.g. Teacher / Engineer'}
                />
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 5: EMERGENCY CONTACT */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 4 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'የአደጋ ጊዜ ተጠሪ (Emergency Contact)' : 'Emergency Contact'}
                icon={PhoneCall}
                description={
                  isAm
                    ? 'አስቸኳይ ሁኔታ በሚፈጠርበት ጊዜ በቀጥታ የሚገናኝ የቤተሰብ ወይም የቅርብ ሰው።'
                    : 'Designated primary emergency contact person and phone number.'
                }
              >
                <TextField
                  name="emergencyName"
                  label={isAm ? 'የተጠሪ ሙሉ ስም' : 'Contact Full Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ማርታ ተክለ' : 'e.g., Martha Tekle'}
                />
                <PhoneField
                  name="emergencyPhone"
                  label={isAm ? 'የተጠሪ ስልክ ቁጥር' : 'Contact Phone Number'}
                  placeholder="0922334455"
                />
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 6: PHOTO UPLOAD */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 5 ? 'block' : 'hidden'
            }
          >
            <FormCard>
              <FormSection
                title={isAm ? 'የአባል ፎቶ (Profile Photo)' : 'Member Profile Photo'}
                icon={Camera}
                description={
                  isAm
                    ? 'ለአባልነት መታወቂያ ካርድ እና ለአባላት ማውጫ የሚያገለግል ጥርት ያለ ፎቶ ይጫኑ።'
                    : 'Upload a clear passport-style photo for official member ID cards.'
                }
                columns={1}
              >
                <FileDrop
                  label={isAm ? 'ፎቶ ምረጥ' : 'Select Photo'}
                  helperText={
                    isAm
                      ? 'PNG, JPG ወይም WEBP እስከ 2MB። ፎቶውን እዚህ ይጎትቱ ወይም ይጫኑ።'
                      : 'PNG, JPG or WEBP up to 2MB.'
                  }
                  currentFile={photoFile}
                  currentPreviewUrl={initialData?.photoUrl || null}
                  onFileSelect={(file) => setPhotoFile(file)}
                />
              </FormSection>
            </FormCard>
          </div>

          {/* STEP 7: REVIEW & CONFIRMATION */}
          <div
            className={
              viewMode === 'full' || currentStepIndex === 6 ? 'block' : 'hidden'
            }
          >
            <FormCard
              title={isAm ? 'የመረጃ ማጠቃለያና ማረጋገጫ (Review & Submit)' : 'Review & Submit'}
              description={
                isAm
                  ? 'ያስገቧቸውን መረጃዎች በትክክል ይገምግሙ። ማንኛውንም መረጃ ለማስተካከል "አስተካክል" የሚለውን ይጫኑ።'
                  : 'Review all entered information before final submission.'
              }
            >
              <div className="space-y-6">
                {/* 1. Personal Info Summary */}
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {isAm ? 'የግል መረጃ' : 'Personal Info'}
                    </span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(0)}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      {isAm ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ሙሉ ስም' : 'Full Name'}:</span>
                      <span className="font-semibold text-foreground">
                        {formValues.firstName} {formValues.fatherName} {formValues.grandfatherName || ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'የክርስትና ስም' : 'Baptismal Name'}:</span>
                      <span className="font-semibold text-foreground">
                        {formValues.baptismalName || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ጾታ' : 'Gender'}:</span>
                      <span className="font-semibold text-foreground capitalize">
                        {formValues.sex === 'male' ? (isAm ? 'ወንድ' : 'Male') : (isAm ? 'ሴት' : 'Female')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ስልክ' : 'Phone'}:</span>
                      <span className="font-semibold text-foreground">{formValues.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ኢሜይል' : 'Email'}:</span>
                      <span className="font-semibold text-foreground">{formValues.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'የትውልድ ቀን' : 'Birth Date'}:</span>
                      <span className="font-semibold text-foreground">{formValues.dateOfBirth || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Address & Church Summary */}
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Church className="h-4 w-4 text-primary" />
                      {isAm ? 'አድራሻና ቤተክርስቲያን' : 'Address & Church'}
                    </span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(1)}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      {isAm ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'መኖሪያ' : 'Residence'}:</span>
                      <span className="font-semibold text-foreground">
                        {[formValues.region, formValues.zone, formValues.woreda].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'አጥቢያ' : 'Parish'}:</span>
                      <span className="font-semibold text-foreground">{formValues.parish || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'የንስሐ አባት' : 'Confession Father'}:</span>
                      <span className="font-semibold text-foreground">{formValues.confessionFather || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ክፍል' : 'Department'}:</span>
                      <span className="font-semibold text-foreground">
                        {departments.find((d) => d.id === Number(formValues.departmentId))?.nameAm || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ሁኔታ' : 'Status'}:</span>
                      <span className="font-semibold text-foreground capitalize">{formValues.status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ሙያ' : 'Occupation'}:</span>
                      <span className="font-semibold text-foreground">{formValues.occupation || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Emergency Contact Summary */}
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-primary" />
                      {isAm ? 'የአደጋ ጊዜ ተጠሪ' : 'Emergency Contact'}
                    </span>
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      {isAm ? 'አስተካክል' : 'Edit'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ተጠሪ ስም' : 'Name'}:</span>
                      <span className="font-semibold text-foreground">{formValues.emergencyName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">{isAm ? 'ተጠሪ ስልክ' : 'Phone'}:</span>
                      <span className="font-semibold text-foreground">{formValues.emergencyPhone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Notice Alert */}
                <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-300">
                    <p className="font-semibold mb-0.5">
                      {isAm ? 'የመጨረሻ ማረጋገጫ' : 'Final Confirmation'}
                    </p>
                    <p>
                      {isAm
                        ? 'የአባሉ ቁጥር በስርዓቱ በራሱ ተዘጋጅቶ መገለጫው ወዲያውኑ ይፈጠራል። "አረጋግጥና አስቀምጥ" የሚለውን ይጫኑ።'
                        : 'Click Confirm & Save to register the member and assign official ID number.'}
                    </p>
                  </div>
                </div>
              </div>
            </FormCard>
          </div>
        </div>

        {/* BOTTOM SUBMIT / STEPPER NAVIGATION BAR */}
        <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
          {viewMode === 'stepper' ? (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                {currentStepIndex > 0 ? (
                  <SecondaryButton
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    {isAm ? 'ወደ ኋላ' : 'Previous'}
                  </SecondaryButton>
                ) : (
                  <SecondaryButton
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {tCommon('cancel')}
                  </SecondaryButton>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isReviewStep ? (
                  <PrimaryButton
                    type="button"
                    onClick={handleNextStep}
                    endIcon={<ArrowRight className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    {isAm ? 'ቀጣይ' : 'Next'}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    type="submit"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    startIcon={<CheckCircle2 className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    {isAm ? 'አረጋግጥና አስቀምጥ' : 'Confirm & Save'}
                  </PrimaryButton>
                )}
              </div>
            </div>
          ) : (
            <SubmitBar
              primaryLabel={isAm ? 'አስቀምጥ' : tCommon('save')}
              primaryLoading={isSubmitting}
              primaryIcon={<Save className="h-4 w-4" />}
              secondaryLabel={tCommon('cancel')}
              secondaryAction={handleCancel}
            />
          )}
        </div>
      </form>
    </FormProvider>
  );
}
