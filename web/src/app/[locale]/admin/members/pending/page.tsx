'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  User,
  Phone,
  Church,
  Calendar,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../../../lib/api-client';
import { Member, PaginatedResponse } from '../../../../../types/api';
import { StatusBadge } from '../../../../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { TableSkeleton } from '../../../../../components/ui/SkeletonLoaders';
import { useToast } from '../../../../../providers/ToastProvider';
import {
  gregorianToEthiopian,
  formatEthiopianDate,
} from '../../../../../lib/ethiopian-calendar';

export default function PendingApprovalsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('Members');
  const tCommon = useTranslations('Common');
  const toast = useToast();
  const queryClient = useQueryClient();
  const isAm = locale === 'am';

  // Target member for modal confirmation
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Fetch pending members
  const { data, isLoading } = useQuery<PaginatedResponse<Member>>({
    queryKey: ['pending-members-list'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Member>>('/members', {
        params: {
          status: 'pending',
          limit: 100,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      }),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/members/${id}/approve`),
    onSuccess: () => {
      toast.success(
        isAm ? 'አባሉ በተሳካ ሁኔታ ጸድቋል' : 'Member approved successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['pending-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });
      setSelectedMember(null);
      setActionType(null);
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'ማጽደቅ አልተቻለም' : 'Failed to approve'));
    },
  });

  // Reject / Deactivate Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.put(`/members/${id}`, { status: 'inactive' }),
    onSuccess: () => {
      toast.success(
        isAm ? 'አባሉ ውድቅ ተደርጓል' : 'Member registration rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['pending-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members-list'] });
      setSelectedMember(null);
      setActionType(null);
    },
    onError: (err: any) => {
      toast.error(err.message || (isAm ? 'እርምጃውን ማከናወን አልተቻለም' : 'Failed to reject'));
    },
  });

  const pendingMembers = (data?.items || data?.data || []) as Member[];

  return (
    <div className="space-y-6">
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={actionType === 'approve' && selectedMember !== null}
        onOpenChange={(open) => !open && setActionType(null)}
        title={isAm ? 'አባልን ማጽደቅ' : 'Approve Member Registration'}
        description={
          isAm
            ? `አባል "${selectedMember?.firstName} ${selectedMember?.fatherName}" ወደ ንቁ አባልነት እንዲቀየር ማጽደቅ ይፈልጋሉ?`
            : `Are you sure you want to approve "${selectedMember?.firstName} ${selectedMember?.fatherName}" as an active member?`
        }
        confirmLabel={t('approve')}
        cancelLabel={tCommon('cancel')}
        isLoading={approveMutation.isPending}
        onConfirm={() => {
          if (selectedMember) approveMutation.mutate(selectedMember.id);
        }}
      />

      <ConfirmDialog
        open={actionType === 'reject' && selectedMember !== null}
        onOpenChange={(open) => !open && setActionType(null)}
        title={isAm ? 'አባልን ውድቅ ማድረግ' : 'Reject Member Registration'}
        description={
          isAm
            ? `የአባል "${selectedMember?.firstName} ${selectedMember?.fatherName}" ምዝገባ ውድቅ ይደረግ? መረጃው እንደ ማይንቀሳቀስ (Inactive) ሆኖ ይቀመጣል።`
            : `Are you sure you want to reject registration for "${selectedMember?.firstName} ${selectedMember?.fatherName}"?`
        }
        variant="destructive"
        confirmLabel={t('reject')}
        cancelLabel={tCommon('cancel')}
        isLoading={rejectMutation.isPending}
        onConfirm={() => {
          if (selectedMember) rejectMutation.mutate(selectedMember.id);
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/members`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-sm"
            title={tCommon('back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                {t('pendingApprovals')}
              </h1>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                {pendingMembers.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAm
                ? 'በራስ ምዝገባ ወይም በዝውውር ማጽደቂያ የሚጠብቁ አባላት'
                : 'Members awaiting approval from self-registration or transfer'}
            </p>
          </div>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <TableSkeleton rows={5} cols={5} />
        </div>
      ) : pendingMembers.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 shadow-sm">
          <EmptyState
            title={t('noPendingMembers')}
            description={
              isAm
                ? 'ሁሉም የአባልነት ማመልከቻዎች ተስተናግደዋል ወይም በአሁኑ ወቅት አዲስ ማመልከቻ የለም።'
                : 'All member applications have been processed or there are no new registrations.'
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">{t('fullName')}</th>
                  <th className="px-4 py-3.5">{t('memberNo')}</th>
                  <th className="px-4 py-3.5">{t('department')}</th>
                  <th className="px-4 py-3.5">{t('phone')}</th>
                  <th className="px-4 py-3.5">{t('joinedDate')}</th>
                  <th className="px-4 py-3.5 text-right">{tCommon('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pendingMembers.map((member) => {
                  const registeredDateEth = member.joinedAt
                    ? formatEthiopianDate(
                        gregorianToEthiopian(new Date(member.joinedAt)),
                        isAm ? 'am' : 'en'
                      )
                    : '—';

                  return (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                            {member.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.photoUrl}
                                alt={member.firstName}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{member.firstName?.[0] || 'አ'}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {member.firstName} {member.fatherName} {member.grandfatherName || ''}
                            </div>
                            {member.baptismalName && (
                              <div className="text-[11px] text-muted-foreground">
                                {isAm ? 'ክ/ስም:' : 'Baptismal:'} {member.baptismalName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-primary">
                        {member.memberNo}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {member.department?.nameAm ||
                          member.department?.nameEn ||
                          (isAm ? 'ያልተመደበ' : 'Unassigned')}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-muted-foreground">
                        {member.phone || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground">
                        {registeredDateEth}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${locale}/admin/members/${member.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title={t('profile')}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('approve');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t('approve')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(member);
                              setActionType('reject');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{t('reject')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
