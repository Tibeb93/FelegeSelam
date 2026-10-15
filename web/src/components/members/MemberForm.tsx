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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Member, Department } from '../../types/api';
import { apiClient } from '../../lib/api-client';
import { useToast } from '../../providers/ToastProvider';
import {
  InputField,
  SelectField,
  TextareaField,
} from '../ui/FormField';
import { EthiopianDatePicker } from '../ui/EthiopianDatePicker';
import { FileUpload } from '../ui/FileUpload';
import { ConfirmDialog } from '../ui/ConfirmDialog';

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
    setValue,
    formState: { isDirty, errors },
  } = methods;

  const dateOfBirthValue = watch('dateOfBirth');

  // Prevent accidental navigation when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
    } else {
      router.back();
    }
  };

  const onSubmit = async (values: MemberFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up values: convert empty strings to undefined or null
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

      if (mode === 'create') {
        const created = await apiClient.post<Member>('/members', payload);
        memberId = created.id;
        toast.success(
          isAm ? 'አባል በተሳካ ሁኔታ ተመዝግቧል' : 'Member registered successfully'
        );
      } else {
        memberId = initialData!.id;
        await apiClient.put<Member>(`/members/${memberId}`, payload);
        toast.success(
          isAm ? 'የአባል መረጃ በተሳካ ሁኔታ ታድሷል' : 'Member updated successfully'
        );
      }

      // If a photo was selected, upload it
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('photo', photoFile);
          await apiClient.post(`/members/${memberId}/photo`, formData);
          toast.success(
            isAm ? 'ፎቶ በተሳካ ሁኔታ ተጭኗል' : 'Photo uploaded successfully'
          );
        } catch (photoErr: any) {
          toast.error(
            photoErr.message || (isAm ? 'ፎቶውን መጫን አልተቻለም' : 'Photo upload failed')
          );
        }
      }

      // Invalidate relevant queries so freshly updated member data renders immediately
      await queryClient.invalidateQueries({ queryKey: ['member-details', memberId] });
      await queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });

      router.push(`/${locale}/admin/members/${memberId}`);
    } catch (err: any) {
      toast.error(
        err.message || (isAm ? 'ስህተት ተከስቷል' : 'An error occurred')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const sexOptions = [
    { label: isAm ? 'ወንድ' : 'Male', value: 'male' },
    { label: isAm ? 'ሴት' : 'Female', value: 'female' },
  ];

  const statusOptions = [
    { label: t('active'), value: 'active' },
    { label: t('pending'), value: 'pending' },
    { label: t('inactive'), value: 'inactive' },
    { label: t('graduated'), value: 'graduated' },
    { label: t('transferred'), value: 'transferred' },
  ];

  const departmentOptions = departments.map((d) => ({
    label: isAm ? d.nameAm : d.nameEn || d.nameAm,
    value: d.id,
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

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

        {/* Top Sticky Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
              title={tCommon('back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {mode === 'create' ? t('addMember') : t('editMember')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {mode === 'create'
                  ? isAm
                    ? 'አዲስ አባል ወደ ሰንበት ትምህርት ቤቱ መዝግብ'
                    : 'Register a new member to the Sunday school'
                  : `${initialData?.firstName} ${initialData?.fatherName} (${initialData?.memberNo})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSubmitting ? (isAm ? 'በማስቀመጥ ላይ...' : 'Saving...') : tCommon('save')}</span>
            </button>
          </div>
        </div>

        {/* Form Body - Card Sections */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main 2-column content */}
          <div className="space-y-8 lg:col-span-2">
            {/* 1. Personal Information */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {t('personalInfo')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('personalInfoDesc')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="firstName"
                  label={isAm ? 'ስም (FirstName)' : 'First Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ዮሐንስ' : 'e.g., Yohannes'}
                  required
                />
                <InputField
                  name="fatherName"
                  label={isAm ? 'የአባት ስም (FatherName)' : 'Father Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ተክለ' : 'e.g., Tekle'}
                  required
                />
                <InputField
                  name="grandfatherName"
                  label={isAm ? 'የአያት ስም (GrandfatherName)' : 'Grandfather Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ኃይለማርያም' : 'e.g., Hailemariam'}
                />
                <InputField
                  name="baptismalName"
                  label={isAm ? 'የክርስትና ስም (BaptismalName)' : 'Baptismal Name'}
                  placeholder={isAm ? 'ለምሳሌ፡ ወልደ ጊዮርጊስ' : 'e.g., Wolde Giorgis'}
                />
                <SelectField
                  name="sex"
                  label={isAm ? 'ጾታ (Sex)' : 'Sex'}
                  options={sexOptions}
                  required
                />
                <div className="space-y-1.5">
                  <EthiopianDatePicker
                    label={isAm ? 'የትውልድ ቀን (የኢትዮጵያ ቀን መቁጠሪያ)' : 'Date of Birth (Ethiopian Calendar)'}
                    value={dateOfBirthValue}
                    onChange={(iso) => setValue('dateOfBirth', iso, { shouldDirty: true })}
                    locale={isAm ? 'am' : 'en'}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-destructive">
                      {errors.dateOfBirth.message as string}
                    </p>
                  )}
                </div>
                <InputField
                  name="phone"
                  label={t('phone')}
                  placeholder={isAm ? 'ለምሳሌ፡ 0911223344' : '+251911223344'}
                  type="tel"
                />
                <InputField
                  name="email"
                  label={t('email')}
                  placeholder="example@mail.com"
                  type="email"
                />
              </div>
            </div>

            {/* 2. Residential Address */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {t('addressInfo')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('addressInfoDesc')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="region"
                  label={isAm ? 'ክልል / ከተማ አስተዳደር' : 'Region / City'}
                  placeholder={isAm ? 'ለምሳሌ፡ አዲስ አበባ' : 'Addis Ababa'}
                />
                <InputField
                  name="zone"
                  label={isAm ? 'ዞን / ክፍለ ከተማ' : 'Zone / Sub-city'}
                  placeholder={isAm ? 'ለምሳሌ፡ የካ / ቦሌ' : 'Yeka / Bole'}
                />
                <InputField
                  name="woreda"
                  label={isAm ? 'ወረዳ' : 'Woreda'}
                  placeholder={isAm ? 'ለምሳሌ፡ 08' : '08'}
                />
                <InputField
                  name="kebele"
                  label={isAm ? 'ቀበሌ / የቤት ቁጥር' : 'Kebele / House No'}
                  placeholder={isAm ? 'ለምሳሌ፡ 123' : '123'}
                />
                <div className="sm:col-span-2">
                  <InputField
                    name="addressDetail"
                    label={isAm ? 'ልዩ የመኖሪያ አድራሻ (መለያ ምልክት)' : 'Detailed Address / Landmark'}
                    placeholder={isAm ? 'ለምሳሌ፡ ከቅዱስ ሚካኤል ቤተክርስቲያን ጀርባ' : 'Behind St. Michael Church'}
                  />
                </div>
              </div>
            </div>

            {/* 3. Church Information */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Church className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {t('churchInfo')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('churchInfoDesc')}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  name="parish"
                  label={isAm ? 'አጥቢያ ቤተ ክርስቲያን' : 'Parish Church'}
                  placeholder={isAm ? 'ለምሳሌ፡ ደብረ ሰላም መድኃኔዓለም' : 'Debre Selam Medhanealem'}
                />
                <InputField
                  name="confessionFather"
                  label={isAm ? 'የንስሐ አባት' : 'Confession Father'}
                  placeholder={isAm ? 'ለምሳሌ፡ መልአከ ሰላም ቀሲስ አስራት' : 'Memhir Asrat'}
                />
                <SelectField
                  name="departmentId"
                  label={t('department')}
                  options={departmentOptions}
                  placeholder={t('selectDepartment')}
                />
                <SelectField
                  name="status"
                  label={t('status')}
                  options={statusOptions}
                  required
                />
                <div className="sm:col-span-2">
                  <TextareaField
                    name="notes"
                    label={isAm ? 'ተጨማሪ ማስታወሻ / ልዩ ተሰጥኦ' : 'Additional Notes / Talents'}
                    placeholder={isAm ? 'ስለ አባሉ የሚጠቀስ ልዩ ክህሎት ወይም አገልግሎት...' : 'Any relevant notes or spiritual talents...'}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 4. Education & Work + Emergency Contact */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Education & Work */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {t('educationWork')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('educationWorkDesc')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <SelectField
                    name="educationLevel"
                    label={isAm ? 'የትምህርት ደረጃ' : 'Education Level'}
                    options={educationOptions}
                    placeholder={t('selectEducation')}
                  />
                  <InputField
                    name="occupation"
                    label={isAm ? 'የሥራ መስክ / ሙያ' : 'Occupation / Profession'}
                    placeholder={isAm ? 'ለምሳሌ፡ መምህር / ነጋዴ / ተማሪ' : 'e.g. Teacher / Engineer'}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {t('emergencyContact')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('emergencyContactDesc')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <InputField
                    name="emergencyName"
                    label={isAm ? 'የተጠሪ ሙሉ ስም' : 'Contact Full Name'}
                    placeholder={isAm ? 'ለምሳሌ፡ ማርታ ተክለ' : 'e.g., Martha Tekle'}
                  />
                  <InputField
                    name="emergencyPhone"
                    label={isAm ? 'የተጠሪ ስልክ ቁጥር' : 'Contact Phone Number'}
                    placeholder={isAm ? '0922334455' : '+251922334455'}
                    type="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar: Photo upload & summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {t('photoUpload')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('photoUploadDesc')}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <FileUpload
                  value={photoFile || initialData?.photoUrl || null}
                  onChange={(file) => setPhotoFile(file)}
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeBytes={2 * 1024 * 1024}
                  previewType="image"
                  helperText={
                    isAm
                      ? 'ፎቶው ለመታወቂያ እና ለአባልነት መገለጫነት ያገለግላል።'
                      : 'Used for ID cards and member directory.'
                  }
                />
              </div>
            </div>

            {/* Notice Alert */}
            <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">
                    {isAm ? 'ማስታወሻ' : 'Notice'}
                  </p>
                  <p>
                    {isAm
                      ? 'የአባሉ ቁጥር (Member No) ሥርዓቱ በራሱ በቅደም ተከተል AS-YYYY-0001 በሚል ቅርጸት ያዘጋጀዋል። እርስዎ መሙላት አይጠበቅብዎትም።'
                      : 'Member number (AS-YYYY-0001) will be generated automatically by the system upon creation.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
