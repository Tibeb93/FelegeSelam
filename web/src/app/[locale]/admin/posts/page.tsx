'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Post, PostType, PaginatedResponse } from '@/types/api';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { PostCalendarView } from '@/components/posts/PostCalendarView';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  FileText,
  Plus,
  Calendar,
  List,
  Search,
  Flame,
  Clock,
  Sparkles,
  BookOpen,
  Newspaper,
  GraduationCap,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const POST_TYPES: { value: PostType; labelAm: string; labelEn: string; icon: any }[] = [
  { value: 'sinksar', labelAm: 'ስንክሳር', labelEn: 'Sinksar', icon: Sparkles },
  { value: 'bible_reading', labelAm: 'የዕለቱ ንባብ', labelEn: 'Bible Reading', icon: BookOpen },
  { value: 'saint_of_day', labelAm: 'የዕለቱ ቅዱስ', labelEn: 'Saint of Day', icon: Sparkles },
  { value: 'urgent', labelAm: 'አስቸኳይ', labelEn: 'Urgent', icon: Flame },
  { value: 'event', labelAm: 'መርሐ-ግብር', labelEn: 'Event', icon: Calendar },
  { value: 'news', labelAm: 'ዜና', labelEn: 'News', icon: Newspaper },
  { value: 'teaching', labelAm: 'ትምህርት', labelEn: 'Teaching', icon: GraduationCap },
];

