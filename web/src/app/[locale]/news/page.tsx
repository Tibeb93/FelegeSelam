'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Newspaper,
  Search,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { PostItem, PaginatedResult } from '@/types/api';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NewsPageProps {
  params: { locale: string };
}

export default function NewsPage({ params: { locale } }: NewsPageProps) {
  const t = useTranslations('Website');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading } = useQuery<PaginatedResult<PostItem>>({
    queryKey: ['posts', 'public', selectedType, searchQuery, page],
    queryFn: () =>
      apiRequest('/posts', {
        params: {
          page,
          limit: 12,
          type: selectedType === 'all' ? undefined : selectedType,
          search: searchQuery || undefined,
        },
      }),
  });

  const posts = data?.data || [];

  const postTypes = [
    { key: 'all', labelAm: 'ሁሉም', labelEn: 'All' },
    { key: 'sinksar', labelAm: 'ስንክሳር', labelEn: 'Synaxarium' },
    { key: 'urgent', labelAm: 'አስቸኳይ', labelEn: 'Urgent' },
    { key: 'news', labelAm: 'ዜና', labelEn: 'News' },
    { key: 'teaching', labelAm: 'ትምህርት', labelEn: 'Teachings' },
    { key: 'event', labelAm: 'መርሐ-ግብር', labelEn: 'Events' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader locale={locale} />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 md:py-16 space-y-8" tabIndex={-1}>
        {/* Header Title */}
        <div className="space-y-2 text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/40 px-3 py-1 text-xs uppercase font-semibold">
            {t('navNews')}
          </Badge>
          <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {locale === 'am' ? 'መንፈሳዊ ዜናዎችና ማስታወቂያዎች' : 'Spiritual News & Notices'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'የዕለቱ ስንክሳር፣ አስቸኳይ ማስታወቂያዎችና የሰንበት ትምህርት ቤቱ መርሐ-ግብራት'
              : 'Daily Synaxarium readings, notices, event bulletins, and liturgical announcements.'}
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
          {/* Post Type Badges */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {postTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => {
                  setSelectedType(type.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                  selectedType === type.key
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {locale === 'am' ? type.labelAm : type.labelEn}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={locale === 'am' ? 'ዜናዎችን ፈልግ...' : 'Search posts...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 min-h-[44px] rounded-xl"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <Newspaper className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-base font-bold text-foreground">
              {locale === 'am' ? 'ምንም የወጣ ዜና አልተገኘም' : 'No posts found'}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {locale === 'am' ? 'እባክዎ የተለየ የፍለጋ ቃል ወይም ማጣሪያ ይሞክሩ።' : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="border-border bg-card shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {post.imageUrl && (
                  <div className="h-44 w-full overflow-hidden bg-muted relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                        post.isUrgent
                          ? 'bg-red-600 text-white'
                          : post.type === 'sinksar'
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {post.isUrgent
                        ? locale === 'am'
                          ? 'አስቸኳይ'
                          : 'Urgent'
                        : post.type}
                    </span>

                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(post.publishAt).toLocaleDateString(
                          locale === 'am' ? 'am-ET' : 'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </span>
                    </span>
                  </div>

                  <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                    <Link
                      href={`/${locale}/news/${post.id}`}
                      className="hover:text-primary transition-colors focus:underline"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {post.body.replace(/<[^>]*>?/gm, '')}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between hover:bg-muted text-xs font-semibold min-h-[44px] rounded-xl"
                  >
                    <Link href={`/${locale}/news/${post.id}`}>
                      <span>{locale === 'am' ? 'ሙሉውን አንብብ' : 'Read Article'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {data && data.total > 12 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="min-h-[44px] rounded-xl"
            >
              {locale === 'am' ? 'ቀዳሚ' : 'Previous'}
            </Button>
            <span className="text-xs font-semibold px-3">
              {page} / {Math.ceil(data.total / 12)}
            </span>
            <Button
              variant="outline"
              disabled={page * 12 >= data.total}
              onClick={() => setPage(page + 1)}
              className="min-h-[44px] rounded-xl"
            >
              {locale === 'am' ? 'ቀጣይ' : 'Next'}
            </Button>
          </div>
        )}
      </main>

      <PublicFooter locale={locale} />
    </div>
  );
}
