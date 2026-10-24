'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api-client';
import { PostItem } from '../../types/api';
import { AlertTriangle, BookOpen, Sparkles, ChevronRight, BellRing } from 'lucide-react';

interface SpiritualBannerProps {
  locale: string;
}

export function SpiritualBanner({ locale }: SpiritualBannerProps) {
  const { data: postsData } = useQuery<{ data: PostItem[] }>({
    queryKey: ['posts', 'today'],
    queryFn: () => apiRequest('/posts/today'),
    staleTime: 60000,
  });

  const todayPosts = postsData?.data || [];
  const urgentPost = todayPosts.find((p) => p.isUrgent);
  const sinksarPost = todayPosts.find((p) => p.type === 'sinksar') || todayPosts[0];

  return (
    <div className="space-y-4">
      {/* 1. Urgent Notice Alert (If active) */}
      {urgentPost && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border-2 border-red-600/40 bg-red-50 p-4 text-red-950 shadow-md dark:bg-red-950/40 dark:text-red-200 dark:border-red-600/50"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-600 p-2 text-white shadow-xs shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-block rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                    {locale === 'am' ? 'አስቸኳይ ማስታወቂያ' : 'Urgent Notice'}
                  </span>
                  <span className="text-xs text-red-800 dark:text-red-300">
                    {new Date(urgentPost.publishAt).toLocaleDateString(
                      locale === 'am' ? 'am-ET' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </span>
                </div>
                <h3 className="text-base font-bold text-red-950 dark:text-red-100">
                  {urgentPost.title}
                </h3>
                <p className="mt-0.5 text-xs sm:text-sm text-red-900/90 dark:text-red-200/90 line-clamp-2">
                  {urgentPost.body.replace(/<[^>]*>?/gm, '').slice(0, 150)}...
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/news/${urgentPost.id}`}
              className="inline-flex items-center justify-center gap-1.5 self-start sm:self-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors shrink-0 min-h-[44px]"
            >
              <span>{locale === 'am' ? 'ሙሉውን አንብብ' : 'Read Notice'}</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Today's Sinksar / Spiritual Reflection Card */}
      <div className="rounded-2xl border border-secondary/40 bg-gradient-to-r from-card via-card/90 to-secondary/10 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-secondary shrink-0 shadow-xs">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {sinksarPost?.type === 'sinksar'
                      ? locale === 'am'
                        ? 'የዕለቱ ስንክሳር'
                        : "Today's Synaxarium"
                      : locale === 'am'
                      ? 'የዕለቱ መንፈሳዊ መልእክት'
                      : 'Spiritual Word for Today'}
                  </span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground md:text-xl">
                {sinksarPost ? sinksarPost.title : locale === 'am' ? 'የቅዱሳን መታሰቢያና ጸሎት' : 'Commemoration of the Saints'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                {sinksarPost
                  ? sinksarPost.body.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...'
                  : locale === 'am'
                  ? 'እግዚአብሔር በቅዱሳኑ ያደረገውን ድንቅ ሥራ እያሰቡ በሃይማኖት መጽናትና በምግባር ማብራት የሁላችን ክርስቲያናዊ አደራ ነው።'
                  : 'Reflecting on the holy works of God in the lives of His saints, persevering in faith and good works.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            {sinksarPost ? (
              <Link
                href={`/${locale}/news/${sinksarPost.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/50 bg-secondary/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-secondary hover:bg-secondary/25 transition-colors min-h-[44px]"
              >
                <span>{locale === 'am' ? 'ስንክሳሩን ያንብቡ' : 'Read Full Text'}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/news`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/50 bg-secondary/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-secondary hover:bg-secondary/25 transition-colors min-h-[44px]"
              >
                <span>{locale === 'am' ? 'ዜናዎችን ይመልከቱ' : 'View Notices'}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