export default function PostsAdminPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [schedulerNotice, setSchedulerNotice] = useState<string | null>(null);

  // Fetch posts for management (includes scheduled and expired)
  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Post>>({
    queryKey: ['admin-posts', page, pageSize, selectedType, isUrgentOnly, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (selectedType) params.append('type', selectedType);
      if (isUrgentOnly) params.append('isUrgent', 'true');
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiClient.get<any>(`/posts/manage?${params.toString()}`);
      return res;
    },
  });

  const posts = data?.items || data?.data || [];
  const total = data?.total || 0;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      setDeleteTarget(null);
    },
  });

  // Run scheduler immediately mutation
  const runSchedulerMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/posts/scheduler/run');
    },
    onSuccess: (res: any) => {
      refetch();
      setSchedulerNotice(
        locale === 'am'
          ? `የመርሐ-ግብር ሥራው ተከናውኗል (${res.activePublishedCount} ንቁ፣ ${res.expiredCount} ያለፈባቸው)`
          : `Scheduler processed: ${res.activePublishedCount} active, ${res.expiredCount} expired`,
      );
      setTimeout(() => setSchedulerNotice(null), 5000);
    },
  });

  const getStatusBadge = (post: Post) => {
    const status = post.lifecycleStatus || 'published';
    if (status === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <Clock className="h-3 w-3" />
          <span>{locale === 'am' ? 'የተያዘ (Scheduled)' : 'Scheduled'}</span>
        </span>
      );
    } else if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          <span>{locale === 'am' ? 'ያለፈበት' : 'Expired'}</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          <span>{locale === 'am' ? 'የታተመ' : 'Published'}</span>
        </span>
      );
    }
  };

  const columns: ColumnDef<Post>[] = [
    {
      header: locale === 'am' ? 'ርዕስና ዓይነት' : 'Title & Type',
      accessorKey: 'title',
      cell: (post) => {
        const typeInfo = POST_TYPES.find((t) => t.value === post.type);
        const Icon = typeInfo?.icon || FileText;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/admin/posts/${post.id}/edit`}
                  className="font-semibold text-foreground text-xs md:text-sm hover:underline"
                >
                  {post.title}
                </Link>
                {post.isUrgent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <Flame className="h-3 w-3 fill-current" />
                    <span>{locale === 'am' ? 'አስቸኳይ' : 'URGENT'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === 'am' ? typeInfo?.labelAm : typeInfo?.labelEn || post.type}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ሁኔታ' : 'Status',
      accessorKey: 'lifecycleStatus',
      cell: (post) => getStatusBadge(post),
    },
    {
      header: locale === 'am' ? 'የሚለቀቅበት ቀን' : 'Publish Date',
      accessorKey: 'publishAt',
      cell: (post) => {
        const d = new Date(post.publishAt);
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{d.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'የሚያበቃበት ቀን' : 'Expires At',
      accessorKey: 'expiresAt',
      cell: (post) => {
        if (!post.expiresAt) return <span className="text-xs text-muted-foreground">—</span>;
        const d = new Date(post.expiresAt);
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{d.toLocaleDateString()}</p>
            <p className="text-[11px] text-muted-foreground">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        );
      },
    },
    {
      header: locale === 'am' ? 'ድርጊት' : 'Actions',
      accessorKey: 'id',
      cell: (post) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/admin/posts/${post.id}/edit`}
            className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title={locale === 'am' ? 'አርትዕ' : 'Edit'}
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteTarget(post)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title={locale === 'am' ? 'ሰርዝ' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>{locale === 'am' ? 'ዕለታዊ መንፈሳዊ ይዘት' : 'Spiritual Publishing'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {locale === 'am' ? 'ዕለታዊ መንፈሳዊ መልዕክቶች' : 'Daily Spiritual Posts'}
          </h1>
          <p className="mt-1 text-xs md:text-sm text-muted-foreground">
            {locale === 'am'
              ? 'ስንክሳር፣ የዕለቱ ንባብ፣ ቅዱሳን፣ አስቸኳይ ማስታወቂያዎችና ትምህርቶች'
              : 'Publish scheduled sinksar, scripture readings, teachings, and urgent notifications.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'ዝርዝር' : 'List'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{locale === 'am' ? 'ቀን መቁጠሪያ' : 'Calendar'}</span>
            </button>
          </div>

          {/* Trigger scheduler now button */}
          <button
            type="button"
            onClick={() => runSchedulerMutation.mutate()}
            disabled={runSchedulerMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
            title={locale === 'am' ? 'የህትመትና የአገልግሎት ጊዜ መርሐ-ግብር ወዲያውኑ አስፈጽም' : 'Run publishing scheduler now'}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                runSchedulerMutation.isPending ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {locale === 'am' ? 'መርሐ-ግብር አድስ' : 'Run Scheduler'}
            </span>
          </button>

          {/* New Post Button */}
          <Link
            href={`/${locale}/admin/posts/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{locale === 'am' ? 'አዲስ መልዕክት' : 'Create Post'}</span>
          </Link>
        </div>
      </div>

      {schedulerNotice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{schedulerNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === 'am'
                ? 'በርዕስ ወይም በይዘት ፈልግ...'
                : 'Search posts by title or content...'
            }
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">
              {locale === 'am' ? 'ሁሉም ዓይነቶች' : 'All Post Types'}
            </option>
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {locale === 'am' ? t.labelAm : t.labelEn}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUrgentOnly}
              onChange={(e) => {
                setIsUrgentOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500/30"
            />
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <Flame className="h-3.5 w-3.5 fill-current" />
              <span>{locale === 'am' ? 'አስቸኳይ ብቻ' : 'Urgent Only'}</span>
            </span>
          </label>
        </div>
      </div>

      {/* Main Content Area: List View vs. Calendar View */}
      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={posts}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      ) : (
        <PostCalendarView posts={posts} locale={locale} />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={locale === 'am' ? 'መልዕክቱን መሰረዝ ይፈልጋሉ?' : 'Delete Post?'}
        description={
          locale === 'am'
            ? `«${deleteTarget?.title}» የሚለውን መልዕክት ከስርዓቱ ለማስወገድ እርግጠኛ ነዎት?`
            : `Are you sure you want to delete "${deleteTarget?.title}"?`
        }
        confirmLabel={locale === 'am' ? 'ሰርዝ' : 'Delete'}
        cancelLabel={locale === 'am' ? 'ይቅር' : 'Cancel'}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
