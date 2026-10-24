'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  CreditCard,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Download,
  Calendar,
  User,
  MapPin,
  Church,
  GraduationCap,
  BookOpen,
  DollarSign,
  History,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../../../lib/api-client';
import { Member } from '../../../../../types/api';
import { StatusBadge } from '../../../../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog';
import { GenerateLetterDialog } from '../../../../../components/members/GenerateLetterDialog';
import { useToast } from '../../../../../providers/ToastProvider';
import {
  gregorianToEthiopian,
  formatEthiopianDate,
} from '../../../../../lib/ethiopian-calendar';
import { FormSkeleton } from '../../../../../components/ui/SkeletonLoaders';
import { EmptyState } from '../../../../../components/ui/EmptyState';

export default function MemberProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) || 'am';
  const toast = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const isAm = locale === 'am';

  // Active tab state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'academics' | 'attendance' | 'contributions' | 'history'
  >('overview');

  // Modals state
  const [showLetterDialog, setShowLetterDialog] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Member Details
  const { data: member, isLoading, error } = useQuery<Member>({
    queryKey: ['member-details', id],
    queryFn: () => apiClient.get<Member>(`/members/${id}`),
    enabled: Boolean(id),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/members/${id}/approve`),
    onSuccess: () => {
      toast.success(
        isAm ? 'አባሉ በተሳካ ሁኔታ ጸድቋል' : 'Member approved successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['member-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });
      setShowApproveConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ማጽደቅ አልተቻለም' : 'Failed to approve'));
    },
  });

  // Status Change Mutation (activate/deactivate)
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: 'active' | 'inactive') =>
      apiClient.put(`/members/${id}`, { status: newStatus }),
    onSuccess: (_, newStatus) => {
      toast.success(
        newStatus === 'active'
          ? isAm
            ? 'አባሉ ንቁ ሆኗል'
            : 'Member activated'
          : isAm
            ? 'አባሉ እንዲታገድ ተደርጓል'
            : 'Member deactivated'
      );
      queryClient.invalidateQueries({ queryKey: ['member-details', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });
      setShowDeactivateConfirm(false);
      setShowActivateConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ሁኔታ መቀየር አልተቻለም' : 'Failed to update status'));
    },
  });

  // Handle Download ID Card
  const handleDownloadIdCard = async () => {
    if (!member) return;
    try {
      toast.info(
        isAm ? 'የመታወቂያ ካርድ በማዘጋጀት ላይ...' : 'Preparing ID card...',
        isAm ? 'መታወቂያ' : 'ID Card'
      );
      const blob = await apiClient.get<Blob>(`/members/${member.id}/id-card`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ID-Card-${member.memberNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isAm ? 'መታወቂያው ወርዷል' : 'ID card downloaded');
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'መታወቂያ ማውረድ አልተቻለም' : 'Failed to download ID card'));
    }
  };

  // Handle Export Single Member (PDF, Word, Excel)
  const handleExportProfile = async (format: 'pdf' | 'docx' | 'xlsx') => {
    if (!member) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const ext = format === 'docx' ? 'docx' : format === 'xlsx' ? 'xlsx' : 'pdf';
      toast.info(
        isAm ? `ሰነድ በ ${format.toUpperCase()} በመዘጋጀት ላይ...` : `Preparing ${format.toUpperCase()} export...`
      );
      const blob = await apiClient.get<Blob>(`/members/${member.id}/export`, {
        params: { format },
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Member-Profile-${member.memberNo}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(
        isAm ? 'የአባሉ መገለጫ ሰነድ ወርዷል' : 'Member profile downloaded'
      );
    } catch (err: any) {
      toast.error(err.message || (isAm ? 'ሰነዱን ማውረድ አልተቻለም' : 'Failed to download export'));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-6 space-y-6">
        <FormSkeleton />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <EmptyState
          title={isAm ? 'አባሉ አልተገኘም' : 'Member Not Found'}
          description={
            isAm
              ? 'የተጠየቀው አባል አልተገኘም ወይም ተሰርዟል።'
              : 'The requested member could not be found or has been deleted.'
          }
        />
      </div>
    );
  }

  // Format Ethiopian Dates
  const joinedDateEth = member.joinedAt
    ? formatEthiopianDate(gregorianToEthiopian(new Date(member.joinedAt)), isAm ? 'am' : 'en')
    : '—';

  const birthDateEth = member.dateOfBirth
    ? formatEthiopianDate(gregorianToEthiopian(new Date(member.dateOfBirth)), isAm ? 'am' : 'en')
    : '—';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Dialogs */}
      <GenerateLetterDialog
        open={showLetterDialog}
        onOpenChange={setShowLetterDialog}
        member={member}
        locale={locale}
      />

      <ConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title={isAm ? 'አባልን ማጽደቅ ይፈልጋሉ?' : 'Approve Member?'}
        description={
          isAm
            ? `አባል "${member.firstName} ${member.fatherName}" ወደ ንቁ አባልነት እንዲቀየር ማጽደቅ ይፈልጋሉ?`
            : `Are you sure you want to approve member "${member.firstName} ${member.fatherName}" to active status?`
        }
        confirmLabel={t('approve')}
        cancelLabel={tCommon('cancel')}
        isLoading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
      />

      <ConfirmDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
        title={isAm ? 'አባልን ማገድ ይፈልጋሉ?' : 'Deactivate Member?'}
        description={
          isAm
            ? `አባል "${member.firstName} ${member.fatherName}" እንዳይንቀሳቀስ (Inactive) ማድረግ ይፈልጋሉ?`
            : `Are you sure you want to deactivate member "${member.firstName} ${member.fatherName}"?`
        }
        variant="destructive"
        confirmLabel={t('deactivate')}
        cancelLabel={tCommon('cancel')}
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate('inactive')}
      />

      <ConfirmDialog
        open={showActivateConfirm}
        onOpenChange={setShowActivateConfirm}
        title={isAm ? 'አባልን ማንቃት ይፈልጋሉ?' : 'Activate Member?'}
        description={
          isAm
            ? `አባል "${member.firstName} ${member.fatherName}" ወደ ንቁ አባልነት እንዲመለስ ይፈልጋሉ?`
            : `Are you sure you want to reactivate member "${member.firstName} ${member.fatherName}"?`
        }
        confirmLabel={t('activate')}
        cancelLabel={tCommon('cancel')}
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => updateStatusMutation.mutate('active')}
      />

      {/* Top Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={`/${locale}/admin/members`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('title')}</span>
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{member.memberNo}</span>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Member Identity Details */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative flex h-20 w-20 md:h-24 md:w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10 overflow-hidden shadow-inner">
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoUrl}
                  alt={member.firstName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {member.firstName?.[0] || 'አ'}
                </span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {member.firstName} {member.fatherName}{' '}
                  {member.grandfatherName || ''}
                </h1>
                <StatusBadge status={member.status} />
              </div>

              {member.baptismalName && (
                <p className="mt-1 text-sm font-medium text-primary">
                  {isAm ? 'የክርስትና ስም:' : 'Baptismal Name:'}{' '}
                  <span className="font-semibold">{member.baptismalName}</span>
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2.5 py-1 font-mono font-bold text-foreground">
                  {member.memberNo}
                </span>
                <span>•</span>
                <span>
                  {member.department?.nameAm ||
                    member.department?.nameEn ||
                    (isAm ? 'ክፍል አልተመደበም' : 'No Department')}
                </span>
                <span>•</span>
                <span>
                  {isAm ? 'የተመዘገበበት:' : 'Joined:'} {joinedDateEth}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Pending -> Approve Button */}
            {member.status === 'pending' && (
              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('approve')}</span>
              </button>
            )}

            {/* Inactive -> Activate Button */}
            {member.status === 'inactive' && (
              <button
                type="button"
                onClick={() => setShowActivateConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('activate')}</span>
              </button>
            )}

            {/* Active -> Deactivate Button */}
            {member.status === 'active' && (
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs md:text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>{t('deactivate')}</span>
              </button>
            )}

            {/* Edit Button */}
            <Link
              href={`/${locale}/admin/members/${member.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Edit3 className="h-4 w-4 text-primary" />
              <span>{t('editMember')}</span>
            </Link>

            {/* ID Card PDF Download */}
            <button
              type="button"
              onClick={handleDownloadIdCard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
              title={t('idCard')}
            >
              <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{t('idCard')}</span>
            </button>

            {/* Letter Dialog */}
            <button
              type="button"
              onClick={() => setShowLetterDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('generateLetter')}</span>
            </button>

            {/* Print / Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs md:text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>{t('printProfile')}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => handleExportProfile('pdf')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Download className="h-4 w-4 text-rose-500" />
                      <span>PDF Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportProfile('docx')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Download className="h-4 w-4 text-blue-500" />
                      <span>Word (.docx) Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportProfile('xlsx')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <Download className="h-4 w-4 text-emerald-500" />
                      <span>Excel (.xlsx) Spreadsheet</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex overflow-x-auto border-b border-border text-xs md:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            <span>{t('profile')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academics')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'academics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>{t('academics')}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">
              {member.enrollments?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>{t('attendance')}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">
              {member.attendances?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contributions')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'contributions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>{t('contributions')}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">
              {member.contributions?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4" />
            <span>{t('statusHistory')}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Personal Info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t('personalInfo')}
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
              <dt className="text-muted-foreground">{isAm ? 'ጾታ:' : 'Sex:'}</dt>
              <dd className="font-semibold text-foreground">
                {member.sex === 'male' ? (isAm ? 'ወንድ' : 'Male') : (isAm ? 'ሴት' : 'Female')}
              </dd>

              <dt className="text-muted-foreground">{isAm ? 'የትውልድ ቀን:' : 'Date of Birth:'}</dt>
              <dd className="font-semibold text-foreground">{birthDateEth}</dd>

              <dt className="text-muted-foreground">{t('phone')}:</dt>
              <dd className="font-mono font-semibold text-foreground">
                {member.phone || '—'}
              </dd>

              <dt className="text-muted-foreground">{t('email')}:</dt>
              <dd className="font-semibold text-foreground truncate">
                {member.email || '—'}
              </dd>
            </dl>
          </div>

          {/* Church Info */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <Church className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t('churchInfo')}
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
              <dt className="text-muted-foreground">{isAm ? 'አጥቢያ ቤተክርስቲያን:' : 'Parish Church:'}</dt>
              <dd className="font-semibold text-foreground">{member.parish || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'የንስሐ አባት:' : 'Confession Father:'}</dt>
              <dd className="font-semibold text-foreground">
                {member.confessionFather || '—'}
              </dd>

              <dt className="text-muted-foreground">{t('department')}:</dt>
              <dd className="font-semibold text-foreground">
                {member.department?.nameAm || member.department?.nameEn || '—'}
              </dd>

              <dt className="text-muted-foreground">{t('joinedDate')}:</dt>
              <dd className="font-semibold text-foreground">{joinedDateEth}</dd>
            </dl>
          </div>

          {/* Residential Address */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t('addressInfo')}
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
              <dt className="text-muted-foreground">{isAm ? 'ክልል / ከተማ:' : 'Region:'}</dt>
              <dd className="font-semibold text-foreground">{member.region || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'ዞን / ክ/ከተማ:' : 'Zone:'}</dt>
              <dd className="font-semibold text-foreground">{member.zone || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'ወረዳ:' : 'Woreda:'}</dt>
              <dd className="font-semibold text-foreground">{member.woreda || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'ቀበሌ / የቤት ቁጥር:' : 'Kebele / House:'}</dt>
              <dd className="font-semibold text-foreground">{member.kebele || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'ልዩ አድራሻ:' : 'Detail:'}</dt>
              <dd className="font-semibold text-foreground">{member.addressDetail || '—'}</dd>
            </dl>
          </div>

          {/* Education, Work & Emergency */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {t('educationWork')} & {t('emergencyContact')}
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-xs md:text-sm">
              <dt className="text-muted-foreground">{isAm ? 'የትምህርት ደረጃ:' : 'Education Level:'}</dt>
              <dd className="font-semibold text-foreground">
                {member.educationLevel || '—'}
              </dd>

              <dt className="text-muted-foreground">{isAm ? 'የሥራ መስክ:' : 'Occupation:'}</dt>
              <dd className="font-semibold text-foreground">{member.occupation || '—'}</dd>

              <dt className="text-muted-foreground">{isAm ? 'የአስቸኳይ ተጠሪ ስም:' : 'Emergency Name:'}</dt>
              <dd className="font-semibold text-foreground">
                {member.emergencyName || '—'}
              </dd>

              <dt className="text-muted-foreground">{isAm ? 'የተጠሪ ስልክ:' : 'Emergency Phone:'}</dt>
              <dd className="font-mono font-semibold text-foreground">
                {member.emergencyPhone || '—'}
              </dd>
            </dl>
          </div>

          {/* Notes Card */}
          {member.notes && (
            <div className="col-span-1 md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {isAm ? 'ተጨማሪ ማስታወሻ' : 'Notes'}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {member.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Academics */}
      {activeTab === 'academics' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-foreground">
            {t('academics')}
          </h2>

          {!member.enrollments || member.enrollments.length === 0 ? (
            <EmptyState
              title={isAm ? 'ምንም የተመዘገበ የትምህርት ክፍል የለም' : 'No Enrolled Courses'}
              description={
                isAm
                  ? 'ይህ አባል እስካሁን ድረስ በማንኛውም የትምህርት ክፍል አልተመዘገበም።'
                  : 'This member has not been enrolled in any courses yet.'
              }
            />
          ) : (
            <div className="divide-y divide-border/60">
              {member.enrollments.map((enr) => (
                <div key={enr.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {enr.course?.titleAm || enr.course?.titleEn || 'Course'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isAm ? 'ደረጃ:' : 'Level:'} {enr.course?.level || '—'}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary capitalize">
                      {enr.status}
                    </span>
                  </div>

                  {/* Grades */}
                  {enr.grades && enr.grades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {enr.grades.map((grade) => (
                        <div
                          key={grade.id}
                          className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs"
                        >
                          <span className="text-muted-foreground mr-1.5">
                            {grade.assessmentName}:
                          </span>
                          <span className="font-bold text-foreground">
                            {grade.score} / {grade.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'attendance' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-foreground">
            {t('attendance')}
          </h2>

          {!member.attendances || member.attendances.length === 0 ? (
            <EmptyState
              title={isAm ? 'ምንም የመገኘት መረጃ የለም' : 'No Attendance Records'}
              description={
                isAm
                  ? 'ለዚህ አባል የተመዘገበ የክፍል መገኘት አልተገኘም።'
                  : 'There are no attendance sessions recorded for this member yet.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{isAm ? 'ቀን' : 'Date'}</th>
                    <th className="px-4 py-3">{isAm ? 'ትምህርት / ክፍል' : 'Course'}</th>
                    <th className="px-4 py-3">{t('status')}</th>
                    <th className="px-4 py-3">{isAm ? 'ማስታወሻ' : 'Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {member.attendances.map((att) => {
                    const dateEth = att.sessionDate
                      ? formatEthiopianDate(gregorianToEthiopian(new Date(att.sessionDate)), isAm ? 'am' : 'en')
                      : '—';
                    return (
                      <tr key={att.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{dateEth}</td>
                        <td className="px-4 py-3 text-muted-foreground">{att.course?.titleAm || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              att.status === 'present'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : att.status === 'late'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                  : att.status === 'excused'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{att.notes || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Contributions */}
      {activeTab === 'contributions' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-foreground">
            {t('contributions')}
          </h2>

          {!member.contributions || member.contributions.length === 0 ? (
            <EmptyState
              title={isAm ? 'ምንም የተመዘገበ መዋጮ የለም' : 'No Contribution Records'}
              description={
                isAm
                  ? 'ለዚህ አባል የተመዘገበ የገንዘብ ወይም የአባልነት መዋጮ አልተገኘም።'
                  : 'No contribution or dues receipts recorded for this member yet.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">{isAm ? 'ደረሰኝ ቁጥር' : 'Receipt No'}</th>
                    <th className="px-4 py-3">{isAm ? 'ዓይነት' : 'Type'}</th>
                    <th className="px-4 py-3">{isAm ? 'መጠን (ብር)' : 'Amount (ETB)'}</th>
                    <th className="px-4 py-3">{isAm ? 'ቀን' : 'Date'}</th>
                    <th className="px-4 py-3">{isAm ? 'የክፍያ ዘዴ' : 'Payment Method'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {member.contributions.map((con) => {
                    const paidDateEth = con.paidAt
                      ? formatEthiopianDate(gregorianToEthiopian(new Date(con.paidAt)), isAm ? 'am' : 'en')
                      : '—';
                    return (
                      <tr key={con.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-bold text-primary">
                          {con.receiptNo || '—'}
                        </td>
                        <td className="px-4 py-3 capitalize text-foreground">{con.type}</td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {Number(con.amount).toLocaleString()} ብር
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{paidDateEth}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">
                          {con.paymentMethod || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Status History (Audit Log) */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-foreground">
            {t('statusHistory')}
          </h2>

          {!member.statusHistory || member.statusHistory.length === 0 ? (
            <EmptyState
              title={isAm ? 'ምንም የለውጥ ታሪክ የለም' : 'No Audit History'}
              description={
                isAm
                  ? 'ለዚህ አባል እስካሁን ድረስ የተመዘገበ የኦዲት መዝገብ የለም።'
                  : 'No audit history logs recorded for this member yet.'
              }
            />
          ) : (
            <div className="relative border-l-2 border-primary/20 pl-6 ml-4 space-y-6">
              {member.statusHistory.map((log) => {
                const logDate = log.createdAt
                  ? formatEthiopianDate(gregorianToEthiopian(new Date(log.createdAt)), isAm ? 'am' : 'en')
                  : '—';
                return (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm uppercase">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {logDate}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isAm ? 'ክስተት:' : 'Entity:'} {log.entity} (IP: {log.ipAddress || '—'})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
