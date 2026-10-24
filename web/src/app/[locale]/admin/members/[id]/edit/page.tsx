'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiClient } from '../../../../../../lib/api-client';
import { Member } from '../../../../../../types/api';
import { MemberForm } from '../../../../../../components/members/MemberForm';
import { FormSkeleton } from '../../../../../../components/ui/SkeletonLoaders';
import { EmptyState } from '../../../../../../components/ui/EmptyState';

export default function EditMemberPage() {
  const params = useParams();
  const id = params?.id as string;
  const locale = (params?.locale as string) || 'am';
  const isAm = locale === 'am';

  const { data: member, isLoading, error } = useQuery<Member>({
    queryKey: ['member', id],
    queryFn: () => apiClient.get<Member>(`/members/${id}`),
    enabled: Boolean(id),
  });

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
              ? 'የተጠየቀው አባል አልተገኘም ወይም ተሰርዟል። እባክዎ እንደገና ይሞክሩ።'
              : 'The requested member record could not be found or has been deleted.'
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-4">
      <MemberForm mode="edit" initialData={member} locale={locale} />
    </div>
  );
}
