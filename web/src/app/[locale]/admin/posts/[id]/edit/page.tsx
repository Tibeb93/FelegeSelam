'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Post } from '@/types/api';
import { PostEditorForm } from '@/components/posts/PostEditorForm';
import { FormSkeleton } from '@/components/ui/SkeletonLoaders';
import { FileText, AlertCircle } from 'lucide-react';

export default function EditPostPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ['admin-post', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/posts/${id}`);
      return res.data || res;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <FormSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h2 className="text-lg font-bold text-foreground">
          {locale === 'am' ? 'መልዕክቱ አልተገኘም' : 'Post Not Found'}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === 'am'
            ? 'የተጠየቀው መልዕክት ተሰርዟል ወይም አልተገኘም።'
            : 'The requested post could not be loaded.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <FileText className="h-3.5 w-3.5" />
          <span>{locale === 'am' ? 'መልዕክት ማረም' : 'Edit Post'}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {locale === 'am' ? 'መንፈሳዊ መልዕክት አርትዕ' : 'Edit Spiritual Post'}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-muted-foreground">
          {post.title}
        </p>
      </div>

      <PostEditorForm initialPost={post} locale={locale} />
    </div>
  );
}
