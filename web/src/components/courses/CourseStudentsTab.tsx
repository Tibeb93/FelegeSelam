'use client';

import React, { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Course, CourseEnrollment, Department, Member, PaginatedResponse } from '@/types/api';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Users,
  UserPlus,
  Building2,
  Search,
  UserMinus,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface CourseStudentsTabProps {
  course: Course;
  enrollments: CourseEnrollment[];
  onRefresh: () => void;
}

export function CourseStudentsTab({
  course,
  enrollments,
  onRefresh,
}: CourseStudentsTabProps) {
  const locale = useLocale();
  const t = useTranslations('Courses');
  const tCommon = useTranslations('Common');

  const [search, setSearch] = useState('');
  const [showSingleEnrollModal, setShowSingleEnrollModal] = useState(false);
  const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
  const [enrollmentToDrop, setEnrollmentToDrop] = useState<CourseEnrollment | null>(null);

  // Single enroll state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchedMembers, setSearchedMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [singleEnrolling, setSingleEnrolling] = useState(false);
  const [singleEnrollError, setSingleEnrollError] = useState<string | null>(null);

  // Bulk enroll state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [bulkEnrolling, setBulkEnrolling] = useState(false);
  const [bulkEnrollResult, setBulkEnrollResult] = useState<any | null>(null);
  const [bulkEnrollError, setBulkEnrollError] = useState<string | null>(null);

  // Dropping state
  const [dropping, setDropping] = useState(false);

  const capacity = course.capacity ?? 40;
  const enrolledCount = enrollments.filter((e) => e.status !== 'dropped').length;
  const isCapacityFull = enrolledCount >= capacity;

  // Search members for single enrollment
  useEffect(() => {
    if (!memberSearchQuery || memberSearchQuery.length < 2) {
      setSearchedMembers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingMembers(true);
        const res = await apiClient.get<PaginatedResponse<Member>>('/members', {
          params: { search: memberSearchQuery, limit: 10 },
        });
        const items = res?.items || res?.data || [];
        // Filter out already enrolled members
        const enrolledMemberIds = new Set(enrollments.map((e) => e.memberId));
        setSearchedMembers(items.filter((m) => !enrolledMemberIds.has(m.id)));
      } catch (err) {
        logger.error('Failed to search members', err);
      } finally {
        setSearchingMembers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [memberSearchQuery, enrollments]);

  // Load departments for bulk enroll
  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await apiClient.get<any>('/departments');
        if (res) {
          setDepartments(Array.isArray(res) ? res : res.data || res.items || []);
        }
      } catch (err) {
        logger.error('Failed to load departments', err);
      }
    }
    loadDepts();
  }, []);

  const handleSingleEnroll = async () => {
    if (!selectedMember) return;
    try {
      setSingleEnrolling(true);
      setSingleEnrollError(null);

      await apiClient.post(`/courses/${course.id}/enrollments`, {
        memberId: selectedMember.id,
      });

      setShowSingleEnrollModal(false);
      setSelectedMember(null);
      setMemberSearchQuery('');
      onRefresh();
    } catch (err: any) {
      setSingleEnrollError(
        err?.response?.data?.message || err?.message || 'Failed to enroll member',
      );
    } finally {
      setSingleEnrolling(false);
    }
  };

  const handleBulkEnroll = async () => {
    if (!selectedDeptId) return;
    try {
      setBulkEnrolling(true);
      setBulkEnrollError(null);
      setBulkEnrollResult(null);

      const res = await apiClient.post<any>(
        `/courses/${course.id}/enrollments/bulk-department`,
        {
          departmentId: Number(selectedDeptId),
        },
      );

      setBulkEnrollResult(res?.data);
      onRefresh();
    } catch (err: any) {
      setBulkEnrollError(
        err?.response?.data?.message || err?.message || 'Failed to bulk enroll department',
      );
    } finally {
      setBulkEnrolling(false);
    }
  };

  const handleDropEnrollment = async () => {
    if (!enrollmentToDrop) return;
    try {
      setDropping(true);
      await apiClient.patch(
        `/courses/${course.id}/enrollments/${enrollmentToDrop.id}/drop`,
        {},
      );
      setEnrollmentToDrop(null);
      onRefresh();
    } catch (err) {
      logger.error('Failed to drop enrollment', err);
    } finally {
      setDropping(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const fullName = `${e.member.firstName} ${e.member.fatherName} ${e.member.grandfatherName || ''}`.toLowerCase();
    const memberNo = (e.member.memberNo || '').toLowerCase();
    return fullName.includes(term) || memberNo.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Search & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === 'am'
                ? 'ተማሪ በስም ወይም በአባል ቁጥር ፈልግ...'
                : 'Search student by name or member number...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isCapacityFull}
            onClick={() => {
              setSelectedMember(null);
              setSingleEnrollError(null);
              setShowSingleEnrollModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
            title={isCapacityFull ? t('capacityFull') : undefined}
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('enrollStudent')}</span>
          </button>

          <button
            type="button"
            disabled={isCapacityFull}
            onClick={() => {
              setSelectedDeptId('');
              setBulkEnrollError(null);
              setBulkEnrollResult(null);
              setShowBulkEnrollModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            <Building2 className="h-4 w-4 text-secondary" />
            <span>{t('bulkEnroll')}</span>
          </button>
        </div>
      </div>

      {isCapacityFull && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {t('capacityFull')} ({enrolledCount}/{capacity})
          </span>
        </div>
      )}

      {/* Enrolled Students Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {locale === 'am' ? 'ምንም የተመዘገበ ተማሪ የለም' : 'No students enrolled'}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === 'am'
              ? 'ተማሪዎችን በነጠላ ወይም በክፍል በጅምላ ይመዝግቡ'
              : 'Enroll students individually or bulk enroll an entire department'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">
                    {locale === 'am' ? 'የአባል ቁጥር' : 'Member No'}
                  </th>
                  <th className="px-4 py-3">{locale === 'am' ? 'ሙሉ ስም' : 'Full Name'}</th>
                  <th className="px-4 py-3">{locale === 'am' ? 'ክፍል' : 'Department'}</th>
                  <th className="px-4 py-3">{locale === 'am' ? 'ስልክ' : 'Phone'}</th>
                  <th className="px-4 py-3">{t('status')}</th>
                  <th className="px-4 py-3 text-right">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEnrollments.map((enr) => {
                  const m = enr.member;
                  const fullName = `${m.firstName} ${m.fatherName} ${m.grandfatherName || ''}`.trim();

                  return (
                    <tr key={enr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                        {m.memberNo}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{fullName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.department?.nameAm || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={enr.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {enr.status !== 'dropped' && (
                          <button
                            type="button"
                            onClick={() => setEnrollmentToDrop(enr)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                            title={t('dropStudent')}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span>{t('dropStudent')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Enroll Modal */}
      {showSingleEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">{t('enrollStudent')}</h3>
              <button
                type="button"
                onClick={() => setShowSingleEnrollModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {singleEnrollError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {singleEnrollError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('searchMember')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="ስም ወይም የአባል ቁጥር..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Searched Results List */}
              {searchingMembers && (
                <p className="text-xs text-muted-foreground">{tCommon('loading')}</p>
              )}

              {searchedMembers.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {searchedMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between ${
                        selectedMember?.id === m.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div>
                        <p>
                          {m.firstName} {m.fatherName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {m.memberNo} · {m.department?.nameAm || ''}
                        </p>
                      </div>
                      {selectedMember?.id === m.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs">
                  <p className="text-muted-foreground">{locale === 'am' ? 'የተመረጠው አባል' : 'Selected'}:</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">
                    {selectedMember.firstName} {selectedMember.fatherName} ({selectedMember.memberNo})
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSingleEnrollModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                disabled={!selectedMember || singleEnrolling}
                onClick={handleSingleEnroll}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {singleEnrolling ? tCommon('loading') : t('enrollStudent')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Enroll Modal */}
      {showBulkEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">{t('bulkEnroll')}</h3>
              <button
                type="button"
                onClick={() => setShowBulkEnrollModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {bulkEnrollError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {bulkEnrollError}
              </div>
            )}

            {bulkEnrollResult ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{locale === 'am' ? 'የጅምላ ምዝገባ ሪፖርት' : 'Bulk Enrollment Report'}</span>
                </div>
                <p>
                  {locale === 'am' ? 'አዲስ የተመዘገቡ' : 'Enrolled'}:{' '}
                  <span className="font-bold">{bulkEnrollResult.enrolledCount ?? 0}</span>
                </p>
                <p>
                  {locale === 'am' ? 'ቀደም ሲል የተመዘገቡ' : 'Already Enrolled'}:{' '}
                  <span className="font-bold">{bulkEnrollResult.skippedCount ?? 0}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('selectDept')} *
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- {t('selectDept')} --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameAm} {d.nameEn ? `(${d.nameEn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowBulkEnrollModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                {tCommon('close')}
              </button>
              {!bulkEnrollResult && (
                <button
                  type="button"
                  disabled={!selectedDeptId || bulkEnrolling}
                  onClick={handleBulkEnroll}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {bulkEnrolling ? tCommon('loading') : t('bulkEnroll')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drop Student Confirmation */}
      <ConfirmDialog
        open={!!enrollmentToDrop}
        onOpenChange={(open) => !open && setEnrollmentToDrop(null)}
        title={t('dropStudent')}
        description={
          locale === 'am'
            ? `«${enrollmentToDrop?.member.firstName} ${enrollmentToDrop?.member.fatherName}» ከዚህ ትምህርት እንዲያቋርጡ በእርግጥ ይፈልጋሉ?`
            : `Are you sure you want to drop student ${enrollmentToDrop?.member.firstName} ${enrollmentToDrop?.member.fatherName} from this course?`
        }
        confirmLabel={locale === 'am' ? 'አዎ አቋርጥ' : 'Drop Student'}
        cancelLabel={tCommon('cancel')}
        variant="destructive"
        isLoading={dropping}
        onConfirm={handleDropEnrollment}
      />
    </div>
  );
}
