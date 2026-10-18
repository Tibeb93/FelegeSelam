'use client';

import React from 'react';
import { PostEditorForm } from '@/components/posts/PostEditorForm';
import { FileText } from 'lucide-react';

export default function NewPostPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <FileText className="h-3.5 w-3.5" />
          <span>{locale === 'am' ? 'አዲስ ህትመት' : 'New Publication'}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {locale === 'am' ? 'አዲስ መንፈሳዊ መልዕክት ማዘጋጃ' : 'Create Spiritual Post'}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          {locale === 'am'
            ? 'ስንክሳር፣ የዕለቱ ንባብ፣ የቅዱሳን ታሪክ፣ ዜና ወይም አስቸኳይ ማስታወቂያ ያትሙ'
            : 'Compose and schedule daily sinksar, scripture readings, news, or urgent notices.'}
        </p>
      </div>

      <PostEditorForm locale={locale} />
    </div>
  );
}
