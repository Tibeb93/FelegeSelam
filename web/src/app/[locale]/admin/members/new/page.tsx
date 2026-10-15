'use client';

import React from 'react';
import { MemberForm } from '../../../../../components/members/MemberForm';

export default function NewMemberPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="mx-auto max-w-6xl py-4">
      <MemberForm mode="create" locale={locale} />
    </div>
  );
}
